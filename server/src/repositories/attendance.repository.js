import prisma from "../config/prisma.js";

class AttendanceRepository {
    async findById(id) {
        return prisma.attendance.findUnique({ where: { id } });
    }

    async findActiveCheckIn(memberId, todayStart, tomorrowStart) {
        return prisma.attendance.findFirst({
            where: {
                memberId,
                checkIn: { gte: todayStart, lt: tomorrowStart },
                checkOut: null,
            },
        });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { checkIn: "desc" }, include = null) {
        const [data, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take,
                orderBy,
                ...(include && { include }),
            }),
            prisma.attendance.count({ where }),
        ]);

        return { data, total };
    }

    async create(data) {
        return prisma.attendance.create({ data });
    }

    async update(id, data) {
        return prisma.attendance.update({ where: { id }, data });
    }

    async count(where = {}) {
        return prisma.attendance.count({ where });
    }
}

export default new AttendanceRepository();
