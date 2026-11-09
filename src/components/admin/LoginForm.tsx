"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<void>("/api/admin/login", { method: "POST", body: { password } });
      router.replace("/admin/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="admin-password" className="font-medium">
          Mật khẩu
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "admin-password-error" : undefined}
          className="mt-1.5 block w-full rounded-lg border border-ink/25 bg-surface px-3 py-2.5 focus:border-rim-strong focus:outline-none"
        />
        {error ? (
          <p id="admin-password-error" role="alert" className="mt-1.5 text-sm font-medium text-chili">
            {error}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="min-h-11 w-full rounded-lg bg-rim font-semibold text-on-rim hover:bg-rim/90 disabled:opacity-60"
      >
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
