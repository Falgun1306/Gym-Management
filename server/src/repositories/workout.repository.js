import prisma from "../config/prisma.js";

class WorkoutRepository {
    async findPlanById(id, trainerId = null) {
        return prisma.workoutPlan.findUnique({
            where: {
                id,
                ...(trainerId && { trainerId }),
            },
            include: {
                exercises: {
                    include: { exercise: true },
                    orderBy: { orderIndex: "asc" },
                },
            },
        });
    }

    async findPlansByTrainer(trainerId) {
        return prisma.workoutPlan.findMany({
            where: { trainerId },
            include: {
                exercises: {
                    include: { exercise: true },
                    orderBy: { orderIndex: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async findMemberAssignments(memberId) {
        return prisma.workoutAssignment.findMany({
            where: { memberId },
            include: {
                exercise: true,
                trainer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { assignedDate: "desc" },
        });
    }

    async createPlan(data) {
        return prisma.workoutPlan.create({
            data,
            include: {
                exercises: {
                    include: { exercise: true },
                    orderBy: { orderIndex: "asc" },
                },
            },
        });
    }

    async updatePlan(id, data) {
        return prisma.workoutPlan.update({
            where: { id },
            data,
            include: {
                exercises: {
                    include: { exercise: true },
                    orderBy: { orderIndex: "asc" },
                },
            },
        });
    }

    async deletePlan(id) {
        return prisma.workoutPlan.delete({ where: { id } });
    }

    async createAssignments(dataArray) {
        return prisma.workoutAssignment.createMany({ data: dataArray });
    }
}

export default new WorkoutRepository();
