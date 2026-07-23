import trainerRepository from "../repositories/trainer.repository.js";
import memberRepository from "../repositories/member.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

const EDITABLE_FIELDS = ["bio", "profilePhoto", "certifications"];

export const createTrainerFromMember = async (tx, { userId, specialization, experience, bio, certifications, salary, joiningDate }) => {
    const member = await tx.member.findUnique({ where: { userId } });
    if (!member) {
        throw new ErrorHandler("Member profile not found for this user. A Member profile is required before promotion.", 400);
    }

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ErrorHandler("User not found", 404);
    }

    if (user.role === "TRAINER" || user.role === "ADMIN") {
        throw new ErrorHandler(`User is already a ${user.role}`, 400);
    }

    const existingTrainer = await tx.trainer.findUnique({ where: { userId } });
    if (existingTrainer) {
        throw new ErrorHandler("Trainer profile already exists for this user", 409);
    }

    const trainer = await tx.trainer.create({
        data: {
            userId,
            firstName: member.firstName,
            lastName: member.lastName,
            phone: member.phone,
            gender: member.gender,
            specialization,
            experience: experience ? parseInt(experience) : null,
            bio: bio || null,
            certifications: certifications || [],
            profilePhoto: member.profilePhoto || null,
            salary: salary ? parseFloat(salary) : null,
            joinedAt: joiningDate ? new Date(joiningDate) : new Date(),
        },
    });

    await tx.user.update({
        where: { id: userId },
        data: { role: "TRAINER" },
    });

    return trainer;
};

class TrainerService {
    async getTrainerRecord(userId) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }
        return trainer;
    }

    async getMyProfile(userId) {
        const trainer = await prisma.trainer.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        role: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                schedules: {
                    orderBy: { dayOfWeek: "asc" },
                },
            },
        });

        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        return trainer;
    }

    async updateMyProfile(userId, body) {
        const trainer = await this.getTrainerRecord(userId);

        const updateData = {};
        for (const field of EDITABLE_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return trainerRepository.update(trainer.id, updateData);
    }

    async listTrainers() {
        const res = await trainerRepository.findMany({}, 0, 100, { averageRating: "desc" }, {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            experience: true,
            bio: true,
            profilePhoto: true,
            certifications: true,
            averageRating: true,
            totalReviews: true,
        });

        return res.data ? res.data : res;
    }

    async getTrainerById(id) {
        const trainer = await trainerRepository.findById(id, {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            experience: true,
            bio: true,
            profilePhoto: true,
            certifications: true,
            averageRating: true,
            totalReviews: true,
        });

        if (!trainer) {
            throw new ErrorHandler("Trainer not found", 404);
        }

        return trainer;
    }

    async getMyMembers(userId) {
        const trainer = await this.getTrainerRecord(userId);

        return memberRepository.findMany({ trainerId: trainer.id }, 0, 100, { joinedAt: "desc" }, {
            user: {
                select: {
                    username: true,
                    email: true,
                },
            },
            memberships: {
                where: { status: "ACTIVE" },
                include: { plan: true },
                orderBy: { startDate: "desc" },
                take: 1,
            },
        }).then(res => res.data);
    }

    async getMyMemberById(userId, memberId) {
        const trainer = await this.getTrainerRecord(userId);

        const member = await prisma.member.findUnique({
            where: { id: memberId, trainerId: trainer.id },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
                memberships: {
                    include: { plan: true },
                    orderBy: { startDate: "desc" },
                },
                workoutAssignments: {
                    include: { exercise: true },
                    orderBy: { assignedDate: "desc" },
                },
                dietAssignments: {
                    include: { dietPlan: true },
                    orderBy: { assignedAt: "desc" },
                },
                progressLogs: {
                    orderBy: { recordedAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!member) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        return member;
    }

    async getMySchedule(userId) {
        const trainer = await this.getTrainerRecord(userId);

        return prisma.trainerSchedule.findMany({
            where: { trainerId: trainer.id },
            orderBy: { dayOfWeek: "asc" },
        });
    }

    async updateMySchedule(userId, slots) {
        const trainer = await this.getTrainerRecord(userId);

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            throw new ErrorHandler("Slots array is required", 400);
        }

        for (const slot of slots) {
            if (slot.dayOfWeek === undefined || !slot.startTime || !slot.endTime) {
                throw new ErrorHandler("Each slot must have dayOfWeek, startTime, and endTime", 400);
            }
            if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
                throw new ErrorHandler("dayOfWeek must be between 0 (Sun) and 6 (Sat)", 400);
            }
        }

        return prisma.$transaction(
            slots.map((slot) =>
                prisma.trainerSchedule.upsert({
                    where: {
                        trainerId_dayOfWeek: {
                            trainerId: trainer.id,
                            dayOfWeek: slot.dayOfWeek,
                        },
                    },
                    update: {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isAvailable: slot.isAvailable ?? true,
                    },
                    create: {
                        trainerId: trainer.id,
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isAvailable: slot.isAvailable ?? true,
                    },
                })
            )
        );
    }

    async logMemberProgress(userId, memberId, body) {
        const trainer = await this.getTrainerRecord(userId);

        const member = await prisma.member.findUnique({
            where: { id: memberId, trainerId: trainer.id },
        });

        if (!member) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        const { weight, bodyFat, chest, waist, arms, thigh, notes } = body;

        return prisma.progressLog.create({
            data: {
                memberId: member.id,
                weight: weight ? parseFloat(weight) : null,
                bodyFat: bodyFat ? parseFloat(bodyFat) : null,
                chest: chest ? parseFloat(chest) : null,
                waist: waist ? parseFloat(waist) : null,
                arms: arms ? parseFloat(arms) : null,
                thigh: thigh ? parseFloat(thigh) : null,
                notes,
            },
        });
    }

    async getMemberProgress(userId, memberId) {
        const trainer = await this.getTrainerRecord(userId);

        const member = await prisma.member.findUnique({
            where: { id: memberId, trainerId: trainer.id },
        });

        if (!member) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        return prisma.progressLog.findMany({
            where: { memberId: member.id },
            orderBy: { recordedAt: "desc" },
        });
    }
}

export default new TrainerService();
