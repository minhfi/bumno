import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { ADMIN_PASSWORD, ADMIN_USERNAME, FAKE_NOW } from "../playwright.config";

export { FAKE_NOW };

/** A time on the same Vietnam day as FAKE_NOW, e.g. vnTime("13:00"). */
export function vnTime(hhmm: string): Date {
  return new Date(`${FAKE_NOW.slice(0, 10)}T${hhmm}:00+07:00`);
}

export async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_USERNAME);
  await page.getByLabel("Mật khẩu").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
}

/** Places an order straight through the API (from a distinct IP so the rate limit is not hit). */
export async function createOrderViaApi(request: APIRequestContext, ip: string, customerName = "Khách API") {
  const response = await request.post("/api/orders", {
    headers: { "x-forwarded-for": ip },
    data: {
      customerName,
      phone: "0987654321",
      address: "99 Đường Thử, Quận 1",
      deliverySlot: vnTime("08:00").toISOString(),
      items: [{ productId: "phan-dac-biet", quantity: 1 }],
      website: "",
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { code: string };
}
