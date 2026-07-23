import ErrorHandler from "../utility/ErrorHandler.utility.js";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED SERVICE: Create a Trainer record from a Member profile
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a Trainer profile by copying personal data from the Member record
 * and updating the User role to TRAINER.
 *
 * Used by both:
 *   - approveTrainerApplication (admin approves a member's application)
 *   - directPromoteToTrainer    (admin directly promotes without application)
 *
 * Must be called INSIDE a Prisma interactive transaction (tx).
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx - Prisma transaction client
 * @param {Object} params
 * @param {string} params.userId           - The User ID being promoted
 * @param {string} params.specialization   - TrainerSpecialization enum value
 * @param {number|null} [params.experience]     - Years of experience
 * @param {string|null} [params.bio]            - Bio text
 * @param {string[]}    [params.certifications] - Array of certification strings
 * @param {number|null} [params.salary]         - Salary (set by admin)
 * @param {string|null} [params.joiningDate]    - Joining date (set by admin)
 * @returns {Promise<Object>} The created Trainer record
 */
const createTrainerFromMember = async (tx, {
    userId,
    specialization,
    experience = null,
    bio = null,
    certifications = [],
    salary = null,
    joiningDate = null,
}) => {
    // ── 1. Fetch the member profile to copy personal data ────────────────
    const member = await tx.member.findUnique({
        where: { userId },
    });

    if (!member) {
        throw new ErrorHandler(
            "Member profile not found. User must have a member profile before becoming a trainer.",
            400
        );
    }

    // ── 2. Verify user is still a MEMBER ─────────────────────────────────
    const user = await tx.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new ErrorHandler("User not found", 404);
    }

    if (user.role !== "MEMBER") {
        throw new ErrorHandler(`User is already a ${user.role}`, 400);
    }

    // ── 3. Check no Trainer profile already exists ───────────────────────
    const existingTrainer = await tx.trainer.findUnique({
        where: { userId },
    });

    if (existingTrainer) {
        throw new ErrorHandler("Trainer profile already exists for this user", 409);
    }

    // ── 4. Create the Trainer record (copy personal data from Member) ────
    const trainer = await tx.trainer.create({
        data: {
            userId,
            firstName: member.firstName,
            lastName: member.lastName,
            phone: member.phone,
            gender: member.gender,
            specialization,
            experience: experience !== null ? parseInt(experience) : null,
            salary: salary !== null ? parseFloat(salary) : null,
            bio: bio || null,
            certifications: certifications || [],
            joinedAt: joiningDate ? new Date(joiningDate) : new Date(),
        },
    });

    // ── 5. Update User role to TRAINER ───────────────────────────────────
    await tx.user.update({
        where: { id: userId },
        data: { role: "TRAINER" },
    });

    return trainer;
};

export { createTrainerFromMember };
