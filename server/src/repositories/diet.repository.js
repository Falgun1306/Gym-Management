import prisma from "../config/prisma.js";

class DietRepository {
    async findPlanById(id, trainerId = null) {
        return prisma.dietPlan.findUnique({
            where: {
                id,
                ...(trainerId && { trainerId }),
            },
        });
    }

    async findPlansByTrainer(trainerId) {
        return prisma.dietPlan.findMany({
            where: { trainerId },
            orderBy: { createdAt: "desc" },
        });
    }

    async findMemberAssignments(memberId) {
        return prisma.dietAssignment.findMany({
            where: { memberId },
            include: {
                dietPlan: true,
                trainer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { assignedAt: "desc" },
        });
    }

    async createPlan(data) {
        return prisma.dietPlan.create({ data });
    }

    async updatePlan(id, data) {
        return prisma.dietPlan.update({ where: { id }, data });
    }

    async deletePlan(id) {
        return prisma.dietPlan.delete({ where: { id } });
    }

    async createAssignment(data) {
        return prisma.dietAssignment.create({
            data,
            include: { dietPlan: true },
        });
    }
}

export default new DietRepository();
