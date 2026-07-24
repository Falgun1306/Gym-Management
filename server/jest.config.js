/**
 * Jest configuration for ESM (ES Modules) project.
 *
 * Since this project uses "type": "module" in package.json,
 * Jest must run with Node's --experimental-vm-modules flag.
 *
 * Run tests via:   npm test
 * Which executes:  NODE_OPTIONS="--experimental-vm-modules" jest
 */
export default {
    // ─── Test file discovery ─────────────────────────────────────────────
    testMatch: [
        "<rootDir>/tests/**/*.test.js",
    ],

    // ─── Roots ───────────────────────────────────────────────────────────
    roots: ["<rootDir>"],

    // ─── ESM support ─────────────────────────────────────────────────────
    // No transform needed — Node handles ESM natively
    transform: {},

    // ─── Module resolution ───────────────────────────────────────────────
    moduleFileExtensions: ["js", "json"],
    moduleDirectories: ["node_modules", "<rootDir>"],

    // ─── Test environment ────────────────────────────────────────────────
    testEnvironment: "node",

    // ─── Setup files ─────────────────────────────────────────────────────
    // Runs before each test suite — loads env vars, configures mocks
    setupFiles: ["<rootDir>/tests/setup.js"],

    // ─── Coverage ────────────────────────────────────────────────────────
    collectCoverageFrom: [
        "src/controller/**/*.js",
        "src/services/**/*.js",
        "src/middlewares/**/*.js",
        "src/jobs/**/*.js",
        "!src/config/**",
        "!src/server.js",
    ],
    coverageDirectory: "coverage",

    // ─── Timeouts ────────────────────────────────────────────────────────
    testTimeout: 10000,

    // ─── Verbose output ──────────────────────────────────────────────────
    verbose: true,
};
