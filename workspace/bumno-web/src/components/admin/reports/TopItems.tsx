import { formatVnd } from "@/config/menu";
import type { ReportItem } from "@/lib/reports/types";

const shareFormat = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 0 });

function AddonTag() {
  return <span className="ml-2 rounded-full border border-ink/20 px-2 py-0.5 text-xs font-medium text-ink/70">món&nbsp;thêm</span>;
}

function ShareBar({ share }: { share: number }) {
  return (
    <span aria-hidden="true" className="block h-2 w-full rounded-full bg-ink/8">
      <span className="block h-2 rounded-full bg-rim" style={{ width: `${Math.max(share * 100, share > 0 ? 1 : 0)}%` }} />
    </span>
  );
}

type Props = {
  items: ReportItem[];
  /** Shipping fees of the same orders, shown as a last line so the rows add up to `revenue`. */
  shippingTotal: number;
  revenue: number;
};

/** Dishes of COMPLETED orders by revenue: a table on wide screens, stacked rows on phones. */
export function TopItems({ items, shippingTotal, revenue }: Props) {
  const shippingShare = revenue > 0 ? shippingTotal / revenue : 0;
  return (
    <section aria-labelledby="top-items-title" className="border-t border-ink/10 pt-4">
      <h2 id="top-items-title" className="font-semibold">
        Món bán được
      </h2>

      <table className="mt-3 hidden w-full border-collapse text-left tabular-nums md:table">
        <caption className="sr-only">Món bán được theo doanh thu</caption>
        <thead className="text-sm text-ink/65">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Món</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Số phần</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Doanh thu</th>
            <th scope="col" className="w-56 py-2 font-medium">% doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId} className="border-t border-ink/10">
              <th scope="row" className="py-3 pr-4 font-medium">
                {item.name}
                {item.addon ? <AddonTag /> : null}
              </th>
              <td className="py-3 pr-4 text-right">{item.quantity}</td>
              <td className="py-3 pr-4 text-right font-display text-xl font-bold">{formatVnd(item.revenue)}</td>
              <td className="py-3">
                <span className="flex items-center gap-3">
                  <span className="w-10 text-right">{shareFormat.format(item.share)}</span>
                  <ShareBar share={item.share} />
                </span>
              </td>
            </tr>
          ))}
          {shippingTotal > 0 ? (
            <tr className="border-t border-ink/10 text-ink/70">
              <th scope="row" className="py-3 pr-4 font-medium">Phí ship</th>
              <td className="py-3 pr-4" />
              <td className="py-3 pr-4 text-right font-display text-xl font-bold">{formatVnd(shippingTotal)}</td>
              <td className="py-3">
                <span className="flex items-center gap-3">
                  <span className="w-10 text-right">{shareFormat.format(shippingShare)}</span>
                  <ShareBar share={shippingShare} />
                </span>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <ul role="list" className="mt-2 md:hidden">
        {items.map((item) => (
          <li key={item.productId} className="border-t border-ink/10 py-2.5">
            <p className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 break-words font-medium">
                {item.name}
                {item.addon ? <AddonTag /> : null}
              </span>
              <span className="shrink-0 font-display text-lg font-bold leading-none tabular-nums">{formatVnd(item.revenue)}</span>
            </p>
            <p className="mt-1 flex items-center gap-3 text-sm text-ink/75 tabular-nums">
              <ShareBar share={item.share} />
              <span className="shrink-0">
                {item.quantity}&nbsp;phần · {shareFormat.format(item.share)}
              </span>
            </p>
          </li>
        ))}
        {shippingTotal > 0 ? (
          <li className="border-t border-ink/10 py-2.5 text-ink/70">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-medium">Phí ship</span>
              <span className="shrink-0 font-display text-lg font-bold leading-none tabular-nums">{formatVnd(shippingTotal)}</span>
            </p>
            <p className="mt-1 flex items-center gap-3 text-sm tabular-nums">
              <ShareBar share={shippingShare} />
              <span className="shrink-0">{shareFormat.format(shippingShare)}</span>
            </p>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
