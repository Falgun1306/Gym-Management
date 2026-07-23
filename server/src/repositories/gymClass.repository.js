import prisma from "../config/prisma.js";

class GymClassRepository {
    async findById(id, include = null) {
        return prisma.gymClass.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { startTime: "asc" }, include = null) {
        const [data, total] = await Promise.all([
            prisma.gymClass.findMany({
                where,
                skip,
                take,
                orderBy,
                ...(include && { include }),
            }),
            prisma.gymClass.count({ where }),
        ]);

        return { data, total };
    }

    async create(data, include = null) {
        return prisma.gymClass.create({
            data,
            ...(include && { include }),
        });
    }

    async update(id, data, include = null) {
        return prisma.gymClass.update({
            where: { id },
            data,
            ...(include && { include }),
        });
    }

    async delete(id) {
        return prisma.gymClass.delete({ where: { id } });
    }

    async findBooking(classId, memberId) {
        return prisma.classBooking.findFirst({
            where: { classId, memberId },
        });
    }

    async findBookingById(id, include = null) {
        return prisma.classBooking.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async createBooking(data) {
        return prisma.classBooking.create({ data });
    }

    async updateBooking(id, data) {
        return prisma.classBooking.update({ where: { id }, data });
    }

    async findBookings(where = {}, orderBy = { bookedAt: "desc" }, include = null) {
        return prisma.classBooking.findMany({
            where,
            orderBy,
            ...(include && { include }),
        });
    }
}

export default new GymClassRepository();
