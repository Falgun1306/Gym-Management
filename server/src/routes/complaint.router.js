import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateCreateComplaint, validateResolveComplaint } from "../validations/complaint.validation.js";
import {
    createComplaint,
    listComplaints,
    getComplaintById,
    resolveComplaint,
    deleteComplaint,
} from "../controller/complaint.controller.js";

const router = express.Router();

// Member complaint creation & listing
router.post("/", auth, validate(validateCreateComplaint), createComplaint);
router.get("/", auth, listComplaints);
router.get("/:id", auth, getComplaintById);

// Admin complaint resolution
router.patch("/:id", auth, authorize("ADMIN"), validate(validateResolveComplaint), resolveComplaint);
router.delete("/:id", auth, authorize("ADMIN"), deleteComplaint);

export default router;
