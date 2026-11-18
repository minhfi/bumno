"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

const navLinks = [
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/reports", label: "Báo cáo" },
] as const;

/** Shared admin header: brand, page title, links between admin pages and sign-out. */
export function AdminHeader({ title }: { title: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await apiRequest<void>("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin");
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b-4 border-rim pb-3">
      <div>
        <p className="font-display text-xl font-extrabold text-rim-strong">Bumno</p>
        <h1 className="font-display text-[30px] font-extrabold uppercase leading-none">{title}</h1>
      </div>
      <nav aria-label="Trang quản lý" className="order-last -mb-1 flex w-full gap-1 sm:order-none sm:mb-0 sm:ml-auto sm:w-auto">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-lg px-3 font-medium text-ink/70 hover:bg-ink/6 hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-rim aria-[current=page]:decoration-[3px] aria-[current=page]:underline-offset-8"
          >
            {label}
          </Link>
        ))}
      </nav>
      <button type="button" onClick={logout} className="min-h-11 sm:min-h-9 rounded-lg px-3 font-medium text-ink/70 hover:bg-ink/6 hover:text-ink">
        Đăng xuất
      </button>
    </header>
  );
}
