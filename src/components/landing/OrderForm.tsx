"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatVnd, menu, type ProductId } from "@/config/menu";
import { ApiError, apiRequest } from "@/lib/api-client";
import { createOrderSchema, fieldErrors, MAX_QUANTITY, type CreateOrderInput } from "@/lib/orders/schema";
import { availableSlots, formatSlot, shopDateString } from "@/lib/orders/slots";
import type { CreateOrderResponse } from "@/lib/orders/types";
import { OrderSuccess } from "./OrderSuccess";
import { StickyOrderBar } from "./StickyOrderBar";

type Quantities = Record<ProductId, number>;
type Fields = { customerName: string; phone: string; address: string; deliverySlot: string; note: string; website: string };
type FieldName = keyof Fields | "items";

const emptyQuantities = Object.fromEntries(menu.map((item) => [item.id, 0])) as Quantities;
const emptyFields: Fields = { customerName: "", phone: "", address: "", deliverySlot: "", note: "", website: "" };
const fieldOrder: FieldName[] = ["items", "customerName", "phone", "address", "deliverySlot", "note"];

const inputClass =
  "mt-1.5 block w-full rounded-xl border-2 border-ink/20 bg-surface px-4 py-3 text-base placeholder:text-ink/65 focus:border-rim-strong focus:outline-none disabled:bg-ink/5 aria-[invalid=true]:border-chili";

/** Recomputes today's bookable slots from the browser clock every minute (null until mounted). */
function useSlots(): Date[] | null {
  const [slots, setSlots] = useState<Date[] | null>(null);
  useEffect(() => {
    const update = () => setSlots(availableSlots(new Date()));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return slots;
}

/** True while the element is on screen. */
function useOnScreen(ref: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return visible;
}

/** `8:00`, or `8:00 · ngày 18/11` when the slot is not today. */
function slotLabel(slot: Date): string {
  const date = shopDateString(slot);
  if (date === shopDateString(new Date())) return formatSlot(slot);
  const [, month, day] = date.split("-");
  return `${formatSlot(slot)} · ngày ${day}/${month}`;
}

export function OrderForm() {
  const [quantities, setQuantities] = useState<Quantities>(emptyQuantities);
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);
  const slots = useSlots();
  const sectionRef = useRef<HTMLElement>(null);
  const formOnScreen = useOnScreen(sectionRef);

  const total = menu.reduce((sum, item) => sum + item.price * quantities[item.id], 0);
  // Fields stay enabled while submitting so focus is not lost; handleSubmit ignores repeat submits.
  const disabled = slots === null;

  // A chosen slot that is no longer bookable falls back to the earliest one.
  const deliverySlot = slots?.some((slot) => slot.toISOString() === fields.deliverySlot)
    ? fields.deliverySlot
    : (slots?.[0]?.toISOString() ?? "");
  const slotExpired = slots !== null && fields.deliverySlot !== "" && deliverySlot !== fields.deliverySlot;

  useEffect(() => {
    if (result) document.getElementById("order-success-title")?.focus();
  }, [result]);

  function setField(name: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function changeQuantity(id: ProductId, delta: number) {
    if (disabled) return;
    setQuantities((current) => ({ ...current, [id]: Math.min(MAX_QUANTITY, Math.max(0, current[id] + delta)) }));
    if (errors.items) setErrors((current) => ({ ...current, items: undefined }));
  }

  function showErrors(next: Partial<Record<FieldName, string>>) {
    setErrors(next);
    const first = fieldOrder.find((name) => next[name]);
    if (first) document.getElementById(first === "items" ? "items-legend" : `order-${first}`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || disabled) return;
    setFormError(null);
    const input: CreateOrderInput = {
      ...fields,
      deliverySlot,
      note: fields.note || undefined,
      items: menu.map((item) => ({ productId: item.id, quantity: quantities[item.id] })),
    };
    const parsed = createOrderSchema.safeParse(input);
    if (!parsed.success) {
      showErrors(fieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiRequest<CreateOrderResponse>("/api/orders", { method: "POST", body: input });
      setResult(order);
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.fields).length > 0) showErrors(error.fields);
        setFormError(error.message);
      } else {
        setFormError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setQuantities(emptyQuantities);
    setFields(emptyFields);
    setErrors({});
    setFormError(null);
    setResult(null);
  }

  const errorId = (name: FieldName) => (errors[name] ? `order-${name}-error` : undefined);
  const fieldError = (name: FieldName) =>
    errors[name] ? (
      <p id={`order-${name}-error`} className="mt-1.5 text-sm font-medium text-chili">
        {errors[name]}
      </p>
    ) : null;

  return (
    <section ref={sectionRef} id="dat-hang" aria-labelledby="order-title" className="mx-auto max-w-[1120px] scroll-mt-4 px-5 py-12 sm:px-8 md:py-16">
      <h2 id="order-title" className="font-display text-[40px] font-extrabold uppercase leading-none text-rim-strong">
        Đặt hàng
      </h2>
      <p className="mt-3 max-w-[60ch] text-ink/80">
        Chọn món, điền thông tin, quán sẽ gọi xác nhận đơn và báo phí ship sau khi có địa chỉ.
      </p>

      <div className="mt-8">
        {result ? (
          <OrderSuccess order={result} onNewOrder={reset} />
        ) : (
          <form noValidate onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-start md:gap-12">
            <div className="space-y-8">
              <fieldset disabled={disabled} className="space-y-8">
                <fieldset aria-describedby={errorId("items")}>
                  <legend id="items-legend" tabIndex={-1} className="font-display text-[28px] font-bold leading-tight">
                    Chọn món
                  </legend>
                  <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                    {menu.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm tabular-nums text-ink/70">{formatVnd(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-disabled={quantities[item.id] === 0}
                            aria-label={`Bớt 1 ${item.name}`}
                            className="grid size-11 place-items-center rounded-full border-2 border-rim-strong text-xl font-semibold text-rim-strong active:bg-rim/10 disabled:border-ink/15 disabled:text-ink/30 aria-disabled:border-ink/15 aria-disabled:text-ink/30"
                          >
                            −
                          </button>
                          <output aria-label={`Số lượng ${item.name}`} className="w-9 text-center text-lg font-semibold tabular-nums">
                            {quantities[item.id]}
                          </output>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-disabled={quantities[item.id] >= MAX_QUANTITY}
                            aria-label={`Thêm 1 ${item.name}`}
                            className="grid size-11 place-items-center rounded-full bg-rim text-xl font-semibold text-on-rim active:bg-rim/85 disabled:bg-ink/15 aria-disabled:bg-ink/15"
                          >
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {fieldError("items")}
                </fieldset>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="order-customerName" className="font-semibold">Họ tên</label>
                    <input
                      id="order-customerName"
                      name="customerName"
                      autoComplete="name"
                      value={fields.customerName}
                      onChange={(e) => setField("customerName", e.target.value)}
                      aria-invalid={Boolean(errors.customerName)}
                      aria-describedby={errorId("customerName")}
                      className={inputClass}
                    />
                    {fieldError("customerName")}
                  </div>
                  <div>
                    <label htmlFor="order-phone" className="font-semibold">Số điện thoại</label>
                    <input
                      id="order-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0901 234 567"
                      value={fields.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errorId("phone")}
                      className={inputClass}
                    />
                    {fieldError("phone")}
                  </div>
                </div>

                <div>
                  <label htmlFor="order-address" className="font-semibold">Địa chỉ giao</label>
                  <input
                    id="order-address"
                    name="address"
                    autoComplete="street-address"
                    placeholder="Số nhà, đường, phường, quận"
                    value={fields.address}
                    onChange={(e) => setField("address", e.target.value)}
                    aria-invalid={Boolean(errors.address)}
                    aria-describedby={errorId("address")}
                    className={inputClass}
                  />
                  {fieldError("address")}
                </div>

                <div>
                  <label htmlFor="order-deliverySlot" className="font-semibold">Giờ nhận</label>
                  <select
                    id="order-deliverySlot"
                    name="deliverySlot"
                    value={deliverySlot}
                    onChange={(e) => setField("deliverySlot", e.target.value)}
                    aria-invalid={Boolean(errors.deliverySlot)}
                    aria-describedby={errorId("deliverySlot")}
                    className={inputClass}
                  >
                    {slots === null ? <option value="">Đang tải khung giờ…</option> : null}
                    {slots?.map((slot) => (
                      <option key={slot.toISOString()} value={slot.toISOString()}>
                        {slotLabel(slot)}{slot === slots[0] ? " · sớm nhất" : ""}
                      </option>
                    ))}
                  </select>
                  {fieldError("deliverySlot")}
                  {slotExpired && !errors.deliverySlot ? (
                    <p role="status" className="mt-1.5 text-sm font-medium text-ink/80">
                      Khung giờ bạn chọn đã qua, đã chuyển sang giờ sớm nhất.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="order-note" className="font-semibold">
                    Ghi chú <span className="font-normal text-ink/70">(không bắt buộc)</span>
                  </label>
                  <textarea
                    id="order-note"
                    name="note"
                    rows={3}
                    placeholder="Ví dụ: ít hành, gọi trước khi giao"
                    value={fields.note}
                    onChange={(e) => setField("note", e.target.value)}
                    aria-invalid={Boolean(errors.note)}
                    aria-describedby={errorId("note")}
                    className={inputClass}
                  />
                  {fieldError("note")}
                </div>

                {/* Honeypot: hidden from people and assistive tech; bots tend to fill it in. */}
                <div aria-hidden inert className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="order-website">Website</label>
                  <input
                    id="order-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={fields.website}
                    onChange={(e) => setField("website", e.target.value)}
                  />
                </div>
              </fieldset>
            </div>

            <aside aria-label="Tóm tắt đơn" className="rounded-3xl border-2 border-ink/10 bg-surface p-6 md:sticky md:top-6">
              <h3 className="font-display text-[28px] font-bold leading-tight">Đơn của bạn</h3>
              {total > 0 ? (
                <ul className="mt-3 space-y-1.5 text-[15px]">
                  {menu
                    .filter((item) => quantities[item.id] > 0)
                    .map((item) => (
                      <li key={item.id} className="flex justify-between gap-4">
                        <span>
                          {item.name} × {quantities[item.id]}
                        </span>
                        <span className="tabular-nums">{formatVnd(item.price * quantities[item.id])}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-3 text-[15px] text-ink/70">Chọn ít nhất 1 món</p>
              )}
              <p aria-live="polite" className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
                <span className="font-semibold">Tạm tính</span>
                <span className="font-display text-[28px] font-bold tabular-nums text-ink">
                  {formatVnd(total)}
                </span>
              </p>
              <p className="text-sm text-ink/70">Trả tiền mặt khi nhận hàng hoặc chuyển khoản trước.</p>
              {formError ? (
                <p role="alert" className="mt-4 rounded-xl bg-chili/10 px-4 py-3 text-[15px] font-medium text-chili">
                  {formError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={disabled}
                aria-disabled={submitting || undefined}
                className="mt-5 min-h-13 w-full rounded-full bg-rim text-lg font-semibold text-on-rim hover:bg-rim/90 active:bg-rim/85 disabled:bg-ink/25 aria-disabled:bg-rim/70"
              >
                {submitting ? "Đang gửi…" : "Đặt đơn"}
              </button>
            </aside>
          </form>
        )}
      </div>

      <StickyOrderBar total={total} hidden={formOnScreen || result !== null} />
    </section>
  );
}
