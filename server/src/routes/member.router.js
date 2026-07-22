import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    getMyProfile,
    createMyProfile,
    updateMyProfile,
    getMemberById,
    listMembers,
    getMyAttendance,
    getMyPayments,
    getMySubscriptions,
    getMyWorkoutPlans,
    getMyDietPlans,
} from "../controller/member.controller.js";

const router = express.Router();

// ─── /me routes (must be before /:id) ────────────────────────────────────────

router.get("/me", auth, getMyProfile);
router.post("/me", auth, createMyProfile);
router.patch("/me", auth, updateMyProfile);
router.get("/me/attendance", auth, getMyAttendance);
router.get("/me/payments", auth, getMyPayments);
router.get("/me/subscriptions", auth, getMySubscriptions);
router.get("/me/workout-plans", auth, getMyWorkoutPlans);
router.get("/me/diet-plans", auth, getMyDietPlans);

// ─── Admin / Trainer routes ──────────────────────────────────────────────────

router.get("/:id", auth, authorize("ADMIN", "TRAINER"), getMemberById);
router.get("/", auth, authorize("ADMIN"), listMembers);

export default router;
