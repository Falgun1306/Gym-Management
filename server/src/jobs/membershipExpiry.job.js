import prisma from "../config/prisma.js";
import { sendMembershipExpiryReminder } from "../services/email.service.js";

/**
 * Membership Expiry Job
 *
 * Finds all ACTIVE memberships whose endDate has passed,
 * marks them EXPIRED, and notifies each member via database notification and email.
 */
export async function runMembershipExpiryJob() {
    const jobName = "MembershipExpiry";
    console.log(`[${jobName}] Starting...`);

    try {
        const now = new Date();

        // Find all active memberships that have expired
        const expiredMemberships = await prisma.membership.findMany({
            where: {
                status: "ACTIVE",
                endDate: { lte: now },
            },
            include: {
                member: {
                    select: {
                        userId: true,
                        firstName: true,
                        lastName: true,
                        user: { select: { email: true } },
                    },
                },
                plan: {
                    select: { name: true },
                },
            },
        });

        if (expiredMemberships.length === 0) {
            console.log(`[${jobName}] No expired memberships found.`);
            return;
        }

        // Batch update all expired memberships
        const membershipIds = expiredMemberships.map((m) => m.id);
        await prisma.membership.updateMany({
            where: { id: { in: membershipIds } },
            data: { status: "EXPIRED" },
        });

        // Create notifications for each affected member
        const notifications = expiredMemberships.map((membership) => ({
            userId: membership.member.userId,
            title: "Membership Expired",
            message: `Your ${membership.plan.name} membership has expired. Please renew to continue accessing the gym.`,
            type: "MEMBERSHIP",
        }));

        await prisma.notification.createMany({ data: notifications });

        // Send email notification for each expired membership
        for (const membership of expiredMemberships) {
            if (membership.member?.user?.email) {
                const expiryDateStr = new Date(membership.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                });
                sendMembershipExpiryReminder(
                    {
                        name: `${membership.member.firstName} ${membership.member.lastName || ""}`.trim(),
                        email: membership.member.user.email,
                    },
                    {
                        planName: membership.plan.name,
                        expiryDate: expiryDateStr,
                        daysRemaining: 0,
                    }
                ).catch((err) =>
                    console.error(`⚠️ [${jobName}] Email send failed for user ${membership.member.userId}:`, err.message || err)
                );
            }
        }

        console.log(
            `[${jobName}] Expired ${expiredMemberships.length} memberships, sent ${notifications.length} notifications.`
        );
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
