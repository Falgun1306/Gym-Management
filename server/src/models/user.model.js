import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
       type: String,
       required:true,
       unique:true,
       lowercase:true,
       minlength:3,
       maxlength:30     
    },
    password:{
        type: String,
        required:true,
        minlength:8
    },
    email:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    role:{
        type: String,
        enum:["member","admin", "trainer"],
        default:"member"
    }
},{timestamps:true})

const User = mongoose.model("User",userSchema);
export default User;