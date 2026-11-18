import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./test-env";

/** Applies all migrations to the test database once per run. */
export default function setup() {
  execSync("pnpm exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "pipe",
  });
}
