import prisma from "../config/prisma.js";

class ComplaintRepository {
    async findById(id, include = null) {
        return prisma.complaint.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" }, include = null) {
        const [data, total] = await Promise.all([
            prisma.complaint.findMany({
                where,
                skip,
                take,
                orderBy,
                ...(include && { include }),
            }),
            prisma.complaint.count({ where }),
        ]);

        return { data, total };
    }

    async create(data) {
        return prisma.complaint.create({ data });
    }

    async update(id, data, include = null) {
        return prisma.complaint.update({
            where: { id },
            data,
            ...(include && { include }),
        });
    }

    async delete(id) {
        return prisma.complaint.delete({ where: { id } });
    }
}

export default new ComplaintRepository();
