"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import required modules
// Import ADS client library to connect to Beckhoff PLC
var ads_client_1 = require("ads-client");
// Import MQTT library to publish data to the MQTT broker
var mqtt_1 = require("mqtt");
// Configuration for the ADS connection
var client = new ads_client_1.Client({
    targetAmsNetId: '10.193.21.105.1.1', // Target PLC AMS Net ID
    targetAdsPort: 851, // TwinCAT runtime ADS port
    localAmsNetId: '192.168.0.121.1.1', // Local machine AMS Net ID
    localAdsPort: 32721, // Unique local ADS port
    routerAddress: '192.168.0.210', // Beckhoff router IP
    routerTcpPort: 48898 // Default Beckhoff router TCP port
});
// MQTT broker configuration
var mqttClient = mqtt_1.default.connect('mqtt://192.168.0.211', {
    port: 1883, // MQTT broker port
    username: undefined, // MQTT broker username (optional)
    password: undefined // MQTT broker password (optional)
});
// Event listener for successful MQTT connection
mqttClient.on('connect', function () {
    console.log('Connected to MQTT broker');
});
// Event listener for MQTT connection errors
mqttClient.on('error', function (err) {
    console.error('MQTT connection error:', err.message);
});
// Tags grouped by type
var tags = {
    status: [
        'HMI_GVL.M.Rob3.INITIALIZED',
        'HMI_GVL.M.Rob3.RUNNING',
        'HMI_GVL.M.Rob3.WSVIOLATION',
        'HMI_GVL.M.Rob3.PAUSED',
        'HMI_GVL.M.Rob3.SPEEDPERCENTAGE',
        'HMI_GVL.M.Rob3.FINISHEDPARTNUM'
    ],
    motorPositions: [
        'HMI_GVL.M.Rob3.ROBOTPOS.X',
        'HMI_GVL.M.Rob3.ROBOTPOS.Y',
        'HMI_GVL.M.Rob3.ROBOTPOS.Z'
    ],
    motorTorques: [
        'HMI_GVL.M.Rob3.MACTTORQUE[1]',
        'HMI_GVL.M.Rob3.MACTTORQUE[2]',
        'HMI_GVL.M.Rob3.MACTTORQUE[3]'
    ]
};
// Object to track previously published status values
var previousStatusValues = {};
// Function to read tags and publish them
var readAndPublishTags = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Connect to the Beckhoff PLC
                return [4 /*yield*/, client.connect()];
            case 1:
                // Connect to the Beckhoff PLC
                _a.sent();
                console.log('Connected to Beckhoff PLC');
                // Set up an interval to periodically read and publish data
                setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var timestamp, _loop_1, _i, _a, tag, motorPositionData, _b, _c, tag, result, err_2, motorPositionPayload, motorTorqueData, _d, _e, tag, result, err_3, motorTorquePayload;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                timestamp = new Date().toISOString();
                                _loop_1 = function (tag) {
                                    var result, currentValue, payload_1, topic_1, err_4;
                                    return __generator(this, function (_g) {
                                        switch (_g.label) {
                                            case 0:
                                                _g.trys.push([0, 2, , 3]);
                                                return [4 /*yield*/, client.readSymbol(tag)];
                                            case 1:
                                                result = _g.sent();
                                                currentValue = result.value;
                                                if (previousStatusValues[tag] !== currentValue) {
                                                    previousStatusValues[tag] = currentValue;
                                                    payload_1 = { timestamp: timestamp, tag: tag, value: currentValue };
                                                    topic_1 = "IoT_Academy/c3g2t1/robot3/motors/status/".concat(tag.split('.').pop().toLowerCase());
                                                    mqttClient.publish(topic_1, JSON.stringify(payload_1), { qos: 0 }, function (err) {
                                                        if (err) {
                                                            console.error("Error publishing status tag ".concat(tag, ":"), err.message);
                                                        }
                                                        else {
                                                            console.log("Published status tag ".concat(tag, " to topic ").concat(topic_1, ":"), payload_1);
                                                        }
                                                    });
                                                }
                                                return [3 /*break*/, 3];
                                            case 2:
                                                err_4 = _g.sent();
                                                console.error("Error reading status tag ".concat(tag, ":"), err_4.message);
                                                return [3 /*break*/, 3];
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                };
                                _i = 0, _a = tags.status;
                                _f.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                tag = _a[_i];
                                return [5 /*yield**/, _loop_1(tag)];
                            case 2:
                                _f.sent();
                                _f.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4:
                                motorPositionData = {};
                                _b = 0, _c = tags.motorPositions;
                                _f.label = 5;
                            case 5:
                                if (!(_b < _c.length)) return [3 /*break*/, 10];
                                tag = _c[_b];
                                _f.label = 6;
                            case 6:
                                _f.trys.push([6, 8, , 9]);
                                return [4 /*yield*/, client.readSymbol(tag)];
                            case 7:
                                result = _f.sent();
                                motorPositionData[tag.split('.').pop()] = result.value;
                                return [3 /*break*/, 9];
                            case 8:
                                err_2 = _f.sent();
                                console.error("Error reading motor position tag ".concat(tag, ":"), err_2.message);
                                return [3 /*break*/, 9];
                            case 9:
                                _b++;
                                return [3 /*break*/, 5];
                            case 10:
                                motorPositionPayload = { timestamp: timestamp, data: motorPositionData };
                                mqttClient.publish('IoT_Academy/c3g2t1/robot3/motors/positions/', JSON.stringify(motorPositionPayload), { qos: 0 }, function (err) {
                                    if (err) {
                                        console.error('Error publishing motor positions:', err.message);
                                    }
                                    else {
                                        console.log('Published motor positions:', motorPositionPayload);
                                    }
                                });
                                motorTorqueData = {};
                                _d = 0, _e = tags.motorTorques;
                                _f.label = 11;
                            case 11:
                                if (!(_d < _e.length)) return [3 /*break*/, 16];
                                tag = _e[_d];
                                _f.label = 12;
                            case 12:
                                _f.trys.push([12, 14, , 15]);
                                return [4 /*yield*/, client.readSymbol(tag)];
                            case 13:
                                result = _f.sent();
                                motorTorqueData[tag.split('.').pop()] = result.value;
                                return [3 /*break*/, 15];
                            case 14:
                                err_3 = _f.sent();
                                console.error("Error reading motor torque tag ".concat(tag, ":"), err_3.message);
                                return [3 /*break*/, 15];
                            case 15:
                                _d++;
                                return [3 /*break*/, 11];
                            case 16:
                                motorTorquePayload = { timestamp: timestamp, data: motorTorqueData };
                                mqttClient.publish('IoT_Academy/c3g2t1/robot3/motors/torques/', JSON.stringify(motorTorquePayload), { qos: 0 }, function (err) {
                                    if (err) {
                                        console.error('Error publishing motor torques:', err.message);
                                    }
                                    else {
                                        console.log('Published motor torques:', motorTorquePayload);
                                    }
                                });
                                return [2 /*return*/];
                        }
                    });
                }); }, 1000); // Set the interval to 1 second
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                console.error('Connection error:', err_1.message);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Start the process
readAndPublishTags();
