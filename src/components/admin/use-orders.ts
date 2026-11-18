"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest, isAbortError } from "@/lib/api-client";
import type { OrderListResponse, OrderStatus, OrderSummary } from "@/lib/orders/types";

export const POLL_INTERVAL_MS = 30_000;

export type OrderFiltersValue = { date?: string; status?: OrderStatus; q?: string };

/** The orders loaded so far: `pages` pages of the API's list, newest first. */
export type OrderList = { items: OrderSummary[]; total: number; pages: number };

type State = { data: OrderList | null; error: ApiError | null; loading: boolean; loadingMore: boolean };

function toQuery({ date, status, q }: OrderFiltersValue, page: number): string {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Joins pages in order; an order that moved to a later page while loading (new orders push it down) is kept once. */
export function mergePages(pages: OrderSummary[][]): OrderSummary[] {
  const seen = new Set<string>();
  return pages.flat().filter((order) => {
    if (seen.has(order.code)) return false;
    seen.add(order.code);
    return true;
  });
}

function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, "INTERNAL", "Có lỗi xảy ra. Vui lòng thử lại.");
}

/**
 * Loads the order list for `filters` one page at a time (`loadMore` appends the next page) and refreshes every page
 * loaded so far every 30 s while the tab is visible. A failed refresh keeps the last data and only sets `error`.
 */
export function useOrders(filters: OrderFiltersValue, onUnauthorized: () => void) {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true, loadingMore: false });
  const { date, status, q } = filters;
  const controllerRef = useRef<AbortController | null>(null);
  const moreControllerRef = useRef<AbortController | null>(null);
  const pagesRef = useRef(1);
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const fetchPage = useCallback(
    (page: number, signal: AbortSignal) =>
      apiRequest<OrderListResponse>(`/api/admin/orders${toQuery({ date, status, q }, page)}`, { signal }),
    [date, status, q],
  );

  /**
   * Loads pages 1..`pages` again. A filter change starts over at one page; `background` refreshes (polling) keep
   * `loading` false and the pages already loaded, so the list does not flash or shrink.
   */
  const load = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const pages = background ? pagesRef.current : 1;
      if (!background) {
        moreControllerRef.current?.abort();
        pagesRef.current = 1;
        setState((current) => ({ ...current, loading: true, loadingMore: false }));
      }
      try {
        const responses = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1, controller.signal)));
        const total = responses[0].total;
        setState((current) => {
          const items = mergePages(responses.map((response) => response.items));
          // A page appended while this refresh was running stays until the next refresh covers it.
          const extra = background && current.data && current.data.pages > pages ? current.data.items : [];
          return {
            ...current,
            data: { items: mergePages([items, extra]), total, pages: extra.length > 0 && current.data ? current.data.pages : pages },
            error: null,
            loading: false,
          };
        });
      } catch (error) {
        if (isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorizedRef.current();
          return;
        }
        setState((current) => ({ ...current, error: toApiError(error), loading: false }));
      }
    },
    [fetchPage],
  );

  /** Appends the next page; does nothing while one is loading or when every order is shown. */
  const loadMore = useCallback(async () => {
    const data = state.data;
    if (!data || state.loading || state.loadingMore || data.items.length >= data.total) return;
    const page = data.pages + 1;
    const controller = new AbortController();
    moreControllerRef.current = controller;
    setState((current) => ({ ...current, loadingMore: true }));
    try {
      const response = await fetchPage(page, controller.signal);
      pagesRef.current = page;
      setState((current) => ({
        ...current,
        data: current.data
          ? { items: mergePages([current.data.items, response.items]), total: response.total, pages: page }
          : current.data,
        error: null,
        loadingMore: false,
      }));
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorizedRef.current();
        return;
      }
      setState((current) => ({ ...current, error: toApiError(error), loadingMore: false }));
    }
  }, [fetchPage, state.data, state.loading, state.loadingMore]);

  useEffect(() => {
    // Syncing with the server is what this effect is for; the list is (re)fetched on mount and on filter change.
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load({ background: true });
    };
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      controllerRef.current?.abort();
      moreControllerRef.current?.abort();
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

  return { ...state, reload: load, loadMore, replaceItem };
}
