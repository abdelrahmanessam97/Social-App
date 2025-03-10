import cors from "cors";
import connectionDb from "./db/connectionDb.js";
import userRouter from "./modules/users/user.controller.js";
import path from "path";
import { globalErrorHandler } from "./utils/error/index.js";
const bootstrap = async (app, express) => {
  // middleware to parse json
  app.use(express.json());

  // middleware to allow cors
  app.use(cors());

  app.use("/uploads", express.static(path.resolve("uploads")));

  // connect to database
  await connectionDb();

  // parse application/json

  //main route
  app.get("/", (req, res) => res.send("Hello My App ( Social App )"));

  app.use("/users", userRouter);

  // error handling middleware
  app.use("*", (req, res, next) => {
    return next(new Error(`Route not found ${req.originalUrl}`, { cause: 404 }));
  });

  // error handling middleware
  app.use(globalErrorHandler);
};

export default bootstrap;
