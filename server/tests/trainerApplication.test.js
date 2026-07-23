/**
 * Trainer Application Workflow — Route & Controller Tests
 *
 * Tests the full HTTP flow:
 *   Member applies → Admin lists → Admin approves/rejects
 *
 * Architecture:
 *   - Uses jest.unstable_mockModule() to mock Prisma BEFORE importing app
 *   - Real Express routes, real auth middleware, real error handling
 *   - Only the database layer (Prisma) is mocked
 *   - Supertest drives HTTP requests against the Express app
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve absolute path to the prisma module
const prismaModulePath = resolve(__dirname, "../src/config/prisma.js");

// ─── Create Prisma mock inline ──────────────────────────────────────────────

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
});

const prismaMock = {
    user: createModelMock(),
    member: createModelMock(),
    trainer: createModelMock(),
    trainerApplication: createModelMock(),
    membership: createModelMock(),
    membershipPlan: createModelMock(),
    payment: createModelMock(),
    attendance: createModelMock(),
    exercise: createModelMock(),
    workoutAssignment: createModelMock(),
    workoutPlan: createModelMock(),
    workoutPlanExercise: createModelMock(),
    dietPlan: createModelMock(),
    dietAssignment: createModelMock(),
    progressLog: createModelMock(),
    gymClass: createModelMock(),
    classBooking: createModelMock(),
    trainerSchedule: createModelMock(),
    equipment: createModelMock(),
    notification: createModelMock(),
    complaint: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

// ─── Register mock using absolute path ──────────────────────────────────────

jest.unstable_mockModule(prismaModulePath, () => ({
    default: prismaMock,
}));

// ─── Dynamic imports (AFTER mock registration) ─────────────────────────────

const { app } = await import(resolve(__dirname, "../src/app.js"));
const supertest = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;

const request = supertest(app);

// ─── Test helpers ───────────────────────────────────────────────────────────

const createTestUser = (overrides = {}) => ({
    id: "test-user-id",
    username: "testuser",
    email: "test@example.com",
    password: "$argon2id$hashed_password",
    role: "MEMBER",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
});

const createTestMember = (overrides = {}) => ({
    id: "test-member-id",
    userId: "test-user-id",
    firstName: "John",
    lastName: "Doe",
    phone: "9876543210",
    gender: "MALE",
    dob: null,
    address: null,
    height: null,
    weight: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    medicalNotes: null,
    trainerId: null,
    joinedAt: new Date("2026-01-01"),
    ...overrides,
});

const createTestApplication = (overrides = {}) => ({
    id: "test-application-id",
    userId: "test-user-id",
    specialization: "STRENGTH",
    experience: 3,
    bio: "I have experience in personal training",
    certifications: ["ACE Certified"],
    coverNote: "I want to help members",
    status: "PENDING",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    ...overrides,
});

const generateTestToken = (payload = { id: "test-user-id" }) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const withAuth = (supertestRequest, user) => {
    const token = generateTestToken({ id: user.id });
    return supertestRequest.set("Cookie", [`token=${token}`]);
};

// ─── Reset helper ───────────────────────────────────────────────────────────

const resetAllMocks = () => {
    for (const model of Object.values(prismaMock)) {
        if (typeof model === "object" && model !== null) {
            for (const method of Object.values(model)) {
                if (typeof method?.mockReset === "function") {
                    method.mockReset();
                }
            }
        }
    }
    prismaMock.$transaction.mockImplementation((fn) =>
        typeof fn === "function" ? fn(prismaMock) : Promise.all(fn)
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER: Apply for Trainer
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/members/apply-trainer", () => {
    const memberUser = createTestUser({ id: "member-1", role: "MEMBER" });
    const memberProfile = createTestMember({ userId: "member-1" });

    beforeEach(() => {
        resetAllMocks();
        prismaMock.user.findUnique.mockResolvedValue(memberUser);
    });

    it("should submit a trainer application successfully", async () => {
        prismaMock.member.findUnique.mockResolvedValue(memberProfile);
        prismaMock.trainerApplication.findFirst.mockResolvedValue(null);

        const createdApp = createTestApplication({ userId: "member-1" });
        prismaMock.trainerApplication.create.mockResolvedValue(createdApp);

        const res = await withAuth(
            request.post("/api/v1/members/apply-trainer").send({
                specialization: "STRENGTH",
                experience: 3,
                bio: "I have experience",
                coverNote: "I want to help",
            }),
            memberUser
        );

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("submitted successfully");
        expect(prismaMock.trainerApplication.create).toHaveBeenCalledTimes(1);
    });

    it("should reject if user already has a pending application", async () => {
        prismaMock.member.findUnique.mockResolvedValue(memberProfile);
        prismaMock.trainerApplication.findFirst.mockResolvedValue(
            createTestApplication({ status: "PENDING" })
        );

        const res = await withAuth(
            request.post("/api/v1/members/apply-trainer").send({
                specialization: "STRENGTH",
            }),
            memberUser
        );

        expect(res.status).toBe(409);
        expect(res.body.message).toContain("already have a pending");
    });

    it("should reject if user is not a MEMBER", async () => {
        const trainerUser = createTestUser({ id: "trainer-1", role: "TRAINER" });
        prismaMock.user.findUnique.mockResolvedValue(trainerUser);

        const res = await withAuth(
            request.post("/api/v1/members/apply-trainer").send({
                specialization: "STRENGTH",
            }),
            trainerUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("already a TRAINER");
    });

    it("should reject if member profile does not exist", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);

        const res = await withAuth(
            request.post("/api/v1/members/apply-trainer").send({
                specialization: "STRENGTH",
            }),
            memberUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("member profile first");
    });

    it("should reject if specialization is missing", async () => {
        prismaMock.member.findUnique.mockResolvedValue(memberProfile);
        prismaMock.trainerApplication.findFirst.mockResolvedValue(null);

        const res = await withAuth(
            request.post("/api/v1/members/apply-trainer").send({}),
            memberUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("specialization is required");
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER: View My Applications
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/my-applications", () => {
    const memberUser = createTestUser({ id: "member-1", role: "MEMBER" });

    beforeEach(() => {
        resetAllMocks();
        prismaMock.user.findUnique.mockResolvedValue(memberUser);
    });

    it("should return the user's application history", async () => {
        const applications = [
            createTestApplication({ status: "REJECTED" }),
            createTestApplication({ status: "PENDING" }),
        ];
        prismaMock.trainerApplication.findMany.mockResolvedValue(applications);

        const res = await withAuth(
            request.get("/api/v1/members/my-applications"),
            memberUser
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: List Trainer Applications
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/admins/trainer-applications", () => {
    const adminUser = createTestUser({ id: "admin-1", role: "ADMIN" });

    beforeEach(() => {
        resetAllMocks();
        prismaMock.user.findUnique.mockResolvedValue(adminUser);
    });

    it("should list all applications with pagination", async () => {
        const applications = [createTestApplication()];
        prismaMock.trainerApplication.findMany.mockResolvedValue(applications);
        prismaMock.trainerApplication.count.mockResolvedValue(1);

        const res = await withAuth(
            request.get("/api/v1/admins/trainer-applications"),
            adminUser
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.total).toBe(1);
    });

    it("should filter by status", async () => {
        prismaMock.trainerApplication.findMany.mockResolvedValue([]);
        prismaMock.trainerApplication.count.mockResolvedValue(0);

        const res = await withAuth(
            request.get("/api/v1/admins/trainer-applications?status=PENDING"),
            adminUser
        );

        expect(res.status).toBe(200);
        expect(prismaMock.trainerApplication.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { status: "PENDING" },
            })
        );
    });

    it("should deny access to non-ADMIN users", async () => {
        const memberUser = createTestUser({ id: "member-1", role: "MEMBER" });
        prismaMock.user.findUnique.mockResolvedValue(memberUser);

        const res = await withAuth(
            request.get("/api/v1/admins/trainer-applications"),
            memberUser
        );

        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Approve Application
// ═══════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/v1/admins/trainer-applications/:id/approve", () => {
    const adminUser = createTestUser({ id: "admin-1", role: "ADMIN" });
    const pendingApp = createTestApplication({ id: "app-1", userId: "member-1" });
    const memberProfile = createTestMember({ userId: "member-1" });
    const memberUser = createTestUser({ id: "member-1", role: "MEMBER" });

    beforeEach(() => {
        resetAllMocks();
        prismaMock.user.findUnique.mockResolvedValue(adminUser);
    });

    it("should approve a pending application and create trainer profile", async () => {
        prismaMock.trainerApplication.findUnique.mockResolvedValue(pendingApp);
        prismaMock.member.findUnique.mockResolvedValue(memberProfile);
        prismaMock.user.findUnique
            .mockResolvedValueOnce(adminUser)        // auth middleware
            .mockResolvedValueOnce(memberUser);       // service validation
        prismaMock.trainer.findUnique.mockResolvedValue(null);
        prismaMock.trainer.create.mockResolvedValue({
            id: "new-trainer-id",
            userId: "member-1",
            firstName: "John",
            lastName: "Doe",
            specialization: "STRENGTH",
        });
        prismaMock.user.update.mockResolvedValue({});
        prismaMock.trainerApplication.update.mockResolvedValue({});

        const res = await withAuth(
            request.patch("/api/v1/admins/trainer-applications/app-1/approve").send({
                salary: 25000,
                joiningDate: "2026-08-01",
            }),
            adminUser
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("approved");
        expect(prismaMock.trainer.create).toHaveBeenCalledTimes(1);
        expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it("should reject if application is not PENDING", async () => {
        const approvedApp = createTestApplication({ id: "app-2", status: "APPROVED" });
        prismaMock.trainerApplication.findUnique.mockResolvedValue(approvedApp);

        const res = await withAuth(
            request.patch("/api/v1/admins/trainer-applications/app-2/approve").send({}),
            adminUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("already been");
    });

    it("should return 404 if application not found", async () => {
        prismaMock.trainerApplication.findUnique.mockResolvedValue(null);

        const res = await withAuth(
            request.patch("/api/v1/admins/trainer-applications/nonexistent/approve").send({}),
            adminUser
        );

        expect(res.status).toBe(404);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Reject Application
// ═══════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/v1/admins/trainer-applications/:id/reject", () => {
    const adminUser = createTestUser({ id: "admin-1", role: "ADMIN" });

    beforeEach(() => {
        resetAllMocks();
        prismaMock.user.findUnique.mockResolvedValue(adminUser);
    });

    it("should reject a pending application with reason", async () => {
        const pendingApp = createTestApplication({ id: "app-1", status: "PENDING" });
        prismaMock.trainerApplication.findUnique.mockResolvedValue(pendingApp);

        const updatedApp = { ...pendingApp, status: "REJECTED", rejectionReason: "Not enough experience" };
        prismaMock.trainerApplication.update.mockResolvedValue(updatedApp);

        const res = await withAuth(
            request.patch("/api/v1/admins/trainer-applications/app-1/reject").send({
                rejectionReason: "Not enough experience",
            }),
            adminUser
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("rejected");
    });

    it("should require rejectionReason", async () => {
        const res = await withAuth(
            request.patch("/api/v1/admins/trainer-applications/app-1/reject").send({}),
            adminUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("rejectionReason is required");
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Direct Promote
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/admins/trainers/promote", () => {
    const adminUser = createTestUser({ id: "admin-1", role: "ADMIN" });
    const memberUser = createTestUser({ id: "member-1", role: "MEMBER" });
    const memberProfile = createTestMember({ userId: "member-1" });

    beforeEach(() => {
        resetAllMocks();
        prismaMock.user.findUnique.mockResolvedValue(adminUser);
    });

    it("should directly promote a member to trainer", async () => {
        prismaMock.member.findUnique.mockResolvedValue(memberProfile);
        prismaMock.user.findUnique
            .mockResolvedValueOnce(adminUser)        // auth middleware
            .mockResolvedValueOnce(memberUser);       // service validation
        prismaMock.trainer.findUnique.mockResolvedValue(null);
        prismaMock.trainer.create.mockResolvedValue({
            id: "new-trainer-id",
            userId: "member-1",
            firstName: "John",
            lastName: "Doe",
            specialization: "BODYBUILDING",
        });
        prismaMock.user.update.mockResolvedValue({});

        const res = await withAuth(
            request.post("/api/v1/admins/trainers/promote").send({
                userId: "member-1",
                specialization: "BODYBUILDING",
                salary: 30000,
            }),
            adminUser
        );

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("promoted to Trainer");
    });

    it("should require userId", async () => {
        const res = await withAuth(
            request.post("/api/v1/admins/trainers/promote").send({
                specialization: "STRENGTH",
            }),
            adminUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("userId is required");
    });

    it("should require specialization", async () => {
        const res = await withAuth(
            request.post("/api/v1/admins/trainers/promote").send({
                userId: "member-1",
            }),
            adminUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("specialization is required");
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH: Unauthenticated Access
// ═══════════════════════════════════════════════════════════════════════════════

describe("Unauthenticated requests", () => {
    it("should return 401 for /members/apply-trainer without token", async () => {
        const res = await request.post("/api/v1/members/apply-trainer").send({
            specialization: "STRENGTH",
        });

        expect(res.status).toBe(401);
    });

    it("should return 401 for /admins/trainer-applications without token", async () => {
        const res = await request.get("/api/v1/admins/trainer-applications");

        expect(res.status).toBe(401);
    });
});
