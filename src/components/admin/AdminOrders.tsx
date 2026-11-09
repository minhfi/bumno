"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { shopDateString } from "@/lib/orders/slots";
import { isOrderStatus } from "@/lib/orders/status";
import type { OrderDetail as OrderDetailData } from "@/lib/orders/types";
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

export function AdminOrders() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = readFilters(new URLSearchParams(searchParams.toString()));
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [today] = useState(() => shopDateString(new Date()));

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

  async function logout() {
    await apiRequest<void>("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin");
    router.refresh();
  }

  const handleUpdated = useCallback(
    ({ code, createdAt, customerName, phone, deliverySlot, total, status }: OrderDetailData) =>
      replaceItem({ code, createdAt, customerName, phone, deliverySlot, total, status }),
    [replaceItem],
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Đơn hàng</h1>
        <button type="button" onClick={logout} className="min-h-11 rounded-lg px-3 font-medium text-ink/75 hover:bg-ink/8">
          Đăng xuất
        </button>
      </header>

      <div className="mt-5">
        <OrderFilters value={filters} today={today} onChange={setFilters} />
      </div>

      {error ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-chili/10 px-4 py-3 text-chili">
          <span>{data ? "Không làm mới được danh sách. Đang hiện dữ liệu cũ." : error.message}</span>
          <button type="button" onClick={() => void reload()} className="font-semibold underline">
            Thử lại
          </button>
        </div>
      ) : null}

      <section aria-label="Danh sách đơn" aria-busy={loading} className="mt-5">
        {!data && loading ? (
          <ul aria-label="Đang tải" className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="h-11 animate-pulse rounded-lg bg-ink/8 motion-reduce:animate-none" />
            ))}
          </ul>
        ) : null}

        {data && data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/25 px-5 py-10 text-center">
            <p className="font-medium">Chưa có đơn nào trong ngày này</p>
            <p className="mt-1 text-sm text-ink/70">Thử đổi ngày, trạng thái hoặc từ khoá tìm kiếm.</p>
          </div>
        ) : null}

        {data && data.items.length > 0 ? (
          <>
            <div className={`transition-opacity motion-reduce:transition-none ${loading ? "opacity-60" : ""}`}>
              <div className="hidden md:block">
                <OrderTable orders={data.items} onOpen={setOpenCode} />
              </div>
              <ul className="space-y-3 md:hidden">
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
                className="min-h-11 min-w-11 rounded-lg px-3 font-semibold aria-disabled:opacity-40"
              >
                ‹
              </button>
              <span role="status">
                Trang {data.page}/{totalPages} · {data.total} đơn
              </span>
              <button
                type="button"
                aria-disabled={filters.page >= totalPages}
                onClick={() => filters.page < totalPages && setFilters({ ...filters, page: filters.page + 1 })}
                aria-label="Trang sau"
                className="min-h-11 min-w-11 rounded-lg px-3 font-semibold aria-disabled:opacity-40"
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
