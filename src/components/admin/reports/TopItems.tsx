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

/** Dishes of COMPLETED orders by revenue: a table on wide screens, stacked rows on phones. */
export function TopItems({ items }: { items: ReportItem[] }) {
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
        </tbody>
      </table>

      <ul role="list" className="mt-2 md:hidden">
        {items.map((item) => (
          <li key={item.productId} className="border-t border-ink/10 py-3">
            <p className="min-w-0 break-words font-medium">
              {item.name}
              {item.addon ? <AddonTag /> : null}
            </p>
            <p className="mt-0.5 text-[15px] text-ink/75 tabular-nums">
              {item.quantity}&nbsp;phần · {formatVnd(item.revenue)} · {shareFormat.format(item.share)}
            </p>
            <span className="mt-2 block">
              <ShareBar share={item.share} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
