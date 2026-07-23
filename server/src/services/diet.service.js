import dietRepository from "../repositories/diet.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import memberRepository from "../repositories/member.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class DietService {
    async createDietPlan(userId, body) {
        const { title, description, calories, protein, carbs, fats, durationDays } = body;

        if (!title || !durationDays) {
            throw new ErrorHandler("Title and duration days are required", 400);
        }

        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        return dietRepository.createPlan({
            trainerId: trainer.id,
            title,
            description,
            calories: calories ? parseInt(calories) : null,
            protein: protein ? parseFloat(protein) : null,
            carbs: carbs ? parseFloat(carbs) : null,
            fats: fats ? parseFloat(fats) : null,
            durationDays: parseInt(durationDays),
        });
    }

    async getDietPlans(userId) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }
        return dietRepository.findPlansByTrainer(trainer.id);
    }

    async getDietPlanById(userId, id) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }
        const plan = await dietRepository.findPlanById(id, trainer.id);
        if (!plan) {
            throw new ErrorHandler("Diet plan not found", 404);
        }
        return plan;
    }

    async updateDietPlan(userId, id, body) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const existing = await dietRepository.findPlanById(id, trainer.id);
        if (!existing) {
            throw new ErrorHandler("Diet plan not found", 404);
        }

        const { title, description, calories, protein, carbs, fats, durationDays } = body;
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

        return dietRepository.updatePlan(id, updateData);
    }

    async deleteDietPlan(userId, id) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const existing = await dietRepository.findPlanById(id, trainer.id);
        if (!existing) {
            throw new ErrorHandler("Diet plan not found", 404);
        }

        return dietRepository.deletePlan(id);
    }

    async assignDietPlan(userId, planId, memberId) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const plan = await dietRepository.findPlanById(planId, trainer.id);
        if (!plan) {
            throw new ErrorHandler("Diet plan not found", 404);
        }

        const member = await memberRepository.findById(memberId);
        if (!member || member.trainerId !== trainer.id) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        return dietRepository.createAssignment({
            memberId: member.id,
            trainerId: trainer.id,
            dietPlanId: plan.id,
            durationDays: plan.durationDays,
            endDate,
        });
    }

    async getMyDietPlans(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }
        return dietRepository.findMemberAssignments(member.id);
    }
}

export default new DietService();
