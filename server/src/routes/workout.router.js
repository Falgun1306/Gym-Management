import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateCreateWorkoutPlan } from "../validations/workout.validation.js";
import {
    createWorkoutPlan,
    getWorkoutPlans,
    getWorkoutPlanById,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    assignWorkoutPlan,
    getMyWorkoutPlans,
} from "../controller/workout.controller.js";

const router = express.Router();

// Member assigned workout plans
router.get("/me", auth, authorize("MEMBER"), getMyWorkoutPlans);

// Trainer workout plan management
router.post("/", auth, authorize("TRAINER"), validate(validateCreateWorkoutPlan), createWorkoutPlan);
router.get("/", auth, authorize("TRAINER"), getWorkoutPlans);
router.get("/:id", auth, authorize("TRAINER"), getWorkoutPlanById);
router.patch("/:id", auth, authorize("TRAINER"), updateWorkoutPlan);
router.delete("/:id", auth, authorize("TRAINER"), deleteWorkoutPlan);
router.post("/:planId/assign/:memberId", auth, authorize("TRAINER"), assignWorkoutPlan);

export default router;
