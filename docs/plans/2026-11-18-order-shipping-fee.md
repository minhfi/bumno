# Admin: shipping fee per order

- **Status:** Done
- **Date:** 2026-11-18
- **Ticket:** none

### Repos

| Repo | Role | Existing / new | Base branch | Feature branch |
|---|---|---|---|---|
| `workspace/bumno-web` | FE + API (Next.js full-stack, same repo) | existing | `main` | `feature/order-shipping-fee` |

## Goal

The shop sometimes charges for delivery. Let the admin enter a shipping fee on an order (default 0) so the order total and the revenue reports include it.

## Scope

**In scope**
- New `shippingFee` on orders (VND, integer, default 0).
- "Phí ship" number field in the order drawer, saved with the existing single "Lưu" (with status and internal note).
- Order total = items + shipping fee, everywhere the total is shown (list, drawer, reports).
- Reports: revenue / average / pending include the fee; the dish table shows a "Phí ship" line so it still adds up to revenue.

**Out of scope**
- Customers entering or seeing the fee (landing page, order confirmation unchanged).
- Automatic fee by distance; the "Miễn phí ship trong vòng 2 km" copy.

## Decisions

| Question | Decision |
|---|---|
| Where entered | Admin drawer only; new orders start at 0. |
| Totals | Included in the order total and in report revenue; dish revenue stays items only, plus a separate "Phí ship" line. |
| When editable | Until the order is final: NEW, CONFIRMED, DELIVERING. Locked once COMPLETED or CANCELLED. |

## Design

- **UI source:** existing components (`frontend-design-system`); audit with `web-design-guidelines`.
- Drawer form (below items), same field style as the status select:

  ```
  Trạng thái      [ Đang giao        ▾]
  Phí ship        [ 15.000         ] đ
  Ghi chú nội bộ  [                  ]
  [Lưu]
  ```
- Items block in the drawer gains a "Phí ship" line above "Tổng" (only when > 0).
- The field is a numeric text input (`inputMode="numeric"`), shows thousands separators while typing, empty = 0; disabled when the order is final.
- Reports dish table: an extra muted row "Phí ship" with its revenue and % (only when > 0).

## Backend

### Endpoints

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| PATCH | `/api/admin/orders/:code` | admin | adds optional `shippingFee: int, 0–1 000 000` (can be sent with `status` / `internalNote`, not with `address` / `items`) | `200 OrderDetail` with `shippingFee` | `400 VALIDATION`, `401`, `404`, `409 NOT_EDITABLE` when the order is COMPLETED / CANCELLED, `409 INVALID_TRANSITION` as today |
| GET | `/api/admin/orders/:code` | admin | — | `OrderDetail` gains `shippingFee: number` | as today |
| GET | `/api/admin/orders` | admin | — | unchanged shape; `total` includes the fee | as today |
| GET | `/api/admin/reports` | admin | — | `ReportResponse` gains `current.shippingTotal: number` (fees of COMPLETED orders in range) | as today |

- The fee check uses the order's status **before** the change, so DELIVERING → COMPLETED with a fee in the same save is allowed.
- Editing items recomputes `total = items + shippingFee`.

### Data model & migrations

- `Order.shippingFee Int @default(0)`.
- Migration `<ts>_order_shipping_fee`: `ALTER TABLE "Order" ADD COLUMN "shippingFee" INTEGER NOT NULL DEFAULT 0`; `down.sql` drops the column.
- Existing orders get 0; their `total` is unchanged.

### Config / env

- None.

### Backward compatibility

- Additive fields only. The public order API (`POST /api/orders`) is unchanged and creates orders with fee 0.

## Files

| File | Change |
|---|---|
| `prisma/schema.prisma`, `prisma/migrations/<ts>_order_shipping_fee/` | column + migration + down.sql |
| `src/lib/orders/schema.ts` (+ test) | `shippingFee` in `updateOrderSchema` |
| `src/lib/orders/status.ts` (+ test) | `canChangeShippingFee` |
| `src/lib/orders/types.ts`, `service.ts` | `shippingFee` in detail; totals include it; update rules |
| `src/lib/reports/types.ts`, `service.ts` | `shippingTotal` |
| `src/app/api/admin/admin.int.test.ts`, `reports/reports.int.test.ts` | new cases |
| `src/components/admin/OrderDetail.tsx` | fee field, fee line, save |
| `src/components/admin/reports/TopItems.tsx` | "Phí ship" row |
| `src/components/admin/reports/AdminReports.tsx` | pass `shippingTotal` / `revenue` to `TopItems` (added in Phase 3) |
| `src/components/admin/OrderEditForm.tsx` | "Phí ship" line and "Tổng tạm tính" = items + fee (added after review, P1, approved by the user) |
| `e2e/order-flow.spec.ts` | set a fee, see the new total in drawer and list |

## Tasks

- [x] 1. Branch from `main`; baseline (typecheck, lint, unit, integration).
- [x] 2. Migration (up / down / up on local DB).
- [x] 3. Schema + rule + service + route, with unit and integration tests (set fee, fee with status in one save, total includes fee, item edit keeps fee, 409 on final orders, 400 on negative / too large / non-integer).
- [x] 4. Reports `shippingTotal` + integration test (revenue = dish revenue + fees).
- [x] 5. Drawer field and fee line; reports "Phí ship" row.
- [x] 6. E2E; visual check 375 / 1280.
- [x] 7. Full run: typecheck, lint, unit, integration, E2E, build.

## Acceptance criteria

- [x] An admin can set the shipping fee of a NEW / CONFIRMED / DELIVERING order in the drawer and save it with the same "Lưu"; it defaults to 0.
- [x] The order total (drawer, list) is items + fee; editing items keeps the fee.
- [x] COMPLETED / CANCELLED orders cannot change the fee (field disabled; API 409 `NOT_EDITABLE`).
- [x] Reports revenue includes fees; the dish table shows a "Phí ship" line so it adds up to revenue.
- [x] Customer-facing pages are unchanged.

## Test plan

| Layer | Tool | Cases |
|---|---|---|
| Unit | vitest | schema bounds, `canChangeShippingFee` |
| Integration | vitest + test DB | PATCH cases in task 3; reports `shippingTotal` |
| Migration | prisma | up, `down.sql`, up |
| E2E | Playwright | set fee 15.000 → drawer and list total |
| Lint / typecheck / build | repo scripts | |

## Risks

- Changing the fee of an order already counted in a past report changes that report (as with any edit today).

## Test results

### Baseline

`main` @ branch point: typecheck ✅, lint ✅, unit 65/65 ✅, integration 38/38 ✅ — no baseline failures.

### Phase 4

| Layer | Result |
|---|---|
| Typecheck / lint | ✅ |
| Unit | ✅ 68/68 (+3: fee bounds, fee + address/items rejected, `canChangeShippingFee`) |
| Integration | ✅ 45/45 (+7: 6 PATCH fee cases, reports `shippingTotal`) |
| Migration | ✅ up → `down.sql` (+ `_prisma_migrations` row removed) → up on local DB; `migrate diff` DB ↔ schema: no difference |
| E2E (Playwright, mobile + desktop) | ✅ 30/30 (+2: set fee 15.000 → drawer "Phí ship 15.000đ", "Tổng 65.000đ", list row 65.000đ; field disabled once completed) |
| Visual check | ✅ drawer at 375 and 1280 (dark theme), fee typed "15000" shows "15.000 đ"; not saved to local data |
| UI audit (`web-design-guidelines`) | 0 high. Fixed: input `name`, error `role="alert"`, unit announced to screen readers ("Phí ship (đồng)"). Left (low): no hint text on the disabled field, caret jumps to end when editing mid-number, empty "Số phần" cell on the fee row |
| Build | ✅ (only the pre-existing warning about a stray `~/package-lock.json`) |
| Contract | covered by integration tests calling the route handlers (same repo) |

Notes:
- `AdminReports.tsx` got a one-line change (passes `shippingTotal` / `revenue` to `TopItems`); needed for the planned row.
- A fee sent unchanged on a final order is a no-op (200), not 409; only a real change is rejected.
- The address/items edit form still shows "Tổng tạm tính" for items only (file not in the plan); the saved total adds the fee.

## Review

Commit `1f1a033`, fixed point `main`.

**Standards** (no hard violations):
- S1 Fee max is hard-coded twice beside `MAX_SHIPPING_FEE`: the "1.000.000 đ" message in `schema.ts` and `.slice(0, 7)` in `formatFeeInput`.
- S2 (smell) Nested ternary for `total` in `service.ts`; NOT_EDITABLE rule re-derived in service + route.
- S3 (smell) Duplicated "Phí ship" row markup in `TopItems` (table + list), loose `shippingTotal` / `revenue` props.
- S4 (smell) Vague name `changed` in `OrderDetail`.

**Spec** (no defects):
- P1 `OrderEditForm` "Tổng tạm tính" shows items only while the saved total includes the fee (file outside the plan).
- P2 Unasked but sensible: fee-specific 409 message, client-side max check, 7-digit cap, same fee on a final order = 200, `AdminReports.tsx` prop pass-through.
- P3 Empty "Số phần" cell on the fee row.

**Accepted by the user:** S1, P1, S2 (nested ternary) + S4 (rename). Not changed: S3, P2, P3.
Fixed in `refactor(orders): address review of the shipping fee`; re-run after the fixes: typecheck ✅, lint ✅, unit 68/68 ✅, integration 45/45 ✅, E2E 30/30 ✅ (fee test now also checks the edit form's "Tổng tạm tính" 65.000đ → 75.000đ and fee + status in one save), build ✅.
