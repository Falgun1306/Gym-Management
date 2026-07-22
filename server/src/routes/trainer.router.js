import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    getMyProfile,
    createMyProfile,
    updateMyProfile,
    listTrainers,
    getTrainerById,
    getMyMembers,
    getMyMemberById,
    createWorkoutPlan,
    getWorkoutPlans,
    getWorkoutPlanById,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    assignWorkoutPlan,
    createDietPlan,
    getDietPlans,
    getDietPlanById,
    updateDietPlan,
    deleteDietPlan,
    assignDietPlan,
    getMySchedule,
    updateMySchedule,
    logMemberProgress,
    getMemberProgress,
} from "../controller/trainer.controller.js";

const router = express.Router();

// ─── Profile ─────────────────────────────────────────────────────────────────

router.get("/me", auth, authorize("TRAINER"), getMyProfile);
router.post("/me", auth, createMyProfile);
router.patch("/me", auth, authorize("TRAINER"), updateMyProfile);

// ─── Assigned Members ────────────────────────────────────────────────────────

router.get("/me/members", auth, authorize("TRAINER"), getMyMembers);
router.get("/me/members/:memberId", auth, authorize("TRAINER"), getMyMemberById);

// ─── Schedule ────────────────────────────────────────────────────────────────

router.get("/me/schedule", auth, authorize("TRAINER"), getMySchedule);
router.patch("/me/schedule", auth, authorize("TRAINER"), updateMySchedule);

// ─── Workout Plans CRUD ──────────────────────────────────────────────────────

router.post("/workout-plans", auth, authorize("TRAINER"), createWorkoutPlan);
router.get("/workout-plans", auth, authorize("TRAINER"), getWorkoutPlans);
router.get("/workout-plans/:id", auth, authorize("TRAINER"), getWorkoutPlanById);
router.patch("/workout-plans/:id", auth, authorize("TRAINER"), updateWorkoutPlan);
router.delete("/workout-plans/:id", auth, authorize("TRAINER"), deleteWorkoutPlan);
router.post("/workout-plans/:planId/assign/:memberId", auth, authorize("TRAINER"), assignWorkoutPlan);

// ─── Diet Plans CRUD ─────────────────────────────────────────────────────────

router.post("/diet-plans", auth, authorize("TRAINER"), createDietPlan);
router.get("/diet-plans", auth, authorize("TRAINER"), getDietPlans);
router.get("/diet-plans/:id", auth, authorize("TRAINER"), getDietPlanById);
router.patch("/diet-plans/:id", auth, authorize("TRAINER"), updateDietPlan);
router.delete("/diet-plans/:id", auth, authorize("TRAINER"), deleteDietPlan);
router.post("/diet-plans/:planId/assign/:memberId", auth, authorize("TRAINER"), assignDietPlan);

// ─── Progress Tracking ──────────────────────────────────────────────────────

router.post("/members/:memberId/progress", auth, authorize("TRAINER"), logMemberProgress);
router.get("/members/:memberId/progress", auth, authorize("TRAINER"), getMemberProgress);

// ─── Public Trainer Listings (any authenticated user) ────────────────────────

router.get("/:id", auth, getTrainerById);
router.get("/", auth, listTrainers);

export default router;
