import prisma from "../config/prisma.js";

class MemberTimeSlotRepository {
    async findSlotsByMemberId(memberId) {
        return prisma.memberTimeSlot.findMany({
            where: { memberId },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });
    }

    async findSlotById(id) {
        return prisma.memberTimeSlot.findUnique({
            where: { id },
            include: {
                member: {
                    include: {
                        trainer: {
                            include: {
                                user: true,
                            },
                        },
                        user: true,
                    },
                },
            },
        });
    }

    async createSlot(data) {
        return prisma.memberTimeSlot.create({
            data,
            include: {
                member: {
                    include: {
                        trainer: {
                            include: {
                                user: true,
                            },
                        },
                        user: true,
                    },
                },
            },
        });
    }

    async updateSlot(id, data) {
        return prisma.memberTimeSlot.update({
            where: { id },
            data,
            include: {
                member: {
                    include: {
                        trainer: {
                            include: {
                                user: true,
                            },
                        },
                        user: true,
                    },
                },
            },
        });
    }

    async deleteSlot(id) {
        return prisma.memberTimeSlot.delete({ where: { id } });
    }

    async findAllActiveSlots(where = {}) {
        return prisma.memberTimeSlot.findMany({
            where: { isActive: true, ...where },
            include: {
                member: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        gender: true,
                        trainerId: true,
                        user: { select: { email: true } },
                        trainer: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: [{ startTime: "asc" }],
        });
    }

    async findAdvisories(where = {}) {
        return prisma.timeSlotAdvisory.findMany({
            where,
            include: {
                trainer: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: [{ startTime: "asc" }],
        });
    }

    async findAdvisoryById(id) {
        return prisma.timeSlotAdvisory.findUnique({
            where: { id },
        });
    }

    async createAdvisory(data) {
        return prisma.timeSlotAdvisory.create({
            data,
            include: {
                trainer: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    async deleteAdvisory(id) {
        return prisma.timeSlotAdvisory.delete({ where: { id } });
    }
}

export default new MemberTimeSlotRepository();
