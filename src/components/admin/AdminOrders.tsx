"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { DAY_MS, shopDateString } from "@/lib/orders/slots";
import { isOrderStatus } from "@/lib/orders/status";
import type { OrderDetail as OrderDetailData } from "@/lib/orders/types";
import { AdminHeader } from "./AdminHeader";
import { OrderCard } from "./OrderCard";
import { OrderDetail } from "./OrderDetail";
import { OrderFilters } from "./OrderFilters";
import { OrderTable } from "./OrderTable";
import { useOrders, type OrderFiltersValue } from "./use-orders";

function readFilters(params: URLSearchParams): OrderFiltersValue {
  const status = params.get("status") ?? "";
  const page = Number(params.get("page"));
  return {
    date: params.get("date") || undefined,
    status: isOrderStatus(status) ? status : undefined,
    q: params.get("q") || undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** The one filter to undo when nothing matches: search first, then status, then date. */
function emptyStateAction(filters: OrderFiltersValue): { label: string; next: OrderFiltersValue } | null {
  if (filters.q) return { label: "Xoá tìm kiếm", next: { ...filters, q: undefined, page: 1 } };
  if (filters.status) return { label: "Xem mọi trạng thái", next: { ...filters, status: undefined, page: 1 } };
  if (filters.date) return { label: "Về hôm nay", next: { ...filters, date: undefined, page: 1 } };
  return null;
}

export function AdminOrders() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = readFilters(new URLSearchParams(searchParams.toString()));
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [today] = useState(() => shopDateString(new Date()));
  const [yesterday] = useState(() => shopDateString(new Date(Date.now() - DAY_MS)));

  const goToLogin = useCallback(() => router.replace("/admin"), [router]);
  const { data, error, loading, reload, replaceItem } = useOrders(filters, goToLogin);

  function setFilters(next: OrderFiltersValue) {
    const params = new URLSearchParams();
    if (next.date) params.set("date", next.date);
    if (next.status) params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    if (next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const handleUpdated = useCallback(
    ({ code, createdAt, customerName, phone, deliverySlot, total, status }: OrderDetailData) =>
      replaceItem({ code, createdAt, customerName, phone, deliverySlot, total, status }),
    [replaceItem],
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const emptyAction = emptyStateAction(filters);

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-10 pt-6 sm:px-6">
      <AdminHeader title="Đơn hàng" />

      <div className="mt-5">
        <OrderFilters value={filters} today={today} yesterday={yesterday} onChange={setFilters} />
      </div>

      {error ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 border-l-4 border-chili bg-chili/8 px-4 py-3 text-chili">
          <span>{data ? "Không làm mới được danh sách. Đang hiện dữ liệu cũ." : error.message}</span>
          <button type="button" onClick={() => void reload()} className="min-h-11 font-semibold underline sm:min-h-9 underline-offset-4">
            Thử lại
          </button>
        </div>
      ) : null}

      <section aria-label="Danh sách đơn" aria-busy={loading} className="mt-5">
        {!data && loading ? (
          <ul aria-label="Đang tải" className="border-b border-ink/10">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 border-t border-ink/10 bg-surface px-4 py-4 sm:px-6">
                <span className="h-8 w-16 animate-pulse rounded bg-ink/10 motion-reduce:animate-none" />
                <span className="h-4 flex-1 animate-pulse rounded bg-ink/8 motion-reduce:animate-none" />
              </li>
            ))}
          </ul>
        ) : null}

        {data && data.items.length === 0 ? (
          <div className="border-y border-ink/10 bg-surface px-5 py-12 text-center">
            <p className="font-display text-2xl font-bold">Chưa có đơn nào</p>
            <p className="mt-1 text-ink/70">
              {filters.q || filters.status ? "Không có đơn khớp bộ lọc này." : "Chưa có khách đặt trong ngày này."}
            </p>
            {emptyAction ? (
              <button
                type="button"
                onClick={() => setFilters(emptyAction.next)}
                className="mt-4 min-h-11 rounded-lg sm:min-h-9 bg-ink px-5 font-semibold text-enamel hover:bg-ink/85"
              >
                {emptyAction.label}
              </button>
            ) : null}
          </div>
        ) : null}

        {data && data.items.length > 0 ? (
          <>
            <div className={`border-b border-ink/10 transition-opacity motion-reduce:transition-none ${loading ? "opacity-60" : ""}`}>
              <div className="hidden md:block">
                <OrderTable orders={data.items} onOpen={setOpenCode} />
              </div>
              <ul className="-mx-4 md:hidden">
                {data.items.map((order) => (
                  <OrderCard key={order.code} order={order} onOpen={setOpenCode} />
                ))}
              </ul>
            </div>
            <nav aria-label="Phân trang" className="mt-5 flex items-center justify-center gap-4 tabular-nums">
              <button
                type="button"
                aria-disabled={filters.page <= 1}
                onClick={() => filters.page > 1 && setFilters({ ...filters, page: filters.page - 1 })}
                aria-label="Trang trước"
                className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 rounded-lg px-3 text-xl font-semibold hover:bg-ink/6 aria-disabled:opacity-35"
              >
                ‹
              </button>
              <span role="status" className="text-ink/75">
                Trang {data.page}/{totalPages}, {data.total} đơn
              </span>
              <button
                type="button"
                aria-disabled={filters.page >= totalPages}
                onClick={() => filters.page < totalPages && setFilters({ ...filters, page: filters.page + 1 })}
                aria-label="Trang sau"
                className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 rounded-lg px-3 text-xl font-semibold hover:bg-ink/6 aria-disabled:opacity-35"
              >
                ›
              </button>
            </nav>
          </>
        ) : null}
      </section>

      {openCode ? (
        <OrderDetail key={openCode} code={openCode} onClose={() => setOpenCode(null)} onUpdated={handleUpdated} onUnauthorized={goToLogin} />
      ) : null}
    </div>
  );
}
