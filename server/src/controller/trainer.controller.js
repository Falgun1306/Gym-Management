import prisma from "../config/prisma.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

// ─── Helper: Get trainer record for the logged-in user ───────────────────────

const getTrainerRecord = async (userId) => {
    const trainer = await prisma.trainer.findUnique({
        where: { userId },
    });

    if (!trainer) {
        throw new ErrorHandler("Trainer profile not found", 404);
    }

    return trainer;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. View Own Profile ─────────────────────────────────────────────────────

const getMyProfile = asyncHandler(async (req, res) => {
    const trainer = await prisma.trainer.findUnique({
        where: { userId: req.user.id },
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

    res.status(200).json({
        success: true,
        data: trainer,
    });
});
// ─── 1b. Create Own Profile (Initial Setup) ─────────────────────────────────

const createMyProfile = asyncHandler(async (req, res) => {
    // Check if trainer profile already exists
    const existingTrainer = await prisma.trainer.findUnique({
        where: { userId: req.user.id },
    });

    if (existingTrainer) {
        throw new ErrorHandler("Trainer profile already exists. Use PATCH to update.", 409);
    }

    const { firstName, lastName, phone, gender, specialization, experience, bio, certifications } = req.body;

    if (!firstName || !lastName || !phone || !gender || !specialization) {
        throw new ErrorHandler("First name, last name, phone, gender, and specialization are required", 400);
    }

    // Create trainer profile and update user role to TRAINER in a transaction
    const newTrainer = await prisma.$transaction(async (tx) => {
        const trainer = await tx.trainer.create({
            data: {
                user: { connect: { id: req.user.id } },
                firstName,
                lastName,
                phone,
                gender,
                specialization,
                experience: experience ? parseInt(experience) : null,
                bio: bio || null,
                certifications: certifications || [],
            },
        });

        // Update user role to TRAINER
        await tx.user.update({
            where: { id: req.user.id },
            data: { role: "TRAINER" },
        });

        return trainer;
    });

    res.status(201).json({
        success: true,
        message: "Trainer profile created successfully",
        data: newTrainer,
    });
});

// ─── 2. Update Own Profile ───────────────────────────────────────────────────

const EDITABLE_FIELDS = ["bio", "profilePhoto", "certifications"];

const updateMyProfile = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);

    const updateData = {};

    for (const field of EDITABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    const updatedTrainer = await prisma.trainer.update({
        where: { id: trainer.id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedTrainer,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC TRAINER LISTINGS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 3. List All Trainers ────────────────────────────────────────────────────

const listTrainers = asyncHandler(async (req, res) => {
    const trainers = await prisma.trainer.findMany({
        select: {
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
        },
        orderBy: { averageRating: "desc" },
    });

    res.status(200).json({
        success: true,
        data: trainers,
    });
});

// ─── 4. View Trainer by ID ──────────────────────────────────────────────────

const getTrainerById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const trainer = await prisma.trainer.findUnique({
        where: { id },
        select: {
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
        },
    });

    if (!trainer) {
        throw new ErrorHandler("Trainer not found", 404);
    }

    res.status(200).json({
        success: true,
        data: trainer,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGNED MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 5. View Assigned Members ────────────────────────────────────────────────

const getMyMembers = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);

    const members = await prisma.member.findMany({
        where: { trainerId: trainer.id },
        include: {
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
        },
        orderBy: { joinedAt: "desc" },
    });

    res.status(200).json({
        success: true,
        data: members,
    });
});

// ─── 6. View Member Details ─────────────────────────────────────────────────

const getMyMemberById = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { memberId } = req.params;

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

    res.status(200).json({
        success: true,
        data: member,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// WORKOUT PLAN CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 7. Create Workout Plan ─────────────────────────────────────────────────

const createWorkoutPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { title, description, exercises } = req.body;

    if (!title) {
        throw new ErrorHandler("Title is required", 400);
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
        throw new ErrorHandler("At least one exercise is required", 400);
    }

    const workoutPlan = await prisma.workoutPlan.create({
        data: {
            trainerId: trainer.id,
            title,
            description,
            exercises: {
                create: exercises.map((ex, index) => ({
                    exerciseId: ex.exerciseId,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight || null,
                    restSeconds: ex.restSeconds || null,
                    orderIndex: ex.orderIndex ?? index,
                })),
            },
        },
        include: {
            exercises: {
                include: { exercise: true },
                orderBy: { orderIndex: "asc" },
            },
        },
    });

    res.status(201).json({
        success: true,
        message: "Workout plan created successfully",
        data: workoutPlan,
    });
});

// ─── Get Workout Plans ──────────────────────────────────────────────────────

const getWorkoutPlans = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);

    const plans = await prisma.workoutPlan.findMany({
        where: { trainerId: trainer.id },
        include: {
            exercises: {
                include: { exercise: true },
                orderBy: { orderIndex: "asc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
        success: true,
        data: plans,
    });
});

// ─── Get Workout Plan by ID ─────────────────────────────────────────────────

const getWorkoutPlanById = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { id } = req.params;

    const plan = await prisma.workoutPlan.findUnique({
        where: { id, trainerId: trainer.id },
        include: {
            exercises: {
                include: { exercise: true },
                orderBy: { orderIndex: "asc" },
            },
        },
    });

    if (!plan) {
        throw new ErrorHandler("Workout plan not found", 404);
    }

    res.status(200).json({
        success: true,
        data: plan,
    });
});

// ─── Update Workout Plan ────────────────────────────────────────────────────

const updateWorkoutPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { id } = req.params;
    const { title, description, exercises } = req.body;

    const existing = await prisma.workoutPlan.findUnique({
        where: { id, trainerId: trainer.id },
    });

    if (!existing) {
        throw new ErrorHandler("Workout plan not found", 404);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    // If exercises are provided, replace all exercises
    if (exercises && Array.isArray(exercises)) {
        // Delete existing exercises and create new ones in a transaction
        const updatedPlan = await prisma.$transaction(async (tx) => {
            await tx.workoutPlanExercise.deleteMany({
                where: { workoutPlanId: id },
            });

            return tx.workoutPlan.update({
                where: { id },
                data: {
                    ...updateData,
                    exercises: {
                        create: exercises.map((ex, index) => ({
                            exerciseId: ex.exerciseId,
                            sets: ex.sets,
                            reps: ex.reps,
                            weight: ex.weight || null,
                            restSeconds: ex.restSeconds || null,
                            orderIndex: ex.orderIndex ?? index,
                        })),
                    },
                },
                include: {
                    exercises: {
                        include: { exercise: true },
                        orderBy: { orderIndex: "asc" },
                    },
                },
            });
        });

        return res.status(200).json({
            success: true,
            message: "Workout plan updated successfully",
            data: updatedPlan,
        });
    }

    const updatedPlan = await prisma.workoutPlan.update({
        where: { id },
        data: updateData,
        include: {
            exercises: {
                include: { exercise: true },
                orderBy: { orderIndex: "asc" },
            },
        },
    });

    res.status(200).json({
        success: true,
        message: "Workout plan updated successfully",
        data: updatedPlan,
    });
});

// ─── Delete Workout Plan ────────────────────────────────────────────────────

const deleteWorkoutPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { id } = req.params;

    const existing = await prisma.workoutPlan.findUnique({
        where: { id, trainerId: trainer.id },
    });

    if (!existing) {
        throw new ErrorHandler("Workout plan not found", 404);
    }

    await prisma.workoutPlan.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Workout plan deleted successfully",
    });
});

// ─── 8. Assign Workout Plan to Member ───────────────────────────────────────

const assignWorkoutPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { planId, memberId } = req.params;

    // Verify the plan belongs to this trainer
    const plan = await prisma.workoutPlan.findUnique({
        where: { id: planId, trainerId: trainer.id },
        include: {
            exercises: {
                orderBy: { orderIndex: "asc" },
            },
        },
    });

    if (!plan) {
        throw new ErrorHandler("Workout plan not found", 404);
    }

    // Verify the member is assigned to this trainer
    const member = await prisma.member.findUnique({
        where: { id: memberId, trainerId: trainer.id },
    });

    if (!member) {
        throw new ErrorHandler("Member not found or not assigned to you", 404);
    }

    if (plan.exercises.length === 0) {
        throw new ErrorHandler("Workout plan has no exercises to assign", 400);
    }

    // Create WorkoutAssignment records from the plan template
    const assignments = await prisma.workoutAssignment.createMany({
        data: plan.exercises.map((ex) => ({
            memberId: member.id,
            trainerId: trainer.id,
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restSeconds: ex.restSeconds,
        })),
    });

    res.status(201).json({
        success: true,
        message: `Workout plan "${plan.title}" assigned to member successfully`,
        data: { assignedExercises: assignments.count },
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DIET PLAN CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 9. Create Diet Plan ────────────────────────────────────────────────────

const createDietPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { title, description, calories, protein, carbs, fats, durationDays } = req.body;

    if (!title || !durationDays) {
        throw new ErrorHandler("Title and duration days are required", 400);
    }

    const dietPlan = await prisma.dietPlan.create({
        data: {
            trainerId: trainer.id,
            title,
            description,
            calories: calories ? parseInt(calories) : null,
            protein: protein ? parseFloat(protein) : null,
            carbs: carbs ? parseFloat(carbs) : null,
            fats: fats ? parseFloat(fats) : null,
            durationDays: parseInt(durationDays),
        },
    });

    res.status(201).json({
        success: true,
        message: "Diet plan created successfully",
        data: dietPlan,
    });
});

// ─── Get Diet Plans ─────────────────────────────────────────────────────────

const getDietPlans = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);

    const plans = await prisma.dietPlan.findMany({
        where: { trainerId: trainer.id },
        orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
        success: true,
        data: plans,
    });
});

// ─── Get Diet Plan by ID ────────────────────────────────────────────────────

const getDietPlanById = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { id } = req.params;

    const plan = await prisma.dietPlan.findUnique({
        where: { id, trainerId: trainer.id },
    });

    if (!plan) {
        throw new ErrorHandler("Diet plan not found", 404);
    }

    res.status(200).json({
        success: true,
        data: plan,
    });
});

// ─── Update Diet Plan ───────────────────────────────────────────────────────

const updateDietPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { id } = req.params;

    const existing = await prisma.dietPlan.findUnique({
        where: { id, trainerId: trainer.id },
    });

    if (!existing) {
        throw new ErrorHandler("Diet plan not found", 404);
    }

    const { title, description, calories, protein, carbs, fats, durationDays } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (calories !== undefined) updateData.calories = calories ? parseInt(calories) : null;
    if (protein !== undefined) updateData.protein = protein ? parseFloat(protein) : null;
    if (carbs !== undefined) updateData.carbs = carbs ? parseFloat(carbs) : null;
    if (fats !== undefined) updateData.fats = fats ? parseFloat(fats) : null;
    if (durationDays !== undefined) updateData.durationDays = parseInt(durationDays);

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    const updatedPlan = await prisma.dietPlan.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: "Diet plan updated successfully",
        data: updatedPlan,
    });
});

// ─── Delete Diet Plan ───────────────────────────────────────────────────────

const deleteDietPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { id } = req.params;

    const existing = await prisma.dietPlan.findUnique({
        where: { id, trainerId: trainer.id },
    });

    if (!existing) {
        throw new ErrorHandler("Diet plan not found", 404);
    }

    await prisma.dietPlan.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Diet plan deleted successfully",
    });
});

// ─── 10. Assign Diet Plan to Member ─────────────────────────────────────────

const assignDietPlan = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { planId, memberId } = req.params;

    // Verify the plan belongs to this trainer
    const plan = await prisma.dietPlan.findUnique({
        where: { id: planId, trainerId: trainer.id },
    });

    if (!plan) {
        throw new ErrorHandler("Diet plan not found", 404);
    }

    // Verify the member is assigned to this trainer
    const member = await prisma.member.findUnique({
        where: { id: memberId, trainerId: trainer.id },
    });

    if (!member) {
        throw new ErrorHandler("Member not found or not assigned to you", 404);
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const assignment = await prisma.dietAssignment.create({
        data: {
            memberId: member.id,
            trainerId: trainer.id,
            dietPlanId: plan.id,
            durationDays: plan.durationDays,
            endDate,
        },
        include: {
            dietPlan: true,
        },
    });

    res.status(201).json({
        success: true,
        message: `Diet plan "${plan.title}" assigned to member successfully`,
        data: assignment,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 11. Get My Schedule ────────────────────────────────────────────────────

const getMySchedule = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);

    const schedules = await prisma.trainerSchedule.findMany({
        where: { trainerId: trainer.id },
        orderBy: { dayOfWeek: "asc" },
    });

    res.status(200).json({
        success: true,
        data: schedules,
    });
});

// ─── Update My Schedule ─────────────────────────────────────────────────────

const updateMySchedule = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
        throw new ErrorHandler("Slots array is required", 400);
    }

    // Validate each slot
    for (const slot of slots) {
        if (slot.dayOfWeek === undefined || !slot.startTime || !slot.endTime) {
            throw new ErrorHandler("Each slot must have dayOfWeek, startTime, and endTime", 400);
        }
        if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
            throw new ErrorHandler("dayOfWeek must be between 0 (Sun) and 6 (Sat)", 400);
        }
    }

    // Upsert each slot
    const upsertedSlots = await prisma.$transaction(
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

    res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        data: upsertedSlots,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 12. Log Member Progress ────────────────────────────────────────────────

const logMemberProgress = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { memberId } = req.params;

    // Verify the member is assigned to this trainer
    const member = await prisma.member.findUnique({
        where: { id: memberId, trainerId: trainer.id },
    });

    if (!member) {
        throw new ErrorHandler("Member not found or not assigned to you", 404);
    }

    const { weight, bodyFat, chest, waist, arms, thigh, notes } = req.body;

    const progressLog = await prisma.progressLog.create({
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

    res.status(201).json({
        success: true,
        message: "Progress logged successfully",
        data: progressLog,
    });
});

// ─── Get Member Progress ────────────────────────────────────────────────────

const getMemberProgress = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { memberId } = req.params;

    // Verify the member is assigned to this trainer
    const member = await prisma.member.findUnique({
        where: { id: memberId, trainerId: trainer.id },
    });

    if (!member) {
        throw new ErrorHandler("Member not found or not assigned to you", 404);
    }

    const progressLogs = await prisma.progressLog.findMany({
        where: { memberId: member.id },
        orderBy: { recordedAt: "desc" },
    });

    res.status(200).json({
        success: true,
        data: progressLogs,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get Member Attendance ──────────────────────────────────────────────────

const getMemberAttendance = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { memberId } = req.params;

    const member = await prisma.member.findUnique({
        where: { id: memberId, trainerId: trainer.id },
    });

    if (!member) {
        throw new ErrorHandler("Member not found or not assigned to you", 404);
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [attendances, total] = await Promise.all([
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
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});

// ─── Mark Member Attendance ─────────────────────────────────────────────────

const markMemberAttendance = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { memberId } = req.params;

    const member = await prisma.member.findUnique({
        where: { id: memberId, trainerId: trainer.id },
    });

    if (!member) {
        throw new ErrorHandler("Member not found or not assigned to you", 404);
    }

    // Check if already checked in today without checkout
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
        where: {
            memberId: member.id,
            checkIn: { gte: today, lt: tomorrow },
            checkOut: null,
        },
    });

    // If already checked in, mark checkout
    if (existingAttendance) {
        const updated = await prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: { checkOut: new Date() },
        });

        return res.status(200).json({
            success: true,
            message: "Member checked out successfully",
            data: updated,
        });
    }

    // Otherwise, mark check-in
    const attendance = await prisma.attendance.create({
        data: {
            memberId: member.id,
            checkIn: new Date(),
            date: new Date(),
        },
    });

    res.status(201).json({
        success: true,
        message: "Member checked in successfully",
        data: attendance,
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── List Exercises ─────────────────────────────────────────────────────────

const listExercises = asyncHandler(async (req, res) => {
    const { muscleGroup, difficulty } = req.query;

    const where = {};

    if (muscleGroup) {
        where.muscleGroup = muscleGroup;
    }

    if (difficulty) {
        where.difficulty = difficulty;
    }

    const exercises = await prisma.exercise.findMany({
        where,
        orderBy: { name: "asc" },
    });

    res.status(200).json({
        success: true,
        data: exercises,
    });
});

// ─── Search Exercises ───────────────────────────────────────────────────────

const searchExercises = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q) {
        throw new ErrorHandler("Search query (q) is required", 400);
    }

    const exercises = await prisma.exercise.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
            ],
        },
        orderBy: { name: "asc" },
    });

    res.status(200).json({
        success: true,
        data: exercises,
    });
});

// ─── Update Exercise ────────────────────────────────────────────────────────

const updateExercise = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exercise = await prisma.exercise.findUnique({ where: { id } });

    if (!exercise) {
        throw new ErrorHandler("Exercise not found", 404);
    }

    const updateData = {};

    if (req.body.name !== undefined) {
        const existing = await prisma.exercise.findUnique({ where: { name: req.body.name } });
        if (existing && existing.id !== id) {
            throw new ErrorHandler("An exercise with this name already exists", 409);
        }
        updateData.name = req.body.name;
    }
    if (req.body.muscleGroup !== undefined) updateData.muscleGroup = req.body.muscleGroup;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.difficulty !== undefined) updateData.difficulty = req.body.difficulty;
    if (req.body.videoUrl !== undefined) updateData.videoUrl = req.body.videoUrl;

    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler("No valid fields provided to update", 400);
    }

    const updatedExercise = await prisma.exercise.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: "Exercise updated successfully",
        data: updatedExercise,
    });
});

// ─── Delete Exercise ────────────────────────────────────────────────────────

const deleteExercise = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exercise = await prisma.exercise.findUnique({ where: { id } });

    if (!exercise) {
        throw new ErrorHandler("Exercise not found", 404);
    }

    await prisma.exercise.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Exercise deleted successfully",
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get Class Bookings (for a particular member or gym class) ──────────────

const getClassBookings = asyncHandler(async (req, res) => {
    const trainer = await getTrainerRecord(req.user.id);
    const { memberId, classId } = req.query;

    const where = {};

    // Filter by member (only if assigned to this trainer)
    if (memberId) {
        const member = await prisma.member.findUnique({
            where: { id: memberId, trainerId: trainer.id },
        });

        if (!member) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        where.memberId = memberId;
    }

    // Filter by gym class (only if the class belongs to this trainer)
    if (classId) {
        const gymClass = await prisma.gymClass.findUnique({
            where: { id: classId, trainerId: trainer.id },
        });

        if (!gymClass) {
            throw new ErrorHandler("Gym class not found or not assigned to you", 404);
        }

        where.classId = classId;
    }

    if (!memberId && !classId) {
        // Default: show bookings for all classes owned by this trainer
        where.gymClass = { trainerId: trainer.id };
    }

    const bookings = await prisma.classBooking.findMany({
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
            gymClass: {
                select: {
                    id: true,
                    title: true,
                    startTime: true,
                    endTime: true,
                },
            },
        },
        orderBy: { bookedAt: "desc" },
    });

    res.status(200).json({
        success: true,
        data: bookings,
    });
});

export {
    getMyProfile,
    createMyProfile,
    updateMyProfile,
    listTrainers,
    getTrainerById,
    getMyMembers,
    getMyMemberById,
    createWorkoutPlan,
    getWorkoutPlans,
    getWorkoutPlanById,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    assignWorkoutPlan,
    createDietPlan,
    getDietPlans,
    getDietPlanById,
    updateDietPlan,
    deleteDietPlan,
    assignDietPlan,
    getMySchedule,
    updateMySchedule,
    logMemberProgress,
    getMemberProgress,
    getMemberAttendance,
    markMemberAttendance,
    listExercises,
    searchExercises,
    updateExercise,
    deleteExercise,
    getClassBookings,
};

