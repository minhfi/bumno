"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest, isAbortError } from "@/lib/api-client";
import type { ReportRange, ReportResponse } from "@/lib/reports/types";

export const REPORT_POLL_INTERVAL_MS = 30_000;

type State = { data: ReportResponse | null; error: ApiError | null; loading: boolean };

/**
 * Loads the report for `range`. Only "today" refreshes every 30 s (and when the tab becomes visible again), since
 * the other ranges barely move during a session. A failed load keeps the last data and only sets `error`.
 */
export function useReport(range: ReportRange, onUnauthorized: () => void) {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });
  const controllerRef = useRef<AbortController | null>(null);
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  /** `background` refreshes (polling) keep `loading` false so the figures do not flash. */
  const load = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (!background) setState((current) => ({ ...current, error: null, loading: true }));
      try {
        const data = await apiRequest<ReportResponse>(`/api/admin/reports?range=${range}`, { signal: controller.signal });
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
    },
    [range],
  );

  useEffect(() => {
    // Syncing with the server is what this effect is for; the report is (re)fetched on mount and on range change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    if (range !== "today") {
      return () => controllerRef.current?.abort();
    }
    const refresh = () => {
      if (document.visibilityState === "visible") void load({ background: true });
    };
    const timer = window.setInterval(refresh, REPORT_POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      controllerRef.current?.abort();
    };
  }, [load, range]);

  /** Data for another range (still shown while the new one loads) is not returned. */
  const data = state.data?.range === range ? state.data : null;
  return { data, error: state.error, loading: state.loading, reload: load };
}
