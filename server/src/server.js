import { app } from "./app.js";
import connectDB from "./config/db.js";
import { initializeJobs, shutdownJobs } from "./config/jobScheduler.js";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 5000;

connectDB();

app.listen(port, () => {
    console.log(`Server is running on ${port}...`);

    // Start all cron jobs after the server is up and DB is connected
    initializeJobs();
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    shutdownJobs();
    process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdownJobs();
    process.exit(1);
});