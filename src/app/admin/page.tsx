import Image from "next/image";
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
    <main className="grid min-h-dvh md:grid-cols-2">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="relative hidden md:block">
        <Image
          src="/images/bumno-bowls.jpg"
          alt="Những tô bánh ướt lòng gà Bumno xếp sẵn trên bàn"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white lg:p-14">
          <p className="font-display text-5xl font-extrabold uppercase leading-none lg:text-6xl">Bumno</p>
          <p className="mt-3 max-w-[28ch] text-lg text-white/90">Bánh ướt lòng gà, hấp nóng mỗi ngày.</p>
        </div>
      </div>
      <div className="flex flex-col justify-center px-5 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <p className="font-display text-3xl font-extrabold text-rim-strong">Bumno</p>
          <h1 className="mt-2 text-2xl font-semibold">Đăng nhập quản lý đơn</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
