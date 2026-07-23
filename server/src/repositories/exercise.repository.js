import prisma from "../config/prisma.js";

class ExerciseRepository {
    async findById(id) {
        return prisma.exercise.findUnique({ where: { id } });
    }

    async findByName(name) {
        return prisma.exercise.findUnique({ where: { name } });
    }

    async findMany(where = {}, orderBy = { name: "asc" }) {
        return prisma.exercise.findMany({ where, orderBy });
    }

    async create(data) {
        return prisma.exercise.create({ data });
    }

    async update(id, data) {
        return prisma.exercise.update({ where: { id }, data });
    }

    async delete(id) {
        return prisma.exercise.delete({ where: { id } });
    }
}

export default new ExerciseRepository();
