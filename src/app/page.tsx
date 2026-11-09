import { Hero } from "@/components/landing/Hero";
import { MenuBoard } from "@/components/landing/MenuBoard";
import { OrderForm } from "@/components/landing/OrderForm";
import { Reasons } from "@/components/landing/Reasons";
import { ShopInfo } from "@/components/landing/ShopInfo";
import { shop } from "@/config/shop";

export default function Home() {
  return (
    <>
      <Hero />
      <main>
        <MenuBoard />
        <Reasons />
        <OrderForm />
        <ShopInfo />
      </main>
      <footer className="bg-ink px-5 py-6 text-center text-sm text-white/80 pb-24 sm:px-8 md:pb-6">
        © {shop.name} · {shop.tagline}
      </footer>
    </>
  );
}
