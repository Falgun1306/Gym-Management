import memberRepository from "../repositories/member.repository.js";
import paymentRepository from "../repositories/payment.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";
import couponService from "./coupon.service.js";

const EDITABLE_FIELDS = [
    "firstName",
    "lastName",
    "dob",
    "gender",
    "phone",
    "address",
    "height",
    "weight",
    "medicalNotes",
    "emergencyContactName",
    "emergencyContactPhone",
];

class MemberService {
    async getMyProfile(userId) {
        const member = await prisma.member.findUnique({
            where: { userId },
            include: {
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
                    where: { status: "ACTIVE" },
                    include: {
                        plan: true,
                    },
                    orderBy: { startDate: "desc" },
                    take: 1,
                },
            },
        });

        if (!member) {
            throw new ErrorHandler("Member profile not found. Please complete your profile setup.", 404);
        }

        return member;
    }

    async createMyProfile(userId, body) {
        const existingMember = await memberRepository.findByUserId(userId);
        if (existingMember) {
            throw new ErrorHandler("Member profile already exists. Use PATCH to update.", 409);
        }

        const { firstName, lastName, phone, gender, dob, address, height, weight, medicalNotes, emergencyContactName, emergencyContactPhone, referralCode } = body;

        if (!firstName || !lastName || !phone || !gender) {
            throw new ErrorHandler("First name, last name, phone, and gender are required", 400);
        }

        const newMember = await memberRepository.create({
            user: { connect: { id: userId } },
            firstName,
            lastName,
            phone,
            gender,
            dob: dob ? new Date(dob) : undefined,
            address: address || undefined,
            height: height ? parseFloat(height) : undefined,
            weight: weight ? parseFloat(weight) : undefined,
            medicalNotes: medicalNotes || undefined,
            emergencyContactName: emergencyContactName || undefined,
            emergencyContactPhone: emergencyContactPhone || undefined,
        });

        // ── Track referral signup (non-blocking, silently skipped on errors) ──
        if (referralCode && referralCode.trim()) {
            couponService.trackReferralSignup(referralCode.trim().toUpperCase(), newMember.id)
                .catch((err) => {
                    // Self-referral errors are propagated back via the catch here
                    // but we still don't block the member creation response
                    console.error("⚠️ Referral tracking error:", err.message || err);
                });
        }

        return newMember;
    }

    async updateMyProfile(userId, body) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found. Please complete your profile setup.", 404);
        }

        const updateData = {};
        for (const field of EDITABLE_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (updateData.dob) {
            updateData.dob = new Date(updateData.dob);
        }

        if (updateData.height !== undefined) {
            updateData.height = parseFloat(updateData.height);
        }
        if (updateData.weight !== undefined) {
            updateData.weight = parseFloat(updateData.weight);
        }

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return memberRepository.update(member.id, updateData);
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
        });

        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        return member;
    }

    async listMembers(query) {
        const { page = 1, limit = 10, search, membershipStatus, planId } = query;

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
                some: {
                    status: membershipStatus,
                },
            };
        }

        if (planId) {
            where.memberships = {
                ...where.memberships,
                some: {
                    ...where.memberships?.some,
                    planId,
                },
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

        const { data, total } = await memberRepository.findMany(
            where,
            skip,
            limitNum,
            { joinedAt: "desc" },
            include
        );

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

    async getMyPayments(userId, query) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const { page = 1, limit = 20 } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const include = {
            membership: {
                include: { plan: true },
            },
        };

        const { data, total } = await paymentRepository.findMany(
            { memberId: member.id },
            skip,
            limitNum,
            { paidAt: "desc" },
            include
        );

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

    async getMySubscriptions(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const memberships = await prisma.membership.findMany({
            where: { memberId: member.id },
            include: { plan: true },
            orderBy: { startDate: "desc" },
        });

        return memberships.map((membership) => {
            let remainingDays = null;
            if (membership.status === "ACTIVE") {
                const now = new Date();
                const end = new Date(membership.endDate);
                remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
            } else if (membership.status === "SUSPENDED" && membership.frozenAt) {
                // Frozen time doesn't count — show remaining based on endDate vs frozenAt
                const frozenAt = new Date(membership.frozenAt);
                const end = new Date(membership.endDate);
                remainingDays = Math.max(0, Math.ceil((end - frozenAt) / (1000 * 60 * 60 * 24)));
            }

            return {
                ...membership,
                remainingDays,
                isFrozen: membership.status === "SUSPENDED" && !!membership.frozenAt,
            };
        });
    }

    async freezeMembership(userId, membershipId, body) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
            include: { plan: true },
        });

        if (!membership) {
            throw new ErrorHandler("Membership not found", 404);
        }

        if (membership.memberId !== member.id) {
            throw new ErrorHandler("This membership does not belong to you", 403);
        }

        if (membership.status !== "ACTIVE") {
            throw new ErrorHandler(`Cannot freeze a membership with status ${membership.status}. Only ACTIVE memberships can be frozen.`, 400);
        }

        // Max 1 freeze per membership
        if (membership.freezeCount >= 1) {
            throw new ErrorHandler("This membership has already been frozen once. Each membership can only be paused 1 time.", 400);
        }

        const { durationDays, reason } = body || {};
        const duration = parseInt(durationDays);
        if (!duration || duration < 7 || duration > 28) {
            throw new ErrorHandler("Freeze duration must be between 7 and 28 days (1–4 weeks)", 400);
        }

        const now = new Date();
        const updatedMembership = await prisma.membership.update({
            where: { id: membershipId },
            data: {
                status: "SUSPENDED",
                frozenAt: now,
                freezeDurationDays: duration,
                freezeReason: reason || null,
                freezeCount: { increment: 1 },
            },
            include: { plan: true },
        });

        // Notify the member
        await prisma.notification.create({
            data: {
                userId,
                title: "Membership Frozen",
                message: `Your ${membership.plan.name} membership has been frozen for ${duration} days. Your remaining days are preserved.`,
                type: "MEMBERSHIP",
            },
        });

        return updatedMembership;
    }

    async unfreezeMembership(userId, membershipId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
            include: { plan: true },
        });

        if (!membership) {
            throw new ErrorHandler("Membership not found", 404);
        }

        if (membership.memberId !== member.id) {
            throw new ErrorHandler("This membership does not belong to you", 403);
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
                userId,
                title: "Membership Resumed",
                message: `Your ${membership.plan.name} membership has been resumed. It was frozen for ${actualFrozenDays} day(s). Your new end date is ${newEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
                type: "MEMBERSHIP",
            },
        });

        return updatedMembership;
    }

    async applyForTrainer(user, body) {
        if (user.role !== "MEMBER") {
            throw new ErrorHandler(`You are already a ${user.role}. Only MEMBERs can apply.`, 400);
        }

        const member = await memberRepository.findByUserId(user.id);
        if (!member) {
            throw new ErrorHandler("Please create your member profile first before applying.", 400);
        }

        const pendingApplication = await prisma.trainerApplication.findFirst({
            where: { userId: user.id, status: "PENDING" },
        });

        if (pendingApplication) {
            throw new ErrorHandler("You already have a pending trainer application. Please wait for admin review.", 409);
        }

        const { specialization, experience, bio, certifications, coverNote } = body;
        if (!specialization) {
            throw new ErrorHandler("specialization is required", 400);
        }

        return prisma.trainerApplication.create({
            data: {
                userId: user.id,
                specialization,
                experience: experience ? parseInt(experience) : null,
                bio: bio || null,
                certifications: certifications || [],
                coverNote: coverNote || null,
            },
        });
    }

    async getMyApplications(userId) {
        return prisma.trainerApplication.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
}

export default new MemberService();
