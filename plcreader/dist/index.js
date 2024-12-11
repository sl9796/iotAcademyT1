"use strict";
/*
 * index.ts
 *
 * This source file will implement
 * -reading tags from Beckhoff PLC via ADS protocol
 * -publishing data to HiveMQ MQTT broker
 */
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
const ads = __importStar(require("ads-client"));
const mqtt = __importStar(require("mqtt"));
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
//initialize ads client
const client = new ads.Client(config.adsClient);
//connect to MQTT broker
const mqttClient = mqtt.connect(config.mqtt.brokerUrl);
//set base topic according t config
const baseTopic = `${config.mqtt.Organization}/${config.mqtt.Division}/${config.mqtt.Plant}/${config.mqtt.Area}/${config.mqtt.Line}/${config.mqtt.Workstation}`;
console.log(baseTopic);
// Event listener for successful MQTT connection
mqttClient.on("connect", () => {
    console.log("Connected to MQTT broker"); //MQTT connection successful
});
// Event listener for MQTT errors
mqttClient.on("error", (err) => {
    console.error("MQTT  error:", err.message);
});
//Event listener for sent MQTT packets
mqttClient.on("packetsend", (packetsend) => {
    console.log(packetsend);
});
//function to subscribe to all tags listed in config
const subscribeToTags = (tags) => __awaiter(void 0, void 0, void 0, function* () {
    for (const tag of tags) {
        try {
            client.subscribe(tag.name, (result, sub) => __awaiter(void 0, void 0, void 0, function* () { return yield publishSubscribedTags(tag, result, sub); }), 500);
            //console.log(`${sub.target}: ${result.value}, Time: ${result.timeStamp}`), 500);
        }
        catch (err) {
            console.error(`Error reading ${tag}:`, err.message);
        }
    }
});
//function to publish info to MQTT broker
const publishSubscribedTags = (tag, data, sub) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = {
            value: Number(data.value),
            type: data.type.type,
            timestamp: data.timeStamp.toISOString()
        };
        yield mqttClient.publishAsync(`${baseTopic}/${tag.machine}/${tag.type}/${tag.attribute}`, JSON.stringify(payload));
        //console.log(`${baseTopic}/${tag.machine}/${tag.attribute}`, JSON.stringify(payload));
    }
    catch (err) {
        console.log(err.message);
    }
});
//function to create an object containing arrays, grouping tags according to their machine attribute
//TODO: make 'any' return type specific
const createMachineGroups = (array) => {
    try {
        const machineGroups = {};
        //group plctags according to machine attribute
        array.forEach((tag) => {
            const machine = tag.machine;
            //if current group does not exist, create it
            if (!machineGroups[machine]) {
                machineGroups[machine] = [];
            }
            machineGroups[machine].push(tag);
        });
        return machineGroups;
    }
    catch (err) {
        console.log(err.message);
    }
};
//function to read motion data for specific machine
const readMotionTags = (tags) => __awaiter(void 0, void 0, void 0, function* () {
    //object to hold retrieved data
    const dataObj = {};
    let tagData;
    for (const tag of tags) {
        if (tag.type === "motion") {
            try {
                //read data for current tag
                tagData = yield client.readSymbol(tag.name);
                //add data to object
                Object.assign(dataObj, { [tag.attribute]: Number(tagData.value) });
            }
            catch (err) {
                console.error(`Error reading ${tag}:`, err.message);
            }
        }
    }
    return dataObj;
});
const publishMotionTags = (motionData, machine) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = Object.assign(Object.assign({}, motionData), { timestamp: new Date().toISOString() });
        yield mqttClient.publishAsync(`${baseTopic}/${machine}/motion/pos`, JSON.stringify(payload));
    }
    catch (err) {
        console.error(err.message);
    }
});
//function to facilitate graceful shutdown
const shutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.disconnect();
        console.log("Disconnected from Beckhoff PLC");
        yield mqttClient.endAsync();
        console.log("Disconnected from MQTT Broker");
        process.exit();
    }
    catch (err) {
        console.error(err.message);
    }
});
/*
 * function main();
 *
 * This is the mainline code for our project. This code will
 * perform the following work:
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //graceful shutdown
        process.on("SIGINT", shutdown); //ctrl+c
        process.on("SIGTERM", shutdown); //process terminated
        try {
            yield client.connect();
            console.log("Connected to Beckhoff PLC");
            //subscribe to ALL tags listed in config -publish on change
            yield subscribeToTags(config.plctags);
            //create single topic with motion information for each machine found in config
            //"fully qualified position data": X,Y,Z, Torque, Timestamp
            //TODO: make separate function?
            const groups = createMachineGroups(config.plctags);
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                for (const machine in groups) {
                    if (groups.hasOwnProperty(machine)) {
                        const tagsForMachine = groups[machine];
                        const dataTosend = yield readMotionTags(groups[machine]);
                        if (!(Object.keys(dataTosend).length === 0)) {
                            yield publishMotionTags(dataTosend, machine);
                        }
                    }
                }
            }), 1000);
        }
        catch (err) {
            console.error("Error: ", err.message);
        }
    });
}
main();
//# sourceMappingURL=index.js.map