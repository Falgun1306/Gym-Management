import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { validateCreateNotification, validateSendBulkNotification } from "../validations/notification.validation.js";
import {
    getMyNotifications,
    markNotificationRead,
    markAllRead,
    createNotification,
    sendBulkNotification,
    getNotificationById,
    deleteNotification,
} from "../controller/notification.controller.js";

const router = express.Router();

// User notification management
router.get("/me", auth, getMyNotifications);
router.patch("/me/read-all", auth, markAllRead);
router.patch("/me/:id/read", auth, markNotificationRead);

// Admin notification management
router.post("/", auth, authorize("ADMIN"), validate(validateCreateNotification), createNotification);
router.post("/bulk", auth, authorize("ADMIN"), validate(validateSendBulkNotification), sendBulkNotification);
router.get("/:id", auth, getNotificationById);
router.delete("/:id", auth, deleteNotification);

export default router;
