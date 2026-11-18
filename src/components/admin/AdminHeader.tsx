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
    <header className="flex flex-wrap items-end gap-x-4 gap-y-1 border-b-4 border-rim pb-2 sm:gap-y-2 sm:pb-3">
      <div className="w-full sm:w-auto">
        <p className="font-display text-xl font-extrabold text-rim-strong">Bumno</p>
        <h1 className="font-display text-[30px] font-extrabold uppercase leading-none">{title}</h1>
      </div>
      <nav aria-label="Trang quản lý" className="-mb-1 -ml-3 flex gap-1 sm:mb-0 sm:ml-auto">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className="inline-flex min-h-10 sm:min-h-9 items-center rounded-lg px-3 font-medium text-ink/70 hover:bg-ink/6 hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-rim aria-[current=page]:decoration-[3px] aria-[current=page]:underline-offset-8"
          >
            {label}
          </Link>
        ))}
      </nav>
      <button type="button" onClick={logout} className="-mr-3 -mb-1 ml-auto min-h-10 rounded-lg px-3 font-medium sm:m-0 sm:min-h-9 text-ink/70 hover:bg-ink/6 hover:text-ink">
        Đăng xuất
      </button>
    </header>
  );
}
