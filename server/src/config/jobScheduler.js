import cron from "node-cron";
import { runMembershipExpiryJob } from "../jobs/membershipExpiry.job.js";
import { runPaymentReminderJob } from "../jobs/paymentReminder.job.js";
import { runClassReminderJob } from "../jobs/classReminder.job.js";
import { runNotificationCleanupJob } from "../jobs/notificationCleanup.job.js";
import { runAttendanceCleanupJob } from "../jobs/attendanceCleanup.job.js";
import { runEquipmentMaintenanceJob } from "../jobs/equipmentMaintenance.job.js";
import { runNoShowMarkerJob } from "../jobs/noShowMarker.job.js";

const TIMEZONE = "Asia/Kolkata";

/**
 * Job Registry
 *
 * Each entry defines:
 *   - name:     Human-readable label for logs
 *   - schedule: Standard 5-field cron expression
 *   - handler:  Async function to execute
 */
const JOB_DEFINITIONS = [
    {
        name: "MembershipExpiry",
        schedule: "0 0 * * *", // Every day at midnight
        handler: runMembershipExpiryJob,
    },
    {
        name: "PaymentReminder",
        schedule: "0 9 * * *", // Every day at 9:00 AM
        handler: runPaymentReminderJob,
    },
    {
        name: "ClassReminder",
        schedule: "0 20 * * *", // Every day at 8:00 PM
        handler: runClassReminderJob,
    },
    {
        name: "NotificationCleanup",
        schedule: "0 3 * * 0", // Every Sunday at 3:00 AM
        handler: runNotificationCleanupJob,
    },
    {
        name: "AttendanceCleanup",
        schedule: "59 23 * * *", // Every day at 11:59 PM
        handler: runAttendanceCleanupJob,
    },
    {
        name: "EquipmentMaintenance",
        schedule: "0 7 * * *", // Every day at 7:00 AM
        handler: runEquipmentMaintenanceJob,
    },
    {
        name: "NoShowMarker",
        schedule: "0 23 * * *", // Every day at 11:00 PM
        handler: runNoShowMarkerJob,
    },
];

// Keeps references to running cron tasks for graceful shutdown
const runningTasks = [];

/**
 * Initialize and start all cron jobs.
 * Call this after the database connection is established.
 */
export function initializeJobs() {
    console.log("\n⏰ Initializing scheduled jobs...\n");

    for (const job of JOB_DEFINITIONS) {
        const task = cron.schedule(job.schedule, job.handler, {
            timezone: TIMEZONE,
        });

        runningTasks.push(task);
        console.log(`  ✔ ${job.name.padEnd(24)} → ${job.schedule} (${TIMEZONE})`);
    }

    console.log(`\n⏰ ${JOB_DEFINITIONS.length} jobs scheduled successfully.\n`);
}

/**
 * Stop all running cron jobs.
 * Call this on SIGINT/SIGTERM for graceful shutdown.
 */
export function shutdownJobs() {
    console.log("\n⏰ Shutting down scheduled jobs...");

    for (const task of runningTasks) {
        task.stop();
    }

    runningTasks.length = 0;
    console.log("⏰ All jobs stopped.\n");
}
