import prisma from "../config/prisma.js";

/**
 * Equipment Maintenance Job
 *
 * Checks for equipment whose maintenanceDate is within the
 * next 3 days or has already passed, and alerts all ADMIN users.
 * Skips equipment already UNDER_MAINTENANCE or RETIRED.
 */
export async function runEquipmentMaintenanceJob() {
    const jobName = "EquipmentMaintenance";
    console.log(`[${jobName}] Starting...`);

    try {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        // Find equipment due for maintenance (within 3 days or overdue)
        const dueEquipment = await prisma.equipment.findMany({
            where: {
                maintenanceDate: { lte: threeDaysFromNow },
                status: { notIn: ["UNDER_MAINTENANCE", "RETIRED"] },
            },
        });

        if (dueEquipment.length === 0) {
            console.log(`[${jobName}] No equipment due for maintenance.`);
            return;
        }

        // Get all admin users
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
        });

        if (admins.length === 0) {
            console.log(`[${jobName}] No admin users found to notify.`);
            return;
        }

        const notifications = [];
        for (const equipment of dueEquipment) {
            const maintenanceDateStr = new Date(equipment.maintenanceDate).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short", year: "numeric" }
            );
            const isOverdue = new Date(equipment.maintenanceDate) < new Date();

            for (const admin of admins) {
                notifications.push({
                    userId: admin.id,
                    title: isOverdue
                        ? "Equipment Maintenance Overdue!"
                        : "Equipment Maintenance Due Soon",
                    message: isOverdue
                        ? `Equipment "${equipment.name}" was due for maintenance on ${maintenanceDateStr} and is now overdue. Please schedule servicing immediately.`
                        : `Equipment "${equipment.name}" is due for maintenance on ${maintenanceDateStr}. Please schedule servicing.`,
                    type: "GENERAL",
                });
            }
        }

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }

        console.log(
            `[${jobName}] Sent ${notifications.length} alerts for ${dueEquipment.length} equipment items to ${admins.length} admins.`
        );
    } catch (error) {
        console.error(`[${jobName}] Error:`, error.message);
    }
}
