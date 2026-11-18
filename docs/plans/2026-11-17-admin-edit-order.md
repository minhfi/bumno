# Admin: edit address and items of an order

- **Status:** Done
- **Date:** 2026-11-17
- **Ticket:** none

### Repos

| Repo | Role | Existing / new | Base branch | Feature branch |
|---|---|---|---|---|
| `workspace/bumno-web` | FE + API (Next.js full-stack, same repo) | existing | `feature/ldp-banh-uot-long-ga` | same branch (continue) |

## Goal

Today an admin can only change an order's status, cancel it, or add an internal note. When a customer changes their address or adds/removes dishes (usually when the shop calls to confirm), the shop has to cancel and ask the customer to order again. Let the shop fix the **address** and the **items** of an order directly.

## Scope

**In scope**
- Edit `address` and `items` (quantities, add a menu item, remove an item) from the order drawer.
- Server recomputes `total`.
- Only for orders in status **NEW** or **CONFIRMED**.

**Out of scope**
- Editing customer name, phone, delivery slot, or the customer's own note.
- An audit trail / edit history (decided: no).
- Notifying the customer.
- Editing orders in DELIVERING, COMPLETED, CANCELLED.

## Decisions (from grilling)

| Question | Decision |
|---|---|
| Which statuses are editable | NEW and CONFIRMED only |
| Pricing on edit | Lines already in the order keep their original unit price; a newly added item uses the current menu price; `total` is recomputed on the server |
| History | None; only the new values are stored |
| Legacy products (an id no longer on the menu, e.g. from old data) | Allowed to stay, change quantity or be removed, but cannot be newly added |

## Design

- **UI source:** Existing components and tokens (`frontend-design-system`); audit with `web-design-guidelines`.

Drawer, for an editable order, gets an "Sửa đơn" button next to the customer block; it swaps the address and items sections into edit mode:

```
┌──────────────────────────────┐
│ BN-1016              Đóng    │
│ …status track, actions…      │
├──────────────────────────────┤
│ Khách: q234  0965 954 708    │
│ Địa chỉ                      │
│ [ 12 Lê Lợi, Quận 1       ]  │   (textarea, 5–300 chars)
├──────────────────────────────┤
│ Món                          │
│ Bánh ướt lòng gà   [−] 2 [+] │
│ Bánh ướt đùi gà    [−] 0 [+] │
│ Bánh thêm          [−] 1 [+] │
│ Gà thêm            [−] 0 [+] │
│ Tổng (tạm tính)    70.000đ   │
│ [ Lưu thay đổi ]   Bỏ qua    │
└──────────────────────────────┘
```

- Same steppers, 44px targets and token colors as the landing order form; no new palette or fonts.
- The total shown while editing is an estimate (lines keep their old price); the saved total comes from the server.
- Not editable orders show no "Sửa đơn" button.

## Backend

### Endpoints

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| PATCH | `/api/admin/orders/:code` (extend existing) | admin session | any of `status`, `internalNote`, **`address`** (trimmed, 5–300), **`items`**: `[{productId, quantity}]` (quantity 0–20, no duplicate ids, at least one > 0) | updated `OrderDetail` (as now) | `400 VALIDATION` (with `fields`), `401`, `404`, `409 INVALID_TRANSITION` (existing), **`409 NOT_EDITABLE`** when address/items are sent for a status other than NEW/CONFIRMED |

- Rules: `address`/`items` may be combined with `internalNote` in one request, but not with `status` (keeps one concern per request).
- A line that is in the order keeps its stored `name` and `unitPrice`; a new line is priced from the menu; lines with quantity 0 are removed. The whole update runs in one transaction with the same status guard as today (the update fails if the status changed meanwhile).

### Data model & migrations

- None. `OrderItem` rows are replaced inside the transaction (delete + create); `Order.total` and `Order.address` are updated.

### Config / env

- None.

### Backward compatibility

- Existing PATCH callers (status, internalNote) unchanged. New error code `NOT_EDITABLE` added to `ApiErrorCode`.

## Data & API (frontend)

- Extend `updateOrderSchema`; add `NOT_EDITABLE` to `ApiErrorCode`; the drawer calls the existing `apiRequest` PATCH and refreshes the list row via `onUpdated` (summary has no address/items, only `total` changes).

## UI states

- Loading: button shows "Đang lưu…".
- Error: inline message in the drawer's sticky feedback area (e.g. "Đơn đã chuyển sang Đang giao, không sửa được nữa."); form stays open with typed values.
- Empty: saving with every quantity 0 is blocked with "Chọn ít nhất 1 món".
- Success: "Đã cập nhật", edit mode closes, address, items and total refresh.

## Files

| Repo | File | Change |
|---|---|---|
| bumno-web | `src/lib/orders/schema.ts` | modify: extend `updateOrderSchema` |
| bumno-web | `src/lib/orders/types.ts` | modify: `NOT_EDITABLE` code |
| bumno-web | `src/lib/orders/pricing.ts` | modify: `repriceOrder(existingLines, requestedItems)` |
| bumno-web | `src/lib/orders/status.ts` | modify: `canEdit(status)` |
| bumno-web | `src/lib/orders/service.ts` | modify: `updateOrder` handles address/items |
| bumno-web | `src/app/api/admin/orders/[code]/route.ts` | modify: map `NOT_EDITABLE` to 409 |
| bumno-web | `src/components/admin/OrderDetail.tsx` | modify: edit mode |
| bumno-web | `src/components/admin/OrderEditForm.tsx` | create: address + steppers form |
| bumno-web | tests: `pricing.test.ts`, `schema.test.ts`, `status.test.ts`, `admin.int.test.ts`, `e2e/order-flow.spec.ts` | modify |

## Tasks

- [x] 1. Baseline run (typecheck, lint, unit, integration, build).
- [x] 2. Schema + types + `canEdit` + `repriceOrder` with unit tests.
- [x] 3. `updateOrder` + route changes with integration tests (success, keeps old price, new item at menu price, removes line, legacy id kept, NOT_EDITABLE for DELIVERING/COMPLETED/CANCELLED, address+status combo rejected, empty items rejected).
- [x] 4. `OrderEditForm` + drawer edit mode.
- [x] 5. E2E: edit address and items of a NEW order, total updates; button absent for a cancelled order.
- [x] 6. Visual check (light/dark, 375/1280), `web-design-guidelines` audit.

## Acceptance criteria

- [x] An admin can change the address and the items of a NEW or CONFIRMED order and see the new address, items and total right away; the list row total updates too.
- [x] Items already in the order keep their original price; a newly added item uses the current menu price; total is computed on the server.
- [x] Orders in DELIVERING, COMPLETED or CANCELLED cannot be edited (no button; API returns 409 `NOT_EDITABLE`).
- [x] An order cannot be saved with no items or with an address shorter than 5 characters.
- [x] Existing status, cancel and internal-note flows still work.

## Test plan

| Layer | Tool | Cases |
|---|---|---|
| Unit | `vitest` | `repriceOrder` (keep price, new item, zero removal, legacy id), schema, `canEdit` |
| Integration | `vitest` + test DB | PATCH cases listed in task 3 |
| UI flow | Playwright (repo) | edit flow, button absent when not editable |
| UI audit | `web-design-guidelines` | `OrderEditForm`, `OrderDetail` |
| each | lint / typecheck / build | repo scripts |

## Risks & open questions

- Two admins editing the same order at once: the last write wins on address; items are replaced wholesale. Acceptable for a single-shop tool; the status guard prevents editing an order that just moved to DELIVERING.
- A customer-facing confirmation (SMS/Zalo) is out of scope, so the shop must tell the customer the new total by phone.

## Test results

### Baseline

bumno-web @ 0858791: typecheck, lint, unit (42), integration (22) pass.

### Phase 4

bumno-web: typecheck, lint pass; unit 48/48 (new: `repriceOrder`, `updateOrderSchema`, `canEdit`); integration 28/28 (6 new PATCH edit cases); Playwright E2E 16/16 (mobile + desktop; 2 new edit tests); `next build` pass. Visual check: desktop light and mobile dark (edit form).

`web-design-guidelines` audit run on `OrderEditForm` and `OrderDetail` after review; fixed: textarea focus ring, qty buttons/glyphs and live regions, loading status role, `scroll-pt` under the sticky header, hover and disabled contrast. Left: unsaved-changes warning on "Bỏ qua", `maxLength` counter.

### Final re-run

bumno-web @ d929f4e (after review fixes): typecheck, lint pass; unit 48/48; integration 28/28; Playwright E2E 16/16 (8 mobile, 8 desktop); `next build` pass.

### Deviations

- The edit form shows name and phone read-only and hides the customer's own note while editing (kept simple).

## Review

Run on 0858791...c6c986d (Standards + Spec). No hard Standards violations.

Fixed after review:
- Focus moves into the address field when edit mode opens, and back to the drawer title after saving; the items legend no longer hides its focus ring.
- Lost race: the error now reports the order's current status, and the drawer reloads the order and leaves edit mode after `NOT_EDITABLE` / `INVALID_TRANSITION`.
- `MAX_ADDRESS_LENGTH` and `MAX_ORDER_LINES` constants replace repeated literals; `UpdateOrderData` sits next to `updateOrderSchema`.
- E2E now checks the total on the list row itself.
- Audit fixes listed under Phase 4.

Left as is (user decides): merge the duplicated customer/total blocks of `OrderEditForm` and `OrderDetail`, move the "which price applies" logic out of the form's `startRows`, button label "Sửa địa chỉ và món" vs the plan's "Sửa đơn", 409 message wording, `createOrderSchema` helper refactor kept.
