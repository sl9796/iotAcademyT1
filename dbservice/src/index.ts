import { IMQTTMotionPayload, IMQTTSimplePayload } from 'interfaces';
import * as mqtt from 'mqtt';
import * as pg from 'pg';
import * as fs from "fs";
import * as path from "path";
import { createLogger, format, transports } from 'winston';

//earl d. wilson
const winstonConfig = {
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'logger01' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/all.log' })
  ]
};

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

//-----------------------------------
//Global variables
//-----------------------------------
let logger: any;
let config = readJSON(setConfigFilename('config.json'));
//create global mqttClient for later use
let mqttClient: mqtt.MqttClient;
//const mqttClient = mqtt.connect(config.mqtt.brokerUrl);
const dbclient: pg.Client = new pg.Client(config.postgre_config);

//-----------------------------------
//Functions
//-----------------------------------
const handleMQTTMessage = async (topic: string, message: Buffer) => {
  try {
    if (!mqttClient) {
      logger.log({ level: 'error', message: 'MQTT client is not initialized' })
      throw new Error('MQTT client is not initialized')
    }
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
      logger.log({ level: 'info', message: 'Inserted position data:', values })

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
      logger.log({ level: 'info', message: 'query sent:', values });
    }
  } catch (err: any) {
    logger.log({ level: 'error', message: err.message })
  }
}

//function to facilitate graceful shutdown
const shutdown = async () => {
  try {
    await dbclient.end();
    logger.log({ level: 'info', message: 'Disconnected from Database' })
    await mqttClient.endAsync();
    logger.log({ level: 'info', message: 'Disconnected from MQTT Broker' })
    process.exit();
  } catch (err: any) {
    logger.log({ level: 'error', message: err.message })
  }
};

async function main() {
  // Graceful shutdown
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  //set up winston logger
  logger = createLogger(winstonConfig);
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));

  mqttClient = mqtt.connect(config.mqtt.brokerUrl);
  // Handle incoming MQTT messages
  mqttClient.on('message', async (topic, message) => {
    handleMQTTMessage(topic, message)
  });
  // mqtt error listener
  mqttClient.on('error', (err: any) => {
    logger.log({ level: 'error', message: 'MQTT Error ' + err.message })
  });
  //dbclient error listener
  dbclient.on('error', (err: any) => {
    logger.log({ level: 'error', message: 'Database error ' + err.message })
  });
  //subscribe to topics on connect
  mqttClient.on('connect', () => {
    logger.log({ level: 'info', message: 'Connected to MQTT broker' })
    // Subscribe to Team1 topics
    //TODO: build topic string from config
    mqttClient.subscribe('m/iotacademy/conestoga/presorter/smart/Team1/#', (err) => {
      if (!err) {
        logger.log({ level: 'info', message: 'Subscribed to Team1 topics' })
      }
    });
  });
  await dbclient.connect();
  logger.log({ level: 'info', message: "Connected to Database" })
}

main();