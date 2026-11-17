import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAdminCredentials, createSessionToken, SESSION_MAX_AGE_SECONDS, verifySessionToken } from "./session";

const secret = "unit-test-secret-that-is-at-least-32-chars";
const t0 = Date.UTC(2026, 10, 9);

afterEach(() => vi.unstubAllEnvs());

describe("session token", () => {
  it("verifies its own token until it expires", () => {
    const token = createSessionToken(t0, secret);
    expect(verifySessionToken(token, t0 + 1000, secret)).toBe(true);
    expect(verifySessionToken(token, t0 + SESSION_MAX_AGE_SECONDS * 1000 - 1, secret)).toBe(true);
    expect(verifySessionToken(token, t0 + SESSION_MAX_AGE_SECONDS * 1000, secret)).toBe(false);
  });

  it("rejects tampered, foreign or malformed tokens", () => {
    const token = createSessionToken(t0, secret);
    const [expires, signature] = token.split(".");
    expect(verifySessionToken(`${Number(expires) + 1}.${signature}`, t0, secret)).toBe(false);
    expect(verifySessionToken(token, t0, "another-secret-that-is-at-least-32-chars")).toBe(false);
    for (const bad of [undefined, "", "abc", "123.", ".sig", `${expires}.${signature}.x`]) {
      expect(verifySessionToken(bad, t0, secret)).toBe(false);
    }
  });

  it("refuses a short SESSION_SECRET", () => {
    vi.stubEnv("SESSION_SECRET", "short");
    expect(() => createSessionToken(t0)).toThrow();
  });
});

describe("checkAdminCredentials", () => {
  it("compares against ADMIN_USERNAME and ADMIN_PASSWORD", () => {
    vi.stubEnv("ADMIN_USERNAME", "quản-lý");
    vi.stubEnv("ADMIN_PASSWORD", "đúng-rồi");
    expect(checkAdminCredentials("quản-lý", "đúng-rồi")).toBe(true);
    expect(checkAdminCredentials("quản-lý", "sai")).toBe(false);
    expect(checkAdminCredentials("khác", "đúng-rồi")).toBe(false);
    expect(checkAdminCredentials("", "")).toBe(false);
  });
});
