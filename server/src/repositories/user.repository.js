import prisma from "../config/prisma.js";

class UserRepository {
    async findById(id, select = null) {
        return prisma.user.findUnique({
            where: { id },
            ...(select && { select }),
        });
    }

    async findByEmail(email) {
        if (!email) return null;
        return prisma.user.findUnique({ where: { email } });
    }

    async findByUsername(username) {
        if (!username) return null;
        return prisma.user.findUnique({ where: { username } });
    }

    async findByEmailOrUsername(email, username) {
        if (email && username) {
            return prisma.user.findFirst({
                where: {
                    OR: [{ email }, { username }],
                },
            });
        }
        if (email) {
            return prisma.user.findUnique({ where: { email } });
        }
        if (username) {
            return prisma.user.findUnique({ where: { username } });
        }
        return null;
    }

    async create(data) {
        return prisma.user.create({ data });
    }

    async update(id, data, select = null) {
        return prisma.user.update({
            where: { id },
            data,
            ...(select && { select }),
        });
    }

    async delete(id) {
        return prisma.user.delete({
            where: { id },
        });
    }
}

export default new UserRepository();
