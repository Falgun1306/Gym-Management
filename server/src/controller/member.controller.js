import prisma from "../config/prisma.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

// ─── 1. View Own Profile ─────────────────────────────────────────────────────

const getMyProfile = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
        where: { userId: req.user.id },
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

    res.status(200).json({
        success: true,
        data: member,
    });
});

// ─── 1b. Create Own Profile (Initial Setup) ─────────────────────────────────

const createMyProfile = asyncHandler(async (req, res) => {
    // Check if member profile already exists
    const existingMember = await prisma.member.findUnique({
        where: { userId: req.user.id },
    });

    if (existingMember) {
        throw new ErrorHandler("Member profile already exists. Use PATCH to update.", 409);
    }

    const { firstName, lastName, phone, gender, dob, address, height, weight, medicalNotes, emergencyContactName, emergencyContactPhone } = req.body;

    // Required fields for member profile
    if (!firstName || !lastName || !phone || !gender) {
        throw new ErrorHandler("First name, last name, phone, and gender are required", 400);
    }

    const newMember = await prisma.member.create({
        data: {
            user: { connect: { id: req.user.id } },
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
        },
    });

    res.status(201).json({
        success: true,
        message: "Member profile created successfully",
        data: newMember,
    });
});

// ─── 2. Update Own Profile ───────────────────────────────────────────────────

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

const updateMyProfile = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
        where: { userId: req.user.id },
    });

    if (!member) {
        throw new ErrorHandler("Member profile not found. Please complete your profile setup.", 404);
    }

    // Build update data from only the whitelisted fields
    const updateData = {};

    for (const field of EDITABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    // Parse dob as a Date if provided
    if (updateData.dob) {
        updateData.dob = new Date(updateData.dob);
    }

    // Parse numeric fields
    if (updateData.height !== undefined) {
        updateData.height = parseFloat(updateData.height);
    }
    if (updateData.weight !== undefined) {
        updateData.weight = parseFloat(updateData.weight);
    }

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    const updatedMember = await prisma.member.update({
        where: { id: member.id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedMember,
    });
});

// ─── 3. View Member by ID (Admin / Trainer) ─────────────────────────────────

const getMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
        where: { id },
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
                include: { plan: true },
                orderBy: { startDate: "desc" },
            },
        },
    });

    if (!member) {
        throw new ErrorHandler("Member not found", 404);
    }

    res.status(200).json({
        success: true,
        data: member,
    });
});

// ─── 4. List Members (Admin only) ───────────────────────────────────────────

const listMembers = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        membershipStatus,
        planId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    // Search by first name, last name, or phone
    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
        ];
    }

    // Filter by membership status
    if (membershipStatus) {
        where.memberships = {
            some: {
                status: membershipStatus,
            },
        };
    }

    // Filter by plan
    if (planId) {
        where.memberships = {
            ...where.memberships,
            some: {
                ...where.memberships?.some,
                planId,
            },
        };
    }

    const [members, total] = await Promise.all([
        prisma.member.findMany({
            where,
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
                    },
                },
                memberships: {
                    where: { status: "ACTIVE" },
                    include: { plan: true },
                    orderBy: { startDate: "desc" },
                    take: 1,
                },
            },
            skip,
            take: limitNum,
            orderBy: { joinedAt: "desc" },
        }),
        prisma.member.count({ where }),
    ]);

    res.status(200).json({
        success: true,
        data: members,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});

// ─── 5. Attendance History ───────────────────────────────────────────────────

const getMyAttendance = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
        where: { userId: req.user.id },
    });

    if (!member) {
        throw new ErrorHandler("Member profile not found", 404);
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [attendances, totalVisits] = await Promise.all([
        prisma.attendance.findMany({
            where: { memberId: member.id },
            orderBy: { checkIn: "desc" },
            skip,
            take: limitNum,
        }),
        prisma.attendance.count({
            where: { memberId: member.id },
        }),
    ]);

    res.status(200).json({
        success: true,
        data: attendances,
        totalVisits,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalVisits,
            totalPages: Math.ceil(totalVisits / limitNum),
        },
    });
});

// ─── 6. Payment History ─────────────────────────────────────────────────────

const getMyPayments = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
        where: { userId: req.user.id },
    });

    if (!member) {
        throw new ErrorHandler("Member profile not found", 404);
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where: { memberId: member.id },
            include: {
                membership: {
                    include: { plan: true },
                },
            },
            orderBy: { paidAt: "desc" },
            skip,
            take: limitNum,
        }),
        prisma.payment.count({
            where: { memberId: member.id },
        }),
    ]);

    res.status(200).json({
        success: true,
        data: payments,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});

// ─── 7. Membership / Subscription Information ──────────────────────────────

const getMySubscriptions = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
        where: { userId: req.user.id },
    });

    if (!member) {
        throw new ErrorHandler("Member profile not found", 404);
    }

    const memberships = await prisma.membership.findMany({
        where: { memberId: member.id },
        include: { plan: true },
        orderBy: { startDate: "desc" },
    });

    // Enrich with remaining days for active memberships
    const enriched = memberships.map((membership) => {
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

    res.status(200).json({
        success: true,
        data: enriched,
    });
});

// ─── 8. Assigned Workout Plans ──────────────────────────────────────────────

const getMyWorkoutPlans = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
        where: { userId: req.user.id },
    });

    if (!member) {
        throw new ErrorHandler("Member profile not found", 404);
    }

    const workoutAssignments = await prisma.workoutAssignment.findMany({
        where: { memberId: member.id },
        include: {
            exercise: true,
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { assignedDate: "desc" },
    });

    res.status(200).json({
        success: true,
        data: workoutAssignments,
    });
});

// ─── 9. Assigned Diet Plans ─────────────────────────────────────────────────

const getMyDietPlans = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
        where: { userId: req.user.id },
    });

    if (!member) {
        throw new ErrorHandler("Member profile not found", 404);
    }

    const dietAssignments = await prisma.dietAssignment.findMany({
        where: { memberId: member.id },
        include: {
            dietPlan: true,
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { assignedAt: "desc" },
    });

    res.status(200).json({
        success: true,
        data: dietAssignments,
    });
});

export {
    getMyProfile,
    createMyProfile,
    updateMyProfile,
    getMemberById,
    listMembers,
    getMyAttendance,
    getMyPayments,
    getMySubscriptions,
    getMyWorkoutPlans,
    getMyDietPlans,
};
