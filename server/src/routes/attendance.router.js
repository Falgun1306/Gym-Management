import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    checkIn,
    checkOut,
    getMyAttendance,
    getMemberAttendance,
    markMemberAttendance,
    listAttendance,
    getAttendanceReport,
    generateQrCode,
    scanQrCode,
} from "../controller/attendance.controller.js";

const router = express.Router();

// Member attendance
router.post("/check-in", auth, authorize("MEMBER"), checkIn);
router.post("/check-out", auth, authorize("MEMBER"), checkOut);
router.get("/me", auth, authorize("MEMBER"), getMyAttendance);

// QR Code check-in
router.get("/me/qr-code", auth, authorize("MEMBER"), generateQrCode);
router.post("/qr/scan", auth, authorize("TRAINER", "ADMIN"), scanQrCode);

// Trainer member attendance
router.get("/members/:memberId", auth, authorize("TRAINER"), getMemberAttendance);
router.post("/members/:memberId", auth, authorize("TRAINER"), markMemberAttendance);

// Admin attendance view & report
router.get("/", auth, authorize("ADMIN"), listAttendance);
router.get("/report", auth, authorize("ADMIN"), getAttendanceReport);

export default router;
