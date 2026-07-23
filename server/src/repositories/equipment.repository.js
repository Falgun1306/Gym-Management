import prisma from "../config/prisma.js";

class EquipmentRepository {
    async findById(id) {
        return prisma.equipment.findUnique({ where: { id } });
    }

    async findByName(name) {
        return prisma.equipment.findUnique({ where: { name } });
    }

    async findMany(where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" }) {
        const [data, total] = await Promise.all([
            prisma.equipment.findMany({ where, skip, take, orderBy }),
            prisma.equipment.count({ where }),
        ]);

        return { data, total };
    }

    async create(data) {
        return prisma.equipment.create({ data });
    }

    async update(id, data) {
        return prisma.equipment.update({ where: { id }, data });
    }

    async delete(id) {
        return prisma.equipment.delete({ where: { id } });
    }
}

export default new EquipmentRepository();
