import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    getRevenueReport,
    getMembershipReport,
    getTrainerReport,
    getMemberGrowthReport,
} from "../controller/report.controller.js";

const router = express.Router();

// Admin reports & analytics
router.get("/revenue", auth, authorize("ADMIN"), getRevenueReport);
router.get("/memberships", auth, authorize("ADMIN"), getMembershipReport);
router.get("/trainers", auth, authorize("ADMIN"), getTrainerReport);
router.get("/member-growth", auth, authorize("ADMIN"), getMemberGrowthReport);

export default router;
