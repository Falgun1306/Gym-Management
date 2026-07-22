import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import argon2 from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const existingAdmin = await prisma.user.findUnique({
        where: { email: "admin@gym.com" },
    });

    if (existingAdmin) {
        console.log("✅ Admin already exists — skipping seed.");
        return;
    }

    const hashedPassword = await argon2.hash("admin123");

    const admin = await prisma.user.create({
        data: {
            username: "admin",
            email: "admin@gym.com",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    console.log("✅ Admin user seeded successfully:");
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: admin123`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
