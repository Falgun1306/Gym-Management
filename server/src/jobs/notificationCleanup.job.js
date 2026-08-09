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

        // Cleanup stale "Payment Required" notifications for members who have active memberships
        const activeMembers = await prisma.member.findMany({
            where: {
                memberships: {
                    some: { status: "ACTIVE" },
                },
            },
            select: { userId: true },
        });

        const activeUserIds = activeMembers.map((m) => m.userId).filter(Boolean);
        if (activeUserIds.length > 0) {
            const staleNotifs = await prisma.notification.deleteMany({
                where: {
                    userId: { in: activeUserIds },
                    title: { in: ["Payment Required", "Membership Pending Approval"] },
                },
            });
            console.log(`[${jobName}] Deleted ${staleNotifs.count} stale payment required notifications for active members.`);
        }
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
