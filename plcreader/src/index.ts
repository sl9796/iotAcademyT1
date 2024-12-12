/*
 * index.ts
 *
 * This source file will implement 
 * -reading tags from Beckhoff PLC via ADS protocol
 * -publishing data to HiveMQ MQTT broker
 */

import * as ads from "ads-client";
import * as mqtt from "mqtt";
import * as fs from "fs";
import * as path from "path";
import { createLogger, format, transports } from 'winston';
import { Iplctag, IMQTTSimplePayload, IMQTTMotionPayload } from "./interfaces";

//helper functions to import config
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

//set base topic according t config
const baseTopic: string = `${config.mqtt.Organization}/${config.mqtt.Division}/${config.mqtt.Plant}/${config.mqtt.Area}/${config.mqtt.Line}/${config.mqtt.Workstation}`;

//initialize ads client
const adsClient = new ads.Client(config.adsClient);

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

//-----------------------------------
//Functions
//-----------------------------------

//function to subscribe to all tags listed in config
const subscribeToTags = async (tags: Iplctag[]) => {
  for (const tag of tags) {
    try {
      adsClient.subscribe(tag.name, async (result, sub) => await publishSubscribedTags(tag, result, sub), 500);
    } catch (err: any) {
      logger.log({ level: 'error', message: `Error reading ${tag}. Message: ${err.message} ` });
    }
  }
};

//function to publish info to MQTT broker
const publishSubscribedTags = async (tag: Iplctag, data: ads.SubscriptionCallbackData, sub: ads.Subscription) => {
  try {
    const payload: IMQTTSimplePayload = {
      value: Number(data.value),
      type: data.type.type,
      timestamp: data.timeStamp.toISOString()
    }
    await mqttClient.publishAsync(`${baseTopic}/${tag.machine}/${tag.type}/${tag.attribute}`, JSON.stringify(payload));
  } catch (err: any) {
    logger.log({ level: 'error', message: err.message });
  }
}
//function to create an object containing arrays, grouping tags according to their machine attribute
//TODO: make 'any' return type specific
const createMachineGroups = (array: Iplctag[]): any => {
  try {
    const machineGroups: { [key: string]: Iplctag[] } = {};

    //group plctags according to machine attribute
    array.forEach((tag: Iplctag) => {
      const machine = tag.machine
      //if current group does not exist, create it
      if (!machineGroups[machine]) {
        machineGroups[machine] = [];
      }
      machineGroups[machine].push(tag);
    });
    return machineGroups;

  } catch (err: any) {
    logger.log({ level: 'error', message: err.message });
  }
}
//function to read motion data for specific machine
const readMotionTags = async (tags: Iplctag[]): Promise<{ [key: string]: number }> => {
  //object to hold retrieved data
  const dataObj: { [key: string]: number } = {};
  let tagData: ads.SymbolData;

  for (const tag of tags) {
    if (tag.type === "motion") {
      try {
        //read data for current tag
        tagData = await adsClient.readSymbol(tag.name);
        //add data to object
        Object.assign(dataObj, { [tag.attribute]: Number(tagData.value) })
      } catch (err: any) {
        logger.log({ level: 'error', message: `Error reading ${tag}. Message: ${err.message} ` });
      }
    }
  }
  return dataObj;
}

const publishMotionTags = async (motionData: { [key: string]: number }, machine: string) => {
  try {
    const payload: IMQTTMotionPayload = {
      ...motionData,
      timestamp: new Date().toISOString()
    }
    await mqttClient.publishAsync(`${baseTopic}/${machine}/motion/pos`, JSON.stringify(payload));

  } catch (err: any) {
    logger.log({ level: 'error', message: err.message });
  }
}

//function to facilitate graceful shutdown
const shutdown = async () => {
  try {
    await mqttClient.endAsync();
    logger.log({ level: 'info', message: 'Disconnected from MQTT Broker' })
    if (adsClient.connection) {
      await adsClient.disconnect();
      logger.log({ level: 'info', message: 'Disconnected from PLC' })
    }
    process.exit();
  } catch (err: any) {
    logger.log({ level: 'error', message: err.message });
  }
};

/*
 * function main();
 *
 * This is the mainline code for our project. This code will
 * perform the following work:
 */
async function main() {

  //graceful shutdown
  process.on("SIGINT", shutdown); //ctrl+c
  process.on("SIGTERM", shutdown); //process terminated

  try {
    //set up winston logger with console logging enabled
    logger = createLogger(winstonConfig);
    logger.add(new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }));
    //connect to MQTT broker
    mqttClient = mqtt.connect(config.mqtt.brokerUrl);

    // Event listener for successful MQTT connection
    mqttClient.on("connect", () => {
      logger.log({ level: 'info', message: 'Connected to MQTT broker' })
    });
    // Event listener for MQTT errors
    mqttClient.on("error", (err) => {
      logger.log({ level: 'error', message: 'MQTT error:' + err.message });
    });
    //Event listener for sent MQTT packets
    mqttClient.on("packetsend", (packetsend) => {
      console.log(packetsend) //for debugging
    });

    //connect adsClient
    await adsClient.connect();
    logger.log({ level: 'info', message: 'Connected to PLC' })
    //subscribe to ALL tags listed in config -publish on change
    await subscribeToTags(config.plctags);

    //create single topic with motion information for each machine found in config
    //"fully qualified position data": X,Y,Z, Torque, Timestamp
    //TODO: make separate function?
    const groups: any = createMachineGroups(config.plctags);
    setInterval(async () => {
      for (const machine in groups) {
        if (groups.hasOwnProperty(machine)) {
          const tagsForMachine = groups[machine];
          const dataTosend = await readMotionTags(groups[machine])
          if (!(Object.keys(dataTosend).length === 0)) {
            await publishMotionTags(dataTosend, machine);
          }
        }
      }
    }, 1000);

  } catch (err: any) {
    logger.log({ level: 'error', message: 'Error' + err.message });
  }
}

main(); 
