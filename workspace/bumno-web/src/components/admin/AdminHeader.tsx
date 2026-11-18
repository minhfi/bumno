"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

const navLinks = [
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/reports", label: "Báo cáo" },
] as const;

/**
 * Shared admin header: brand, page title, links between admin pages and sign-out.
 * On mobile the title is visually hidden and the highlighted current tab stands in for it.
 */
export function AdminHeader({ title }: { title: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await apiRequest<void>("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin");
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center gap-x-4 border-b-4 border-rim pb-1 sm:items-end sm:gap-y-2 sm:pb-3">
      <div>
        <p className="font-display text-xl font-extrabold text-rim-strong">Bumno</p>
        <h1 className="sr-only font-display text-[30px] font-extrabold uppercase leading-none sm:not-sr-only">{title}</h1>
      </div>
      <nav aria-label="Trang quản lý" className="order-last -ml-3 flex w-full items-baseline gap-1 sm:order-none sm:ml-auto sm:w-auto">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className="inline-flex min-h-10 sm:min-h-9 items-center rounded-lg px-3 font-medium text-ink/70 hover:bg-ink/6 hover:text-ink max-sm:aria-[current=page]:font-bold max-sm:aria-[current=page]:text-rim-strong sm:aria-[current=page]:font-semibold sm:aria-[current=page]:text-ink sm:aria-[current=page]:underline sm:aria-[current=page]:decoration-rim sm:aria-[current=page]:decoration-[3px] sm:aria-[current=page]:underline-offset-8"
          >
            {label}
          </Link>
        ))}
      </nav>
      <button type="button" onClick={logout} className="-mr-3 ml-auto min-h-10 rounded-lg px-3 font-medium sm:m-0 sm:min-h-9 text-ink/70 hover:bg-ink/6 hover:text-ink">
        Đăng xuất
      </button>
    </header>
  );
}
