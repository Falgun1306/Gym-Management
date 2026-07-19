import mongoose from "mongoose";

const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);

        console.log("Database connection successfully");
    }catch(error){
        console.error("Connection failed:", error.message);
        process.exit(1);
    }
}

export default connectDB;