import "dotenv/config";
import { execSync } from "node:child_process";

/** Migrates and empties the test database before the suite. */
export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST };
  execSync("pnpm exec prisma migrate deploy", { env, stdio: "pipe" });
  execSync(
    `pnpm exec prisma db execute --stdin`,
    { env, input: 'TRUNCATE "OrderItem", "Order" RESTART IDENTITY CASCADE; ALTER SEQUENCE "Order_number_seq" RESTART WITH 1001;', stdio: ["pipe", "pipe", "pipe"] },
  );
}
