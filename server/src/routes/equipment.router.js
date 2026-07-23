import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateCreateEquipment, validateUpdateEquipmentStatus } from "../validations/equipment.validation.js";
import {
    createEquipment,
    listEquipment,
    getEquipmentById,
    updateEquipment,
    updateEquipmentStatus,
    deleteEquipment,
} from "../controller/equipment.controller.js";

const router = express.Router();

// View equipment list (Authenticated users)
router.get("/", auth, listEquipment);
router.get("/:id", auth, getEquipmentById);

// Admin equipment management
router.post("/", auth, authorize("ADMIN"), validate(validateCreateEquipment), createEquipment);
router.patch("/:id", auth, authorize("ADMIN"), updateEquipment);
router.patch("/:id/status", auth, authorize("ADMIN", "TRAINER"), validate(validateUpdateEquipmentStatus), updateEquipmentStatus);
router.delete("/:id", auth, authorize("ADMIN"), deleteEquipment);

export default router;
