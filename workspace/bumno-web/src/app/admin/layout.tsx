import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý đơn — Bumno",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="theme-admin min-h-dvh bg-enamel text-ink">{children}</div>;
}
