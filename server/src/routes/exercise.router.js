import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateCreateExercise } from "../validations/exercise.validation.js";
import {
    createExercise,
    listExercises,
    getExerciseById,
    getExercisesByMuscleGroup,
    searchExercises,
    updateExercise,
    deleteExercise,
} from "../controller/exercise.controller.js";

const router = express.Router();

// Read & search exercises (Authenticated users)
router.get("/", auth, listExercises);
router.get("/search", auth, searchExercises);
router.get("/muscle-group/:muscleGroup", auth, getExercisesByMuscleGroup);
router.get("/:id", auth, getExerciseById);

// Admin / Trainer exercise management
router.post("/", auth, authorize("ADMIN", "TRAINER"), validate(validateCreateExercise), createExercise);
router.patch("/:id", auth, authorize("ADMIN", "TRAINER"), updateExercise);
router.delete("/:id", auth, authorize("ADMIN", "TRAINER"), deleteExercise);

export default router;
