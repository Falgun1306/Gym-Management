import prisma from "../config/prisma.js";

/**
 * Payment Reminder Job
 *
 * Sends renewal reminders for memberships expiring soon:
 *   - 7-day warning
 *   - 3-day urgent warning
 * Skips members who already received a PAYMENT notification in the last 24h.
 */
export async function runPaymentReminderJob() {
    const jobName = "PaymentReminder";
    console.log(`[${jobName}] Starting...`);

    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const twentyFourHoursAgo = new Date(now);
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // Find memberships expiring within 7 days (includes 3-day window)
        const expiringMemberships = await prisma.membership.findMany({
            where: {
                status: "ACTIVE",
                endDate: { gt: now, lte: sevenDaysFromNow },
            },
            include: {
                member: {
                    select: { userId: true, firstName: true },
                },
                plan: {
                    select: { name: true },
                },
            },
        });

        if (expiringMemberships.length === 0) {
            console.log(`[${jobName}] No expiring memberships found.`);
            return;
        }

        // Get userIds who already received a PAYMENT notification in last 24h
        const userIds = expiringMemberships.map((m) => m.member.userId);
        const recentNotifications = await prisma.notification.findMany({
            where: {
                userId: { in: userIds },
                type: "PAYMENT",
                createdAt: { gte: twentyFourHoursAgo },
            },
            select: { userId: true },
        });

        const alreadyNotifiedUserIds = new Set(recentNotifications.map((n) => n.userId));

        const notifications = [];
        for (const membership of expiringMemberships) {
            if (alreadyNotifiedUserIds.has(membership.member.userId)) {
                continue;
            }

            const daysRemaining = Math.ceil(
                (new Date(membership.endDate) - now) / (1000 * 60 * 60 * 24)
            );
            const endDateStr = new Date(membership.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });

            const isUrgent = membership.endDate <= threeDaysFromNow;

            notifications.push({
                userId: membership.member.userId,
                title: isUrgent ? "Urgent: Membership Expiring Soon!" : "Membership Renewal Reminder",
                message: isUrgent
                    ? `URGENT: Your ${membership.plan.name} membership expires in ${daysRemaining} day(s)! Renew immediately to avoid losing access.`
                    : `Your ${membership.plan.name} membership expires on ${endDateStr}. Renew now to avoid interruption.`,
                type: "PAYMENT",
            });
        }

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }

        console.log(
            `[${jobName}] Sent ${notifications.length} reminders (skipped ${alreadyNotifiedUserIds.size} already notified).`
        );
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
