import paymentRepository from "../repositories/payment.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import memberRepository from "../repositories/member.repository.js";
import prisma from "../config/prisma.js";

class ReportService {
    async getRevenueReport(query) {
        const { startDate, endDate } = query;
        const where = { status: "SUCCESS" };

        if (startDate || endDate) {
            where.paidAt = {};
            if (startDate) where.paidAt.gte = new Date(startDate);
            if (endDate) where.paidAt.lte = new Date(endDate);
        }

        const [aggregateResult, breakdown] = await Promise.all([
            paymentRepository.aggregate(where),
            prisma.payment.groupBy({
                by: ["paymentMethod"],
                _sum: { amount: true },
                _count: { id: true },
                where,
            }),
        ]);

        return {
            totalRevenue: aggregateResult._sum.amount || 0,
            totalTransactions: aggregateResult._count.id || 0,
            paymentMethodBreakdown: breakdown,
        };
    }

    async getMembershipReport() {
        const [statusBreakdown, plans] = await Promise.all([
            membershipRepository.groupByStatus(),
            membershipRepository.findPlans(),
        ]);

        return {
            statusBreakdown,
            availablePlansCount: plans.length,
            plans,
        };
    }

    async getTrainerReport() {
        const trainers = await prisma.trainer.findMany({
            include: {
                _count: {
                    select: {
                        members: true,
                        gymClasses: true,
                    },
                },
            },
            orderBy: { joinedAt: "desc" },
        });

        return trainers.map((t) => ({
            id: t.id,
            name: `${t.firstName || ""} ${t.lastName || ""}`.trim(),
            specialization: t.specialization,
            averageRating: t.averageRating,
            assignedMembersCount: t._count?.members || 0,
            gymClassesCount: t._count?.gymClasses || 0,
        }));
    }

    async getMemberGrowthReport() {
        const [totalMembers, monthlyJoins] = await Promise.all([
            memberRepository.count(),
            prisma.member.groupBy({
                by: ["joinedAt"],
                _count: { id: true },
                orderBy: { joinedAt: "desc" },
                take: 12,
            }),
        ]);

        return {
            totalMembers,
            monthlyJoins,
        };
    }
}

export default new ReportService();
