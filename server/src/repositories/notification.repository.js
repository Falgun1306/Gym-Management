import prisma from "../config/prisma.js";

class NotificationRepository {
    async findById(id) {
        return prisma.notification.findUnique({ where: { id } });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" }) {
        const [data, total] = await Promise.all([
            prisma.notification.findMany({ where, skip, take, orderBy }),
            prisma.notification.count({ where }),
        ]);

        return { data, total };
    }

    async create(data) {
        return prisma.notification.create({ data });
    }

    async createMany(dataArray) {
        return prisma.notification.createMany({ data: dataArray });
    }

    async update(id, data) {
        return prisma.notification.update({ where: { id }, data });
    }

    async updateMany(where, data) {
        return prisma.notification.updateMany({ where, data });
    }

    async delete(id) {
        return prisma.notification.delete({ where: { id } });
    }

    async count(where = {}) {
        return prisma.notification.count({ where });
    }
}

export default new NotificationRepository();
