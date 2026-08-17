import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const parseOrigins = () => {
    const raw = process.env.CLIENT_URL || "";
    const list = raw
        .split(",")
        .map((url) => url.trim().replace(/\/+$/, ""))
        .filter(Boolean);

    return [
        ...list,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ];
};

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server or non-browser requests (e.g. Postman, curl, webhooks)
            if (!origin) return callback(null, true);

            const allowed = parseOrigins();
            const normalizedOrigin = origin.replace(/\/+$/, "");

            try {
                const url = new URL(origin);
                if (
                    allowed.includes(normalizedOrigin) ||
                    allowed.includes(origin) ||
                    url.hostname.endsWith(".vercel.app") ||
                    url.hostname === "localhost" ||
                    url.hostname === "127.0.0.1"
                ) {
                    return callback(null, true);
                }
            } catch {
                // If URL parsing fails, fallback to direct string check
                if (allowed.includes(normalizedOrigin)) {
                    return callback(null, true);
                }
            }

            callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    })
);

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

import timeSlotRouter from "./routes/timeSlot.router.js";
app.use("/api/v1/time-slots", timeSlotRouter);

app.use(errorHandler);

export { app };