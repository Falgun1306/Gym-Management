import memberRepository from "../repositories/member.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import paymentRepository from "../repositories/payment.repository.js";
import attendanceRepository from "../repositories/attendance.repository.js";
import notificationRepository from "../repositories/notification.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class DashboardService {
    async getAdminDashboard() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const [
            totalMembers,
            activeMembers,
            totalTrainers,
            activeMemberships,
            monthlyRevenueAgg,
            pendingPayments,
            attendanceToday,
        ] = await Promise.all([
            memberRepository.count({ user: { role: "MEMBER" } }),
            memberRepository.count({
                user: { role: "MEMBER" },
                memberships: { some: { status: "ACTIVE", endDate: { gte: today } } },
            }),
            trainerRepository.count(),
            membershipRepository.countMemberships({ status: "ACTIVE", endDate: { gte: today } }),
            paymentRepository.aggregate({ status: "SUCCESS", paidAt: { gte: monthStart, lt: monthEnd } }),
            paymentRepository.count({ status: "PENDING" }),
            attendanceRepository.count({ checkIn: { gte: today, lt: tomorrow } }),
        ]);

        return {
            totalMembers,
            activeMembers: Math.min(activeMembers, totalMembers),
            totalTrainers,
            activeMemberships,
            monthlyRevenue: monthlyRevenueAgg._sum.amount || 0,
            pendingPayments,
            attendanceToday,
        };
    }

    async getTrainerDashboard(userId) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const [assignedMembersCount, workoutPlansCount, dietPlansCount, gymClassesCount] = await Promise.all([
            memberRepository.count({ trainerId: trainer.id }),
            prisma.workoutPlan.count({ where: { trainerId: trainer.id } }),
            prisma.dietPlan.count({ where: { trainerId: trainer.id } }),
            prisma.gymClass.count({ where: { trainerId: trainer.id } }),
        ]);

        return {
            trainerProfile: {
                id: trainer.id,
                firstName: trainer.firstName,
                lastName: trainer.lastName,
                specialization: trainer.specialization,
                averageRating: trainer.averageRating,
            },
            assignedMembersCount,
            workoutPlansCount,
            dietPlansCount,
            gymClassesCount,
        };
    }

    async getMemberDashboard(userId) {
        const member = await memberRepository.findByUserId(userId, {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                    phone: true,
                    experience: true,
                    bio: true,
                    user: {
                        select: {
                            email: true
                        }
                    }
                },
            },
        });

        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        let activeMembership = await prisma.membership.findFirst({
            where: { memberId: member.id, status: { in: ["ACTIVE", "FROZEN", "PENDING"] } },
            include: { plan: true },
            orderBy: { endDate: "desc" },
        });

        if (activeMembership && activeMembership.status === "PENDING") {
            activeMembership = await prisma.membership.update({
                where: { id: activeMembership.id },
                data: { status: "ACTIVE" },
                include: { plan: true },
            });
        }

        const [workoutAssignmentsCount, dietAssignmentsCount, totalVisits, unreadNotificationsCount] = await Promise.all([
            prisma.workoutAssignment.count({ where: { memberId: member.id } }),
            prisma.dietAssignment.count({ where: { memberId: member.id } }),
            attendanceRepository.count({ memberId: member.id }),
            notificationRepository.count({ userId, isRead: false }),
        ]);

        return {
            memberProfile: {
                id: member.id,
                firstName: member.firstName,
                lastName: member.lastName,
                trainer: member.trainer,
            },
            activeMembership,
            assignedWorkoutsCount: workoutAssignmentsCount,
            assignedDietsCount: dietAssignmentsCount,
            totalVisits,
            unreadNotificationsCount,
        };
    }
}

export default new DashboardService();
