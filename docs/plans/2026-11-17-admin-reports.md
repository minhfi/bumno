# Admin: report dashboard (today, 7 days, 30 days, 365 days)

- **Status:** Done
- **Date:** 2026-11-17
- **Ticket:** none

### Repos

| Repo | Role | Existing / new | Base branch | Feature branch |
|---|---|---|---|---|
| `workspace/bumno-web` | FE + API (Next.js full-stack, same repo) | existing | `feature/ldp-banh-uot-long-ga` | `feature/admin-reports` |

## Goal

The shop owner (the existing admin account) wants to know how the shop is doing: revenue, number of orders, cancellations and which dishes sell best, for today and for the last 7, 30 and 365 days, compared with the period before.

## Scope

**In scope**
- New page `/admin/reports` with a "Báo cáo" link in the admin header (and "Đơn hàng" back).
- Range picker: Hôm nay / 7 ngày / 30 ngày / 365 ngày, kept in the URL (`?range=`).
- Metric tiles, a revenue bar chart, and a dish table.
- New API `GET /api/admin/reports`.
- Index on `Order.deliverySlot` (migration).
- Dev seed extended with about 13 months of orders.

**Out of scope**
- Delivery-slot distribution, returning customers, CSV/Excel export.
- Custom date ranges.
- Changing the order list page (other than sharing the header).

## Decisions (from grilling)

| Question | Decision |
|---|---|
| Q1 Users and purpose | Shop owner (existing admin) sees revenue, orders and best-selling dishes per range. |
| Q2 Metrics | Revenue, orders, average order value, cancellations / cancel rate, dish table, revenue chart. Delivery-slot distribution and returning customers later. |
| Q3 Range meaning | Rolling: today, last 7, last 30, last 365 days including today, in VN time. |
| Q4 Which date | Delivery date (`deliverySlot`). |
| Q5 What counts as revenue | Only `COMPLETED`. A secondary "đang chờ" figure sums NEW + CONFIRMED + DELIVERING. `CANCELLED` only feeds the cancel rate. |
| Q6 Compare with previous period | Yes, % on each tile against the previous period of the same length. |
| Q7 Where | New page `/admin/reports`; order page unchanged. |
| Q8 Export | No. |
| Q9 Chart | Hand-written SVG bar chart, no new dependency; hover/tap shows the value; a visually hidden table for screen readers. |
| Q10 Buckets | Today: per hour of delivery, 06:00–19:59 (14 bars). 7 / 30 days: per day. 365 days: per month (13 bars, the first is a partial month labelled with its start date, e.g. "từ 18/11/2025"). |
| Q11 Dish table | All dishes with quantity, revenue and % of revenue, sorted by revenue. Add-ons shown with a "món thêm" tag. COMPLETED orders only. Dishes no longer on the menu still show, using the stored name. |
| Q12 Computation and refresh | Aggregated in SQL on the server; new API `GET /api/admin/reports?range=today|7d|30d|365d`. Auto-refresh every 30 s only on "Hôm nay". Range kept in the URL. |
| Q13 States | Skeleton while loading; error banner with "Thử lại"; zero values with "Chưa có đơn hoàn thành trong khoảng này"; "—" instead of % when the previous period is 0. |
| Q14 Tests | Unit (range and bucket math, VN midnight / month edges), integration (API figures, 401), E2E (open, switch range, figures match, redirect when signed out), screenshots 375/1280 light/dark. |
| Q15 Branch | New branch `feature/admin-reports` from `feature/ldp-banh-uot-long-ga`. |
| Q16 Seed | Extend the dev seed to about 13 months of orders. Local DB only. |

## Design

- **UI source:** Existing components and tokens (the admin redesign).
- **Design skill:** `frontend-design-system` (reuse); audit with `web-design-guidelines`.
- **Direction / notes:** Same look as the order page. Nothing new in the palette or type.

**Palette** (existing tokens in `globals.css`, no new ones)

| Token | Role here |
|---|---|
| enamel / surface | page / panels |
| ink | text; hairlines and chart grid at low opacity |
| rim | revenue bars, active range tab, header underline |
| rim-strong | orange text (selected bar label) |
| herb | "up" change (▲ 12%) |
| chili | "down" change (▼ 8%), cancel-rate tile when it goes up |

**Type**
- **Barlow Condensed 800**: page title and the big numbers on the tiles (tabular numerals).
- **Be Vietnam Pro**: everything else.

**Layout**

Desktop (1280):
```
┌──────────────────────────────────────────────────────────────────────┐
│ Bumno  BÁO CÁO            [Đơn hàng] [Báo cáo]              Đăng xuất │
│ ═══════════════════════════════════════════════════════════════════ │
│ [Hôm nay] [7 ngày] [30 ngày] [365 ngày]       18/10 – 17/11/2026 (giao) │
│                                                                      │
│ Doanh thu        Đơn hoàn thành   TB / đơn       Tỉ lệ huỷ    Đang chờ │
│ 12.450.000đ      214              58.200đ        4,1%         3 đơn    │
│ ▲ 12% kỳ trước   ▲ 9%             ▲ 3%           ▼ 0,6 điểm   175.000đ │
│                                                                      │
│ Doanh thu theo ngày                                                  │
│  ▇ ▅ ▆ ▇ ▃ ▅ ▇ ▆ ▅ ▇ ▆ ▇ ▅ ▃ ▆ ▇ ▆ ▅ ▇ ▆ ▅ ▇ ▆ ▇ ▅ ▃ ▆ ▇ ▆ ▅           │
│  18/10                    1/11                          17/11         │
│                                                                      │
│ Món                         Số phần      Doanh thu      %            │
│ Phần đặc biệt                 140       7.000.000đ   56%  ████       │
│ Phần thường                   120       4.200.000đ   34%  ███        │
│ Thêm lòng và gà  món thêm      60         900.000đ    7%  ▌          │
│ Thêm bánh        món thêm      35         350.000đ    3%  ▏          │
└──────────────────────────────────────────────────────────────────────┘
```

Mobile (375): header with the two nav links under the title; range tabs scroll horizontally; tiles in a 2-column grid (revenue full width on top); chart scrolls horizontally inside its panel for 30 bars; dish table becomes rows of "name / quantity · revenue · %".

- Tiles are not identical shadowed cards: plain blocks separated by hairlines, the big number in the signboard font.
- Bars use `rim`; the hovered/focused bar shows a small label with the exact value and the period. Bars are focusable with arrow-key navigation inside the chart group.
- The % change is text plus ▲/▼, not color alone.

**Principles**
- One loud thing: the revenue number.
- Same header, tabs and banners as the order page so the two pages feel like one tool.
- 44px tap targets, visible focus, no animation except the existing skeleton pulse (respects reduced motion).

## Backend

### Endpoints

| Method | Path | Auth / permission | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/reports` | admin session (`isAdminRequest` + proxy) | query `range`: `today` \| `7d` \| `30d` \| `365d` (default `today`) | `200 ReportResponse` | `400 VALIDATION`, `401 UNAUTHORIZED` |

```ts
type ReportRange = "today" | "7d" | "30d" | "365d";
type ReportBucket = "hour" | "day" | "month";

type ReportSummary = {
  revenue: number;           // sum of total, COMPLETED, VND
  completedOrders: number;
  averageOrderValue: number; // revenue / completedOrders, rounded; 0 when no orders
  cancelledOrders: number;
  cancelRate: number;        // cancelled / all orders in the range, 0..1; 0 when no orders
};

type ReportResponse = {
  range: ReportRange;
  bucket: ReportBucket;
  from: string;               // ISO, inclusive (VN midnight of the first day)
  to: string;                 // ISO, exclusive (VN midnight after today)
  current: ReportSummary;
  previous: ReportSummary;    // same length, immediately before `from`
  pending: { orders: number; total: number }; // NEW + CONFIRMED + DELIVERING in the current range
  series: { start: string; revenue: number; completedOrders: number }[]; // every bucket, zeros included
  items: { productId: string; name: string; addon: boolean; quantity: number; revenue: number; share: number }[];
};
```

- All dates by `deliverySlot`, in `Asia/Ho_Chi_Minh` (fixed +07:00).
- Ranges: `today` = [today 00:00, tomorrow 00:00); `7d` / `30d` / `365d` = [today − (N−1) days 00:00, tomorrow 00:00). Orders delivered tomorrow are not counted.
- `series`: hours 06–19 for `today` (from `shop.deliveryStartMinute`/`deliveryEndMinute`); one bucket per day for 7d / 30d; one per calendar month for 365d, the first bucket starting at `from`.
- `items.name`: the stored `OrderItem.name` (latest one per `productId`); `addon` from the menu config, `false` for unknown products. `revenue` = Σ unitPrice × quantity; Σ revenue equals `current.revenue`.
- Aggregation: Prisma `groupBy`/`aggregate` for summaries, `$queryRaw` (tagged template, no string building) with `date_trunc` in the shop time zone for `series` and the item join.

### Data model & migrations

- Schema change: `@@index([deliverySlot])` on `Order`.
- Migration `prisma/migrations/<timestamp>_order_delivery_slot_index/` with `migration.sql` (`CREATE INDEX`) and `down.sql` (`DROP INDEX`), following the `init` migration's layout.
- Effect on existing data: none.

### Jobs / events

- None.

### Config / env

- None. `src/config/menu.ts` gets an optional `addon: true` on the two add-on items.

### Backward compatibility

- New endpoint only. `src/proxy.ts` matcher gains `/admin/reports/:path*`; existing routes unchanged.

## Data & API (frontend)

- Types in `src/lib/reports/types.ts`, shared by route and client.
- `use-report.ts` hook fetches via `apiRequest` (`src/lib/api-client.ts`), keeps the last data on error, polls every 30 s only when `range === "today"`, and cleans up the timer and in-flight request on change/unmount.
- Range read from and written to `?range=` with `useSearchParams` / `router.replace`; an unknown value falls back to `today`.

## UI states

- Loading: skeleton blocks for tiles, chart and table.
- Empty: tiles show 0 / "—"; chart and table replaced by "Chưa có đơn hoàn thành trong khoảng này".
- Error: banner with "Thử lại" (same as the order page); stale data kept if any.
- Success: tiles, chart, dish table.

## Files

| Repo | File | Change |
|---|---|---|
| bumno-web | `prisma/schema.prisma` | modify: `@@index([deliverySlot])` |
| bumno-web | `prisma/migrations/<ts>_order_delivery_slot_index/migration.sql`, `down.sql` | create |
| bumno-web | `prisma/seed.ts` | modify: ~13 months of orders, deterministic |
| bumno-web | `src/config/menu.ts` | modify: `addon` flag |
| bumno-web | `src/lib/reports/types.ts` | create |
| bumno-web | `src/lib/reports/range.ts` + `range.test.ts` | create: range, previous range, buckets |
| bumno-web | `src/lib/reports/schema.ts` + `schema.test.ts` | create: query schema |
| bumno-web | `src/lib/reports/service.ts` | create: `getReport(range)` |
| bumno-web | `src/app/api/admin/reports/route.ts` | create |
| bumno-web | `src/app/api/admin/reports/reports.int.test.ts` | create |
| bumno-web | `src/proxy.ts`, `src/proxy.test.ts` | modify: guard `/admin/reports` |
| bumno-web | `src/app/admin/reports/page.tsx` | create |
| bumno-web | `src/components/admin/AdminHeader.tsx` | create: header + nav, extracted from `AdminOrders` |
| bumno-web | `src/components/admin/AdminOrders.tsx` | modify: use `AdminHeader` |
| bumno-web | `src/components/admin/reports/AdminReports.tsx`, `RangeTabs.tsx`, `MetricTiles.tsx`, `RevenueChart.tsx`, `TopItems.tsx`, `use-report.ts` | create |
| bumno-web | `e2e/reports.spec.ts` | create |

## Tasks

**`workspace/bumno-web`**
- [x] 1. Branch `feature/admin-reports`; baseline run (typecheck, lint, unit, integration, build).
- [x] 2. Index migration (up / down / up on the local DB) and `addon` flag.
- [x] 3. `range.ts` + schema with unit tests (VN midnight, month edges, 365-day partial month, previous range).
- [x] 4. `getReport` + route + proxy matcher, with integration tests (figures per range, previous period, pending, cancel rate, dish totals match revenue, tomorrow's orders excluded, 400, 401).
- [x] 5. `AdminHeader` with nav; order page uses it unchanged otherwise.
- [x] 6. Reports page: range tabs, tiles, SVG chart, dish table, states, 30 s refresh on today.
- [x] 7. Seed: ~13 months of orders.
- [x] 8. E2E: open from nav, switch range, figures match orders created in the test, redirect when signed out.
- [x] 9. Visual check 375 / 1280, light / dark; `web-design-guidelines` audit.

## Acceptance criteria

- [x] A signed-in admin opens `/admin/reports` from the "Báo cáo" link in the header. A signed-out visitor is redirected to the login page; the API returns 401.
- [x] The range can be set to Hôm nay / 7 ngày / 30 ngày / 365 ngày, rolling, in VN time, by delivery date; the choice is kept in the URL.
- [x] Tiles show revenue (COMPLETED only), completed orders, average order value, cancel rate and the pending total, each with % against the previous period, "—" when the previous period is 0.
- [x] A revenue bar chart per hour / day / month by range, as in Q10.
- [x] A dish table with quantity, revenue and % of revenue; dish revenues add up to the revenue tile.
- [x] Loading, error (with retry) and empty states; "Hôm nay" refreshes every 30 s.
- [x] Works at 375px and 1280px, light and dark; the order page is unchanged.

## Test plan

| Repo | Layer | Skill / tool | Cases |
|---|---|---|---|
| FE+API | Unit | `vitest` | range bounds and buckets (VN midnight, month edges, partial first month), previous range, query schema |
| FE+API | Integration | `vitest` + test DB | `GET /api/admin/reports` per range: summary, previous, pending, cancel rate, series zero-filled, items sum = revenue, tomorrow excluded, unknown product name kept, 400 on bad range, 401 |
| FE+API | Migration | `prisma migrate` on local DB | up, `down.sql`, up again |
| FE | UI flow | Playwright (repo) | open via nav, switch range (URL updates), figures match test orders, signed-out redirect; mobile + desktop |
| FE | UI audit | `web-design-guidelines` | reports components, `AdminHeader` |
| each | Lint / typecheck / build | repo scripts | |

## Risks & open questions

- **Pending tile has no % change.** A "pending" amount for a past period is not meaningful (those orders have since completed or been cancelled), so this tile shows the order count instead of a % change. This differs slightly from the acceptance criterion "each tile with %"; the other four tiles compare.
- Cancel rate change is shown in percentage points ("▼ 0,6 điểm"), not % of a %.
- Revenue counts an order on its delivery date once it is COMPLETED, so today's figures grow during the day; yesterday's can still change if an old order is completed late.
- Chart with 30 bars at 375px scrolls horizontally inside its panel.
- E2E runs with `BUMNO_FAKE_NOW` = 07:00 VN today; test orders must use delivery slots today.

## Test results

### Baseline

Run 2026-11-17 on `feature/admin-reports` before any change (base `feature/ldp-banh-uot-long-ga` @ d929f4e):

| Layer | Result |
|---|---|
| typecheck | pass |
| lint | pass |
| unit | pass (9 files, 48 tests) |
| integration | pass (2 files, 28 tests) |
| build | not run: the user's `next dev` is running in this directory (one dev/build per directory); run in Phase 4 |

Migration `20261117100000_order_delivery_slot_index` on the local dev DB: up → `down.sql` (+ remove `_prisma_migrations` row) → up again: pass.

### Phase 4

Run 2026-11-17 on `feature/admin-reports`. No new failures compared to the baseline.

| Group | Layer | Result |
|---|---|---|
| A | typecheck / lint | pass (re-run after the audit fixes) |
| A | unit | pass: 11 files, 61 tests (baseline 48) |
| A | integration | pass: 3 files, 36 tests (baseline 28), incl. 8 new for `GET /api/admin/reports` |
| A | migration | pass: up → `down.sql` → up on the local dev DB; `migrate deploy` on the test DB |
| B | E2E (Playwright, mobile + desktop) | pass: order-flow 16/16; reports 8/8. The first run failed 2 tests on a test locator (figcaption and the hidden table's caption both matched); fixed the locator to `getByRole("figure", { name })` and re-ran: pass |
| B | `next-dev-loop` | not run; the runtime was checked by hand in the browser pane on a temporary `next dev` (no errors) plus E2E |
| B | visual 375 / 1280, light / dark | done in the browser pane against the seeded dev DB (13 months). Found the revenue number overflowing into the next tile at 1280; fixed by giving the revenue column 1.8fr on `lg` |
| C | `web-design-guidelines` | no high findings. Fixed: light-mode contrast of the range note, no opacity transition, `aria-live` on the range label, tooltip kept for a focused bar on mouse leave, `role="list"` on the mobile dish list, `&nbsp;` in "món thêm" / "n phần", `min-w-0` + smaller number under `sm` on tiles, focus ring not clipped in range tabs, empty-state title as `h2`. Accepted: bars narrower than 44 px on phones (full-height hit areas, arrow keys, the hidden table); tab order on desktop puts the nav before "Đăng xuất" while mobile shows it below |
| D | build | pass |

Notes:
- The API's 400 code is `VALIDATION`, the repo's existing error code (the plan draft said `VALIDATION_ERROR`).
- Dev seed run on the local DB with the user's OK (it wipes the dev orders as before): 15 orders today + 3,252 past orders.

## Review

`code-review` on `workspace/bumno-web`, fixed point `feature/ldp-banh-uot-long-ga`, commit 663ce77.

**Standards** (no hard violations, no bugs; all judgement calls)
1. Duplicated Code: `use-report.ts` repeats most of `use-orders.ts` (abort/401/poll plumbing), and both define a 30 s constant.
2. Primitive Obsession: `service.ts` keys statuses by `string` (`PENDING_STATUSES`, `StatusTotals`) instead of `OrderStatus`.
3. `rangeLabel` formats `dd/mm/yyyy` inline; a shared shop-date formatter would avoid another copy.
4. The reports route imports `fieldErrors` from `@/lib/orders/schema` (a generic helper living in the orders module).
5. `bucketStarts` takes an injectable `hours` parameter that only defaults are used for.
- Soft: `items` is unbounded, but it is bounded by the menu size.

**Spec** (no blocking gaps)
1. The chart's first partial-month axis label reads "từ 18/11" without the year (the tooltip and the hidden table have it); Q10's example is "từ 18/11/2025".
2. Pending tile without % change: the deviation documented under Risks.
3. Extras not in the spec: refetch on tab visibility for today, "Cao nhất" line, "n đơn huỷ" line, dimming while reloading, stale-data banner text, the "Chưa có doanh thu" title, an empty `?range=` treated as `today`.
4. Cancel-rate change shows points when the previous period had only pending orders (rate 0%).
5. Today is compared with the whole of yesterday, so early in the day it looks down (follows Q6 literally).
- Checked and not an issue: `Order.total` always equals Σ unitPrice × quantity (`pricing.ts`, create and edit), and delivery slots are always within 6:00–19:59 (`availableSlots`), so the item sum and the hour buckets are exact.

**Handled** (user's choice): fixed Spec 1 (axis label now "từ 18/11/2025") and Standards 2 (statuses typed as `OrderStatus`, the 30 s constant shared with `use-orders`) in a follow-up commit. The other items are left as they are. After the fixes: typecheck, lint, unit (61), integration (36), reports E2E (8/8) and build pass.

