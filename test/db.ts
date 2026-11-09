import { db } from "@/lib/db";
import { globalLoginRateLimiter, loginRateLimiter, orderAttemptRateLimiter, orderRateLimiter } from "@/lib/rate-limit";

/** Empties the test database and in-memory limiters between tests. */
export async function resetState() {
  await db.$executeRawUnsafe('TRUNCATE "OrderItem", "Order" RESTART IDENTITY CASCADE');
  await db.$executeRawUnsafe('ALTER SEQUENCE "Order_number_seq" RESTART WITH 1001');
  orderRateLimiter.reset();
  orderAttemptRateLimiter.reset();
  loginRateLimiter.reset();
  globalLoginRateLimiter.reset();
}
