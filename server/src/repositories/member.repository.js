import prisma from "../config/prisma.js";

class MemberRepository {
    async findById(id, include = null) {
        return prisma.member.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findByUserId(userId, include = null) {
        return prisma.member.findUnique({
            where: { userId },
            ...(include && { include }),
        });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { joinedAt: "desc" }, include = null) {
        const [data, total] = await Promise.all([
            prisma.member.findMany({
                where,
                skip,
                take,
                orderBy,
                ...(include && { include }),
            }),
            prisma.member.count({ where }),
        ]);

        return { data, total };
    }

    async create(data, include = null) {
        return prisma.member.create({
            data,
            ...(include && { include }),
        });
    }

    async update(id, data, include = null) {
        return prisma.member.update({
            where: { id },
            data,
            ...(include && { include }),
        });
    }

    async delete(id) {
        return prisma.member.delete({
            where: { id },
        });
    }

    async count(where = {}) {
        return prisma.member.count({ where });
    }
}

export default new MemberRepository();
