import prisma from "../config/prisma.js";

/**
 * Notification Cleanup Job
 *
 * Deletes read notifications older than 30 days.
 * Unread notifications are kept regardless of age.
 */
export async function runNotificationCleanupJob() {
    const jobName = "NotificationCleanup";
    console.log(`[${jobName}] Starting...`);

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.notification.deleteMany({
            where: {
                isRead: true,
                createdAt: { lt: thirtyDaysAgo },
            },
        });

        console.log(`[${jobName}] Deleted ${result.count} old read notifications.`);
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
