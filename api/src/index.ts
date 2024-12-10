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
const PORT: number = 3000;
const app: express.Application = express();


app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  //continue default processing
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.send("this is api");
});

//add more appropriate router names here
const apiRouter = express.Router();

//middleware for apiRouter
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  console.log("middleware this");
  next();
});

//route handler for apiRouter
apiRouter.get('/testapi', (req: Request, res: Response) => {
  console.log("something endpoint");
  res.send("end of the line for you");
});

app.use(apiRouter);

app.listen(PORT, () => {
  console.log(`hello this is fbi, PORT ${PORT}`)
})

async function main() {
  console.log("Hello project");
  // TODO: our project code goes here
}
main(); // execute main function
