/**
 * Unit Tests for Membership Expiry Job
 *
 * Source: src/jobs/membershipExpiry.job.js
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createModelMock = () => ({
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    count: jest.fn(), aggregate: jest.fn(), upsert: jest.fn(),
    deleteMany: jest.fn(), updateMany: jest.fn(), createMany: jest.fn(),
});

const prismaMock = {
    user: createModelMock(), member: createModelMock(), trainer: createModelMock(),
    trainerApplication: createModelMock(), membership: createModelMock(),
    membershipPlan: createModelMock(), payment: createModelMock(),
    attendance: createModelMock(), exercise: createModelMock(),
    workoutAssignment: createModelMock(), workoutPlan: createModelMock(),
    workoutPlanExercise: createModelMock(), dietPlan: createModelMock(),
    dietAssignment: createModelMock(), progressLog: createModelMock(),
    gymClass: createModelMock(), classBooking: createModelMock(),
    trainerSchedule: createModelMock(), equipment: createModelMock(),
    notification: createModelMock(), complaint: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
    $connect: jest.fn(), $disconnect: jest.fn(),
};

jest.unstable_mockModule(resolve(__dirname, "../../../src/config/prisma.js"), () => ({
    default: prismaMock,
}));

const { runMembershipExpiryJob } = await import("../../../src/jobs/membershipExpiry.job.js");

describe("MembershipExpiry Job", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should expire active memberships past endDate and send notifications", async () => {
        const expiredMemberships = [
            {
                id: "ms-1",
                member: { userId: "u-1", firstName: "John", lastName: "Doe" },
                plan: { name: "Gold Plan" },
            },
        ];

        prismaMock.membership.findMany.mockResolvedValue(expiredMemberships);
        prismaMock.membership.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

        await runMembershipExpiryJob();

        expect(prismaMock.membership.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { status: "ACTIVE", endDate: expect.any(Object) },
            })
        );
        expect(prismaMock.membership.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["ms-1"] } },
            data: { status: "EXPIRED" },
        });
        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    userId: "u-1",
                    title: "Membership Expired",
                    type: "MEMBERSHIP",
                }),
            ],
        });
    });

    it("should do nothing when no expired memberships exist", async () => {
        prismaMock.membership.findMany.mockResolvedValue([]);

        await runMembershipExpiryJob();

        expect(prismaMock.membership.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    });

    it("should handle multiple expired memberships in batch", async () => {
        const expiredMemberships = [
            {
                id: "ms-1",
                member: { userId: "u-1", firstName: "Alice", lastName: "A" },
                plan: { name: "Silver Plan" },
            },
            {
                id: "ms-2",
                member: { userId: "u-2", firstName: "Bob", lastName: "B" },
                plan: { name: "Gold Plan" },
            },
            {
                id: "ms-3",
                member: { userId: "u-3", firstName: "Charlie", lastName: "C" },
                plan: { name: "Platinum Plan" },
            },
        ];

        prismaMock.membership.findMany.mockResolvedValue(expiredMemberships);
        prismaMock.membership.updateMany.mockResolvedValue({ count: 3 });
        prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

        await runMembershipExpiryJob();

        expect(prismaMock.membership.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["ms-1", "ms-2", "ms-3"] } },
            data: { status: "EXPIRED" },
        });
        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ userId: "u-1" }),
                expect.objectContaining({ userId: "u-2" }),
                expect.objectContaining({ userId: "u-3" }),
            ]),
        });
    });

    it("should handle database errors gracefully without throwing", async () => {
        prismaMock.membership.findMany.mockRejectedValue(new Error("DB connection failed"));

        await expect(runMembershipExpiryJob()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "[MembershipExpiry] Error:",
            "DB connection failed"
        );
    });
});
