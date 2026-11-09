"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest, isAbortError } from "@/lib/api-client";
import type { OrderListResponse, OrderStatus, OrderSummary } from "@/lib/orders/types";

export const POLL_INTERVAL_MS = 30_000;

export type OrderFiltersValue = { date?: string; status?: OrderStatus; q?: string; page: number };

type State = { data: OrderListResponse | null; error: ApiError | null; loading: boolean };

function toQuery({ date, status, q, page }: OrderFiltersValue): string {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Loads the order list for `filters` and refreshes it every 30 s while the tab is visible.
 * A failed refresh keeps the last data and only sets `error`.
 */
export function useOrders(filters: OrderFiltersValue, onUnauthorized: () => void) {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });
  const query = toQuery(filters);
  const controllerRef = useRef<AbortController | null>(null);
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  /** `background` refreshes (polling) keep `loading` false so the list does not flash. */
  const load = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!background) setState((current) => ({ ...current, loading: true }));
    try {
      const data = await apiRequest<OrderListResponse>(`/api/admin/orders${query}`, { signal: controller.signal });
      setState({ data, error: null, loading: false });
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorizedRef.current();
        return;
      }
      const apiError = error instanceof ApiError ? error : new ApiError(0, "INTERNAL", "Có lỗi xảy ra. Vui lòng thử lại.");
      setState((current) => ({ ...current, error: apiError, loading: false }));
    }
  }, [query]);

  useEffect(() => {
    // Syncing with the server is what this effect is for; the list is (re)fetched on mount and on filter change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load({ background: true });
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load({ background: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      controllerRef.current?.abort();
    };
  }, [load]);

  /** Replaces one order in the current list after a local update. */
  const replaceItem = useCallback((order: OrderSummary) => {
    setState((current) =>
      current.data
        ? { ...current, data: { ...current.data, items: current.data.items.map((item) => (item.code === order.code ? order : item)) } }
        : current,
    );
  }, []);

  return { ...state, reload: load, replaceItem };
}
