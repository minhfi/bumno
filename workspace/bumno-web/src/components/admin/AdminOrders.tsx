"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { shopDateString } from "@/lib/orders/slots";
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
  return {
    date: params.get("date") || undefined,
    status: isOrderStatus(status) ? status : undefined,
    q: params.get("q") || undefined,
  };
}

/** The one filter to undo when nothing matches: search first, then status, then date. */
function emptyStateAction(filters: OrderFiltersValue): { label: string; next: OrderFiltersValue } | null {
  if (filters.q) return { label: "Xoá tìm kiếm", next: { ...filters, q: undefined } };
  if (filters.status) return { label: "Xem mọi trạng thái", next: { ...filters, status: undefined } };
  if (filters.date) return { label: "Về hôm nay", next: { ...filters, date: undefined } };
  return null;
}

type LoadMoreProps = { shown: number; total: number; loading: boolean; onLoadMore: () => void };

/**
 * Loads the next page when the end of the list scrolls into view (a little before it, so it is usually ready), and
 * offers a button for keyboard users or when the observer is not available.
 */
function LoadMore({ shown, total, loading, onLoadMore }: LoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const hasMore = shown < total;

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
    }, { rootMargin: "0px 0px 300px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, shown]);

  // Once every order is shown there is nothing to say below the list.
  if (!hasMore && !loading) return null;

  return (
    <div ref={sentinelRef} className="mt-3 flex min-h-11 flex-col items-center justify-center gap-1 text-sm text-ink/70 tabular-nums sm:mt-5">
      <p role="status">
        {loading ? "Đang tải thêm…" : `Đang hiện ${shown}/${total} đơn`}
      </p>
      {!loading ? (
        <button type="button" onClick={onLoadMore} className="min-h-10 rounded-lg px-4 font-semibold text-ink underline underline-offset-4 hover:bg-ink/6 sm:min-h-9">
          Tải thêm
        </button>
      ) : null}
    </div>
  );
}

export function AdminOrders() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = readFilters(new URLSearchParams(searchParams.toString()));
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [today] = useState(() => shopDateString(new Date()));

  const goToLogin = useCallback(() => router.replace("/admin"), [router]);
  const { data, error, loading, loadingMore, reload, loadMore, replaceItem } = useOrders(filters, goToLogin);

  function setFilters(next: OrderFiltersValue) {
    const params = new URLSearchParams();
    if (next.date) params.set("date", next.date);
    if (next.status) params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const handleUpdated = useCallback(
    ({ code, createdAt, customerName, phone, deliverySlot, total, status }: OrderDetailData) =>
      replaceItem({ code, createdAt, customerName, phone, deliverySlot, total, status }),
    [replaceItem],
  );

  const emptyAction = emptyStateAction(filters);

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-10 pt-6 sm:px-6">
      <AdminHeader title="Đơn hàng" />

      <div className="mt-5">
        <OrderFilters value={filters} today={today} onChange={setFilters} />
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
            <LoadMore shown={data.items.length} total={data.total} loading={loadingMore} onLoadMore={() => void loadMore()} />
          </>
        ) : null}
      </section>

      {openCode ? (
        <OrderDetail key={openCode} code={openCode} onClose={() => setOpenCode(null)} onUpdated={handleUpdated} onUnauthorized={goToLogin} />
      ) : null}
    </div>
  );
}
