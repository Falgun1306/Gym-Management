import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateCreateDietPlan } from "../validations/diet.validation.js";
import {
    createDietPlan,
    getDietPlans,
    getDietPlanById,
    updateDietPlan,
    deleteDietPlan,
    assignDietPlan,
    getMyDietPlans,
} from "../controller/diet.controller.js";

const router = express.Router();

// Member assigned diet plans
router.get("/me", auth, authorize("MEMBER"), getMyDietPlans);

// Trainer diet plan management
router.post("/", auth, authorize("TRAINER"), validate(validateCreateDietPlan), createDietPlan);
router.get("/", auth, authorize("TRAINER"), getDietPlans);
router.get("/:id", auth, authorize("TRAINER"), getDietPlanById);
router.patch("/:id", auth, authorize("TRAINER"), updateDietPlan);
router.delete("/:id", auth, authorize("TRAINER"), deleteDietPlan);
router.post("/:planId/assign/:memberId", auth, authorize("TRAINER"), assignDietPlan);

export default router;
