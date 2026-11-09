import { formatMinuteOfDay, shop } from "@/config/shop";
import { Plate } from "./Plate";

export function Hero() {
  const hours = `${formatMinuteOfDay(shop.openMinute)}–${formatMinuteOfDay(shop.closeMinute)}`;
  return (
    <header className="mx-auto max-w-[1120px] px-5 pt-4 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <a href="#" className="font-display text-3xl font-extrabold tracking-tight text-rim-strong">
          {shop.name}
        </a>
        <nav aria-label="Chính" className="flex items-center gap-1 text-[15px] font-medium sm:gap-5">
          <a href="#menu" className="hidden px-2 py-2 hover:text-rim-strong sm:inline">
            Menu
          </a>
          <a href="#dat-hang" className="hidden px-2 py-2 hover:text-rim-strong sm:inline">
            Đặt hàng
          </a>
          <a
            href={`tel:${shop.phone}`}
            className="rounded-full border-2 border-rim-strong px-4 py-1.5 font-semibold text-rim-strong hover:bg-rim hover:text-on-rim"
          >
            Gọi quán
          </a>
        </nav>
      </div>

      <div className="hero-in grid items-center gap-8 pb-12 pt-10 sm:pt-14 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pb-20">
        <div>
          <h1 className="font-display text-[64px] font-extrabold uppercase leading-[0.92] tracking-tight text-rim-strong sm:text-[80px] lg:text-[88px]">
            Bánh ướt
            <br />
            lòng gà
          </h1>
          <p className="mt-5 max-w-[34ch] text-lg text-ink/85 sm:text-xl">
            Bánh tráng mỏng hấp nóng, lòng gà luộc vừa tới, chan nước mắm chua ngọt. Giao tận nơi mỗi sáng.
          </p>
          <p className="mt-3 text-[15px] font-medium text-ink/70">
            Nhận đơn {hours} mỗi sáng · Trả tiền khi nhận hàng
          </p>
          <a
            href="#dat-hang"
            className="mt-7 inline-flex min-h-12 items-center rounded-full bg-rim px-7 text-lg font-semibold text-on-rim shadow-sm hover:bg-rim/90"
          >
            Đặt ngay
          </a>
        </div>
        <Plate className="mx-auto w-[min(82vw,420px)]" />
      </div>
    </header>
  );
}
