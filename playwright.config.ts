import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/** 07:00 today in Vietnam: inside opening hours, so the order flow works whenever the suite runs. */
function fakeNow(): string {
  const vnToday = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  return `${vnToday}T07:00:00+07:00`;
}

export const FAKE_NOW = process.env.E2E_FAKE_NOW ?? fakeNow();
process.env.E2E_FAKE_NOW = FAKE_NOW;
export const ADMIN_PASSWORD = "e2e-admin-password";

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl || databaseUrl === process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL_TEST must be set and differ from DATABASE_URL");
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // One shared test database: run tests one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      BUMNO_FAKE_NOW: FAKE_NOW,
      ADMIN_PASSWORD,
      SESSION_SECRET: "e2e-session-secret-that-is-at-least-32-chars",
    },
  },
});
