import prisma from "../config/prisma.js";

class HealthService {
    async checkHealth() {
        return {
            status: "UP",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }

    async checkDatabaseStatus() {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const responseTimeMs = Date.now() - start;

        return {
            status: "UP",
            responseTimeMs,
            timestamp: new Date().toISOString(),
        };
    }
}

export default new HealthService();
