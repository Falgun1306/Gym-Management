import prisma from "../config/prisma.js";

/**
 * Class Reminder Job
 *
 * Finds all gym classes scheduled for tomorrow and notifies
 * every member who has a BOOKED booking for that class.
 */
export async function runClassReminderJob() {
    const jobName = "ClassReminder";
    console.log(`[${jobName}] Starting...`);

    try {
        const now = new Date();

        // Calculate tomorrow's date range
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

        // Find all classes scheduled for tomorrow with their booked members
        const tomorrowClasses = await prisma.gymClass.findMany({
            where: {
                startTime: { gte: tomorrowStart, lt: tomorrowEnd },
            },
            include: {
                trainer: {
                    select: { firstName: true, lastName: true },
                },
                bookings: {
                    where: { status: "BOOKED" },
                    include: {
                        member: {
                            select: { userId: true, firstName: true },
                        },
                    },
                },
            },
        });

        if (tomorrowClasses.length === 0) {
            console.log(`[${jobName}] No classes scheduled for tomorrow.`);
            return;
        }

        const notifications = [];

        for (const gymClass of tomorrowClasses) {
            const classTime = new Date(gymClass.startTime).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            const trainerName = `${gymClass.trainer.firstName} ${gymClass.trainer.lastName}`;

            for (const booking of gymClass.bookings) {
                notifications.push({
                    userId: booking.member.userId,
                    title: "Upcoming Class Tomorrow",
                    message: `Reminder: You have "${gymClass.title}" tomorrow at ${classTime} with ${trainerName}. Don't miss it!`,
                    type: "CLASS",
                });
            }
        }

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }

        console.log(
            `[${jobName}] Sent ${notifications.length} reminders for ${tomorrowClasses.length} classes.`
        );
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
