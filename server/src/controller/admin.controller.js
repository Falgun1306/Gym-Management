import prisma from "../config/prisma.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

// ═══════════════════════════════════════════════════════════════════════════════
// OWN PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admins/me ──────────────────────────────────────────────────────────

const getMyProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new ErrorHandler("Admin not found", 404);
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

// ─── PATCH /admins/me ────────────────────────────────────────────────────────

const ADMIN_EDITABLE_FIELDS = ["username", "email"];

const updateMyProfile = asyncHandler(async (req, res) => {
    const updateData = {};

    for (const field of ADMIN_EDITABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    // Check for uniqueness conflicts
    if (updateData.username) {
        const existing = await prisma.user.findUnique({ where: { username: updateData.username } });
        if (existing && existing.id !== req.user.id) {
            throw new ErrorHandler("Username already taken", 409);
        }
    }

    if (updateData.email) {
        const existing = await prisma.user.findUnique({ where: { email: updateData.email } });
        if (existing && existing.id !== req.user.id) {
            throw new ErrorHandler("Email already taken", 409);
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /admins/trainers ───────────────────────────────────────────────────

const promoteToTrainer = asyncHandler(async (req, res) => {
    const {
        userId,
        firstName,
        lastName,
        phone,
        gender,
        specialization,
        experience,
        salary,
        joiningDate,
    } = req.body;

    if (!userId) {
        throw new ErrorHandler("userId is required", 400);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new ErrorHandler("User not found", 404);
    }

    // Verify role is MEMBER
    if (user.role !== "MEMBER") {
        throw new ErrorHandler(`User is already a ${user.role}`, 400);
    }

    // Validate required trainer fields
    if (!firstName || !lastName || !phone || !gender || !specialization) {
        throw new ErrorHandler(
            "firstName, lastName, phone, gender, and specialization are required",
            400
        );
    }

    // Create trainer profile + update role in a transaction
    const trainer = await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: { role: "TRAINER" },
        });

        return tx.trainer.create({
            data: {
                userId,
                firstName,
                lastName,
                phone,
                gender,
                specialization,
                experience: experience ? parseInt(experience) : null,
                salary: salary ? parseFloat(salary) : null,
                joinedAt: joiningDate ? new Date(joiningDate) : new Date(),
            },
        });
    });

    res.status(201).json({
        success: true,
        message: "Member promoted to Trainer successfully",
        data: trainer,
    });
});

// ─── PATCH /admins/trainers/:id ──────────────────────────────────────────────

const TRAINER_EDITABLE_FIELDS = [
    "salary",
    "experience",
    "specialization",
];

const updateTrainer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const trainer = await prisma.trainer.findUnique({ where: { id } });

    if (!trainer) {
        throw new ErrorHandler("Trainer not found", 404);
    }

    const updateData = {};

    for (const field of TRAINER_EDITABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    // Handle numeric conversions
    if (updateData.salary !== undefined) {
        updateData.salary = parseFloat(updateData.salary);
    }
    if (updateData.experience !== undefined) {
        updateData.experience = parseInt(updateData.experience);
    }

    // Handle joiningDate separately
    if (req.body.joiningDate !== undefined) {
        updateData.joinedAt = new Date(req.body.joiningDate);
    }

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    const updatedTrainer = await prisma.trainer.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: "Trainer updated successfully",
        data: updatedTrainer,
    });
});

// ─── DELETE /admins/trainers/:id ─────────────────────────────────────────────

const removeTrainer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const trainer = await prisma.trainer.findUnique({ where: { id } });

    if (!trainer) {
        throw new ErrorHandler("Trainer not found", 404);
    }

    await prisma.$transaction(async (tx) => {
        await tx.trainer.delete({ where: { id } });

        await tx.user.update({
            where: { id: trainer.userId },
            data: { role: "MEMBER" },
        });
    });

    res.status(200).json({
        success: true,
        message: "Trainer removed and role reverted to MEMBER",
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admins/members ─────────────────────────────────────────────────────

const listMembers = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        membershipStatus,
    } = req.query;

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

// ─── GET /admins/members/:id ─────────────────────────────────────────────────

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
            payments: {
                orderBy: { paidAt: "desc" },
                take: 5,
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

// ─── PATCH /admins/members/:id ───────────────────────────────────────────────

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

const updateMember = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await prisma.member.findUnique({ where: { id } });

    if (!member) {
        throw new ErrorHandler("Member not found", 404);
    }

    const updateData = {};

    for (const field of MEMBER_EDITABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
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

    const updatedMember = await prisma.member.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: "Member updated successfully",
        data: updatedMember,
    });
});

// ─── DELETE /admins/members/:id ──────────────────────────────────────────────

const deleteMember = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await prisma.member.findUnique({ where: { id } });

    if (!member) {
        throw new ErrorHandler("Member not found", 404);
    }

    await prisma.$transaction(async (tx) => {
        await tx.member.delete({ where: { id } });

        // Optionally also delete the user, or just leave as orphan
        // Here we keep the user account but it will have no member profile
    });

    res.status(200).json({
        success: true,
        message: "Member deleted successfully",
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERSHIP PLAN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /admins/membership-plans ───────────────────────────────────────────

const createMembershipPlan = asyncHandler(async (req, res) => {
    const { name, durationMonths, price, description } = req.body;

    if (!name || !durationMonths || !price) {
        throw new ErrorHandler("name, durationMonths, and price are required", 400);
    }

    const existing = await prisma.membershipPlan.findUnique({ where: { name } });

    if (existing) {
        throw new ErrorHandler("A plan with this name already exists", 409);
    }

    const plan = await prisma.membershipPlan.create({
        data: {
            name,
            durationMonths: parseInt(durationMonths),
            price: parseFloat(price),
            description: description || null,
        },
    });

    res.status(201).json({
        success: true,
        message: "Membership plan created successfully",
        data: plan,
    });
});

// ─── GET /admins/membership-plans ────────────────────────────────────────────

const listMembershipPlans = asyncHandler(async (req, res) => {
    const plans = await prisma.membershipPlan.findMany({
        include: {
            _count: { select: { memberships: true } },
        },
        orderBy: { price: "asc" },
    });

    res.status(200).json({
        success: true,
        data: plans,
    });
});

// ─── PATCH /admins/membership-plans/:id ──────────────────────────────────────

const updateMembershipPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await prisma.membershipPlan.findUnique({ where: { id } });

    if (!plan) {
        throw new ErrorHandler("Membership plan not found", 404);
    }

    const updateData = {};

    if (req.body.name !== undefined) {
        const existing = await prisma.membershipPlan.findUnique({ where: { name: req.body.name } });
        if (existing && existing.id !== id) {
            throw new ErrorHandler("A plan with this name already exists", 409);
        }
        updateData.name = req.body.name;
    }
    if (req.body.durationMonths !== undefined) {
        updateData.durationMonths = parseInt(req.body.durationMonths);
    }
    if (req.body.price !== undefined) {
        updateData.price = parseFloat(req.body.price);
    }
    if (req.body.description !== undefined) {
        updateData.description = req.body.description;
    }
    if (req.body.isActive !== undefined) {
        updateData.isActive = req.body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    const updatedPlan = await prisma.membershipPlan.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: "Membership plan updated successfully",
        data: updatedPlan,
    });
});

// ─── DELETE /admins/membership-plans/:id ─────────────────────────────────────

const deleteMembershipPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await prisma.membershipPlan.findUnique({
        where: { id },
        include: { _count: { select: { memberships: true } } },
    });

    if (!plan) {
        throw new ErrorHandler("Membership plan not found", 404);
    }

    // Soft-delete by deactivating if memberships exist
    if (plan._count.memberships > 0) {
        await prisma.membershipPlan.update({
            where: { id },
            data: { isActive: false },
        });

        return res.status(200).json({
            success: true,
            message: "Plan has active memberships — deactivated instead of deleted",
        });
    }

    await prisma.membershipPlan.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Membership plan deleted successfully",
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admins/payments ────────────────────────────────────────────────────

const listPayments = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
        where.status = status;
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            include: {
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
            },
            skip,
            take: limitNum,
            orderBy: { paidAt: "desc" },
        }),
        prisma.payment.count({ where }),
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

// ─── GET /admins/payments/:id ────────────────────────────────────────────────

const getPaymentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
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
        },
    });

    if (!payment) {
        throw new ErrorHandler("Payment not found", 404);
    }

    res.status(200).json({
        success: true,
        data: payment,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admins/dashboard ───────────────────────────────────────────────────

const getDashboard = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Current month boundaries
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
        totalMembers,
        activeMembers,
        totalTrainers,
        activeMemberships,
        monthlyRevenue,
        pendingPayments,
        attendanceToday,
    ] = await Promise.all([
        // Total members
        prisma.member.count(),

        // Active members (have at least one ACTIVE membership)
        prisma.member.count({
            where: {
                memberships: { some: { status: "ACTIVE" } },
            },
        }),

        // Total trainers
        prisma.trainer.count(),

        // Active memberships
        prisma.membership.count({
            where: { status: "ACTIVE" },
        }),

        // Monthly revenue (SUM of successful payments this month)
        prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                status: "SUCCESS",
                paidAt: { gte: monthStart, lt: monthEnd },
            },
        }),

        // Pending payments count
        prisma.payment.count({
            where: { status: "PENDING" },
        }),

        // Attendance today
        prisma.attendance.count({
            where: {
                checkIn: { gte: today, lt: tomorrow },
            },
        }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalMembers,
            activeMembers,
            totalTrainers,
            activeMemberships,
            monthlyRevenue: monthlyRevenue._sum.amount || 0,
            pendingPayments,
            attendanceToday,
        },
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINER ↔ MEMBER ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PATCH /admins/members/:memberId/assign-trainer ──────────────────────────

const assignTrainerToMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { trainerId } = req.body;

    if (!trainerId) {
        throw new ErrorHandler("trainerId is required", 400);
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });

    if (!member) {
        throw new ErrorHandler("Member not found", 404);
    }

    const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });

    if (!trainer) {
        throw new ErrorHandler("Trainer not found", 404);
    }

    const updatedMember = await prisma.member.update({
        where: { id: memberId },
        data: { trainerId },
        include: {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                },
            },
        },
    });

    res.status(200).json({
        success: true,
        message: `Trainer ${trainer.firstName} ${trainer.lastName} assigned to member successfully`,
        data: updatedMember,
    });
});

// ─── PATCH /admins/members/:memberId/remove-trainer ──────────────────────────

const removeTrainerFromMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const member = await prisma.member.findUnique({ where: { id: memberId } });

    if (!member) {
        throw new ErrorHandler("Member not found", 404);
    }

    if (!member.trainerId) {
        throw new ErrorHandler("Member has no trainer assigned", 400);
    }

    const updatedMember = await prisma.member.update({
        where: { id: memberId },
        data: { trainerId: null },
    });

    res.status(200).json({
        success: true,
        message: "Trainer removed from member successfully",
        data: updatedMember,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERSHIP MANAGEMENT (Individual Memberships, not Plans)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admins/memberships ─────────────────────────────────────────────────

const listMemberships = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
        where.status = status;
    }

    const [memberships, total] = await Promise.all([
        prisma.membership.findMany({
            where,
            include: {
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
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: "desc" },
        }),
        prisma.membership.count({ where }),
    ]);

    res.status(200).json({
        success: true,
        data: memberships,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});

// ─── GET /admins/memberships/:id ─────────────────────────────────────────────

const getMembershipById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const membership = await prisma.membership.findUnique({
        where: { id },
        include: {
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
        },
    });

    if (!membership) {
        throw new ErrorHandler("Membership not found", 404);
    }

    res.status(200).json({
        success: true,
        data: membership,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admins/attendance ──────────────────────────────────────────────────

const listAttendance = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        date,
        memberId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Filter by specific date
    if (date) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        where.checkIn = { gte: dayStart, lt: dayEnd };
    }

    if (memberId) {
        where.memberId = memberId;
    }

    const [attendances, total] = await Promise.all([
        prisma.attendance.findMany({
            where,
            include: {
                member: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: { checkIn: "desc" },
        }),
        prisma.attendance.count({ where }),
    ]);

    res.status(200).json({
        success: true,
        data: attendances,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admins/complaints ──────────────────────────────────────────────────

const listComplaints = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
        where.status = status;
    }

    const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
            where,
            include: {
                member: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: "desc" },
        }),
        prisma.complaint.count({ where }),
    ]);

    res.status(200).json({
        success: true,
        data: complaints,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});

// ─── PATCH /admins/complaints/:id ────────────────────────────────────────────

const resolveComplaint = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"];

    if (!status || !validStatuses.includes(status)) {
        throw new ErrorHandler(
            `status is required and must be one of: ${validStatuses.join(", ")}`,
            400
        );
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });

    if (!complaint) {
        throw new ErrorHandler("Complaint not found", 404);
    }

    const updatedComplaint = await prisma.complaint.update({
        where: { id },
        data: { status },
        include: {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    res.status(200).json({
        success: true,
        message: `Complaint status updated to ${status}`,
        data: updatedComplaint,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GYM CLASS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /admins/gym-classes ────────────────────────────────────────────────

const createGymClass = asyncHandler(async (req, res) => {
    const { trainerId, title, description, capacity, startTime, endTime } = req.body;

    if (!trainerId || !title || !capacity || !startTime || !endTime) {
        throw new ErrorHandler(
            "trainerId, title, capacity, startTime, and endTime are required",
            400
        );
    }

    const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });

    if (!trainer) {
        throw new ErrorHandler("Trainer not found", 404);
    }

    const gymClass = await prisma.gymClass.create({
        data: {
            trainerId,
            title,
            description: description || null,
            capacity: parseInt(capacity),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
        },
        include: {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    res.status(201).json({
        success: true,
        message: "Gym class created successfully",
        data: gymClass,
    });
});

// ─── PATCH /admins/gym-classes/:id ───────────────────────────────────────────

const updateGymClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gymClass = await prisma.gymClass.findUnique({ where: { id } });

    if (!gymClass) {
        throw new ErrorHandler("Gym class not found", 404);
    }

    const updateData = {};

    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.capacity !== undefined) updateData.capacity = parseInt(req.body.capacity);
    if (req.body.startTime !== undefined) updateData.startTime = new Date(req.body.startTime);
    if (req.body.endTime !== undefined) updateData.endTime = new Date(req.body.endTime);

    if (req.body.trainerId !== undefined) {
        const trainer = await prisma.trainer.findUnique({ where: { id: req.body.trainerId } });
        if (!trainer) {
            throw new ErrorHandler("Trainer not found", 404);
        }
        updateData.trainerId = req.body.trainerId;
    }

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    const updatedClass = await prisma.gymClass.update({
        where: { id },
        data: updateData,
        include: {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    res.status(200).json({
        success: true,
        message: "Gym class updated successfully",
        data: updatedClass,
    });
});

// ─── DELETE /admins/gym-classes/:id ──────────────────────────────────────────

const deleteGymClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gymClass = await prisma.gymClass.findUnique({
        where: { id },
        include: { _count: { select: { bookings: true } } },
    });

    if (!gymClass) {
        throw new ErrorHandler("Gym class not found", 404);
    }

    await prisma.gymClass.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Gym class deleted successfully",
    });
});

// ═══════════════════════════════════════════════════════════════════════════════

export {
    getMyProfile,
    updateMyProfile,
    promoteToTrainer,
    updateTrainer,
    removeTrainer,
    assignTrainerToMember,
    removeTrainerFromMember,
    listMembers,
    getMemberById,
    updateMember,
    deleteMember,
    createMembershipPlan,
    listMembershipPlans,
    updateMembershipPlan,
    deleteMembershipPlan,
    listMemberships,
    getMembershipById,
    listPayments,
    getPaymentById,
    listAttendance,
    listComplaints,
    resolveComplaint,
    createGymClass,
    updateGymClass,
    deleteGymClass,
    getDashboard,
};
