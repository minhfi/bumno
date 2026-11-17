import type { ReportRange } from "@/lib/reports/types";

const tabs: { range: ReportRange; label: string }[] = [
  { range: "today", label: "Hôm nay" },
  { range: "7d", label: "7 ngày" },
  { range: "30d", label: "30 ngày" },
  { range: "365d", label: "365 ngày" },
];

type Props = { value: ReportRange; onChange: (range: ReportRange) => void };

export function RangeTabs({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Khoảng thời gian" className="-mx-4 -my-1 flex gap-1 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-1 sm:px-1">
      {tabs.map(({ range, label }) => (
        <button
          key={range}
          type="button"
          aria-pressed={value === range}
          onClick={() => onChange(range)}
          className="min-h-11 shrink-0 rounded-full px-4 text-[15px] font-medium text-ink/75 hover:bg-ink/6 aria-pressed:bg-rim aria-pressed:font-semibold aria-pressed:text-on-rim"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
