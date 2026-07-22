/**
 * Test Helpers — Utilities for simulating authenticated requests.
 *
 * The auth middleware reads JWT from req.cookies.token, verifies it,
 * then fetches the user from DB and sets req.user.
 *
 * In tests, we:
 *   1. Generate a real JWT with the test secret (matches setup.js)
 *   2. Mock prisma.user.findUnique to return a fake user
 *   3. Set the cookie on the supertest request
 *
 * This way, the REAL auth middleware runs (we're not skipping it),
 * but it resolves against our mock data.
 */
import jwt from "jsonwebtoken";

// ─── Test user factories ─────────────────────────────────────────────────────

/**
 * Creates a test user object. Override any field as needed.
 */
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

/**
 * Creates a test member profile. Override any field as needed.
 */
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

/**
 * Creates a test trainer profile. Override any field as needed.
 */
const createTestTrainer = (overrides = {}) => ({
    id: "test-trainer-id",
    userId: "test-trainer-user-id",
    firstName: "Jane",
    lastName: "Smith",
    phone: "9876543211",
    gender: "FEMALE",
    specialization: "STRENGTH",
    experience: 5,
    salary: 25000,
    bio: "Experienced trainer",
    profilePhoto: null,
    certifications: ["ACE Certified"],
    averageRating: 4.5,
    totalReviews: 10,
    joinedAt: new Date("2026-01-01"),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
});

/**
 * Creates a test trainer application. Override any field as needed.
 */
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

// ─── JWT Token Generation ────────────────────────────────────────────────────

/**
 * Generates a valid JWT token for testing.
 * Uses the same secret defined in tests/setup.js.
 *
 * @param {Object} payload - Token payload (must include `id`)
 * @returns {string} Signed JWT token
 */
const generateTestToken = (payload = { id: "test-user-id" }) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// ─── Supertest Auth Helper ───────────────────────────────────────────────────

/**
 * Adds authentication cookie to a supertest request.
 *
 * Usage:
 *   const res = await withAuth(request(app).get("/api/v1/members/me"), user);
 *
 * Or more commonly via the authRequest helper:
 *   const res = await authRequest(app, "get", "/api/v1/members/me", memberUser);
 *
 * @param {Object} supertestRequest - A supertest chain (e.g., request(app).get(...))
 * @param {Object} user - User object (must have `id`)
 * @returns {Object} The supertest chain with cookie set
 */
const withAuth = (supertestRequest, user) => {
    const token = generateTestToken({ id: user.id });
    return supertestRequest.set("Cookie", [`token=${token}`]);
};

export {
    createTestUser,
    createTestMember,
    createTestTrainer,
    createTestApplication,
    generateTestToken,
    withAuth,
};
