import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";

// ─── Prisma Mock Definition ──────────────────────────────────────────────────
const createModelMock = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    createMany: jest.fn(),
    groupBy: jest.fn(),
});

const prismaMock = {
    user: createModelMock(),
    member: createModelMock(),
    trainer: createModelMock(),
    equipment: createModelMock(),
    attendance: createModelMock(),
    notification: createModelMock(),
    exercise: createModelMock(),
    complaint: createModelMock(),
    gymClass: createModelMock(),
    classBooking: createModelMock(),
    workoutPlan: createModelMock(),
    workoutPlanExercise: createModelMock(),
    workoutAssignment: createModelMock(),
    dietPlan: createModelMock(),
    dietAssignment: createModelMock(),
    membership: createModelMock(),
    membershipPlan: createModelMock(),
    payment: createModelMock(),
    trainerTimeOff: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
    $queryRaw: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

jest.unstable_mockModule("../src/config/prisma.js", () => ({
    default: prismaMock,
}));

const { app } = await import("../src/app.js");
const { createTestUser, createTestMember, createTestTrainer, withAuth } = await import("./helpers/auth.helper.js");

const resetAllMocks = () => {
    for (const modelKey of Object.keys(prismaMock)) {
        const model = prismaMock[modelKey];
        if (typeof model === "object" && model !== null) {
            for (const fn of Object.values(model)) {
                if (typeof fn?.mockReset === "function") fn.mockReset();
            }
            if (model.createMany) model.createMany.mockResolvedValue({ count: 1 });
        }
    }
    if (typeof prismaMock.$queryRaw.mockReset === "function") {
        prismaMock.$queryRaw.mockReset();
        prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    }
    prismaMock.$transaction.mockImplementation((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn)));
};

describe("Feature Domain Controllers — Complete Jest Test Suite", () => {
    let adminUser, trainerUser, memberUser;
    let memberProfile, trainerProfile;

    beforeEach(() => {
        resetAllMocks();

        adminUser = createTestUser({ id: "admin-user-id", role: "ADMIN" });
        trainerUser = createTestUser({ id: "trainer-user-id", role: "TRAINER" });
        memberUser = createTestUser({ id: "member-user-id", role: "MEMBER" });

        memberProfile = createTestMember({ id: "member-id-1", userId: "member-user-id" });
        trainerProfile = createTestTrainer({ id: "trainer-id-1", userId: "trainer-user-id" });

        prismaMock.user.findUnique.mockImplementation(async (query) => {
            if (query?.where?.id === adminUser.id) return adminUser;
            if (query?.where?.id === trainerUser.id) return trainerUser;
            if (query?.where?.id === memberUser.id) return memberUser;
            return null;
        });

        prismaMock.member.findUnique.mockImplementation(async (query) => {
            if (query?.where?.userId === memberUser.id || query?.where?.id === memberProfile.id) {
                return memberProfile;
            }
            return null;
        });

        prismaMock.trainer.findUnique.mockImplementation(async (query) => {
            if (query?.where?.userId === trainerUser.id || query?.where?.id === trainerProfile.id) {
                return trainerProfile;
            }
            return null;
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 1. HEALTH CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("1. Health Controller", () => {
        it("GET /api/v1/health — should return 200 health status", async () => {
            const res = await request(app).get("/api/v1/health");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("healthy");
        });

        it("GET /api/v1/health/db — should return UP when database responds", async () => {
            prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

            const res = await request(app).get("/api/v1/health/db");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data?.status || res.body.status).toBe("UP");
        });

        it("GET /api/v1/health/db — should return 500 when database query throws", async () => {
            prismaMock.$queryRaw.mockReset();
            prismaMock.$queryRaw.mockRejectedValueOnce(new Error("Connection refused"));

            const res = await request(app).get("/api/v1/health/db");

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.status).toBe("DOWN");
            expect(res.body.error).toContain("Connection refused");
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 2. EQUIPMENT CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("2. Equipment Controller", () => {
        const mockEquipment = {
            id: "eq-100",
            name: "Squat Rack",
            category: "Strength",
            quantity: 4,
            status: "AVAILABLE",
        };

        it("POST /api/v1/equipment — create equipment (Admin)", async () => {
            prismaMock.equipment.findUnique.mockResolvedValue(null);
            prismaMock.equipment.create.mockResolvedValue(mockEquipment);

            const res = await withAuth(
                request(app).post("/api/v1/equipment").send({
                    name: "Squat Rack",
                    category: "Strength",
                    quantity: 4,
                }),
                adminUser
            );

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe("Squat Rack");
        });

        it("POST /api/v1/equipment — return 400 when required fields missing", async () => {
            const res = await withAuth(
                request(app).post("/api/v1/equipment").send({ name: "Squat Rack" }),
                adminUser
            );

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("required");
        });

        it("POST /api/v1/equipment — return 409 when equipment name exists", async () => {
            prismaMock.equipment.findUnique.mockResolvedValue(mockEquipment);

            const res = await withAuth(
                request(app).post("/api/v1/equipment").send({
                    name: "Squat Rack",
                    category: "Strength",
                    quantity: 2,
                }),
                adminUser
            );

            expect(res.status).toBe(409);
        });

        it("GET /api/v1/equipment — list equipment with filters", async () => {
            prismaMock.equipment.findMany.mockResolvedValue([mockEquipment]);
            prismaMock.equipment.count.mockResolvedValue(1);

            const res = await withAuth(
                request(app).get("/api/v1/equipment?category=Strength"),
                memberUser
            );

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it("GET /api/v1/equipment/:id — get equipment by ID", async () => {
            prismaMock.equipment.findUnique.mockResolvedValue(mockEquipment);

            const res = await withAuth(request(app).get("/api/v1/equipment/eq-100"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe("eq-100");
        });

        it("GET /api/v1/equipment/:id — return 404 if equipment not found", async () => {
            prismaMock.equipment.findUnique.mockResolvedValue(null);

            const res = await withAuth(request(app).get("/api/v1/equipment/invalid-id"), memberUser);

            expect(res.status).toBe(404);
        });

        it("PATCH /api/v1/equipment/:id — update equipment fields", async () => {
            prismaMock.equipment.findUnique.mockResolvedValue(mockEquipment);
            prismaMock.equipment.update.mockResolvedValue({ ...mockEquipment, quantity: 6 });

            const res = await withAuth(
                request(app).patch("/api/v1/equipment/eq-100").send({ quantity: 6 }),
                adminUser
            );

            expect(res.status).toBe(200);
            expect(res.body.data.quantity).toBe(6);
        });

        it("PATCH /api/v1/equipment/:id/status — update equipment status", async () => {
            prismaMock.equipment.findUnique.mockResolvedValue(mockEquipment);
            prismaMock.equipment.update.mockResolvedValue({ ...mockEquipment, status: "UNDER_MAINTENANCE" });

            const res = await withAuth(
                request(app).patch("/api/v1/equipment/eq-100/status").send({ status: "UNDER_MAINTENANCE" }),
                trainerUser
            );

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("UNDER_MAINTENANCE");
        });

        it("DELETE /api/v1/equipment/:id — delete equipment", async () => {
            prismaMock.equipment.findUnique.mockResolvedValue(mockEquipment);
            prismaMock.equipment.delete.mockResolvedValue(mockEquipment);

            const res = await withAuth(request(app).delete("/api/v1/equipment/eq-100"), adminUser);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("deleted");
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 3. ATTENDANCE CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("3. Attendance Controller", () => {
        it("POST /api/v1/attendance/check-in — member check-in", async () => {
            prismaMock.attendance.findFirst.mockResolvedValue(null);
            prismaMock.attendance.create.mockResolvedValue({
                id: "att-1",
                memberId: "member-id-1",
                checkIn: new Date(),
            });

            const res = await withAuth(request(app).post("/api/v1/attendance/check-in"), memberUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("Checked in");
        });

        it("POST /api/v1/attendance/check-in — return 400 if already checked in", async () => {
            prismaMock.attendance.findFirst.mockResolvedValue({
                id: "att-1",
                memberId: "member-id-1",
                checkIn: new Date(),
                checkOut: null,
            });

            const res = await withAuth(request(app).post("/api/v1/attendance/check-in"), memberUser);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already checked in");
        });

        it("POST /api/v1/attendance/check-out — member check-out", async () => {
            prismaMock.attendance.findFirst.mockResolvedValue({
                id: "att-1",
                memberId: "member-id-1",
                checkIn: new Date(),
                checkOut: null,
            });
            prismaMock.attendance.update.mockResolvedValue({
                id: "att-1",
                memberId: "member-id-1",
                checkOut: new Date(),
            });

            const res = await withAuth(request(app).post("/api/v1/attendance/check-out"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("Checked out");
        });

        it("POST /api/v1/attendance/check-out — return 404 if no active check-in", async () => {
            prismaMock.attendance.findFirst.mockResolvedValue(null);

            const res = await withAuth(request(app).post("/api/v1/attendance/check-out"), memberUser);

            expect(res.status).toBe(404);
        });

        it("GET /api/v1/attendance/me — get member's attendance history", async () => {
            prismaMock.attendance.findMany.mockResolvedValue([
                { id: "att-1", memberId: "member-id-1", checkIn: new Date() },
            ]);
            prismaMock.attendance.count.mockResolvedValue(1);

            const res = await withAuth(request(app).get("/api/v1/attendance/me"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.totalVisits).toBe(1);
        });

        it("GET /api/v1/attendance/members/:memberId — trainer view member attendance", async () => {
            prismaMock.member.findUnique.mockResolvedValue({
                id: "member-id-1",
                userId: "member-user-id",
                trainerId: "trainer-id-1",
            });
            prismaMock.attendance.findMany.mockResolvedValue([]);
            prismaMock.attendance.count.mockResolvedValue(0);

            const res = await withAuth(
                request(app).get("/api/v1/attendance/members/member-id-1"),
                trainerUser
            );

            expect(res.status).toBe(200);
        });

        it("GET /api/v1/attendance — admin view attendance list", async () => {
            prismaMock.attendance.findMany.mockResolvedValue([]);
            prismaMock.attendance.count.mockResolvedValue(0);

            const res = await withAuth(request(app).get("/api/v1/attendance"), adminUser);

            expect(res.status).toBe(200);
        });

        it("GET /api/v1/attendance/report — get attendance report for admin", async () => {
            prismaMock.attendance.count.mockResolvedValue(15);

            const res = await withAuth(request(app).get("/api/v1/attendance/report"), adminUser);

            expect(res.status).toBe(200);
            expect(res.body.data.todayTotalVisits).toBe(15);
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 4. WORKOUT CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("4. Workout Controller", () => {
        const mockWorkoutPlan = {
            id: "plan-10",
            trainerId: "trainer-id-1",
            title: "Leg Day Destroyer",
            description: "Quads & Hamstrings",
            exercises: [],
        };

        it("POST /api/v1/workouts — create workout plan (Trainer)", async () => {
            prismaMock.workoutPlan.create.mockResolvedValue(mockWorkoutPlan);

            const res = await withAuth(
                request(app).post("/api/v1/workouts").send({
                    title: "Leg Day Destroyer",
                    exercises: [{ exerciseId: "ex-1", sets: 4, reps: 12 }],
                }),
                trainerUser
            );

            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe("Leg Day Destroyer");
        });

        it("GET /api/v1/workouts — get trainer's workout plans", async () => {
            prismaMock.workoutPlan.findMany.mockResolvedValue([mockWorkoutPlan]);

            const res = await withAuth(request(app).get("/api/v1/workouts"), trainerUser);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it("GET /api/v1/workouts/me — get member's assigned workout plans", async () => {
            prismaMock.workoutAssignment.findMany.mockResolvedValue([
                { id: "wa-1", memberId: "member-id-1" },
            ]);

            const res = await withAuth(request(app).get("/api/v1/workouts/me"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it("DELETE /api/v1/workouts/:id — delete workout plan", async () => {
            prismaMock.workoutPlan.findUnique.mockResolvedValue(mockWorkoutPlan);
            prismaMock.workoutPlan.delete.mockResolvedValue(mockWorkoutPlan);

            const res = await withAuth(request(app).delete("/api/v1/workouts/plan-10"), trainerUser);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("deleted");
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 5. DIET CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("5. Diet Controller", () => {
        const mockDietPlan = {
            id: "diet-10",
            trainerId: "trainer-id-1",
            title: "High Protein Muscle Gain",
            durationDays: 30,
            protein: 180,
        };

        it("POST /api/v1/diets — create diet plan (Trainer)", async () => {
            prismaMock.dietPlan.create.mockResolvedValue(mockDietPlan);

            const res = await withAuth(
                request(app).post("/api/v1/diets").send({
                    title: "High Protein Muscle Gain",
                    durationDays: 30,
                    protein: 180,
                }),
                trainerUser
            );

            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe("High Protein Muscle Gain");
        });

        it("GET /api/v1/diets/me — get member's assigned diet plans", async () => {
            prismaMock.dietAssignment.findMany.mockResolvedValue([
                { id: "da-1", memberId: "member-id-1", dietPlan: mockDietPlan },
            ]);

            const res = await withAuth(request(app).get("/api/v1/diets/me"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it("DELETE /api/v1/diets/:id — delete diet plan", async () => {
            prismaMock.dietPlan.findUnique.mockResolvedValue(mockDietPlan);
            prismaMock.dietPlan.delete.mockResolvedValue(mockDietPlan);

            const res = await withAuth(request(app).delete("/api/v1/diets/diet-10"), trainerUser);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("deleted");
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 6. NOTIFICATION CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("6. Notification Controller", () => {
        const mockNotif = {
            id: "n-1",
            userId: "member-user-id",
            title: "Welcome to Gym",
            message: "Your profile has been created.",
            isRead: false,
        };

        it("GET /api/v1/notifications/me — get user notifications", async () => {
            prismaMock.notification.findMany.mockResolvedValue([mockNotif]);
            prismaMock.notification.count.mockResolvedValue(1);

            const res = await withAuth(request(app).get("/api/v1/notifications/me"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it("PATCH /api/v1/notifications/me/read-all — mark all notifications read", async () => {
            prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

            const res = await withAuth(request(app).patch("/api/v1/notifications/me/read-all"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("read");
        });

        it("POST /api/v1/notifications/bulk — send bulk notifications (Admin)", async () => {
            prismaMock.user.findMany.mockResolvedValue([{ id: "u-1" }, { id: "u-2" }]);
            prismaMock.notification.createMany.mockResolvedValue({ count: 2 });

            const res = await withAuth(
                request(app).post("/api/v1/notifications/bulk").send({
                    title: "Maintenance Notice",
                    message: "Gym will close at 8 PM today.",
                }),
                adminUser
            );

            expect(res.status).toBe(201);
            expect(res.body.data.count).toBe(2);
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 7. EXERCISE CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("7. Exercise Controller", () => {
        const mockExercise = {
            id: "ex-100",
            name: "Deadlift",
            muscleGroup: "BACK",
            description: "Conventional deadlift",
            difficulty: "ADVANCED",
        };

        it("POST /api/v1/exercises — create exercise", async () => {
            prismaMock.exercise.findUnique.mockResolvedValue(null);
            prismaMock.exercise.create.mockResolvedValue(mockExercise);

            const res = await withAuth(
                request(app).post("/api/v1/exercises").send({
                    name: "Deadlift",
                    muscleGroup: "BACK",
                    description: "Conventional deadlift",
                }),
                trainerUser
            );

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe("Deadlift");
        });

        it("GET /api/v1/exercises/search — search exercises", async () => {
            prismaMock.exercise.findMany.mockResolvedValue([mockExercise]);

            const res = await withAuth(request(app).get("/api/v1/exercises/search?q=Deadlift"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it("GET /api/v1/exercises/muscle-group/:muscleGroup — filter by muscle group", async () => {
            prismaMock.exercise.findMany.mockResolvedValue([mockExercise]);

            const res = await withAuth(request(app).get("/api/v1/exercises/muscle-group/BACK"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.data[0].muscleGroup).toBe("BACK");
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 8. COMPLAINT CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("8. Complaint Controller", () => {
        const mockComplaint = {
            id: "c-10",
            memberId: "member-id-1",
            subject: "Air Conditioner Issue",
            description: "AC unit 2 is leaking.",
            status: "OPEN",
        };

        it("POST /api/v1/complaints — member submit complaint", async () => {
            prismaMock.complaint.create.mockResolvedValue(mockComplaint);

            const res = await withAuth(
                request(app).post("/api/v1/complaints").send({
                    subject: "Air Conditioner Issue",
                    description: "AC unit 2 is leaking.",
                }),
                memberUser
            );

            expect(res.status).toBe(201);
            expect(res.body.data.subject).toBe("Air Conditioner Issue");
        });

        it("PATCH /api/v1/complaints/:id — admin resolve complaint", async () => {
            prismaMock.complaint.findUnique.mockResolvedValue(mockComplaint);
            prismaMock.complaint.update.mockResolvedValue({ ...mockComplaint, status: "RESOLVED" });

            const res = await withAuth(
                request(app).patch("/api/v1/complaints/c-10").send({ status: "RESOLVED" }),
                adminUser
            );

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("RESOLVED");
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 9. GYM CLASS CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("9. GymClass Controller", () => {
        const mockClass = {
            id: "gc-1",
            trainerId: "trainer-id-1",
            title: "Spinning & Cardio",
            capacity: 15,
            startTime: new Date("2026-08-05T09:00:00Z"),
            endTime: new Date("2026-08-05T10:00:00Z"),
            _count: { bookings: 2 },
        };

        it("POST /api/v1/gym-classes — admin create gym class", async () => {
            prismaMock.gymClass.create.mockResolvedValue(mockClass);

            const res = await withAuth(
                request(app).post("/api/v1/gym-classes").send({
                    trainerId: "trainer-id-1",
                    title: "Spinning & Cardio",
                    capacity: 15,
                    startTime: "2026-08-05T09:00:00Z",
                    endTime: "2026-08-05T10:00:00Z",
                }),
                adminUser
            );

            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe("Spinning & Cardio");
        });

        it("POST /api/v1/gym-classes/:classId/book — member book gym class", async () => {
            prismaMock.membership.findMany.mockResolvedValue([{ id: "ms-1", status: "ACTIVE" }]);
            prismaMock.gymClass.findUnique.mockResolvedValue(mockClass);
            prismaMock.classBooking.findFirst.mockResolvedValue(null);
            prismaMock.classBooking.create.mockResolvedValue({
                id: "b-10",
                classId: "gc-1",
                memberId: "member-id-1",
            });

            const res = await withAuth(
                request(app).post("/api/v1/gym-classes/gc-1/book"),
                memberUser
            );

            expect(res.status).toBe(201);
            expect(res.body.message).toContain("booked successfully");
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 10. DASHBOARD CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("10. Dashboard Controller", () => {
        it("GET /api/v1/dashboards/admin — get admin dashboard stats", async () => {
            prismaMock.member.count.mockResolvedValue(50);
            prismaMock.trainer.count.mockResolvedValue(5);
            prismaMock.membership.count.mockResolvedValue(40);
            prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: 80000 } });
            prismaMock.payment.count.mockResolvedValue(1);
            prismaMock.attendance.count.mockResolvedValue(20);

            const res = await withAuth(request(app).get("/api/v1/dashboards/admin"), adminUser);

            expect(res.status).toBe(200);
            expect(res.body.data.totalMembers).toBe(50);
        });

        it("GET /api/v1/dashboards/trainer — get trainer dashboard stats", async () => {
            prismaMock.member.count.mockResolvedValue(10);
            prismaMock.workoutPlan.count.mockResolvedValue(5);
            prismaMock.dietPlan.count.mockResolvedValue(4);
            prismaMock.gymClass.count.mockResolvedValue(3);

            const res = await withAuth(request(app).get("/api/v1/dashboards/trainer"), trainerUser);

            expect(res.status).toBe(200);
            expect(res.body.data.assignedMembersCount).toBe(10);
        });

        it("GET /api/v1/dashboards/member — get member dashboard stats", async () => {
            prismaMock.membership.findFirst.mockResolvedValue(null);
            prismaMock.workoutAssignment.count.mockResolvedValue(2);
            prismaMock.dietAssignment.count.mockResolvedValue(1);
            prismaMock.attendance.count.mockResolvedValue(15);
            prismaMock.notification.count.mockResolvedValue(3);

            const res = await withAuth(request(app).get("/api/v1/dashboards/member"), memberUser);

            expect(res.status).toBe(200);
            expect(res.body.data.totalVisits).toBe(15);
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 11. REPORT CONTROLLER
    // ═════════════════════════════════════════════════════════════════════════
    describe("11. Report Controller", () => {
        it("GET /api/v1/reports/revenue — get revenue report for admin", async () => {
            prismaMock.payment.aggregate.mockResolvedValue({
                _sum: { amount: 120000 },
                _count: { id: 25 },
            });
            prismaMock.payment.groupBy.mockResolvedValue([]);

            const res = await withAuth(request(app).get("/api/v1/reports/revenue"), adminUser);

            expect(res.status).toBe(200);
            expect(res.body.data.totalRevenue).toBe(120000);
        });

        it("GET /api/v1/reports/memberships — get membership distribution report", async () => {
            prismaMock.membership.groupBy.mockResolvedValue([
                { status: "ACTIVE", _count: { id: 30 } },
            ]);
            prismaMock.membershipPlan.findMany.mockResolvedValue([
                { id: "p-1", name: "Premium Plan" },
            ]);

            const res = await withAuth(request(app).get("/api/v1/reports/memberships"), adminUser);

            expect(res.status).toBe(200);
            expect(res.body.data.statusBreakdown).toHaveLength(1);
        });

        it("GET /api/v1/reports/trainers — get trainer performance report", async () => {
            prismaMock.trainer.findMany.mockResolvedValue([
                { id: "tr-1", firstName: "Jane", averageRating: 4.9 },
            ]);

            const res = await withAuth(request(app).get("/api/v1/reports/trainers"), adminUser);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it("GET /api/v1/reports/member-growth — get member growth history report", async () => {
            prismaMock.member.count.mockResolvedValue(150);
            prismaMock.member.groupBy.mockResolvedValue([]);

            const res = await withAuth(request(app).get("/api/v1/reports/member-growth"), adminUser);

            expect(res.status).toBe(200);
            expect(res.body.data.totalMembers).toBe(150);
        });
    });
});
