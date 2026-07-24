/**
 * Unit Tests for No-Show Marker Job
 *
 * Source: src/jobs/noShowMarker.job.js
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

const { runNoShowMarkerJob } = await import("../../../src/jobs/noShowMarker.job.js");

describe("NoShowMarker Job", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should mark BOOKED bookings as NO_SHOW and send notifications", async () => {
        const noShowBookings = [
            {
                id: "bk-1",
                member: { userId: "u-1", firstName: "John" },
                gymClass: { title: "Morning HIIT" },
            },
        ];

        prismaMock.classBooking.findMany.mockResolvedValue(noShowBookings);
        prismaMock.classBooking.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

        await runNoShowMarkerJob();

        expect(prismaMock.classBooking.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["bk-1"] } },
            data: { status: "NO_SHOW" },
        });
        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    userId: "u-1",
                    title: "Missed Class",
                    type: "CLASS",
                }),
            ],
        });
    });

    it("should do nothing when no no-show bookings exist", async () => {
        prismaMock.classBooking.findMany.mockResolvedValue([]);

        await runNoShowMarkerJob();

        expect(prismaMock.classBooking.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    });

    it("should handle multiple no-show bookings in batch", async () => {
        const noShowBookings = [
            {
                id: "bk-1",
                member: { userId: "u-1", firstName: "Alice" },
                gymClass: { title: "Yoga Flow" },
            },
            {
                id: "bk-2",
                member: { userId: "u-2", firstName: "Bob" },
                gymClass: { title: "CrossFit" },
            },
            {
                id: "bk-3",
                member: { userId: "u-3", firstName: "Charlie" },
                gymClass: { title: "Spin Class" },
            },
        ];

        prismaMock.classBooking.findMany.mockResolvedValue(noShowBookings);
        prismaMock.classBooking.updateMany.mockResolvedValue({ count: 3 });
        prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

        await runNoShowMarkerJob();

        expect(prismaMock.classBooking.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["bk-1", "bk-2", "bk-3"] } },
            data: { status: "NO_SHOW" },
        });

        const createManyCall = prismaMock.notification.createMany.mock.calls[0][0];
        expect(createManyCall.data).toHaveLength(3);
        expect(createManyCall.data[0].message).toContain("Yoga Flow");
        expect(createManyCall.data[1].message).toContain("CrossFit");
        expect(createManyCall.data[2].message).toContain("Spin Class");
    });

    it("should handle database errors gracefully without throwing", async () => {
        prismaMock.classBooking.findMany.mockRejectedValue(new Error("DB unavailable"));

        await expect(runNoShowMarkerJob()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "[NoShowMarker] Error:",
            "DB unavailable"
        );
    });
});
