/**
 * Unit Tests for Payment Reminder Job
 *
 * Source: src/jobs/paymentReminder.job.js
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

const { runPaymentReminderJob } = await import("../../../src/jobs/paymentReminder.job.js");

describe("PaymentReminder Job", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should send a 7-day renewal reminder for non-urgent memberships", async () => {
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

        const expiringMemberships = [
            {
                id: "ms-1",
                endDate: fiveDaysFromNow,
                member: { userId: "u-1", firstName: "John" },
                plan: { name: "Gold Plan" },
            },
        ];

        prismaMock.membership.findMany.mockResolvedValue(expiringMemberships);
        prismaMock.notification.findMany.mockResolvedValue([]); // No recent notifications
        prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

        await runPaymentReminderJob();

        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    userId: "u-1",
                    title: "Membership Renewal Reminder",
                    type: "PAYMENT",
                }),
            ],
        });
    });

    it("should send an urgent 3-day warning for memberships expiring very soon", async () => {
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        const expiringMemberships = [
            {
                id: "ms-1",
                endDate: twoDaysFromNow,
                member: { userId: "u-1", firstName: "Jane" },
                plan: { name: "Silver Plan" },
            },
        ];

        prismaMock.membership.findMany.mockResolvedValue(expiringMemberships);
        prismaMock.notification.findMany.mockResolvedValue([]);
        prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

        await runPaymentReminderJob();

        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    userId: "u-1",
                    title: "Urgent: Membership Expiring Soon!",
                    type: "PAYMENT",
                }),
            ],
        });
    });

    it("should skip members who already received a PAYMENT notification in the last 24h", async () => {
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

        const expiringMemberships = [
            {
                id: "ms-1",
                endDate: fiveDaysFromNow,
                member: { userId: "u-1", firstName: "John" },
                plan: { name: "Gold Plan" },
            },
            {
                id: "ms-2",
                endDate: fiveDaysFromNow,
                member: { userId: "u-2", firstName: "Jane" },
                plan: { name: "Silver Plan" },
            },
        ];

        // u-1 was already notified
        prismaMock.membership.findMany.mockResolvedValue(expiringMemberships);
        prismaMock.notification.findMany.mockResolvedValue([{ userId: "u-1" }]);
        prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

        await runPaymentReminderJob();

        // Should only send to u-2 (u-1 was skipped)
        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: [expect.objectContaining({ userId: "u-2" })],
        });
    });

    it("should do nothing when no expiring memberships exist", async () => {
        prismaMock.membership.findMany.mockResolvedValue([]);

        await runPaymentReminderJob();

        expect(prismaMock.notification.findMany).not.toHaveBeenCalled();
        expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully without throwing", async () => {
        prismaMock.membership.findMany.mockRejectedValue(new Error("Connection timeout"));

        await expect(runPaymentReminderJob()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "[PaymentReminder] Error:",
            "Connection timeout"
        );
    });
});
