import prisma from "../config/prisma.js";

/**
 * No-Show Marker Job
 *
 * Finds class bookings where the class has ended today but the
 * member's booking is still BOOKED (never attended or cancelled).
 * Marks them as NO_SHOW and notifies the member.
 */
export async function runNoShowMarkerJob() {
    const jobName = "NoShowMarker";
    console.log(`[${jobName}] Starting...`);

    try {
        const now = new Date();

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        // Find bookings for classes that ended today, still in BOOKED status
        const noShowBookings = await prisma.classBooking.findMany({
            where: {
                status: "BOOKED",
                gymClass: {
                    endTime: { gte: todayStart, lt: todayEnd, lte: now },
                },
            },
            include: {
                member: {
                    select: { userId: true, firstName: true },
                },
                gymClass: {
                    select: { title: true },
                },
            },
        });

        if (noShowBookings.length === 0) {
            console.log(`[${jobName}] No no-show bookings found.`);
            return;
        }

        // Batch update all no-show bookings
        const bookingIds = noShowBookings.map((b) => b.id);
        await prisma.classBooking.updateMany({
            where: { id: { in: bookingIds } },
            data: { status: "NO_SHOW" },
        });

        // Notify each member
        const notifications = noShowBookings.map((booking) => ({
            userId: booking.member.userId,
            title: "Missed Class",
            message: `You missed your "${booking.gymClass.title}" class today. Please cancel in advance if you can't attend.`,
            type: "CLASS",
        }));

        await prisma.notification.createMany({ data: notifications });

        console.log(
            `[${jobName}] Marked ${noShowBookings.length} bookings as NO_SHOW, sent ${notifications.length} notifications.`
        );
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
