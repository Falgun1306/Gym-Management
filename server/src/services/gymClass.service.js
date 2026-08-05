import gymClassRepository from "../repositories/gymClass.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import memberRepository from "../repositories/member.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";
import prisma from "../config/prisma.js";

class GymClassService {
    async createGymClass(body) {
        const { trainerId, title, name, description, capacity, startTime, endTime } = body;
        const classTitle = title || name;

        if (!classTitle) {
            throw new ErrorHandler("Class title is required", 400);
        }
        if (!trainerId) {
            throw new ErrorHandler("Trainer ID is required for a gym class", 400);
        }

        const trainer = await trainerRepository.findById(trainerId);
        if (!trainer) {
            throw new ErrorHandler("Trainer not found", 404);
        }

        const include = {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        };

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Check if trainer has time off during this period
        const timeOffConflict = await prisma.trainerTimeOff.findFirst({
            where: {
                trainerId,
                startDate: { lte: end },
                endDate: { gte: start }
            }
        });

        if (timeOffConflict) {
            throw new ErrorHandler(`Trainer is on time-off during this period (Reason: ${timeOffConflict.reason || 'Not specified'})`, 409);
        }

        return gymClassRepository.create(
            {
                trainerId,
                title: classTitle,
                description: description || null,
                capacity: parseInt(capacity),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            },
            include
        );
    }

    async listGymClasses(query = {}) {
        const { page = 1, limit = 100, trainerId } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (trainerId) {
            where.trainerId = trainerId;
        }

        const include = {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                },
            },
            bookings: {
                where: {
                    status: { not: "CANCELLED" },
                },
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            user: {
                                select: {
                                    username: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { bookedAt: "desc" },
            },
            _count: {
                select: {
                    bookings: {
                        where: {
                            status: { not: "CANCELLED" },
                        },
                    },
                },
            },
        };

        const { data, total } = await gymClassRepository.findMany(
            where,
            skip,
            limitNum,
            { startTime: "asc" },
            include
        );

        return {
            classes: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getClassById(id) {
        const include = {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                    phone: true,
                },
            },
            bookings: {
                where: {
                    status: { not: "CANCELLED" },
                },
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            user: {
                                select: {
                                    username: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { bookedAt: "desc" },
            },
            _count: {
                select: {
                    bookings: {
                        where: {
                            status: { not: "CANCELLED" },
                        },
                    },
                },
            },
        };

        const gymClass = await gymClassRepository.findById(id, include);
        if (!gymClass) {
            throw new ErrorHandler("Gym class not found", 404);
        }
        return gymClass;
    }

    async updateGymClass(id, body) {
        const gymClass = await gymClassRepository.findById(id);
        if (!gymClass) {
            throw new ErrorHandler("Gym class not found", 404);
        }

        const updateData = {};
        if (body.title !== undefined || body.name !== undefined) {
            updateData.title = body.title || body.name;
        }
        if (body.description !== undefined) updateData.description = body.description;
        if (body.capacity !== undefined) updateData.capacity = parseInt(body.capacity);
        if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
        if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);

        if (body.trainerId !== undefined) {
            const trainer = await trainerRepository.findById(body.trainerId);
            if (!trainer) {
                throw new ErrorHandler("Trainer not found", 404);
            }
            updateData.trainerId = body.trainerId;
        }

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        const include = {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        };

        return gymClassRepository.update(id, updateData, include);
    }

    async deleteGymClass(id) {
        const gymClass = await gymClassRepository.findById(id);
        if (!gymClass) {
            throw new ErrorHandler("Gym class not found", 404);
        }

        return gymClassRepository.delete(id);
    }

    async bookClass(userId, classId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        // Validate active membership
        const { data: activeMemberships } = await membershipRepository.findMemberships(
            {
                memberId: member.id,
                status: { in: ["ACTIVE", "PENDING", "FROZEN"] },
                endDate: { gte: new Date() },
            },
            0,
            1
        );

        const membership = activeMemberships[0];
        if (!membership) {
            throw new ErrorHandler("You must have an active membership to book classes", 403);
        }

        if (membership.status === "FROZEN") {
            throw new ErrorHandler("Your membership is currently frozen. You cannot book classes.", 403);
        }

        const gymClass = await gymClassRepository.findById(classId, {
            _count: {
                select: {
                    bookings: {
                        where: { status: { not: "CANCELLED" } },
                    },
                },
            },
        });

        if (!gymClass) {
            throw new ErrorHandler("Gym class not found", 404);
        }

        if (gymClass._count.bookings >= gymClass.capacity) {
            throw new ErrorHandler("This class is fully booked", 400);
        }

        const existingBooking = await gymClassRepository.findBooking(gymClass.id, member.id);
        if (existingBooking && existingBooking.status !== "CANCELLED") {
            throw new ErrorHandler("You are already booked for this class", 409);
        }

        if (existingBooking && existingBooking.status === "CANCELLED") {
            return gymClassRepository.updateBooking(existingBooking.id, { status: "BOOKED" });
        }

        return gymClassRepository.createBooking({
            classId: gymClass.id,
            memberId: member.id,
        });
    }

    async cancelBooking(userId, bookingId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const booking = await gymClassRepository.findBookingById(bookingId);
        if (!booking) {
            throw new ErrorHandler("Booking not found", 404);
        }

        if (booking.memberId !== member.id) {
            throw new ErrorHandler("Access denied: You can only cancel your own bookings", 403);
        }

        if (booking.status === "CANCELLED") {
            throw new ErrorHandler("Booking is already cancelled", 400);
        }

        return gymClassRepository.updateBooking(bookingId, { status: "CANCELLED" });
    }

    async getClassBookings(userId, query = {}) {
        const trainer = await trainerRepository.findByUserId(userId);
        const { memberId, classId } = query;

        const classWhere = {};
        if (trainer) {
            classWhere.trainerId = trainer.id;
        }
        if (classId) {
            classWhere.id = classId;
        }

        const classInclude = {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                },
            },
            bookings: {
                where: {
                    status: { not: "CANCELLED" },
                    ...(memberId && { memberId }),
                },
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            user: {
                                select: {
                                    username: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { bookedAt: "desc" },
            },
            _count: {
                select: {
                    bookings: {
                        where: {
                            status: { not: "CANCELLED" },
                        },
                    },
                },
            },
        };

        let res = await gymClassRepository.findMany(
            classWhere,
            0,
            100,
            { startTime: "asc" },
            classInclude
        );

        let gymClasses = res.data || [];

        // Fallback: If no trainer-specific classes found, return all gym classes created by admin
        if (gymClasses.length === 0 && trainer) {
            res = await gymClassRepository.findMany(
                {},
                0,
                100,
                { startTime: "asc" },
                classInclude
            );
            gymClasses = res.data || [];
        }

        return gymClasses;
    }
}

export default new GymClassService();
