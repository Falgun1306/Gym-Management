import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateCreateGymClass } from "../validations/gymClass.validation.js";
import {
    createGymClass,
    updateGymClass,
    deleteGymClass,
    listGymClasses,
    getClassById,
    bookClass,
    cancelBooking,
    getClassBookings,
} from "../controller/gymClass.controller.js";

const router = express.Router();

// Class listing & viewing
router.get("/", auth, listGymClasses);
router.get("/bookings", auth, authorize("TRAINER", "ADMIN"), getClassBookings);
router.get("/:id", auth, getClassById);

// Member bookings
router.post("/:classId/book", auth, authorize("MEMBER"), bookClass);
router.patch("/bookings/:bookingId/cancel", auth, authorize("MEMBER"), cancelBooking);

// Admin class management
router.post("/", auth, authorize("ADMIN"), validate(validateCreateGymClass), createGymClass);
router.patch("/:id", auth, authorize("ADMIN"), updateGymClass);
router.delete("/:id", auth, authorize("ADMIN"), deleteGymClass);

export default router;
