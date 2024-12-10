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

const PORT: number = 3000;
const app: express.Application = express();

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
app.use(express.static('public'));

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
dbRouter.get('/filter', async (req: Request, res: Response) => {
  //basic SELECT from db
  try {
    let from: any = req.query.from;
    let to: any = req.query.to;

    //db config
    //TODO: add config.json support
    const dbconf = {
      user: "postgres",
      host: "192.168.0.211",
      port: 3306,
      database: "academy25",
      password: "academy2024!"
    }
    //instantiate client and connect
    const db = new pg.Client(dbconf)
    await db.connect();

    const query = `SELECT * FROM "hbot_motion" WHERE timestamp >= '${from}' AND timestamp <= '${to}'`;
    console.log(query);
    const dbresult: any = await db.query(query);

    //end connection to db after query
    db.end();

    res.send(dbresult);
    //http://127.0.0.1:3000/filter/?from=2024-12-10T15:07:09.177Z&to=2024-12-10T15:07:21.021Z
  } catch (err: any) {
    console.log(err);
  }

})

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
