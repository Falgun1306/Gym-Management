import memberRepository from "../repositories/member.repository.js";
import paymentRepository from "../repositories/payment.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

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

        const { firstName, lastName, phone, gender, dob, address, height, weight, medicalNotes, emergencyContactName, emergencyContactPhone } = body;

        if (!firstName || !lastName || !phone || !gender) {
            throw new ErrorHandler("First name, last name, phone, and gender are required", 400);
        }

        return memberRepository.create({
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
            }

            return {
                ...membership,
                remainingDays,
            };
        });
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
