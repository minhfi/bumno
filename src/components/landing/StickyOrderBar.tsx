import { formatVnd } from "@/config/menu";

type Props = { total: number; hidden: boolean };

/** Mobile-only bar pinned to the bottom; hidden while the order form is on screen. */
export function StickyOrderBar({ total, hidden }: Props) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-enamel/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-200 motion-reduce:transition-none md:hidden ${
        hidden ? "pointer-events-none translate-y-full" : ""
      }`}
      aria-hidden={hidden}
    >
      <a
        href="#dat-hang"
        tabIndex={hidden ? -1 : undefined}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-rim text-lg font-semibold text-on-rim"
      >
        {total > 0 ? `Đặt ngay · ${formatVnd(total)}` : "Đặt ngay"}
      </a>
    </div>
  );
}
