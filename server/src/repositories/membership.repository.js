import prisma from "../config/prisma.js";

class MembershipRepository {
    async findPlanById(id, include = null) {
        return prisma.membershipPlan.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findPlanByName(name) {
        return prisma.membershipPlan.findUnique({ where: { name } });
    }

    async findPlans(where = {}, include = null) {
        return prisma.membershipPlan.findMany({
            where,
            orderBy: { price: "asc" },
            ...(include && { include }),
        });
    }

    async createPlan(data) {
        return prisma.membershipPlan.create({ data });
    }

    async updatePlan(id, data) {
        return prisma.membershipPlan.update({ where: { id }, data });
    }

    async deletePlan(id) {
        return prisma.membershipPlan.delete({ where: { id } });
    }

    async createMembership(data) {
        return prisma.membership.create({
            data,
            include: { plan: true, member: true },
        });
    }

    async findMembershipById(id, include = null) {
        return prisma.membership.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findMemberships(where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" }, include = null) {
        const [data, total] = await Promise.all([
            prisma.membership.findMany({
                where,
                skip,
                take,
                orderBy,
                ...(include && { include }),
            }),
            prisma.membership.count({ where }),
        ]);

        return { data, total };
    }

    async countMemberships(where = {}) {
        return prisma.membership.count({ where });
    }

    async groupByStatus() {
        return prisma.membership.groupBy({
            by: ["status"],
            _count: { id: true },
        });
    }
}

export default new MembershipRepository();
