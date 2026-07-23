import gymClassRepository from "../repositories/gymClass.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import memberRepository from "../repositories/member.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class GymClassService {
    async createGymClass(body) {
        const { trainerId, title, description, capacity, startTime, endTime } = body;

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

        return gymClassRepository.create(
            {
                trainerId,
                title,
                description: description || null,
                capacity: parseInt(capacity),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            },
            include
        );
    }

    async listGymClasses(query) {
        const { page = 1, limit = 20 } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const include = {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                },
            },
            _count: {
                select: {
                    bookings: true,
                },
            },
        };

        const { data, total } = await gymClassRepository.findMany(
            {},
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
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    bookings: true,
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
        if (body.title !== undefined) updateData.title = body.title;
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

        const gymClass = await gymClassRepository.findById(classId, {
            _count: { select: { bookings: true } },
        });

        if (!gymClass) {
            throw new ErrorHandler("Gym class not found", 404);
        }

        if (gymClass._count.bookings >= gymClass.capacity) {
            throw new ErrorHandler("This class is fully booked", 400);
        }

        const existingBooking = await gymClassRepository.findBooking(gymClass.id, member.id);
        if (existingBooking) {
            throw new ErrorHandler("You are already booked for this class", 409);
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

    async getClassBookings(userId, query) {
        const trainer = await trainerRepository.findByUserId(userId);
        const { memberId, classId } = query;
        const where = {};

        if (memberId && trainer) {
            const member = await memberRepository.findById(memberId);
            if (!member || member.trainerId !== trainer.id) {
                throw new ErrorHandler("Member not found or not assigned to you", 404);
            }
            where.memberId = memberId;
        }

        if (classId && trainer) {
            const gymClass = await gymClassRepository.findById(classId);
            if (!gymClass || gymClass.trainerId !== trainer.id) {
                throw new ErrorHandler("Gym class not found or not assigned to you", 404);
            }
            where.classId = classId;
        }

        if (!memberId && !classId && trainer) {
            where.gymClass = { trainerId: trainer.id };
        }

        const include = {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
            gymClass: {
                select: {
                    id: true,
                    title: true,
                    startTime: true,
                    endTime: true,
                },
            },
        };

        return gymClassRepository.findBookings(where, { bookedAt: "desc" }, include);
    }
}

export default new GymClassService();
