/**
 * Unit Tests for Attendance Cleanup Job
 *
 * Source: src/jobs/attendanceCleanup.job.js
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

const { runAttendanceCleanupJob } = await import("../../../src/jobs/attendanceCleanup.job.js");

describe("AttendanceCleanup Job", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should auto-close forgotten check-outs from today", async () => {
        prismaMock.attendance.updateMany.mockResolvedValue({ count: 3 });

        await runAttendanceCleanupJob();

        expect(prismaMock.attendance.updateMany).toHaveBeenCalledWith({
            where: {
                checkIn: { gte: expect.any(Date), lt: expect.any(Date) },
                checkOut: null,
            },
            data: {
                checkOut: expect.any(Date),
            },
        });
    });

    it("should verify the date range covers only today", async () => {
        prismaMock.attendance.updateMany.mockResolvedValue({ count: 0 });

        await runAttendanceCleanupJob();

        const callArgs = prismaMock.attendance.updateMany.mock.calls[0][0];
        const gteDate = callArgs.where.checkIn.gte;
        const ltDate = callArgs.where.checkIn.lt;

        expect(gteDate.getHours()).toBe(0);
        expect(gteDate.getMinutes()).toBe(0);
        expect(gteDate.getSeconds()).toBe(0);

        const expectedTomorrow = new Date(gteDate);
        expectedTomorrow.setDate(expectedTomorrow.getDate() + 1);
        expect(ltDate.getTime()).toBe(expectedTomorrow.getTime());
    });

    it("should handle zero open check-ins gracefully", async () => {
        prismaMock.attendance.updateMany.mockResolvedValue({ count: 0 });

        await runAttendanceCleanupJob();

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("Auto-closed 0 forgotten check-outs")
        );
    });

    it("should handle database errors gracefully without throwing", async () => {
        prismaMock.attendance.updateMany.mockRejectedValue(new Error("Update failed"));

        await expect(runAttendanceCleanupJob()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "[AttendanceCleanup] Error:",
            "Update failed"
        );
    });
});
