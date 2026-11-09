import { testDatabaseUrl } from "./test-env";

// Runs before each integration file imports `@/lib/db`, so Prisma connects to the test database.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.SESSION_SECRET = "test-session-secret-that-is-at-least-32-chars";
