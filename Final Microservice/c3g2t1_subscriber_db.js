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
var mqtt_1 = require("mqtt");
var pg_1 = require("pg");
var pool = new pg_1.Pool({
    user: 'postgres',
    host: '192.168.0.211',
    database: 'academy21',
    password: 'academy2024!',
    port: 3306
});
var mqttClient = mqtt_1.default.connect('mqtt://192.168.0.211', {
    port: 1883,
    username: undefined,
    password: undefined
});
// Function to insert initial status values
function insertInitialStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var initialStatusValues, _i, initialStatusValues_1, status_1, query, timestamp, values, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    initialStatusValues = [
                        { tag: 'HMI_GVL.M.Rob3.INITIALIZED', value: false },
                        { tag: 'HMI_GVL.M.Rob3.RUNNING', value: false },
                        { tag: 'HMI_GVL.M.Rob3.WSVIOLATION', value: false },
                        { tag: 'HMI_GVL.M.Rob3.PAUSED', value: false },
                        { tag: 'HMI_GVL.M.Rob3.SPEEDPERCENTAGE', value: 0 },
                        { tag: 'HMI_GVL.M.Rob3.FINISHEDPARTNUM', value: 0 }
                    ];
                    _i = 0, initialStatusValues_1 = initialStatusValues;
                    _a.label = 1;
                case 1:
                    if (!(_i < initialStatusValues_1.length)) return [3 /*break*/, 6];
                    status_1 = initialStatusValues_1[_i];
                    query = "\n      INSERT INTO robot3_status (tag_name, rob3_status, timestamp_ts)\n      VALUES ($1, $2, $3)\n    ";
                    timestamp = new Date().toISOString();
                    values = [status_1.tag, status_1.value.toString(), timestamp];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, pool.query(query, values)];
                case 3:
                    _a.sent();
                    console.log("Inserted initial status for ".concat(status_1.tag));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error inserting initial status for ".concat(status_1.tag, ":"), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
mqttClient.on('connect', function () {
    console.log('Connected to MQTT broker');
    // Insert initial status values
    insertInitialStatus();
    mqttClient.subscribe([
        'IoT_Academy/c3g2t1/robot3/motors/positions/',
        'IoT_Academy/c3g2t1/robot3/motors/torques/',
        'IoT_Academy/c3g2t1/robot3/motors/status/+'
    ], function (err) {
        if (!err) {
            console.log('Subscribed to topics');
        }
    });
});
mqttClient.on('message', function (topic, message) { return __awaiter(void 0, void 0, void 0, function () {
    var statusPayload, query, values, payload, query, values, query, values, error_2;
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _g.trys.push([0, 7, , 8]);
                if (!topic.includes('status/')) return [3 /*break*/, 2];
                statusPayload = JSON.parse(message.toString());
                query = "\n        INSERT INTO robot3_status (tag_name, rob3_status, timestamp_ts)\n        VALUES ($1, $2, $3)\n      ";
                values = [
                    statusPayload.tag,
                    statusPayload.value.toString(),
                    statusPayload.timestamp
                ];
                return [4 /*yield*/, pool.query(query, values)];
            case 1:
                _g.sent();
                console.log('Updated status:', values);
                return [2 /*return*/];
            case 2:
                payload = JSON.parse(message.toString());
                if (!(topic === 'IoT_Academy/c3g2t1/robot3/motors/positions/')) return [3 /*break*/, 4];
                query = "\n        INSERT INTO \"robot3_data\" (hbot_x, hbot_y, hbot_z, timestamp)\n        VALUES ($1, $2, $3, $4)\n      ";
                values = [
                    ((_a = payload.data.X) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                    ((_b = payload.data.Y) === null || _b === void 0 ? void 0 : _b.toString()) || '0',
                    ((_c = payload.data.Z) === null || _c === void 0 ? void 0 : _c.toString()) || '0',
                    payload.timestamp
                ];
                return [4 /*yield*/, pool.query(query, values)];
            case 3:
                _g.sent();
                console.log('Inserted position data:', values);
                return [3 /*break*/, 6];
            case 4:
                if (!(topic === 'IoT_Academy/c3g2t1/robot3/motors/torques/')) return [3 /*break*/, 6];
                query = "\n        UPDATE \"robot3_data\"\n        SET hbot_torq1 = $1,\n            hbot_torq2 = $2,\n            hbot_torq3 = $3\n        WHERE timestamp = $4\n      ";
                values = [
                    ((_d = payload.data['MACTTORQUE[1]']) === null || _d === void 0 ? void 0 : _d.toString()) || '0',
                    ((_e = payload.data['MACTTORQUE[2]']) === null || _e === void 0 ? void 0 : _e.toString()) || '0',
                    ((_f = payload.data['MACTTORQUE[3]']) === null || _f === void 0 ? void 0 : _f.toString()) || '0',
                    payload.timestamp
                ];
                return [4 /*yield*/, pool.query(query, values)];
            case 5:
                _g.sent();
                console.log('Updated torque data:', values);
                _g.label = 6;
            case 6: return [3 /*break*/, 8];
            case 7:
                error_2 = _g.sent();
                console.error('Error processing message:', error_2);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
mqttClient.on('error', function (error) {
    console.error('MQTT Error:', error);
});
pool.on('error', function (error) {
    console.error('Database Error:', error);
});
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Closing connections...');
                mqttClient.end();
                return [4 /*yield*/, pool.end()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
