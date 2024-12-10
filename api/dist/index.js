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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * index.ts
 *
 * This source file will implement [TODO – add in description]
 */
// TODO: add in import statements
/*
 * function main();
 *
 * This is the mainline code for our project. This code will
 * perform the following work:
 * TODO – add in description
 */
const express_1 = __importDefault(require("express"));
const pg = __importStar(require("pg"));
const PORT = 3000;
const app = (0, express_1.default)();
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    //continue default processing
    next();
});
app.get('/', (req, res) => {
    //default route
    res.send("hello, this is api");
});
// set up route for simple web site file serving
app.use(express_1.default.static('public'));
//add more appropriate router names here
const apiRouter = express_1.default.Router();
const dbRouter = express_1.default.Router();
//middleware for apiRouter
apiRouter.use((req, res, next) => {
    console.log("middleware this");
    next();
});
//middleware for dbRouter
dbRouter.use((req, res, next) => {
    console.log("middleware that");
    next();
});
//route handler for apiRouter
apiRouter.get('/timestable/:table', (req, res) => {
    let ttable = convertDataToInteger(req.params.table, 1);
    let start = convertDataToInteger(req.query.start, 1);
    let end = convertDataToInteger(req.query.end, 10);
    let tableoutput = generateTimesTable(ttable, start, end);
    res.header('Access-Control-Allow-Origin', '*');
    res.send(tableoutput);
});
//route handler for dbRouter
dbRouter.get('/filter', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let from = req.query.from;
    let to = req.query.to;
    const dbconf = {
        user: "postgres",
        host: "192.168.0.211",
        port: 3306,
        database: "academy25",
        password: "academy2024!"
    };
    const db = new pg.Client(dbconf);
    yield db.connect();
    const query = `SELECT * FROM "hbot_motion" WHERE timestamp >= '${from}' AND timestamp <= '${to}'`;
    //const values:any = [];
    console.log(query);
    const dbresult = yield db.query(query);
    db.end();
    res.send(dbresult);
    //http://127.0.0.1:3000/filter/?from=2024-12-10T15:07:09.177Z&to=2024-12-10T15:07:21.021Z
}));
app.use(apiRouter);
app.use(dbRouter);
app.listen(PORT, () => {
    console.log(`hello this is fbi, PORT ${PORT}`);
});
//convert input data to int
const convertDataToInteger = (data, def) => {
    let n = def;
    if (data != undefined) {
        n = parseInt(data.toString(), 10);
        if (Number.isNaN(n))
            n = def;
    }
    return n;
};
//helper
const generateTimesTable = (ttable, start, end) => {
    let p = 0;
    let x = 0;
    let out = [];
    for (x = start; x <= end; x++) {
        p = x * ttable;
        out.push(`${x} x ${ttable} = ${p}`);
        //console.log(`${x} x ${ttable} = ${p}`);
    }
    return out;
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: stuff
    });
}
main(); // execute main function
//# sourceMappingURL=index.js.map