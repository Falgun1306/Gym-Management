import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import attendanceService from "../services/attendance.service.js";
import qrCheckinService from "../services/qrCheckin.service.js";

const checkIn = asyncHandler(async (req, res) => {
    const attendance = await attendanceService.checkIn(req.user.id);
    res.status(201).json(new ApiResponse(201, attendance, "Checked in successfully"));
});

const checkOut = asyncHandler(async (req, res) => {
    const attendance = await attendanceService.checkOut(req.user.id);
    res.status(200).json(new ApiResponse(200, attendance, "Checked out successfully"));
});

const getMyAttendance = asyncHandler(async (req, res) => {
    const { history, totalVisits, pagination } = await attendanceService.getMyAttendanceHistory(req.user.id, req.query);
    res.status(200).json({
        ...new ApiResponse(200, history, "Attendance history retrieved", pagination),
        totalVisits,
    });
});

const getMemberAttendance = asyncHandler(async (req, res) => {
    const { attendances, pagination } = await attendanceService.getMemberAttendanceByTrainer(req.user.id, req.params.memberId, req.query);
    res.status(200).json(new ApiResponse(200, attendances, "Member attendance retrieved", pagination));
});

const markMemberAttendance = asyncHandler(async (req, res) => {
    const { action, attendance } = await attendanceService.markMemberAttendanceByTrainer(req.user.id, req.params.memberId);
    const message = action === "CHECK_OUT" ? "Member checked out successfully" : "Member checked in successfully";
    const statusCode = action === "CHECK_OUT" ? 200 : 201;
    res.status(statusCode).json(new ApiResponse(statusCode, attendance, message));
});

const listAttendance = asyncHandler(async (req, res) => {
    const { attendances, pagination } = await attendanceService.listAttendance(req.query);
    res.status(200).json(new ApiResponse(200, attendances, "Attendance list retrieved", pagination));
});

const getAttendanceReport = asyncHandler(async (req, res) => {
    const report = await attendanceService.getAttendanceReport();
    res.status(200).json(new ApiResponse(200, report, "Attendance report generated"));
});

// ── QR Code Check-in ──────────────────────────────────────────────────────────

const generateQrCode = asyncHandler(async (req, res) => {
    const qrData = await qrCheckinService.generateQrCode(req.user.id);
    res.status(200).json(new ApiResponse(200, qrData, "QR code generated successfully"));
});

const scanQrCode = asyncHandler(async (req, res) => {
    const { action, attendance, memberName } = await qrCheckinService.scanQrCode(req.body.qrToken);
    const message = action === "CHECK_OUT"
        ? `${memberName} checked out successfully`
        : `${memberName} checked in successfully`;
    const statusCode = action === "CHECK_OUT" ? 200 : 201;
    res.status(statusCode).json(new ApiResponse(statusCode, attendance, message));
});

export {
    checkIn,
    checkOut,
    getMyAttendance,
    getMemberAttendance,
    markMemberAttendance,
    listAttendance,
    getAttendanceReport,
    generateQrCode,
    scanQrCode,
};
