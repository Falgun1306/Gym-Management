import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
    validateCreateTimeSlot,
    validateUpdateTimeSlot,
    validateCreateAdvisory,
} from "../validations/timeSlot.validation.js";
import {
    getMyTimeSlots,
    setMyTimeSlot,
    updateMyTimeSlot,
    deleteMyTimeSlot,
    getTrainerTimeSlotOverview,
    createAdvisory,
    deleteAdvisory,
} from "../controller/timeSlot.controller.js";

const router = express.Router();

// ─── Member Slot Routes ──────────────────────────────────────────────────────
router.get("/my-slots", auth, authorize("MEMBER"), getMyTimeSlots);
router.post("/my-slots", auth, authorize("MEMBER"), validate(validateCreateTimeSlot), setMyTimeSlot);
router.patch("/my-slots/:id", auth, authorize("MEMBER"), validate(validateUpdateTimeSlot), updateMyTimeSlot);
router.delete("/my-slots/:id", auth, authorize("MEMBER"), deleteMyTimeSlot);

// ─── Trainer & Admin Overview & Space Management Routes ──────────────────────
router.get("/overview", auth, authorize("TRAINER", "ADMIN"), getTrainerTimeSlotOverview);
router.post("/advisories", auth, authorize("TRAINER", "ADMIN"), validate(validateCreateAdvisory), createAdvisory);
router.delete("/advisories/:id", auth, authorize("TRAINER", "ADMIN"), deleteAdvisory);

export default router;
