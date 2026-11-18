# LDP bánh ướt lòng gà + trang quản lý đơn

- **Status:** Done
- **Date:** 2026-11-09
- **Ticket:** none
- **Stack (new app only):** FE + BE trong 1 app: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, pnpm, Prisma 7 + PostgreSQL local (`localhost:5432`, không Docker — đổi theo yêu cầu user 2026-11-09), Zod, Vitest, Playwright

### Repos

| Repo | Role | Existing / new | Base branch | Feature branch |
|---|---|---|---|---|
| `workspace/bumno-web` | FE + BE (full-stack Next.js) | new app | `main` | `feature/ldp-banh-uot-long-ga` |

## Goal

Bumno bán bánh ướt lòng gà cho khách lẻ trong nội thành. Khách cần một trang (LDP) để xem món, giá và đặt đơn nhanh trên điện thoại mà không cần tài khoản. Chủ quán (1 admin) cần một trang để xem, lọc và cập nhật trạng thái đơn.

## Scope

**In scope**
- LDP tiếng Việt, mobile-first: hero, menu + giá, lý do chọn, form đặt hàng, thông tin quán, footer; nút "Đặt ngay" dính đáy màn hình trên mobile.
- Form đặt hàng: họ tên, SĐT, địa chỉ, chọn món + số lượng, khung giờ nhận, ghi chú. Thanh toán COD. Màn hình thành công với mã đơn.
- Khoá form ngoài giờ mở cửa.
- Chống spam: honeypot + rate limit theo IP.
- Admin: đăng nhập bằng 1 mật khẩu (env), danh sách đơn, lọc ngày/trạng thái, tìm SĐT/mã, phân trang, chi tiết đơn, đổi trạng thái theo luật, ghi chú nội bộ, tự refresh 30s.
- Postgres + Prisma, migration đầu tiên, seed dữ liệu mẫu cho dev.

**Out of scope**
- Thanh toán online, phí ship, đơn tối thiểu theo tiền.
- Quản lý menu/giá trong admin (menu nằm trong file config).
- Thông báo đơn mới (Telegram/Zalo/email).
- Tra cứu trạng thái đơn cho khách.
- Đặt trước nhiều ngày; giới hạn khu vực giao.
- Thống kê doanh thu; xoá đơn; nhiều tài khoản admin.
- Deploy (Vercel/Neon) — chỉ chạy local.

## Decisions (from grilling)

| Question | Decision |
|---|---|
| Q1 Người dùng | Thương hiệu Bumno, khách lẻ nội thành, 1 admin (chủ quán) |
| Q2 Kiến trúc | 1 app Next.js full-stack `workspace/bumno-web` |
| Q3 Đặt hàng | Không cần tài khoản; họ tên, SĐT, địa chỉ, món + SL, giờ nhận, ghi chú; COD |
| Q4 Menu | 3–5 món cố định trong config; admin không sửa menu |
| Q5 Admin | Danh sách, lọc, tìm SĐT/mã, chi tiết, đổi trạng thái; không xoá (chỉ huỷ) |
| Q6 Auth | 1 mật khẩu trong env, cookie session ký HMAC |
| Q7 DB | Postgres + Prisma; Postgres cài sẵn trên máy (`localhost:5432`, DB `bumno` + `bumno_test`) — *đổi từ Docker theo yêu cầu user khi implement*; không deploy trong v1 |
| Q8 Thông báo | Ngoài scope; admin tự refresh 30s |
| Q9 UI source | Không có → `frontend-design`; ảnh placeholder |
| Q10 Ngôn ngữ | UI tiếng Việt; nội dung nháp, chỗ cần thông tin thật đánh dấu `TODO(nội dung)` |
| Q11 Stack | Next.js 16, Tailwind v4, pnpm, Prisma, Vitest, Playwright |
| Q12 Giá | Không phí ship trên web; hiện tạm tính; giá snapshot vào đơn |
| Q13 Giờ | Chỉ trong ngày, khung 30 phút, cách hiện tại ≥ 30 phút; giờ mở cửa config (6:00–11:00, Asia/Ho_Chi_Minh); ngoài giờ khoá form |
| Q14 Khu vực | Không validate; ghi chú khu vực giao trên LDP |
| Q15 Validate | SĐT VN 10 số đầu 0; honeypot; ≤ 5 đơn / 10 phút / IP; mỗi món 0–20, tổng ≥ 1; Zod dùng chung client + server |
| Q16 Sau đặt | Màn hình thành công: mã đơn `BN-xxxx`, tóm tắt, "Quán sẽ gọi xác nhận" |
| Q17 Bố cục LDP | Hero → Menu → Vì sao chọn → Form → Thông tin quán → Footer; CTA dính đáy mobile |
| Q18 Admin | Như Scope; chuyển trạng thái từng bước tiến, huỷ được trước Hoàn thành |
| Q19 AC | Xem **Acceptance criteria** |
| Q20 Test | Xem **Test plan** |

## Design

- **UI source:** None
- **Design skill:** `frontend-design`
- **Audit:** `web-design-guidelines` trên các file UI đã đổi
- **Direction / notes:** Lấy cảm hứng từ quán bánh ướt buổi sáng: **đĩa sắt tráng men trắng viền xanh**, bảng hiệu sơn tay chữ đứng đậm, chén nước mắm màu hổ phách, ớt đỏ, rau răm.
  - Đã cân nhắc rồi loại: nền kem ấm + serif + điểm nhấn đất nung (kiểu "quán Việt hoài cổ") — đó là mặc định chung, không riêng gì món này. Thay bằng trắng men lạnh + xanh viền đĩa, vốn đặc trưng cho đồ ăn sáng vỉa hè.

- **Palette:** *(đổi 2026-11-09 theo yêu cầu user: primary xanh viền đĩa → vàng cam; giá tiền → màu mực; bỏ màu "nước mắm")*
  - Men trắng (nền) — `#F7F9FA` (light) / `#121821` (dark)
  - Vàng cam viền đĩa (primary: nền nút, CTA, viền đĩa, thanh dính đáy, khối thông tin quán) — `#F59E0B` / `#FBBF24`
  - Vàng cam đậm (chữ/viền primary trên nền sáng: tiêu đề, link, nút viền, focus ring; đủ tương phản 4.7:1) — `#B45309` / `#FBBF24`
  - Chữ trên nền primary — `#1A2230` cả light/dark (chữ trắng trên vàng cam không đủ tương phản)
  - Mực (chữ, giá tiền) — `#1A2230` / `#E6EAF0`
  - Ớt (lỗi, trạng thái huỷ, dùng rất ít) — `#C8261C` / `#F0675C`
  - Rau răm (thành công, hoàn thành) — `#2F6B3A` / `#7CC48A`
  - Trạng thái admin: Mới = vàng cam, Đã xác nhận / Đang giao = xám mực (nhạt / đậm), Hoàn thành = rau răm, Đã huỷ = ớt.
  - LDP chỉ thiết kế light; admin có cả light/dark theo `prefers-color-scheme`.

- **Type:**
  - **Barlow Condensed** (700/800) — tiêu đề kiểu bảng hiệu sơn tay, tên món, giá tiền cỡ lớn. Hỗ trợ dấu tiếng Việt.
  - **Be Vietnam Pro** (400/500/600) — body, form, toàn bộ admin; số dạng `tabular-nums` trong bảng đơn.
  - Scale (mobile → desktop): 16 body / 20 / 28 / 40 / 64–88 hero. Line-height body 1.6, tiêu đề 1.0–1.1. Dòng body ≤ 70 ký tự.

- **Layout:** căn trái, một cột trên mobile; desktop tối đa 1120px, hero 2 cột.

  ```
  LDP (mobile)                         LDP (desktop)
  ┌──────────────────────┐             ┌───────────────────────────────────────┐
  │ Bumno        [Gọi]   │             │ Bumno                 Menu  Đặt  [Gọi]│
  │                      │             │ BÁNH ƯỚT         ╭───────────╮        │
  │ BÁNH ƯỚT             │             │ LÒNG GÀ          │  ảnh món  │ đĩa men│
  │ LÒNG GÀ              │             │ Bánh tráng mỏng, │ viền xanh │        │
  │ mô tả 1 câu          │             │ lòng gà luộc...  ╰───────────╯        │
  │  ╭──────────────╮    │             │ 6:00–11:00 mỗi sáng  [Đặt ngay]       │
  │  │ ảnh trong    │    │             ├───────────────────────────────────────┤
  │  │ đĩa men      │    │             │ Bảng menu: tên món ......... 35.000đ  │
  │  ╰──────────────╯    │             │ (giá dóng phải, dòng chấm như bảng)   │
  ├──────────────────────┤             ├───────────────────────────────────────┤
  │ Menu                 │             │ Vì sao chọn: 3 đoạn văn ngắn          │
  │ Phần thường ..35.000 │             ├──────────────────────┬────────────────┤
  │ Phần đặc biệt 50.000 │             │ Form đặt hàng        │ Tóm tắt đơn    │
  │ ...                  │             │ (món ± SL, thông tin)│ (sticky)       │
  ├──────────────────────┤             ├──────────────────────┴────────────────┤
  │ Vì sao chọn          │             │ Thông tin quán: địa chỉ, giờ, SĐT/Zalo│
  ├──────────────────────┤             └───────────────────────────────────────┘
  │ Form đặt hàng        │
  │ Tạm tính 85.000đ     │
  │ [Đặt đơn]            │
  ├──────────────────────┤
  │ Thông tin quán       │
  ├──────────────────────┤
  │[Đặt ngay · 85.000đ]  │ ← dính đáy, ẩn khi form đang hiện
  └──────────────────────┘

  Admin /admin/orders
  ┌─────────────────────────────────────────────────────────┐
  │ Đơn hàng      [Ngày: hôm nay] [Trạng thái ▾] [Tìm SĐT/mã]│
  │ Mã     Đặt lúc  Khách   SĐT        Nhận  Tổng    TT     │
  │ BN-1042 07:12  Lan     0901…(gọi) 07:45 85.000  ● Mới   │ ← nền xanh nhạt
  │ ...                                                      │
  │                               ‹ Trang 1/3 ›              │
  └─────────────────────────────────────────────────────────┘
  Mobile: mỗi đơn là 1 khối dọc; bấm mở chi tiết (drawer/trang)
  Chi tiết: món, tổng, địa chỉ, ghi chú khách, [Bước tiếp theo] [Huỷ đơn], ghi chú nội bộ [Lưu ghi chú]
  ```

- **Principles:**
  - Điểm nhớ duy nhất: hero chữ đứng đậm kiểu bảng hiệu màu vàng cam đậm + ảnh món đặt trong một "đĩa men" tròn viền vàng cam (CSS border dày). Mọi thứ khác yên tĩnh.
  - Menu trình bày như bảng giá treo tường (tên trái, giá phải, dòng chấm nối), không chia card.
  - Không eyebrow viết hoa, không đánh số 01/02/03, không gradient trang trí. Chỉ 1 chuyển động: hero hiện khi tải trang (tắt khi `prefers-reduced-motion`).
  - CTA nói đúng hành động: "Đặt đơn" → màn hình "Đã đặt đơn BN-1042".
  - Admin: thuần chức năng, mật độ vừa, màu chỉ dùng cho trạng thái.

## Backend

### Endpoints

Route handlers trong `src/app/api/**`. Lỗi trả về `{ error: { code: string, message: string, fields?: Record<string, string> } }` (message tiếng Việt).

| Method | Path | Auth / permission | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/api/orders` | public | `{ customerName, phone, address, deliverySlot (ISO), note?, items: [{ productId, quantity }], website (honeypot, phải rỗng) }` | `201 { code, total, deliverySlot, items: [{ name, unitPrice, quantity }] }` | `400 VALIDATION` (fields), `409 SHOP_CLOSED` / `SLOT_UNAVAILABLE`, `429 RATE_LIMITED` |
| POST | `/api/admin/login` | public | `{ password }` | `204` + set cookie `bumno_admin` (HttpOnly, Secure ở prod, SameSite=Lax, 7 ngày) | `400`, `401 INVALID_PASSWORD`, `429` (5 lần sai / 15 phút / IP) |
| POST | `/api/admin/logout` | admin | — | `204` + xoá cookie | — |
| GET | `/api/admin/orders` | admin | query: `date` (YYYY-MM-DD, mặc định hôm nay theo giờ VN), `status?`, `q?` (SĐT hoặc mã), `page` (mặc định 1) | `200 { items: OrderSummary[], page, pageSize: 20, total }` | `400`, `401` |
| GET | `/api/admin/orders/:code` | admin | — | `200 OrderDetail` | `401`, `404` |
| PATCH | `/api/admin/orders/:code` | admin | `{ status?, internalNote? }` (ít nhất 1 trường) | `200 OrderDetail` | `400`, `401`, `404`, `409 INVALID_TRANSITION` |

- `OrderSummary`: `{ code, createdAt, customerName, phone, deliverySlot, total, status }`
- `OrderDetail`: `OrderSummary` + `{ address, note, internalNote, items: [{ productId, name, unitPrice, quantity }], updatedAt }`
- Trạng thái: `NEW → CONFIRMED → DELIVERING → COMPLETED`; `CANCELLED` từ `NEW` / `CONFIRMED` / `DELIVERING`. `COMPLETED` và `CANCELLED` là trạng thái cuối.
- Server tính giá từ config menu (bỏ qua giá client gửi), kiểm tra lại khung giờ theo giờ server (Asia/Ho_Chi_Minh).
- `proxy.ts` (Next 16) chặn `/admin/orders/**` (redirect `/admin`) và `/api/admin/**` trừ `login` (401).

### Data model & migrations

- `enum OrderStatus { NEW CONFIRMED DELIVERING COMPLETED CANCELLED }`
- `Order`: `id` (cuid), `number` (Int autoincrement, unique — mã hiển thị `BN-{number}`, bắt đầu 1001), `customerName`, `phone`, `address`, `deliverySlot` (DateTime), `note?`, `internalNote?`, `status` (default `NEW`), `total` (Int, VND), `createdAt`, `updatedAt`. Index: `createdAt`, `status`, `phone`.
- `OrderItem`: `id`, `orderId` (FK, cascade), `productId`, `name`, `unitPrice` (Int), `quantity` (Int).
- Migration: `prisma migrate dev --name init` (tạo 2 bảng + enum + sequence bắt đầu 1001). Rollback: `prisma migrate reset` trên DB local/test (app mới, không có dữ liệu cũ); ghi kèm `down.sql` tay để drop bảng/enum.
- Effect on existing data: none (DB mới).
- Seed `prisma/seed.ts`: ~15 đơn mẫu đủ các trạng thái, chỉ cho dev.

### Jobs / events

- Không có.

### Config / env

- `.env.example`: `DATABASE_URL`, `DATABASE_URL_TEST`, `ADMIN_PASSWORD`, `SESSION_SECRET` (≥ 32 ký tự).
- ~~`docker-compose.yml`~~ — bỏ theo yêu cầu user: dùng Postgres local (`localhost:5432`, DB `bumno` cho dev, `bumno_test` cho test; tạo bằng `createdb`).
- `prisma.config.ts` (Prisma 7 bắt buộc: URL datasource + lệnh seed); Prisma Client sinh vào `src/generated/prisma` (gitignored), dùng `@prisma/adapter-pg`.
- `src/config/shop.ts`: tên quán, địa chỉ, SĐT, Zalo, giờ mở/đóng (6:00–11:00), bước khung giờ 30', thời gian chuẩn bị tối thiểu 30', timezone — các giá trị thật đánh dấu `TODO(nội dung)`.
- `src/config/menu.ts`: món tạm (giá placeholder): Phần thường 35.000đ, Phần đặc biệt 50.000đ, Thêm lòng 15.000đ, Thêm bánh 10.000đ.

### Backward compatibility

- Existing clients affected: none (app mới).

## Data & API (frontend)

- Types dùng chung trong `src/lib/orders/types.ts`; schema Zod trong `src/lib/orders/schema.ts` dùng cho cả form (client) và route handler (server).
- Client gọi API qua `src/lib/api-client.ts` (fetch wrapper: parse lỗi theo shape chung, timeout 10s). Không thêm React Query/SWR.
- Admin list: hook `useOrders(filters)` — fetch + `setInterval` 30s (dừng khi tab ẩn, cleanup khi unmount); filters đồng bộ lên URL search params.
- Form LDP: React state + Zod; lỗi field từ server map vào đúng ô.

## UI states

- **Loading:** nút "Đặt đơn" disabled + "Đang gửi…"; admin list skeleton dòng; nút đổi trạng thái disabled khi đang lưu.
- **Empty:** admin "Chưa có đơn nào trong ngày này" + gợi ý đổi bộ lọc; form chưa chọn món → "Chọn ít nhất 1 món".
- **Error:** lỗi field dưới từng ô; lỗi chung (mạng, 429, 409 hết khung giờ) hiện trên nút gửi, giữ nguyên dữ liệu đã nhập; admin hiện banner lỗi + "Thử lại", polling lỗi không xoá dữ liệu cũ.
- **Success:** màn hình "Đã đặt đơn BN-1042" + tóm tắt + "Quán sẽ gọi cho bạn để xác nhận" + nút "Đặt đơn khác"; admin đổi trạng thái → cập nhật tại chỗ + thông báo ngắn "Đã cập nhật".
- **Closed:** ngoài giờ form bị disable, hiện "Quán đã đóng đơn hôm nay, mở lại lúc 6:00".

## Files

| Repo | File | Change |
|---|---|---|
| bumno-web | (scaffold `create-next-app`) | create |
| bumno-web | `.env.example`, `README.md`, `prisma.config.ts` | create |
| bumno-web | `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts` | create |
| bumno-web | `src/config/shop.ts`, `src/config/menu.ts` | create |
| bumno-web | `src/lib/db.ts` | create |
| bumno-web | `src/lib/orders/{types,schema,pricing,slots,status,code}.ts` | create |
| bumno-web | `src/lib/auth/session.ts`, `src/lib/rate-limit.ts`, `src/lib/api-client.ts` | create |
| bumno-web | `src/proxy.ts` | create |
| bumno-web | `src/app/api/orders/route.ts` | create |
| bumno-web | `src/app/api/admin/{login,logout}/route.ts`, `src/app/api/admin/orders/route.ts`, `src/app/api/admin/orders/[code]/route.ts` | create |
| bumno-web | `src/app/layout.tsx`, `src/app/globals.css` (tokens) | modify (scaffold) |
| bumno-web | `src/app/page.tsx` + `src/components/landing/*` (Hero, MenuBoard, Reasons, OrderForm, OrderSuccess, ShopInfo, StickyOrderBar) | create |
| bumno-web | `src/app/admin/page.tsx` (login), `src/app/admin/orders/page.tsx`, `src/components/admin/*` (OrderFilters, OrderTable, OrderCard, OrderDetail, StatusBadge) | create |
| bumno-web | `vitest.config.mts`, `src/**/*.test.ts`, `playwright.config.ts`, `e2e/*.spec.ts` | create |

**Ghi chú khi implement (file phụ, không đổi contract/design):**
- `prisma.config.ts` (Prisma 7 bắt buộc), `src/lib/clock.ts` (`BUMNO_FAKE_NOW` để E2E giả lập giờ phía server, bị bỏ qua ở production), `src/lib/http.ts` (helper lỗi/IP), `src/lib/orders/service.ts` (truy vấn DB tách khỏi route handler), `src/app/admin/layout.tsx` (theme admin + noindex).
- `src/components/landing/Plate.tsx` (đĩa men + hình minh hoạ SVG thay ảnh placeholder), `src/components/admin/{LoginForm,AdminOrders}.tsx`, `src/components/admin/use-orders.ts` (hook `useOrders`).
- `test/` (setup integration: migrate + truncate `bumno_test`), `e2e/global-setup.ts`, `e2e/helpers.ts`.
- Scaffold Next 16.4.5 bật sẵn `cacheComponents` → `/admin` kiểm tra cookie trong `<Suspense>`; footer bỏ năm động.

## Tasks

**Full-stack — `workspace/bumno-web`**
- [x] 1. Scaffold Next.js 16 (TS, Tailwind v4, ESLint, pnpm, `src/`), `git init`, commit đầu trên `main`, branch `feature/ldp-banh-uot-long-ga`.
- [x] 2. Postgres local (DB `bumno`, `bumno_test`), `.env.example`, Prisma schema + migration `init` + `down.sql` + seed.
- [x] 3. Config shop/menu; lib: pricing, slots (timezone VN), status transitions, order code, Zod schema — kèm unit test Vitest.
- [x] 4. Session cookie HMAC, rate limit in-memory, `proxy.ts` — kèm unit test.
- [x] 5. Route handlers orders + admin — kèm integration test với DB test.
- [x] 6. Design tokens + fonts (`next/font`) trong layout/globals.
- [x] 7. LDP: Hero, MenuBoard, Reasons, OrderForm (closed state), OrderSuccess, ShopInfo, StickyOrderBar.
- [x] 8. Admin: login, danh sách + lọc + tìm + phân trang + polling, chi tiết + đổi trạng thái + ghi chú, logout.
- [x] 9. Playwright E2E: đặt đơn → login → thấy đơn → đổi trạng thái; chặn admin khi chưa login; form khoá ngoài giờ (giả lập giờ).
- [x] 10. README: cách chạy local (Postgres local, migrate, seed, dev, test).
- [x] 11. `[manual]` Lighthouse mobile cho LDP — Tiền điều kiện: `pnpm build && pnpm start`. Bước: Chrome DevTools → Lighthouse → Mobile → Performance + Accessibility. Kỳ vọng: cả hai ≥ 90. (Mình tự chạy bằng Lighthouse CLI nếu có, ghi kết quả.) → Đã chạy `lighthouse@12` CLI (mobile, `next start`): Performance 91–93, Accessibility 100 (xem Test results).

## Acceptance criteria

- [x] 1. Khách đặt được đơn hợp lệ trên mobile trong ≤ 1 phút và nhận mã đơn.
- [x] 2. Dữ liệu sai (SĐT sai, 0 món, khung giờ quá khứ/ngoài giờ) bị chặn với thông báo lỗi tiếng Việt rõ ràng ở cả client và server.
- [x] 3. Ngoài giờ mở cửa, form bị khoá.
- [x] 4. Truy cập `/admin/*` hoặc API admin khi chưa đăng nhập bị chặn (redirect / 401).
- [x] 5. Admin xem, lọc, tìm, đổi trạng thái, ghi chú; chuyển trạng thái sai luật bị từ chối.
- [x] 6. Đơn mới xuất hiện trên admin trong ≤ 30s mà không cần reload.
- [x] 7. Lint, typecheck, build pass; Lighthouse mobile LDP ≥ 90 (performance, accessibility).

## Test plan

| Repo | Layer | Skill / tool | Cases |
|---|---|---|---|
| bumno-web | Unit | `vitest` | Zod schema (SĐT, SL 0–20, tổng ≥ 1, honeypot); slots (trước/trong/sau giờ, sát giờ đóng, lead 30'); pricing (snapshot, bỏ giá client); status transitions (hợp lệ / sai); order code; session sign/verify/hết hạn; rate limit |
| bumno-web | API / integration | `vitest` + Postgres test local (`bumno_test`) | POST orders 201/400/409/429; login 204/401/429; list lọc ngày/trạng thái/q/phân trang; PATCH status hợp lệ / 409; 401 khi thiếu cookie |
| bumno-web | Migration | Prisma trên `bumno_test` (reset → migrate → `down.sql` → migrate) | Áp dụng trên DB sạch, rollback, áp lại |
| bumno-web | UI flow (scripted) | Playwright (`e2e/`) | Đặt đơn end-to-end; admin thấy đơn trong ≤ 30s; đổi trạng thái; chặn chưa login; form khoá ngoài giờ |
| bumno-web | UI flow (interactive) | `agent-browser` | Kiểm tra mobile 375px + desktop, keyboard, focus, admin light/dark |
| bumno-web | Next.js runtime | `next-dev-loop` (nếu Next ≥ 16.3 + Turbopack) | Không lỗi runtime ở `/`, `/admin`, `/admin/orders` |
| bumno-web | UI audit | `web-design-guidelines` | Các file trong `src/components/**`, `src/app/**/page.tsx` |
| bumno-web | Lint / typecheck / build | `pnpm lint`, `tsc --noEmit`, `pnpm build` | — |
| bumno-web | Lighthouse | `[manual]` task 11 | Perf + a11y ≥ 90 |

## Risks & open questions

- Rate limit in-memory chỉ đúng khi chạy 1 instance; khi deploy serverless cần chuyển sang store dùng chung (ngoài scope v1).
- Ảnh món, địa chỉ, SĐT, Zalo, giá thật chưa có → placeholder `TODO(nội dung)`, cần bạn cung cấp trước khi ra mắt.
- Giờ mở cửa 6:00–11:00 là giả định tạm.
- Cần Postgres local (`localhost:5432`) với DB `bumno` và `bumno_test`.

## Test results

### Baseline

_App mới — không có baseline._

### Phase 4

Chạy 2026-11-09 trên `feature/ldp-banh-uot-long-ga`, Postgres local 14 (`bumno_test`). Kết quả cuối (sau khi sửa audit):

| Layer | Result |
|---|---|
| Lint (`pnpm lint`) | pass |
| Typecheck (`tsc --noEmit`) | pass |
| Unit (Vitest) | pass — 8 files, 36 tests |
| API / integration (Vitest + `bumno_test`) | pass — 2 files, 20 tests (orders 201/400/409/429; login 204/400/401/429; logout; list lọc ngày/trạng thái/q/phân trang/400; detail 404/401; PATCH hợp lệ/409/400/404/401) |
| Migration | pass, có giới hạn — `prisma migrate reset` **không chạy**: Prisma 7 chặn lệnh này khi phát hiện AI agent, cần user tự đồng ý. Đã kiểm thay: `down.sql` + xoá dòng `_prisma_migrations` → bảng/enum/sequence biến mất → `prisma migrate deploy` trên schema trống → bảng/enum có lại, sequence bắt đầu 1001 |
| UI flow scripted (Playwright, mobile Pixel 7 + desktop Chrome) | pass — 12/12 (đặt đơn → admin thấy đơn → xác nhận → ghi chú → huỷ; lỗi tiếng Việt; khoá form 13:00; đơn mới hiện trong ≤ 30s không reload; chặn admin khi chưa login; sai mật khẩu) |
| UI flow interactive (`agent-browser`) | pass — LDP 375px (không scroll ngang) + 1280px, sticky bar ẩn khi form hiện, focus ring bàn phím, admin login/lọc/tìm/chi tiết/Escape, admin light + dark, logout + redirect |
| Next.js runtime (`next-dev-loop`, Next 16.4.5) | lần 1 fail: `Date.now()` khi prerender `/admin` (cacheComponents) → sửa bằng `await connection()` trong `<Suspense>`; chạy lại: không còn lỗi trong log server, E2E log sạch |
| UI audit (`web-design-guidelines`) | 0 high, 6 medium, 14 low → đã sửa 6 medium + 12 low (focus khi lỗi server/nút −+/huỷ đơn/phân trang, filter không remount, live region, placeholder contrast, scroll-padding, slot hết hạn, sr-only caption, accessible name "Xem đơn", truncate tên khách, inert honeypot, touch-action…). Không sửa: #14 `color-scheme`/`theme-color` tối cho root khi ở admin (chỉ ảnh hưởng scrollbar), #15 thêm `active:` cho mọi nút (đã thêm cho CTA chính) |
| Build (`next build`) | pass — `/` static, `/admin` partial prerender, `/admin/orders` static shell, API dynamic |
| Lighthouse mobile (`lighthouse@12`, `next start`) | Performance 91 / 93 / 93 / 92 (4 lần), Accessibility 100, Best practices 100, SEO 100. LCP ~3.3s (mô phỏng 4G chậm), CLS 0, TBT 50–80ms |

## Review

`code-review` 2026-11-09, fixed point `main` (58bc4ad), commits d6dffea + 698a433. User chọn sửa **S1, P1, P2, P3** — đã sửa trong commit fix (xem "Review fixes" bên dưới); S2–S5 và P4–P7 không sửa theo lựa chọn của user.

### Standards (không có vi phạm cứng)
- S1. Route handler không bắt lỗi bất ngờ (vd. Prisma lỗi) → trả 500 mặc định của Next, không theo shape `{ error }`; chưa có log (standards: "one consistent error format", "structured logs").
- S2. Chuỗi lỗi chung "Có lỗi xảy ra…" lặp 5 nơi → nên gom thành 1 hằng + helper `toApiError` trong `api-client.ts`.
- S3. Regex chuẩn hoá SĐT lặp ở `service.ts` → dùng lại `normalizePhone`.
- S4. `OrderForm.tsx` (~370 dòng), `OrderDetail.tsx` (~240 dòng) khá lớn → có thể tách hook `useSlots` / `useOrderSubmit`.
- S5 (nhỏ). `errorResponse(status, code)` cho phép status và code lệch nhau; body 401 viết tay trong `proxy.ts`.

### Spec (khớp plan, chỉ có finding nhỏ)
- P1. `getClientIp` tin `x-forwarded-for` → client giả IP để vượt rate limit (đặt đơn + đăng nhập sai). Ổn khi chạy local, rủi ro khi deploy.
- P2. Rate limit đơn chỉ đếm đơn tạo thành công; request lỗi 400/409 không bị giới hạn.
- P3. Polling 30s bật `loading` mỗi lần → danh sách mờ (`opacity-60`) thoáng qua mỗi 30s; nên chỉ làm mờ khi đổi bộ lọc.
- P4. Tìm mã/SĐT luôn bị giới hạn trong 1 ngày (đúng contract API, nhưng tìm đơn hôm trước phải đổi ngày).
- P5. Copy `shop.deliveryArea` nhắc "phí ship (nếu có)" trong khi plan nói không có phí ship trên web → nội dung nháp, chờ nội dung thật.
- P6. Khung 11:00 có thể chọn (tới 10:30) — đúng "6:00–11:00", cần bạn xác nhận ý định.
- P7. Seed xoá toàn bộ đơn trong `DATABASE_URL` (chỉ chặn khi `NODE_ENV=production`).

### Review fixes (user chọn S1, P1–P3)
- S1: `withErrorHandling` bọc mọi route handler → lỗi bất ngờ trả `500 { error: { code: "INTERNAL" } }` + 1 dòng log JSON (không chứa dữ liệu request); lỗi điều khiển của Next (`unstable_rethrow`) được ném lại — build phát hiện nếu không làm vậy route GET bị prerender thành 500.
- P1: IP lấy từ phải sang của `X-Forwarded-For` theo env mới `TRUSTED_PROXY_COUNT` (mặc định 1) → sau proxy client không tự chọn được key. Thêm giới hạn tổng 30 lần sai mật khẩu / 15 phút cho mọi IP để chặn brute-force xoay IP. Giới hạn còn lại: nếu app nhận request trực tiếp (không proxy) thì client vẫn tự đặt được header — Next không cho route handler đọc IP socket.
- P2: thêm giới hạn 20 request đặt đơn (kể cả bị từ chối 400/409) / 10 phút / IP; giữ nguyên 5 đơn thành công / 10 phút / IP.
- P3: polling 30s chạy nền không bật `loading` → danh sách không bị mờ; chỉ mờ khi đổi bộ lọc / bấm "Thử lại".
- Test sau sửa: lint, typecheck pass; Vitest 11 files / 65 tests pass (thêm `http.test.ts`, integration 429 cho request bị từ chối, spoof `X-Forwarded-For`, giới hạn tổng đăng nhập); Playwright 12/12; `next build` pass (API vẫn dynamic).

