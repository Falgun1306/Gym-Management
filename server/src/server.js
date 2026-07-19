import { app } from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const port = 5000;

connectDB();

app.listen(port,()=>{
    console.log(`Server is running on ${port}...`);
})