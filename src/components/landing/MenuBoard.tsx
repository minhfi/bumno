import { formatVnd, menu } from "@/config/menu";

/** Menu shown like a price board on the wall: name left, price right, dotted leader in between. */
export function MenuBoard() {
  return (
    <section id="menu" aria-labelledby="menu-title" className="border-y-4 border-rim bg-surface">
      <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 md:py-16">
        <h2 id="menu-title" className="font-display text-[40px] font-extrabold uppercase leading-none text-rim-strong">
          Menu
        </h2>
        <ul className="mt-8 max-w-[720px] space-y-6">
          {menu.map((item) => (
            <li key={item.id}>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[28px] font-bold leading-tight">{item.name}</span>
                <span aria-hidden className="mb-1.5 flex-1 border-b-[3px] border-dotted border-ink/25" />
                <span className="font-display text-[28px] font-bold tabular-nums text-ink">{formatVnd(item.price)}</span>
              </div>
              <p className="mt-1 max-w-[60ch] text-[15px] text-ink/75">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
