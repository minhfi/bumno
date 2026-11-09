import "dotenv/config";

/** URL of the test database; refuses to run against the dev database. */
export function testDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("DATABASE_URL_TEST is not set (see .env.example)");
  if (url === process.env.DATABASE_URL) throw new Error("DATABASE_URL_TEST must differ from DATABASE_URL");
  return url;
}
