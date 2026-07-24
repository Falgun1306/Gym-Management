import prisma from "../config/prisma.js";

/**
 * Attendance Cleanup Job
 *
 * Auto-closes attendance records from today where the
 * member forgot to check out (checkOut is null).
 */
export async function runAttendanceCleanupJob() {
    const jobName = "AttendanceCleanup";
    console.log(`[${jobName}] Starting...`);

    try {
        const now = new Date();

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const result = await prisma.attendance.updateMany({
            where: {
                checkIn: { gte: todayStart, lt: todayEnd },
                checkOut: null,
            },
            data: {
                checkOut: now,
            },
        });

        console.log(`[${jobName}] Auto-closed ${result.count} forgotten check-outs.`);
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
