import { IMQTTMotionPayload, IMQTTSimplePayload } from 'interfaces';
import * as mqtt from 'mqtt';
import * as pg from 'pg';
import * as fs from "fs";
import * as path from "path";

//function to read config file as JSON
const readJSON = (filename: string): any => {
  const data: string = fs.readFileSync(filename).toString();
  return JSON.parse(data)
}
//function to set config filename
const setConfigFilename = (filename: string): string => {
  //construct full path name
  return path.dirname(__filename).concat("/../", filename);
}

let config = readJSON(setConfigFilename('config.json'));

const mqttClient = mqtt.connect(config.mqtt.brokerUrl);
const dbclient = new pg.Client(config.postgre_config);

// Handle incoming MQTT messages
mqttClient.on('message', async (topic, message) => {
  handleMQTTMessage(topic, message)
});
// mqtt error listener
mqttClient.on('error', (error) => {
  console.error('MQTT Error:', error);
});
//dbclient error listener
dbclient.on('error', (error) => {
  console.error('Database Error:', error);
});
//subscribe to topics on connect
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  // Subscribe to Team1 topics
  //TODO: build topic string from config
  mqttClient.subscribe('m/iotacademy/conestoga/presorter/smart/Team1/#', (err) => {
    if (!err) {
      console.log('Subscribed to Team1 topics');
    }
  });
});

const handleMQTTMessage = async (topic: string, message: Buffer) => {
  try {
    if (topic.endsWith("pos")) {
      const payload: IMQTTMotionPayload = JSON.parse(message.toString());
      // Handle position data for robot3
      const query = `
      INSERT INTO "hbot_motion" (position_x, position_y, position_z, torque_1, torque_2, torque_3, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
      const values = [
        payload.position_x,
        payload.position_y,
        payload.position_z,
        payload.torque_1,
        payload.torque_2,
        payload.torque_3,
        payload.timestamp
      ];

      await dbclient.query(query, values);
      console.log('Inserted position data:', values);

    } else if (topic.includes("status")) {
      // Handle workcell data

      //helper string -> handle attributes from different machines for inserting into db
      let machine: string = '';
      if (topic.includes("workcell")) {
        machine = "workcell";
      } else if (topic.includes("robot3")) {
        machine = "robot3";
      }
      const payload: IMQTTSimplePayload = JSON.parse(message.toString());
      const query = `
      INSERT INTO "status" (tag, value, timestamp)
      VALUES ($1, $2, $3)
    `;
      const values = [
        //split topic string after last occurence of '/' -> attribute
        `${machine}_${topic.substring(topic.lastIndexOf("/") + 1, topic.length)}`,
        payload.value,
        payload.timestamp
      ];

      await dbclient.query(query, values);
      console.log('query sent:', values);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

//function to facilitate graceful shutdown
const shutdown = async () => {
  try {
    await dbclient.end();
    console.log("Disconnected from Database");
    await mqttClient.endAsync();
    console.log("Disconnected from MQTT Broker");
    process.exit();
  } catch (err: any) {
    console.error(err.message);
  }
};

async function main() {
  // Graceful shutdown
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  await dbclient.connect();
  console.log("db connected")
}

main();