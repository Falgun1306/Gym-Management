import express from "express";
import { register, login, logout } from "../controller/auth.controller.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateRegister, validateLogin } from "../validations/auth.validation.js";

const router = express.Router();

router.post("/register", validate(validateRegister), register);
router.post("/login", validate(validateLogin), login);
router.post("/logout", auth, logout);

export default router;