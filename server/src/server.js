import { app } from "./app.js";
import connectDB from "./config/db.js";
import { initializeJobs, shutdownJobs } from "./config/jobScheduler.js";
import dotenv from "dotenv";

dotenv.config();

const port = 5000;

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