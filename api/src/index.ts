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

import express, { Request, Response, NextFunction } from "express";
import * as pg from 'pg';
import * as path from 'path';

const PORT: number = 3000;
const app: express.Application = express();

//db config
//TODO: add config.json support
const dbconf = {
  user: "postgres",
  host: "192.168.0.211",
  port: 3306,
  database: "academy25",
  password: "academy2024!"
}

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  //continue default processing
  next();
});

app.get('/', (req: Request, res: Response) => {
  //default route
  res.send("hello, this is api");
});
// set up route for simple web site file serving
app.use(express.static(path.resolve('./public')));
//express.static.mime.define({'text/javascript': ['md']})
//add more appropriate router names here
const apiRouter = express.Router();
const dbRouter = express.Router();

//middleware for apiRouter
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  console.log("middleware this");
  next();
});
//middleware for dbRouter
dbRouter.use((req: Request, res: Response, next: NextFunction) => {
  console.log("middleware that");
  next();
});

//route handler for apiRouter
apiRouter.get('/timestable/:table', (req: Request, res: Response) => {

  let ttable: number = convertDataToInteger(req.params.table, 1);
  let start: number = convertDataToInteger(req.query.start, 1);
  let end: number = convertDataToInteger(req.query.end, 10);

  let tableoutput: string[] = generateTimesTable(ttable, start, end);
  res.header('Access-Control-Allow-Origin', '*');
  res.send(tableoutput);
});

//route handler for dbRouter
dbRouter.get('/robot3pos', async (req: Request, res: Response) => {
  //basic SELECT from db
  //instantiate client and connect
  const db = new pg.Client(dbconf)
  try {
    const now: Date = new Date();
    let onehour: Date = new Date();
    onehour.setHours(onehour.getHours() - 1);
    const from: any = req.query.from || onehour.toISOString(); //default now minus 1 hour 
    const to: any = req.query.to || now.toISOString();
    const limit: any = req.query.limit || '100';


    await db.connect();

    const query = `SELECT * FROM "hbot_motion" WHERE timestamp >= '${from}' AND timestamp <= '${to}' ORDER BY timestamp DESC LIMIT '${limit}'`;
    console.log(query);
    const dbresult: any = await db.query(query);

    //end connection to db after query
    db.end();

    res.json(dbresult);

    //http://127.0.0.1:3000/robot3pos/?from=2024-12-11T07:07:21.021Z&limit=350
  } catch (err: any) {
    db.end();
    console.log(err);
  }
})

dbRouter.get('/status', async (req: Request, res: Response) => {
  //basic SELECT from db for status 
  //instantiate client and connect
  const db = new pg.Client(dbconf)

  try {
    let machine: any = req.query.machine || ''; //default value empty string

    await db.connect();

    const query = `SELECT DISTINCT ON (tag) tag, value, timestamp FROM status where tag LIKE('%${machine}%') ORDER BY tag, timestamp DESC;`;

    console.log(query);
    const dbresult: any = await db.query(query);
    //end connection to db after query
    db.end();

    res.send(dbresult);

    //http://127.0.0.1:3000/robot3pos/?from=2024-12-11T07:07:21.021Z&limit=350

  } catch (err: any) {
    db.end(); //end connection on error
    console.log(err.message)
  }
});

app.use(apiRouter);
app.use(dbRouter);

app.listen(PORT, () => {
  console.log(`hello this is fbi, PORT ${PORT}`)
})

//convert input data to int
const convertDataToInteger = (data: any, def: number): number => {
  let n: number = def;
  if (data != undefined) {
    n = parseInt(data.toString(), 10);
    if (Number.isNaN(n)) n = def;
  }
  return n;
}
//helper
const generateTimesTable = (ttable: number, start: number, end: number): string[] => {
  let p: number = 0;
  let x: number = 0;
  let out: string[] = [];
  for (x = start; x <= end; x++) {
    p = x * ttable;
    out.push(`${x} x ${ttable} = ${p}`);
    //console.log(`${x} x ${ttable} = ${p}`);
  }
  return out;
}

async function main() {

  // TODO: stuff
}
main(); // execute main function
