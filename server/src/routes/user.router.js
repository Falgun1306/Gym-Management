import express from "express";
import { register,login,logout } from "../controller/user.controller.js";      
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register",register);
router.post("/login",login);
router.post("/logout",auth,logout);

export default router;