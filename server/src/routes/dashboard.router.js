import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    getAdminDashboard,
    getTrainerDashboard,
    getMemberDashboard,
} from "../controller/dashboard.controller.js";

const router = express.Router();

router.get("/admin", auth, authorize("ADMIN"), getAdminDashboard);
router.get("/trainer", auth, authorize("TRAINER"), getTrainerDashboard);
router.get("/member", auth, authorize("MEMBER"), getMemberDashboard);

export default router;
