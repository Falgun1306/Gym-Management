import exerciseRepository from "../repositories/exercise.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class ExerciseService {
    async createExercise(body) {
        const { name, muscleGroup, description, difficulty, videoUrl } = body;

        const existing = await exerciseRepository.findByName(name);
        if (existing) {
            throw new ErrorHandler("An exercise with this name already exists", 409);
        }

        return exerciseRepository.create({
            name,
            muscleGroup,
            description: description || null,
            difficulty: difficulty || "BEGINNER",
            videoUrl: videoUrl || null,
        });
    }

    async listExercises(query) {
        const { muscleGroup, difficulty } = query;
        const where = {};
        if (muscleGroup) where.muscleGroup = muscleGroup;
        if (difficulty) where.difficulty = difficulty;

        return exerciseRepository.findMany(where, { name: "asc" });
    }

    async searchExercises(queryStr) {
        if (!queryStr) {
            throw new ErrorHandler("Search query (q) is required", 400);
        }

        const where = {
            OR: [
                { name: { contains: queryStr, mode: "insensitive" } },
                { description: { contains: queryStr, mode: "insensitive" } },
            ],
        };

        return exerciseRepository.findMany(where, { name: "asc" });
    }

    async getExercisesByMuscleGroup(muscleGroup) {
        return exerciseRepository.findMany({ muscleGroup }, { name: "asc" });
    }

    async getExerciseById(id) {
        const exercise = await exerciseRepository.findById(id);
        if (!exercise) {
            throw new ErrorHandler("Exercise not found", 404);
        }
        return exercise;
    }

    async updateExercise(id, body) {
        const exercise = await exerciseRepository.findById(id);
        if (!exercise) {
            throw new ErrorHandler("Exercise not found", 404);
        }

        const updateData = {};
        if (body.name !== undefined) {
            const existing = await exerciseRepository.findByName(body.name);
            if (existing && existing.id !== id) {
                throw new ErrorHandler("An exercise with this name already exists", 409);
            }
            updateData.name = body.name;
        }

        if (body.muscleGroup !== undefined) updateData.muscleGroup = body.muscleGroup;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
        if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return exerciseRepository.update(id, updateData);
    }

    async deleteExercise(id) {
        const exercise = await exerciseRepository.findById(id);
        if (!exercise) {
            throw new ErrorHandler("Exercise not found", 404);
        }

        return exerciseRepository.delete(id);
    }
}

export default new ExerciseService();
