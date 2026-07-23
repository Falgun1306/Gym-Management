/**
 * Global test setup — runs before each test suite.
 *
 * Responsibilities:
 *   1. Load test environment variables
 *   2. Silence console output during tests (optional)
 */

// Set test environment variables BEFORE any module imports
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
