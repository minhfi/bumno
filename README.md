# Bumno — bánh ướt lòng gà

Landing page đặt đơn (không cần tài khoản, COD) + trang quản lý đơn cho 1 admin.
Next.js 16 (App Router) full-stack, Tailwind CSS v4, Prisma 7 + PostgreSQL, Zod, Vitest, Playwright.

## Yêu cầu

- Node.js 22, pnpm 8+
- PostgreSQL cài trên máy (`localhost:5432`) với 2 database:

```bash
createdb bumno
```

```bash
createdb bumno_test
```

## Cài đặt

```bash
pnpm install
```

```bash
cp .env.example .env
```

Sửa `.env`: `DATABASE_URL`, `DATABASE_URL_TEST` (user Postgres của bạn), `ADMIN_PASSWORD`, `SESSION_SECRET` (≥ 32 ký tự, ví dụ `openssl rand -hex 24`).

```bash
pnpm db:migrate
```

```bash
pnpm db:seed
```

Seed tạo ~15 đơn mẫu trong ngày (chỉ dùng cho dev, xoá toàn bộ đơn cũ trong `DATABASE_URL`).

## Chạy

```bash
pnpm dev
```

- LDP: http://localhost:3000
- Admin: http://localhost:3000/admin (mật khẩu = `ADMIN_PASSWORD`)

Production build: `pnpm build && pnpm start`.

## Kiểm thử

| Lệnh | Nội dung |
|---|---|
| `pnpm lint` / `pnpm typecheck` | ESLint, `tsc --noEmit` |
| `pnpm test:unit` | Unit test (schema, khung giờ, giá, trạng thái, mã đơn, session, rate limit, proxy) |
| `pnpm test:int` | Integration test các API trên `DATABASE_URL_TEST` (tự chạy migrate, xoá dữ liệu giữa các test) |
| `pnpm test` | Cả hai |
| `pnpm test:e2e` | Playwright (mobile + desktop) trên `DATABASE_URL_TEST`, tự bật `next dev` cổng 3200 |

Lần đầu chạy E2E: `pnpm exec playwright install chromium`.

Không chạy `test:int` và `test:e2e` cùng lúc (dùng chung `bumno_test`). Phải tắt `pnpm dev` đang chạy trước khi chạy E2E (Next.js chỉ cho 1 dev server mỗi thư mục).

E2E cố định "bây giờ" là 7:00 sáng (giờ VN) của hôm nay: phía server qua biến `BUMNO_FAKE_NOW` (bị bỏ qua khi `NODE_ENV=production`), phía trình duyệt qua `page.clock`.

## Rollback migration

Chỉ trên DB local/test: chạy `prisma/migrations/<migration>/down.sql`, rồi xoá dòng tương ứng trong `_prisma_migrations` (hướng dẫn trong file). Hoặc `pnpm exec prisma migrate reset`.

## Cấu hình nội dung

- `src/config/shop.ts`: tên quán, địa chỉ, SĐT, Zalo, giờ mở cửa, bước khung giờ, thời gian chuẩn bị.
- `src/config/menu.ts`: món và giá.
- Các chỗ cần nội dung thật được đánh dấu `TODO(nội dung)` (ảnh món đang là hình minh hoạ SVG trong `src/components/landing/Plate.tsx`).

## Ghi chú

- Rate limit (5 đơn / 10 phút / IP, 5 lần sai mật khẩu / 15 phút / IP) giữ trong bộ nhớ, chỉ đúng khi chạy 1 instance.
- Múi giờ cố định Asia/Ho_Chi_Minh (UTC+7).
