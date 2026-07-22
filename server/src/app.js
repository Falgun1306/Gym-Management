import express from "express";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());


app.get("/", (req,res)=>{
    res.send("server is on fire");
})

import userRouter from "./routes/user.router.js";
app.use("/api/v1/users",userRouter);

import memberRouter from "./routes/member.router.js";
app.use("/api/v1/members", memberRouter);

import trainerRouter from "./routes/trainer.router.js";
app.use("/api/v1/trainers", trainerRouter);

import adminRouter from "./routes/admin.router.js";
app.use("/api/v1/admins", adminRouter);

app.use(errorHandler);

export {app};