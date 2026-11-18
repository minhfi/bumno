import { expect, test } from "@playwright/test";
import { createOrderViaApi, login, vnTime } from "./helpers";

test.describe("order flow", () => {
  test("customer orders, admin sees the order and confirms it", async ({ page }) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    const startedAt = Date.now();
    await page.goto("/");

    await page.getByRole("link", { name: "Đặt ngay" }).first().click();
    await page.getByRole("button", { name: "Thêm 1 Phần thường" }).click();
    await page.getByRole("button", { name: "Thêm 1 Phần thường" }).click();
    await page.getByRole("button", { name: "Thêm 1 Thêm lòng và gà" }).click();
    await expect(page.getByLabel("Tóm tắt đơn")).toContainText("85.000đ");

    await page.getByLabel("Họ tên").fill("Nguyễn Lan");
    await page.getByLabel("Số điện thoại").fill("0901 234 567");
    await page.getByLabel("Địa chỉ giao").fill("12 Lê Lợi, Quận 1");
    await page.getByLabel("Giờ nhận").selectOption({ label: "8:00" });
    await page.getByLabel(/Ghi chú/).fill("Ít hành");
    await page.getByRole("button", { name: "Đặt đơn", exact: true }).click();

    const success = page.getByRole("heading", { name: /^Đã đặt đơn BN-\d+$/ });
    await expect(success).toBeVisible();
    await expect(page.getByText("Quán sẽ gọi cho bạn để xác nhận")).toBeVisible();
    expect(Date.now() - startedAt).toBeLessThan(60_000);
    const code = (await success.textContent())!.replace("Đã đặt đơn ", "");

    await login(page);
    const openButton = page.getByRole("button", { name: `Xem đơn ${code}` });
    await expect(openButton).toBeVisible();
    await openButton.click();

    const dialog = page.getByRole("dialog", { name: `Đơn ${code}` });
    await expect(dialog).toContainText("Nguyễn Lan");
    await expect(dialog).toContainText("Phần thường × 2");
    await expect(dialog).toContainText("Ít hành");
    await dialog.getByRole("button", { name: "Xác nhận đơn" }).click();
    await expect(dialog.getByText("Đã cập nhật")).toBeVisible();
    await expect(dialog.getByRole("listitem").and(dialog.locator("[aria-current=step]"))).toHaveText("Đã xác nhận");

    await dialog.getByLabel("Ghi chú nội bộ").fill("Đã gọi khách");
    await dialog.getByRole("button", { name: "Lưu ghi chú" }).click();
    await expect(dialog.getByRole("button", { name: "Lưu ghi chú" })).toBeDisabled();

    await dialog.getByRole("button", { name: "Huỷ đơn" }).click();
    await dialog.getByRole("button", { name: "Xác nhận huỷ" }).click();
    await expect(dialog.getByText("Đã huỷ")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Huỷ đơn" })).toHaveCount(0);

    await dialog.getByRole("button", { name: "Đóng" }).click();
    await expect(page.getByRole("button", { name: `Xem đơn ${code}` })).toBeVisible();
  });

  test("invalid input shows Vietnamese errors and keeps what was typed", async ({ page }) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    await page.goto("/#dat-hang");
    await page.getByLabel("Số điện thoại").fill("12345");
    await page.getByRole("button", { name: "Đặt đơn", exact: true }).click();
    await expect(page.getByText("Chọn ít nhất 1 món").last()).toBeVisible();
    await expect(page.getByText("Số điện thoại gồm 10 số, bắt đầu bằng 0")).toBeVisible();
    await expect(page.getByLabel("Số điện thoại")).toHaveValue("12345");
  });

  test("the form stays open late at night", async ({ page }) => {
    await page.clock.setFixedTime(vnTime("13:00"));
    await page.goto("/#dat-hang");
    await expect(page.getByLabel("Họ tên")).toBeEnabled();
    await expect(page.getByRole("button", { name: "Đặt đơn", exact: true })).toBeEnabled();
  });

  test("a new order shows up in the admin list within 30 s without reloading", async ({ page, request }, testInfo) => {
    await page.clock.install({ time: vnTime("07:00") });
    await login(page);
    const customerName = `Khách mới ${testInfo.project.name}`;
    const { code } = await createOrderViaApi(request, `10.9.0.${testInfo.project.name === "mobile" ? 1 : 2}`, customerName);
    await expect(page.getByRole("button", { name: `Xem đơn ${code}` })).toHaveCount(0);
    await page.clock.runFor(30_000);
    await expect(page.getByRole("button", { name: `Xem đơn ${code}` })).toBeVisible();
  });
});

test.describe("editing an order", () => {
  test("admin fixes the address and items of a new order, but not of a cancelled one", async ({ page, request }, testInfo) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    const ip = `10.9.1.${testInfo.project.name === "mobile" ? 1 : 2}`;
    const { code } = await createOrderViaApi(request, ip, `Khách sửa ${testInfo.project.name}`);
    await login(page);
    await page.getByRole("button", { name: `Xem đơn ${code}` }).click();
    const dialog = page.getByRole("dialog", { name: `Đơn ${code}` });
    await expect(dialog).toContainText("99 Đường Thử, Quận 1");

    await dialog.getByRole("button", { name: "Sửa địa chỉ và món" }).click();
    await dialog.getByLabel("Địa chỉ giao").fill("12 Lê Lợi, Quận 1");
    await dialog.getByRole("button", { name: "Thêm 1 Thêm bánh" }).click();
    await expect(dialog).toContainText("60.000đ");
    await dialog.getByRole("button", { name: "Lưu thay đổi" }).click();

    await expect(dialog.getByText("Đã cập nhật")).toBeVisible();
    await expect(dialog).toContainText("12 Lê Lợi, Quận 1");
    await expect(dialog).toContainText("Thêm bánh");
    await expect(dialog).toContainText("60.000đ");
    await dialog.getByRole("button", { name: "Đóng" }).click();
    await expect(page.getByRole("button", { name: `Xem đơn ${code}` })).toBeVisible();
    const row = page.locator("tr, li").filter({ has: page.getByRole("button", { name: `Xem đơn ${code}` }) }).filter({ visible: true });
    await expect(row).toContainText("60.000đ");

    await page.getByRole("button", { name: `Xem đơn ${code}` }).click();
    await dialog.getByRole("button", { name: "Huỷ đơn" }).click();
    await dialog.getByRole("button", { name: "Xác nhận huỷ" }).click();
    await expect(dialog.getByText("Đã huỷ").first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Sửa địa chỉ và món" })).toHaveCount(0);
  });

  test("saving with no items shows an error and keeps the form open", async ({ page, request }, testInfo) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    const ip = `10.9.2.${testInfo.project.name === "mobile" ? 1 : 2}`;
    const { code } = await createOrderViaApi(request, ip, `Khách rỗng ${testInfo.project.name}`);
    await login(page);
    await page.getByRole("button", { name: `Xem đơn ${code}` }).click();
    const dialog = page.getByRole("dialog", { name: `Đơn ${code}` });
    await dialog.getByRole("button", { name: "Sửa địa chỉ và món" }).click();
    await dialog.getByRole("button", { name: "Bớt 1 Phần đặc biệt" }).click();
    await dialog.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(dialog.getByText("Chọn ít nhất 1 món")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Lưu thay đổi" })).toBeVisible();
  });
});

test.describe("order list", () => {
  test("scrolling to the end loads the next orders instead of paging", async ({ page, request }, testInfo) => {
    await page.clock.setFixedTime(vnTime("07:00"));
    // More than one API page (20); each order from its own IP so the rate limit is not hit.
    const project = testInfo.project.name === "mobile" ? 1 : 2;
    for (let i = 0; i < 21; i += 1) await createOrderViaApi(request, `10.9.5${project}.${i + 1}`, `Khách cuộn ${i + 1}`);

    await login(page);
    const { total } = (await (await page.request.get("/api/admin/orders")).json()) as { total: number };
    const status = page.getByRole("status").filter({ hasText: /đơn$/ });
    await expect(status).toHaveText(`Đang hiện 20/${total} đơn`);
    await expect(page.getByRole("navigation", { name: "Phân trang" })).toHaveCount(0);

    await expect(async () => {
      await page.mouse.wheel(0, 10_000);
      await expect(status).toHaveText(`Đã hiện hết ${total} đơn`, { timeout: 1_000 });
    }).toPass();
    await expect(page.getByRole("button", { name: /^Xem đơn / })).toHaveCount(total);
    await expect(page).toHaveURL(/\/admin\/orders$/);
  });
});

test.describe("admin access", () => {
  test("admin pages and APIs are blocked without login", async ({ page, request }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Đăng nhập quản lý đơn" })).toBeVisible();

    const response = await request.get("/api/admin/orders");
    expect(response.status()).toBe(401);
  });

  test("a wrong password is rejected", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel("Tên đăng nhập").fill("admin");
    await page.getByLabel("Mật khẩu").fill("sai-mat-khau");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Tên đăng nhập hoặc mật khẩu không đúng")).toBeVisible();
    await expect(page).toHaveURL(/\/admin$/);
  });
});
