/**
 * Unit Tests for Class Reminder Job
 *
 * Source: src/jobs/classReminder.job.js
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

const { runClassReminderJob } = await import("../../../src/jobs/classReminder.job.js");

describe("ClassReminder Job", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should send reminders to booked members for tomorrow's classes", async () => {
        const tomorrowAt10 = new Date();
        tomorrowAt10.setDate(tomorrowAt10.getDate() + 1);
        tomorrowAt10.setHours(10, 0, 0, 0);

        const tomorrowClasses = [
            {
                id: "gc-1",
                title: "Morning Yoga",
                startTime: tomorrowAt10,
                trainer: { firstName: "Sarah", lastName: "Lee" },
                bookings: [
                    { member: { userId: "u-1", firstName: "John" } },
                    { member: { userId: "u-2", firstName: "Jane" } },
                ],
            },
        ];

        prismaMock.gymClass.findMany.mockResolvedValue(tomorrowClasses);
        prismaMock.notification.createMany.mockResolvedValue({ count: 2 });

        await runClassReminderJob();

        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({
                    userId: "u-1",
                    title: "Upcoming Class Tomorrow",
                    type: "CLASS",
                }),
                expect.objectContaining({
                    userId: "u-2",
                    title: "Upcoming Class Tomorrow",
                    type: "CLASS",
                }),
            ]),
        });
    });

    it("should do nothing when no classes are scheduled for tomorrow", async () => {
        prismaMock.gymClass.findMany.mockResolvedValue([]);

        await runClassReminderJob();

        expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    });

    it("should handle classes with no bookings", async () => {
        const tomorrowAt10 = new Date();
        tomorrowAt10.setDate(tomorrowAt10.getDate() + 1);
        tomorrowAt10.setHours(10, 0, 0, 0);

        const tomorrowClasses = [
            {
                id: "gc-1",
                title: "Empty Class",
                startTime: tomorrowAt10,
                trainer: { firstName: "Mike", lastName: "Tan" },
                bookings: [],
            },
        ];

        prismaMock.gymClass.findMany.mockResolvedValue(tomorrowClasses);

        await runClassReminderJob();

        expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    });

    it("should handle multiple classes with multiple bookings", async () => {
        const tomorrowAt9 = new Date();
        tomorrowAt9.setDate(tomorrowAt9.getDate() + 1);
        tomorrowAt9.setHours(9, 0, 0, 0);

        const tomorrowAt14 = new Date();
        tomorrowAt14.setDate(tomorrowAt14.getDate() + 1);
        tomorrowAt14.setHours(14, 0, 0, 0);

        const tomorrowClasses = [
            {
                id: "gc-1",
                title: "HIIT",
                startTime: tomorrowAt9,
                trainer: { firstName: "A", lastName: "B" },
                bookings: [
                    { member: { userId: "u-1", firstName: "One" } },
                ],
            },
            {
                id: "gc-2",
                title: "Pilates",
                startTime: tomorrowAt14,
                trainer: { firstName: "C", lastName: "D" },
                bookings: [
                    { member: { userId: "u-2", firstName: "Two" } },
                    { member: { userId: "u-3", firstName: "Three" } },
                ],
            },
        ];

        prismaMock.gymClass.findMany.mockResolvedValue(tomorrowClasses);
        prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

        await runClassReminderJob();

        const createManyCall = prismaMock.notification.createMany.mock.calls[0][0];
        expect(createManyCall.data).toHaveLength(3);
    });

    it("should handle database errors gracefully without throwing", async () => {
        prismaMock.gymClass.findMany.mockRejectedValue(new Error("Query failed"));

        await expect(runClassReminderJob()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "[ClassReminder] Error:",
            "Query failed"
        );
    });
});
