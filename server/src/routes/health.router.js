import express from "express";
import { healthCheck, databaseStatus } from "../controller/health.controller.js";

const router = express.Router();

router.get("/", healthCheck);
router.get("/db", databaseStatus);

export default router;
