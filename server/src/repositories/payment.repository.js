import prisma from "../config/prisma.js";

class PaymentRepository {
    async findById(id, include = null) {
        return prisma.payment.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" }, include = null) {
        const [data, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take,
                orderBy,
                ...(include && { include }),
            }),
            prisma.payment.count({ where }),
        ]);

        return { data, total };
    }

    async aggregate(where = {}) {
        return prisma.payment.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where,
        });
    }

    async count(where = {}) {
        return prisma.payment.count({ where });
    }
}

export default new PaymentRepository();
