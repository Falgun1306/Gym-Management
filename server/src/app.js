import express from "express";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

// ── Raw body parsing for Razorpay webhook (must come BEFORE express.json) ──
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
    req.rawBody = req.body;
    if (Buffer.isBuffer(req.body)) {
        req.body = req.body.toString("utf8");
    }
    next();
});

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("server is on fire");
});

// ── Role-based legacy/backward-compatible routes ──
import userRouter from "./routes/user.router.js";
app.use("/api/v1/users", userRouter);

import paymentRouter from "./routes/payment.router.js";
app.use("/api/v1/payments", paymentRouter);

import memberRouter from "./routes/member.router.js";
app.use("/api/v1/members", memberRouter);

import trainerRouter from "./routes/trainer.router.js";
app.use("/api/v1/trainers", trainerRouter);

import adminRouter from "./routes/admin.router.js";
app.use("/api/v1/admins", adminRouter);

// ── Domain-specific feature routes ──
import workoutRouter from "./routes/workout.router.js";
app.use("/api/v1/workouts", workoutRouter);

import dietRouter from "./routes/diet.router.js";
app.use("/api/v1/diets", dietRouter);

import notificationRouter from "./routes/notification.router.js";
app.use("/api/v1/notifications", notificationRouter);

import equipmentRouter from "./routes/equipment.router.js";
app.use("/api/v1/equipment", equipmentRouter);

import attendanceRouter from "./routes/attendance.router.js";
app.use("/api/v1/attendance", attendanceRouter);

import exerciseRouter from "./routes/exercise.router.js";
app.use("/api/v1/exercises", exerciseRouter);

import complaintRouter from "./routes/complaint.router.js";
app.use("/api/v1/complaints", complaintRouter);

import gymClassRouter from "./routes/gymClass.router.js";
app.use("/api/v1/gym-classes", gymClassRouter);

import dashboardRouter from "./routes/dashboard.router.js";
app.use("/api/v1/dashboards", dashboardRouter);

import reportRouter from "./routes/report.router.js";
app.use("/api/v1/reports", reportRouter);

import couponRouter from "./routes/coupon.router.js";
app.use("/api/v1/coupons", couponRouter);

import healthRouter from "./routes/health.router.js";
app.use("/api/v1/health", healthRouter);

app.use(errorHandler);

export { app };