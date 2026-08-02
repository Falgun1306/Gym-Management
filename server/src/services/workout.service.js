import workoutRepository from "../repositories/workout.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import memberRepository from "../repositories/member.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class WorkoutService {
    async createWorkoutPlan(userId, body) {
        const { title, description, exercises } = body;

        if (!title) {
            throw new ErrorHandler("Title is required", 400);
        }

        if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
            throw new ErrorHandler("At least one exercise is required", 400);
        }

        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        return workoutRepository.createPlan({
            trainerId: trainer.id,
            title,
            description,
            exercises: {
                create: exercises.map((ex, index) => ({
                    exerciseId: ex.exerciseId,
                    sets: parseInt(ex.sets),
                    reps: parseInt(ex.reps),
                    weight: ex.weight ? parseFloat(ex.weight) : null,
                    restSeconds: ex.rest ? parseInt(ex.rest) : (ex.restSeconds ? parseInt(ex.restSeconds) : null),
                    orderIndex: ex.orderIndex ?? index,
                })),
            },
        });
    }

    async getWorkoutPlans(userId) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }
        return workoutRepository.findPlansByTrainer(trainer.id);
    }

    async getWorkoutPlanById(userId, id) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }
        const plan = await workoutRepository.findPlanById(id, trainer.id);
        if (!plan) {
            throw new ErrorHandler("Workout plan not found", 404);
        }
        return plan;
    }

    async updateWorkoutPlan(userId, id, body) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const existing = await workoutRepository.findPlanById(id, trainer.id);
        if (!existing) {
            throw new ErrorHandler("Workout plan not found", 404);
        }

        const { title, description } = body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;

        return workoutRepository.updatePlan(id, updateData);
    }

    async deleteWorkoutPlan(userId, id) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const existing = await workoutRepository.findPlanById(id, trainer.id);
        if (!existing) {
            throw new ErrorHandler("Workout plan not found", 404);
        }

        return workoutRepository.deletePlan(id);
    }

    async assignWorkoutPlan(userId, planId, memberId) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const plan = await workoutRepository.findPlanById(planId, trainer.id);
        if (!plan) {
            throw new ErrorHandler("Workout plan not found", 404);
        }

        let member = await memberRepository.findById(memberId);
        if (!member) {
            member = await prisma.member.findFirst({
                where: {
                    user: { username: memberId },
                },
            });
        }
        if (!member || member.trainerId !== trainer.id) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        if (!plan.exercises || plan.exercises.length === 0) {
            throw new ErrorHandler("Workout plan has no exercises to assign", 400);
        }

        const assignments = plan.exercises.map((ex) => ({
            memberId: member.id,
            trainerId: trainer.id,
            exerciseId: ex.exerciseId,
            workoutPlanId: plan.id,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restSeconds: ex.restSeconds,
        }));

        await workoutRepository.createAssignments(assignments);

        return {
            title: plan.title,
            assignedCount: assignments.length,
        };
    }

    async getMyWorkoutPlans(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }
        return workoutRepository.findMemberAssignments(member.id);
    }
}

export default new WorkoutService();
