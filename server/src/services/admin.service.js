import userRepository from "../repositories/user.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import memberRepository from "../repositories/member.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import paymentRepository from "../repositories/payment.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";
import { createTrainerFromMember } from "./trainer.service.js";
import couponService from "./coupon.service.js";

const ADMIN_EDITABLE_FIELDS = ["username", "email"];
const TRAINER_EDITABLE_FIELDS = ["salary", "experience", "specialization", "gender", "firstName", "lastName", "phone", "bio"];
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
                            member: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                },
                            },
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
        let { userId, username, specialization, specializations, experience, salary, joiningDate, bio, certifications } = body;

        if (!userId && username) {
            const user = await userRepository.findByUsername(username);
            if (!user) {
                throw new ErrorHandler(`User with username '${username}' not found`, 404);
            }
            userId = user.id;
        }

        if (!userId) {
            throw new ErrorHandler("username or userId is required", 400);
        }
        if (!specialization && (!specializations || !Array.isArray(specializations) || specializations.length === 0)) {
            throw new ErrorHandler("specialization is required", 400);
        }

        const specs = (specializations && Array.isArray(specializations) && specializations.length > 0)
            ? specializations
            : (specialization ? (Array.isArray(specialization) ? specialization : [specialization]) : ['GENERAL_FITNESS']);

        return prisma.$transaction(async (tx) => {
            return this.createTrainerFromMember(tx, {
                userId,
                specialization: specs[0] || 'GENERAL_FITNESS',
                specializations: specs,
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

        if (body.specializations && Array.isArray(body.specializations) && body.specializations.length > 0) {
            const formatted = body.specializations.map(s => s.toUpperCase().replace(/\s+/g, '_'));
            updateData.specializations = formatted;
            updateData.specialization = formatted[0] || 'GENERAL_FITNESS';
        } else if (body.specialization) {
            const arr = Array.isArray(body.specialization) ? body.specialization : [body.specialization];
            const formatted = arr.map(s => s.toUpperCase().replace(/\s+/g, '_'));
            updateData.specializations = formatted;
            updateData.specialization = formatted[0] || 'GENERAL_FITNESS';
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

        const where = {
            user: { role: "MEMBER" },
        };
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
        const { name, durationMonths, durationInDays, price, description } = body;
        const months = durationMonths ? parseInt(durationMonths) : (durationInDays ? Math.max(1, Math.round(parseInt(durationInDays) / 30)) : null);

        if (!name || !months || !price) {
            throw new ErrorHandler("name, durationMonths, and price are required", 400);
        }

        const existing = await membershipRepository.findPlanByName(name);
        if (existing) {
            throw new ErrorHandler("A plan with this name already exists", 409);
        }

        return membershipRepository.createPlan({
            name,
            durationMonths: months,
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
        if (body.durationMonths !== undefined) {
            updateData.durationMonths = parseInt(body.durationMonths);
        } else if (body.durationInDays !== undefined) {
            updateData.durationMonths = Math.max(1, Math.round(parseInt(body.durationInDays) / 30));
        }
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
        const { memberId, username, planId, startDate, status, couponCode } = body;
        const memberIdentifier = memberId || username;

        if (!memberIdentifier || !planId) {
            throw new ErrorHandler("Member (ID or username) and planId are required", 400);
        }

        let member = await memberRepository.findById(memberIdentifier);
        if (!member) {
            member = await prisma.member.findFirst({
                where: {
                    OR: [
                        { user: { username: memberIdentifier } },
                        { user: { email: memberIdentifier } },
                        { id: memberIdentifier },
                    ],
                },
            });
        }

        if (!member) {
            throw new ErrorHandler(`Member not found with username or ID "${memberIdentifier}"`, 404);
        }

        const resolvedMemberId = member.id;

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

        // ── Validate coupon before entering the transaction ──────────────
        let couponPreview = null;
        if (couponCode) {
            // validateCoupon throws if invalid, so errors surface cleanly
            couponPreview = await couponService.validateCoupon(couponCode, resolvedMemberId, parseFloat(plan.price));
        }

        // ── Atomically create membership + apply coupon ──────────────────
        return prisma.$transaction(async (tx) => {
            const membership = await tx.membership.create({
                data: {
                    memberId: resolvedMemberId,
                    planId,
                    startDate: start,
                    endDate: end,
                    status: status || "ACTIVE",
                    couponId: couponPreview?.couponId || null,
                },
                include: { plan: true, member: true },
            });

            if (couponCode && couponPreview) {
                // applyCoupon works inside an existing tx
                const usage = await couponService.applyCoupon(
                    couponCode,
                    memberId,
                    membership.id,
                    parseFloat(plan.price),
                    tx
                );

                // Return the enriched membership object
                return { ...membership, couponUsage: usage };
            }

            return membership;
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

    async unfreezeMembership(membershipId) {
        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
            include: { plan: true, member: { select: { userId: true, firstName: true } } },
        });

        if (!membership) {
            throw new ErrorHandler("Membership not found", 404);
        }

        if (membership.status !== "SUSPENDED" || !membership.frozenAt) {
            throw new ErrorHandler("This membership is not currently frozen", 400);
        }

        // Calculate actual frozen days and extend endDate
        const frozenAt = new Date(membership.frozenAt);
        const now = new Date();
        const actualFrozenMs = now.getTime() - frozenAt.getTime();
        const actualFrozenDays = Math.ceil(actualFrozenMs / (1000 * 60 * 60 * 24));

        const newEndDate = new Date(membership.endDate);
        newEndDate.setDate(newEndDate.getDate() + actualFrozenDays);

        const updatedMembership = await prisma.membership.update({
            where: { id: membershipId },
            data: {
                status: "ACTIVE",
                endDate: newEndDate,
                frozenAt: null,
                freezeDurationDays: null,
                freezeReason: null,
            },
            include: { plan: true },
        });

        // Notify the member
        await prisma.notification.create({
            data: {
                userId: membership.member.userId,
                title: "Membership Resumed by Admin",
                message: `Your ${membership.plan.name} membership has been resumed by an admin. It was frozen for ${actualFrozenDays} day(s). Your new end date is ${newEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
                type: "MEMBERSHIP",
            },
        });

        return updatedMembership;
    }
}

export default new AdminService();
