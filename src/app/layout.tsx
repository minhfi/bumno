import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Be_Vietnam_Pro } from "next/font/google";
import { shop } from "@/config/shop";
import "./globals.css";

const sign = Barlow_Condensed({
  variable: "--font-sign",
  weight: ["700", "800"],
  subsets: ["latin", "vietnamese"],
});

const body = Be_Vietnam_Pro({
  variable: "--font-body",
  weight: ["400", "500", "600"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: `${shop.name} — Bánh ướt lòng gà giao tận nơi`,
  description: "Bánh ướt lòng gà nóng mỗi sáng. Đặt đơn nhanh, trả tiền khi nhận hàng.",
};

export const viewport: Viewport = {
  themeColor: "#f7f9fa",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sign.variable} ${body.variable} antialiased`}>
      <body className="min-h-dvh font-sans text-base leading-relaxed">{children}</body>
    </html>
  );
}
