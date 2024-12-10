"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt = __importStar(require("mqtt"));
const pg = __importStar(require("pg"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
//function to read config file as JSON
const readJSON = (filename) => {
    const data = fs.readFileSync(filename).toString();
    return JSON.parse(data);
};
//function to set config filename
const setConfigFilename = (filename) => {
    //construct full path name
    return path.dirname(__filename).concat("/../", filename);
};
let config = readJSON(setConfigFilename('config.json'));
const mqttClient = mqtt.connect(config.mqtt.brokerUrl);
const dbclient = new pg.Client(config.postgre_config);
// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => __awaiter(void 0, void 0, void 0, function* () {
    handleMQTTMessage(topic, message);
}));
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
const handleMQTTMessage = (topic, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (topic.endsWith("pos")) {
            const payload = JSON.parse(message.toString());
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
            yield dbclient.query(query, values);
            console.log('Inserted position data:', values);
        }
        else if (topic.includes("status")) {
            // Handle workcell data
            //helper string -> handle attributes from different machines for inserting into db
            let machine = '';
            if (topic.includes("workcell")) {
                machine = "workcell";
            }
            else if (topic.includes("robot3")) {
                machine = "robot3";
            }
            const payload = JSON.parse(message.toString());
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
            yield dbclient.query(query, values);
            console.log('query sent:', values);
        }
    }
    catch (error) {
        console.error('Error processing message:', error);
    }
});
//function to facilitate graceful shutdown
const shutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbclient.end();
        console.log("Disconnected from Database");
        yield mqttClient.endAsync();
        console.log("Disconnected from MQTT Broker");
        process.exit();
    }
    catch (err) {
        console.error(err.message);
    }
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Graceful shutdown
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        yield dbclient.connect();
        console.log("db connected");
    });
}
main();
//# sourceMappingURL=index.js.map