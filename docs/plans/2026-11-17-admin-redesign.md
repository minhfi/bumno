# Admin redesign — bảng đơn buổi sáng

- **Status:** Done
- **Date:** 2026-11-17
- **Ticket:** none

### Repos

| Repo | Role | Existing / new | Base branch | Feature branch |
|---|---|---|---|---|
| `workspace/bumno-web` | FE (Next.js full-stack, no API change) | existing | `feature/ldp-banh-uot-long-ga` | same branch (continue) |

## Goal

The admin order screen (`/admin/orders` and the order drawer) works but looks like an unstyled default table. The shop owner opens it on a phone or laptop while cooking and delivering. They should see at a glance **what to deliver next and when**, and move an order to its next status in one tap.

## Scope

**In scope**
- `/admin/orders`: header, filters, order list (desktop table + mobile cards), empty / loading / error states, pagination.
- Order detail drawer: header, status progress, customer info, items, actions.
- Light and dark theme (admin keeps following `prefers-color-scheme`).

**Out of scope**
- The login page (just redesigned).
- Any API, data, or sort-order change. The list stays sorted by order time, newest first.
- Per-status counts (the API does not return them).
- Landing page.

## Decisions

| Question | Decision |
|---|---|
| Brand | Keep the Bumno palette and fonts from the landing page so admin and shop feel like one product. |
| What leads the screen | The **delivery time** of each order, set large, so the owner reads the list like a kitchen ticket rail. |
| Status filter | Segmented tabs instead of a `<select>`: one tap, always visible. |
| Date filter | Keep the native date input, plus "Hôm qua / Hôm nay / Ngày mai" buttons next to it (orders can now be for tomorrow). |

## Design

- **UI source:** Existing tokens + `frontend-design` direction.
- **Design skill:** `frontend-design`; audit with `web-design-guidelines`.

**Palette** (existing tokens in `globals.css`, nothing new)

| Name | Light | Dark | Role |
|---|---|---|---|
| enamel | `#f7f9fa` | `#121821` | page background |
| surface | `#ffffff` | mix of enamel/ink | list and drawer panels |
| ink | `#1a2230` | `#e6eaf0` | text, hairlines at low opacity |
| rim | `#f59e0b` | `#fbbf24` | the plate-rim orange: primary action and the "Mới" status |
| rim-strong | `#b45309` | `#fbbf24` | orange used as text |
| chili / herb | `#c8261c` / `#2f6b3a` | `#f0675c` / `#7cc48a` | cancelled / completed |

**Type**
- **Barlow Condensed 800** (the landing page's signboard font): delivery times, order codes, totals, and the page title. Tabular numerals.
- **Be Vietnam Pro 400/500/600**: everything else.
- Scale: 40 / 28 / 20 / 16 / 14.

**Layout**

Desktop:
```
┌────────────────────────────────────────────────────────────────────┐
│ Bumno  ĐƠN HÀNG                  [Hôm qua][Hôm nay][Mai] [17/11 ▾]  Đăng xuất │
│ [Tất cả][Mới][Đã xác nhận][Đang giao][Hoàn thành][Đã huỷ]   [ Tìm SĐT / mã đơn ] │
├────────┬───────────────────────────────────────────────────────────┤
│  15:00 │ BN-1016   Chị Lan · 0965 954 708      340.000đ   ● Mới   │
│ hôm nay│ đặt 14:06                                                  │
├────────┼───────────────────────────────────────────────────────────┤
│  6:30  │ BN-1017   …                                                │
│ 18/11  │                                                            │
└────────┴───────────────────────────────────────────────────────────┘
                     ‹  Trang 1/1 · 1 đơn  ›
```
- Each row is a full-width button-like ticket: the time column on the left is the one bold element (40px condensed); everything else is quiet 16px text.
- A "Mới" order gets a 4px orange rim on its left edge, the same orange as the plate rim on the landing page. That is the only accent in the list.

Mobile: same ticket, time on top-left, status top-right, name/phone/total below. Filters collapse to a horizontally scrollable tab row and a search field.

Drawer:
```
┌──────────────────────────────┐
│ BN-1016                 Đóng │
│ Nhận 15:00 hôm nay           │
│ ●──────●──────○──────○       │  Mới → Đã xác nhận → Đang giao → Hoàn thành
│ [ Xác nhận đơn ]  Huỷ đơn    │
├──────────────────────────────┤
│ Chị Lan                      │
│ 0965 954 708 (gọi)           │
│ 12 Lê Lợi, Quận 1            │
│ Ghi chú: Ít hành             │
├──────────────────────────────┤
│ Bánh ướt lòng gà ×2 . . 70.000đ │
│ Gà thêm ×1 . . . . . . 10.000đ │
│ Tổng . . . . . . . . . 80.000đ │
├──────────────────────────────┤
│ Ghi chú nội bộ [textarea]    │
└──────────────────────────────┘
```
- The status progress is a real sequence, so a 4-step track is used there (cancelled shows as a single chili line instead).
- Items reuse the dotted-leader price board from the landing menu.
- The next action sits at the top, above the info, so it is one tap away.

**Principles**
- One loud thing: the delivery time. Everything else is calm, left-aligned, sentence case.
- No identical shadowed cards, no gradient washes, no all-caps labels except the page title in the signboard font.
- Keyboard focus visible, 44px tap targets, motion only on the drawer opening (respecting reduced motion).

## UI states

- Loading: skeleton tickets with the time column shape.
- Empty: "Chưa có đơn nào cho ngày này" plus a button to jump to today, or to clear the search.
- Error: inline banner with "Thử lại" (as now), stale data kept.
- Success: list; drawer shows "Đã cập nhật" after an action (as now).

## Files

| Repo | File | Change |
|---|---|---|
| bumno-web | `src/components/admin/AdminOrders.tsx` | modify: header, layout, states |
| bumno-web | `src/components/admin/OrderFilters.tsx` | modify: date shortcuts, status tabs, search |
| bumno-web | `src/components/admin/OrderTable.tsx` | modify: ticket rows (desktop) |
| bumno-web | `src/components/admin/OrderCard.tsx` | modify: ticket card (mobile) |
| bumno-web | `src/components/admin/StatusBadge.tsx` | modify: restyle |
| bumno-web | `src/components/admin/OrderDetail.tsx` | modify: drawer layout, status track, receipt |
| bumno-web | `e2e/order-flow.spec.ts` | modify only if a label used by the tests changes |

## Tasks

**Frontend — `workspace/bumno-web`**
- [x] 1. Commit the pending content/login changes first (separate commit).
- [x] 2. Filters: date shortcuts, status tabs, search.
- [x] 3. List: ticket rows (desktop) and cards (mobile), "Mới" rim accent.
- [x] 4. States: loading skeleton, empty with action, error banner.
- [x] 5. Drawer: header, status track, actions on top, receipt, internal note.
- [x] 6. Check light + dark, mobile + desktop with screenshots.

## Acceptance criteria

- [x] All existing admin behaviour still works: filter by date, status, search, pagination, open drawer, advance status, cancel, internal note, logout, 30 s auto-refresh.
- [x] Each order shows its delivery time as the most prominent element; tomorrow's orders are marked with their date.
- [x] Status can be filtered with one tap.
- [x] Works at 375px and 1280px, light and dark.
- [x] Existing unit, integration and E2E tests pass.

## Test plan

| Repo | Layer | Skill / tool | Cases |
|---|---|---|---|
| FE | Unit / integration | `vitest` | existing suites |
| FE | UI flow | Playwright (repo) | existing `order-flow.spec.ts` |
| FE | UI audit | `web-design-guidelines` | changed admin files |
| FE | Lint / typecheck / build | repo scripts | |

## Risks & open questions

- Sorting stays "newest order first". Sorting by delivery time would match the design better but changes the API; can be a follow-up.

## Test results

### Baseline

bumno-web @ 64f0d2f: typecheck, lint, unit (41), integration (22) pass. E2E not run as baseline (dev server in use).

### Phase 4

bumno-web: typecheck, lint pass; unit 42/42 (added `slotDayLabel` test); integration 22/22; Playwright E2E 12/12 (mobile + desktop); `next build` pass. Visual check with screenshots: desktop 1280 light, mobile 375 dark, list and drawer.

### Final re-run

bumno-web @ d929f4e (includes this plan's review fixes): typecheck, lint pass; unit 48/48; integration 28/28; Playwright E2E 16/16 (8 mobile, 8 desktop); `next build` pass.

### Deviations

- Date shortcuts are "Hôm qua / Hôm nay" only: the date filter is by order date, so "Mai" would always be empty. Label renamed "Ngày đặt".
- E2E: the "Đã xác nhận" check now targets the current step of the status track (`aria-current="step"`), since the track always lists every status.
- Added `data-scroll-behavior="smooth"` on `<html>` to silence the Next.js warning from the earlier smooth-scroll change.

## Review

Run on 64f0d2f...2d7584b (Standards + Spec, parallel sub-agents). No hard Standards violations.

Fixed after review:
- Delivery time now 40px (table) / 34px (mobile card), page title reduced to 30px so the time is the loudest element.
- Tomorrow's orders are labelled with their date ("mai 18/11").
- Tab chips and "Thử lại" buttons are 44px tall.
- "Đã cập nhật" / error message moved into the drawer's sticky header so it stays visible after saving the note at the bottom.
- Customer note regained its "Ghi chú của khách" label.
- Removed `max` on the date input (future dates allowed again).
- De-duplicated row classes into `order-row.ts`, `DAY_MS` shared from `slots.ts`, `emptyStateAction` helper replaces the nested ternary.

Left as is (user decides): drawer open animation, empty-state copy, mobile ticket layout vs wireframe, tests for status tabs / date shortcuts, "(gọi)" hint on the phone, `data-scroll-behavior` in `layout.tsx` (belongs to the earlier smooth-scroll change), light/dark x 375/1280 screenshot matrix not fully covered, Safari not checked for the inset-shadow accent.
