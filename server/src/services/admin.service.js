import userRepository from "../repositories/user.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import memberRepository from "../repositories/member.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import paymentRepository from "../repositories/payment.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";
import { createTrainerFromMember } from "./trainer.service.js";

const ADMIN_EDITABLE_FIELDS = ["username", "email"];
const TRAINER_EDITABLE_FIELDS = ["salary", "experience", "specialization"];
const MEMBER_EDITABLE_FIELDS = [
    "firstName",
    "lastName",
    "phone",
    "gender",
    "dob",
    "address",
    "height",
    "weight",
    "medicalNotes",
    "emergencyContactName",
    "emergencyContactPhone",
    "trainerId",
];

class AdminService {
    async createTrainerFromMember(tx, payload) {
        return createTrainerFromMember(tx, payload);
    }

    async getMyProfile(userId) {
        const user = await userRepository.findById(userId, {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
        });

        if (!user) {
            throw new ErrorHandler("Admin not found", 404);
        }

        return user;
    }

    async updateMyProfile(userId, body) {
        const updateData = {};
        for (const field of ADMIN_EDITABLE_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        if (updateData.username) {
            const existing = await userRepository.findByEmailOrUsername(null, updateData.username);
            if (existing && existing.id !== userId) {
                throw new ErrorHandler("Username already taken", 409);
            }
        }

        if (updateData.email) {
            const existing = await userRepository.findByEmailOrUsername(updateData.email, null);
            if (existing && existing.id !== userId) {
                throw new ErrorHandler("Email already taken", 409);
            }
        }

        return userRepository.update(userId, updateData, {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
        });
    }

    async listTrainerApplications(query) {
        const { page = 1, limit = 10, status } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (status) {
            where.status = status;
        }

        const [applications, total] = await Promise.all([
            prisma.trainerApplication.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                skip,
                take: limitNum,
                orderBy: { createdAt: "desc" },
            }),
            prisma.trainerApplication.count({ where }),
        ]);

        return {
            applications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getTrainerApplicationById(id) {
        const application = await prisma.trainerApplication.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        member: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                gender: true,
                                joinedAt: true,
                            },
                        },
                    },
                },
            },
        });

        if (!application) {
            throw new ErrorHandler("Trainer application not found", 404);
        }

        return application;
    }

    async approveTrainerApplication(adminId, id, body) {
        const { salary, joiningDate } = body;
        const application = await prisma.trainerApplication.findUnique({ where: { id } });

        if (!application) {
            throw new ErrorHandler("Trainer application not found", 404);
        }

        if (application.status !== "PENDING") {
            throw new ErrorHandler(`This application has already been ${application.status.toLowerCase()}`, 400);
        }

        return prisma.$transaction(async (tx) => {
            const newTrainer = await this.createTrainerFromMember(tx, {
                userId: application.userId,
                specialization: application.specialization,
                experience: application.experience,
                bio: application.bio,
                certifications: application.certifications,
                salary: salary || null,
                joiningDate: joiningDate || null,
            });

            await tx.trainerApplication.update({
                where: { id },
                data: {
                    status: "APPROVED",
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                },
            });

            return newTrainer;
        });
    }

    async rejectTrainerApplication(adminId, id, rejectionReason) {
        if (!rejectionReason) {
            throw new ErrorHandler("rejectionReason is required", 400);
        }

        const application = await prisma.trainerApplication.findUnique({ where: { id } });

        if (!application) {
            throw new ErrorHandler("Trainer application not found", 404);
        }

        if (application.status !== "PENDING") {
            throw new ErrorHandler(`This application has already been ${application.status.toLowerCase()}`, 400);
        }

        return prisma.trainerApplication.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });
    }

    async directPromoteToTrainer(body) {
        const { userId, specialization, experience, salary, joiningDate, bio, certifications } = body;

        if (!userId) {
            throw new ErrorHandler("userId is required", 400);
        }
        if (!specialization) {
            throw new ErrorHandler("specialization is required", 400);
        }

        return prisma.$transaction(async (tx) => {
            return this.createTrainerFromMember(tx, {
                userId,
                specialization,
                experience: experience || null,
                bio: bio || null,
                certifications: certifications || [],
                salary: salary || null,
                joiningDate: joiningDate || null,
            });
        });
    }

    async updateTrainer(id, body) {
        const trainer = await trainerRepository.findById(id);
        if (!trainer) {
            throw new ErrorHandler("Trainer not found", 404);
        }

        const updateData = {};
        for (const field of TRAINER_EDITABLE_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (updateData.salary !== undefined) {
            updateData.salary = parseFloat(updateData.salary);
        }
        if (updateData.experience !== undefined) {
            updateData.experience = parseInt(updateData.experience);
        }
        if (body.joiningDate !== undefined) {
            updateData.joinedAt = new Date(body.joiningDate);
        }

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return trainerRepository.update(id, updateData);
    }

    async removeTrainer(id) {
        const trainer = await trainerRepository.findById(id);
        if (!trainer) {
            throw new ErrorHandler("Trainer not found", 404);
        }

        return prisma.$transaction(async (tx) => {
            await tx.trainer.delete({ where: { id } });
            await tx.user.update({
                where: { id: trainer.userId },
                data: { role: "MEMBER" },
            });
        });
    }

    async listMembers(query) {
        const { page = 1, limit = 10, search, membershipStatus } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
            ];
        }

        if (membershipStatus) {
            where.memberships = {
                some: { status: membershipStatus },
            };
        }

        const include = {
            user: {
                select: {
                    username: true,
                    email: true,
                    role: true,
                },
            },
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            memberships: {
                where: { status: "ACTIVE" },
                include: { plan: true },
                orderBy: { startDate: "desc" },
                take: 1,
            },
        };

        const { data, total } = await memberRepository.findMany(where, skip, limitNum, { joinedAt: "desc" }, include);

        return {
            members: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getMemberById(id) {
        const member = await memberRepository.findById(id, {
            user: {
                select: {
                    username: true,
                    email: true,
                    role: true,
                },
            },
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                },
            },
            memberships: {
                include: { plan: true },
                orderBy: { startDate: "desc" },
            },
            payments: {
                orderBy: { paidAt: "desc" },
                take: 5,
            },
        });

        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        return member;
    }

    async updateMember(id, body) {
        const member = await memberRepository.findById(id);
        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        const updateData = {};
        for (const field of MEMBER_EDITABLE_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (updateData.dob) updateData.dob = new Date(updateData.dob);
        if (updateData.height !== undefined) updateData.height = parseFloat(updateData.height);
        if (updateData.weight !== undefined) updateData.weight = parseFloat(updateData.weight);

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return memberRepository.update(id, updateData);
    }

    async deleteMember(id) {
        const member = await memberRepository.findById(id);
        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        return memberRepository.delete(id);
    }

    async createMembershipPlan(body) {
        const { name, durationMonths, price, description } = body;
        if (!name || !durationMonths || !price) {
            throw new ErrorHandler("name, durationMonths, and price are required", 400);
        }

        const existing = await membershipRepository.findPlanByName(name);
        if (existing) {
            throw new ErrorHandler("A plan with this name already exists", 409);
        }

        return membershipRepository.createPlan({
            name,
            durationMonths: parseInt(durationMonths),
            price: parseFloat(price),
            description: description || null,
        });
    }

    async listMembershipPlans() {
        return membershipRepository.findPlans({}, {
            _count: { select: { memberships: true } },
        });
    }

    async updateMembershipPlan(id, body) {
        const plan = await membershipRepository.findPlanById(id);
        if (!plan) {
            throw new ErrorHandler("Membership plan not found", 404);
        }

        const updateData = {};
        if (body.name !== undefined) {
            const existing = await membershipRepository.findPlanByName(body.name);
            if (existing && existing.id !== id) {
                throw new ErrorHandler("A plan with this name already exists", 409);
            }
            updateData.name = body.name;
        }
        if (body.durationMonths !== undefined) updateData.durationMonths = parseInt(body.durationMonths);
        if (body.price !== undefined) updateData.price = parseFloat(body.price);
        if (body.description !== undefined) updateData.description = body.description;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return membershipRepository.updatePlan(id, updateData);
    }

    async deleteMembershipPlan(id) {
        const plan = await membershipRepository.findPlanById(id, {
            _count: { select: { memberships: true } },
        });

        if (!plan) {
            throw new ErrorHandler("Membership plan not found", 404);
        }

        if (plan._count.memberships > 0) {
            await membershipRepository.updatePlan(id, { isActive: false });
            return { deactivated: true, message: "Plan has active memberships — deactivated instead of deleted" };
        }

        await membershipRepository.deletePlan(id);
        return { deactivated: false, message: "Membership plan deleted successfully" };
    }

    async listPayments(query) {
        const { page = 1, limit = 20, status } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (status) where.status = status;

        const include = {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
            membership: {
                include: { plan: true },
            },
        };

        const { data, total } = await paymentRepository.findMany(where, skip, limitNum, { paidAt: "desc" }, include);

        return {
            payments: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getPaymentById(id) {
        const payment = await paymentRepository.findById(id, {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
            membership: {
                include: { plan: true },
            },
        });

        if (!payment) {
            throw new ErrorHandler("Payment not found", 404);
        }

        return payment;
    }

    async assignTrainerToMember(memberId, trainerId) {
        if (!trainerId) {
            throw new ErrorHandler("trainerId is required", 400);
        }

        const member = await memberRepository.findById(memberId);
        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        const trainer = await trainerRepository.findById(trainerId);
        if (!trainer) {
            throw new ErrorHandler("Trainer not found", 404);
        }

        return memberRepository.update(memberId, { trainerId }, {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                },
            },
        });
    }

    async removeTrainerFromMember(memberId) {
        const member = await memberRepository.findById(memberId);
        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        if (!member.trainerId) {
            throw new ErrorHandler("Member has no trainer assigned", 400);
        }

        return memberRepository.update(memberId, { trainerId: null });
    }

    async assignMembership(body) {
        const { memberId, planId, startDate, status } = body;
        if (!memberId || !planId) {
            throw new ErrorHandler("memberId and planId are required", 400);
        }

        const member = await memberRepository.findById(memberId);
        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        const plan = await membershipRepository.findPlanById(planId);
        if (!plan) {
            throw new ErrorHandler("Membership plan not found", 404);
        }

        const start = startDate ? new Date(startDate) : new Date();
        if (isNaN(start.getTime())) {
            throw new ErrorHandler("Invalid startDate", 400);
        }

        const end = new Date(start);
        end.setMonth(end.getMonth() + plan.durationMonths);

        return membershipRepository.createMembership({
            memberId,
            planId,
            startDate: start,
            endDate: end,
            status: status || "PENDING",
        });
    }

    async listMemberships(query) {
        const { page = 1, limit = 20, status } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (status) where.status = status;

        const include = {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
            plan: true,
            payments: {
                orderBy: { paidAt: "desc" },
                take: 1,
            },
        };

        const { data, total } = await membershipRepository.findMemberships(where, skip, limitNum, { createdAt: "desc" }, include);

        return {
            memberships: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getMembershipById(id) {
        const membership = await membershipRepository.findMembershipById(id, {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
            plan: true,
            payments: {
                orderBy: { paidAt: "desc" },
            },
        });

        if (!membership) {
            throw new ErrorHandler("Membership not found", 404);
        }

        return membership;
    }
}

export default new AdminService();
