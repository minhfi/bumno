import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "bumno_admin";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Cookie value `<expiresAtMs>.<hmac>`; the server keeps no session state. */
export function createSessionToken(nowMs: number = Date.now(), secret: string = getSecret()): string {
  const expiresAt = nowMs + SESSION_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${sign(`admin.${expiresAt}`, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  nowMs: number = Date.now(),
  secret: string = getSecret(),
): boolean {
  if (!token) return false;
  const [expiresRaw, signature, ...rest] = token.split(".");
  if (!expiresRaw || !signature || rest.length > 0 || !/^\d+$/.test(expiresRaw)) return false;
  if (!safeEqual(signature, sign(`admin.${expiresRaw}`, secret))) return false;
  return Number(expiresRaw) > nowMs;
}

/** Constant-time comparison against ADMIN_USERNAME and ADMIN_PASSWORD (both are always compared). */
export function checkAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  const usernameOk = timingSafeEqual(digest(username), digest(expectedUsername));
  const passwordOk = timingSafeEqual(digest(password), digest(expectedPassword));
  return usernameOk && passwordOk;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** Reads and verifies the session cookie of an incoming request. */
export function isAdminRequest(request: { cookies: { get(name: string): { value: string } | undefined } }): boolean {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}
