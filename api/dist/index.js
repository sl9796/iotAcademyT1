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
const PORT = 3000;
const app = (0, express_1.default)();
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    //continue default processing
    next();
});
app.get('/', (req, res) => {
    res.send("this is api");
});
//add more appropriate router names here
const apiRouter = express_1.default.Router();
//middleware for apiRouter
apiRouter.use((req, res, next) => {
    console.log("middleware this");
    next();
});
//route handler for apiRouter
apiRouter.get('/testapi', (req, res) => {
    console.log("something endpoint");
    res.send("end of the line for you");
});
app.use(apiRouter);
app.listen(PORT, () => {
    console.log(`hello this is fbi, PORT ${PORT}`);
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Hello project");
        // TODO: our project code goes here
    });
}
main(); // execute main function
//# sourceMappingURL=index.js.map