import type { ApiErrorBody, ApiErrorCode } from "@/lib/orders/types";

const TIMEOUT_MS = 10_000;

export type ClientErrorCode = ApiErrorCode | "NETWORK" | "TIMEOUT";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ClientErrorCode,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const error = (value as { error: unknown }).error;
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
}

type RequestOptions = { method?: "GET" | "POST" | "PATCH"; body?: unknown; signal?: AbortSignal };

/** fetch wrapper: JSON in/out, the shared error shape, and a 10 s timeout. */
export async function apiRequest<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      cache: "no-store",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.aborted) throw new ApiError(0, "TIMEOUT", "Máy chủ phản hồi quá lâu. Vui lòng thử lại.");
    throw new ApiError(0, "NETWORK", "Không kết nối được. Vui lòng kiểm tra mạng và thử lại.");
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => undefined);
  if (response.ok) return data as T;
  if (isApiErrorBody(data)) {
    throw new ApiError(response.status, data.error.code, data.error.message, data.error.fields);
  }
  throw new ApiError(response.status, "INTERNAL", "Có lỗi xảy ra. Vui lòng thử lại.");
}

/** True when the request was cancelled by the caller (e.g. on unmount); such errors should be ignored. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
