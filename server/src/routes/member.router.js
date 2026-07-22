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
    listGymClasses,
    bookGymClass,
    cancelGymClass,
    createComplaint,
    getMyNotifications,
    markNotificationRead,
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
router.get("/me/notifications", auth, getMyNotifications);
router.patch("/me/notifications/:id", auth, markNotificationRead);

// ─── Gym Classes ─────────────────────────────────────────────────────────────

router.get("/gym-classes", auth, listGymClasses);
router.post("/gym-classes/:classId/book", auth, bookGymClass);
router.patch("/gym-classes/bookings/:bookingId/cancel", auth, cancelGymClass);

// ─── Complaints ──────────────────────────────────────────────────────────────

router.post("/complaints", auth, createComplaint);

// ─── Admin / Trainer routes ──────────────────────────────────────────────────

router.get("/:id", auth, authorize("ADMIN", "TRAINER"), getMemberById);
router.get("/", auth, authorize("ADMIN"), listMembers);

export default router;
