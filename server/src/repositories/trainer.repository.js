import prisma from "../config/prisma.js";

class TrainerRepository {
    async findById(id, include = null) {
        return prisma.trainer.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findByUserId(userId, include = null) {
        return prisma.trainer.findUnique({
            where: { userId },
            ...(include && { include }),
        });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { joinedAt: "desc" }, include = null) {
        const [data, total] = await Promise.all([
            prisma.trainer.findMany({
                where,
                skip,
                take,
                orderBy,
                ...(include && { include }),
            }),
            prisma.trainer.count({ where }),
        ]);

        return { data, total };
    }

    async create(data, include = null) {
        return prisma.trainer.create({
            data,
            ...(include && { include }),
        });
    }

    async update(id, data, include = null) {
        return prisma.trainer.update({
            where: { id },
            data,
            ...(include && { include }),
        });
    }

    async delete(id) {
        return prisma.trainer.delete({
            where: { id },
        });
    }

    async count(where = {}) {
        return prisma.trainer.count({ where });
    }
}

export default new TrainerRepository();
