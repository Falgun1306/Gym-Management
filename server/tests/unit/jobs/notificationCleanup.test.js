/**
 * Unit Tests for Notification Cleanup Job
 *
 * Source: src/jobs/notificationCleanup.job.js
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

const { runNotificationCleanupJob } = await import("../../../src/jobs/notificationCleanup.job.js");

describe("NotificationCleanup Job", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should delete read notifications older than 30 days", async () => {
        prismaMock.notification.deleteMany.mockResolvedValue({ count: 15 });

        await runNotificationCleanupJob();

        expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
            where: {
                isRead: true,
                createdAt: { lt: expect.any(Date) },
            },
        });

        const callArgs = prismaMock.notification.deleteMany.mock.calls[0][0];
        const cutoffDate = callArgs.where.createdAt.lt;
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - 30);

        expect(Math.abs(cutoffDate.getTime() - expectedDate.getTime())).toBeLessThan(5000);
    });

    it("should handle zero matching notifications", async () => {
        prismaMock.notification.deleteMany.mockResolvedValue({ count: 0 });

        await runNotificationCleanupJob();

        expect(prismaMock.notification.deleteMany).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("Deleted 0 old read notifications")
        );
    });

    it("should handle database errors gracefully without throwing", async () => {
        prismaMock.notification.deleteMany.mockRejectedValue(new Error("Delete failed"));

        await expect(runNotificationCleanupJob()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "[NotificationCleanup] Error:",
            "Delete failed"
        );
    });
});
