import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Sends an admin who is already signed in straight to the order list. */
async function RedirectIfSignedIn() {
  await connection();
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/admin/orders");
  return null;
}

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-12">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <p className="font-display text-3xl font-extrabold text-rim-strong">Bumno</p>
      <h1 className="mt-2 text-2xl font-semibold">Đăng nhập quản lý đơn</h1>
      <LoginForm />
    </main>
  );
}
