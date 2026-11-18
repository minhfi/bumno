import { expect, test, type Page } from "@playwright/test";
import type { ReportResponse } from "../src/lib/reports/types";
import { createOrderViaApi, login, vnTime } from "./helpers";

const vnd = (amount: number) => `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;

/** Report straight from the API, with the page's session cookie. */
async function fetchReport(page: Page, range: string): Promise<ReportResponse> {
  const response = await page.request.get(`/api/admin/reports?range=${range}`);
  expect(response.status()).toBe(200);
  return response.json();
}

async function completeOrder(page: Page, code: string) {
  for (const status of ["CONFIRMED", "DELIVERING", "COMPLETED"]) {
    const response = await page.request.patch(`/api/admin/orders/${code}`, { data: { status } });
    expect(response.status()).toBe(200);
  }
}

test.describe("reports", () => {
  test("admin opens reports from the header, switches range, and the figures match the orders", async ({ page, request }, testInfo) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    await login(page);
    // The test database is shared with other specs, so compare against the figures before this test's orders.
    const before = await fetchReport(page, "today");

    const ip = `10.9.3.${testInfo.project.name === "mobile" ? 1 : 2}`;
    const first = await createOrderViaApi(request, ip, `Khách báo cáo 1 ${testInfo.project.name}`);
    const second = await createOrderViaApi(request, ip, `Khách báo cáo 2 ${testInfo.project.name}`);
    await completeOrder(page, first.code);
    await completeOrder(page, second.code);

    await page.getByRole("link", { name: "Báo cáo" }).click();
    await expect(page).toHaveURL(/\/admin\/reports$/);
    await expect(page.getByRole("heading", { level: 1, name: "Báo cáo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Báo cáo" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Hôm nay" })).toHaveAttribute("aria-pressed", "true");

    const revenue = before.current.revenue + 100_000;
    const completed = before.current.completedOrders + 2;
    const tiles = page.locator("dl");
    await expect(tiles.getByText(vnd(revenue), { exact: true })).toBeVisible();
    await expect(tiles.getByText(String(completed), { exact: true })).toBeVisible();
    await expect(tiles.getByText(vnd(Math.round(revenue / completed)), { exact: true })).toBeVisible();

    // Both orders were for 8:00 today: the 8h bar carries them, and the dish table adds up.
    const bar = page.getByRole("img", { name: new RegExp(`^8:00–9:00, .*: ${vnd(before.series[2].revenue + 100_000)}`) });
    await expect(bar).toHaveCount(1);
    const special = page.getByRole("row", { name: /Phần đặc biệt/ });
    if (testInfo.project.name === "desktop") await expect(special).toContainText(vnd((before.items.find((i) => i.productId === "phan-dac-biet")?.revenue ?? 0) + 100_000));

    await page.getByRole("button", { name: "7 ngày" }).click();
    await expect(page).toHaveURL(/\/admin\/reports\?range=7d$/);
    await expect(page.getByRole("button", { name: "7 ngày" })).toHaveAttribute("aria-pressed", "true");
    const week = await fetchReport(page, "7d");
    expect(week.series).toHaveLength(7);
    await expect(tiles.getByText(vnd(week.current.revenue), { exact: true })).toBeVisible();
    await expect(page.getByRole("figure", { name: "Doanh thu theo ngày" })).toBeVisible();

    await page.getByRole("button", { name: "365 ngày" }).click();
    await expect(page).toHaveURL(/range=365d$/);
    await expect(page.getByRole("figure", { name: "Doanh thu theo tháng" })).toBeVisible();

    // The range survives a reload; back to today drops the query.
    await page.reload();
    await expect(page.getByRole("button", { name: "365 ngày" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Hôm nay" }).click();
    await expect(page).toHaveURL(/\/admin\/reports$/);

    // And back to the order list from the header.
    await page.getByRole("link", { name: "Đơn hàng" }).click();
    await expect(page).toHaveURL(/\/admin\/orders$/);
  });

  test("today refreshes every 30 s without reloading", async ({ page, request }, testInfo) => {
    await page.clock.install({ time: vnTime("07:00") });
    await login(page);
    await page.goto("/admin/reports");
    const before = await fetchReport(page, "today");
    const tiles = page.locator("dl");
    await expect(tiles.getByText(vnd(before.current.revenue), { exact: true })).toBeVisible();

    const ip = `10.9.4.${testInfo.project.name === "mobile" ? 1 : 2}`;
    const { code } = await createOrderViaApi(request, ip, `Khách làm mới ${testInfo.project.name}`);
    await completeOrder(page, code);
    const after = vnd(before.current.revenue + 50_000);
    await expect(tiles.getByText(after, { exact: true })).toHaveCount(0);
    await page.clock.runFor(30_000);
    await expect(tiles.getByText(after, { exact: true })).toBeVisible();
  });

  test("switching range keeps the figures and the tabs in place while the next range loads", async ({ page }) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    await login(page);
    await page.goto("/admin/reports");
    const tiles = page.locator("dl");
    await expect(tiles.getByText("Doanh thu")).toBeVisible();
    const tab = page.getByRole("button", { name: "Hôm nay" });
    const widthBefore = (await tab.boundingBox())?.width;

    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/admin/reports?range=30d", async (route) => {
      await held;
      await route.continue();
    });

    await page.getByRole("button", { name: "30 ngày" }).click();
    await expect(page).toHaveURL(/\/admin\/reports\?range=30d$/);
    await expect(page.getByRole("status", { name: "Đang tải báo cáo…" })).toHaveCount(0);
    await expect(tiles.getByText("Doanh thu")).toBeVisible();
    expect((await tab.boundingBox())?.width).toBe(widthBefore);

    const response = page.waitForResponse("**/api/admin/reports?range=30d");
    release();
    await response;
    await expect(page.locator('[aria-busy="false"]')).toHaveCount(1);
    await expect(tiles.getByText("Doanh thu")).toBeVisible();
  });

  test("an unknown range in the URL falls back to today", async ({ page }) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    await login(page);
    await page.goto("/admin/reports?range=abc");
    await expect(page.getByRole("button", { name: "Hôm nay" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("dl").getByText("Doanh thu")).toBeVisible();
  });

  test("reports page and API are blocked without login", async ({ page, request }) => {
    await page.goto("/admin/reports?range=7d");
    await expect(page).toHaveURL(/\/admin$/);
    const response = await request.get("/api/admin/reports");
    expect(response.status()).toBe(401);
  });
});
