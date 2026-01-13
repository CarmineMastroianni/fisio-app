import { formatCurrency } from "../../../lib/utils";
import type { VisitsKpis } from "../utils/visitKpis";

export type VisitsKpiKey = "today" | "next7" | "unpaid" | "to-complete" | "month-paid";

type VisitsKpiBarProps = {
  kpis: VisitsKpis;
  active?: VisitsKpiKey | null;
  onSelect: (key: VisitsKpiKey) => void;
};

export const VisitsKpiBar = ({ kpis, active, onSelect }: VisitsKpiBarProps) => {
  const items = [
    {
      key: "today" as const,
      label: "Oggi",
      value: kpis.todayCount,
      helper: "visite oggi",
    },
    {
      key: "next7" as const,
      label: "Prossimi 7 giorni",
      value: kpis.next7Count,
      helper: "visite future",
    },
    {
      key: "unpaid" as const,
      label: "Insoluti",
      value: kpis.unpaidCount,
      helper: kpis.unpaidLabel,
    },
    {
      key: "to-complete" as const,
      label: "Da completare",
      value: kpis.toCompleteCount,
      helper: "passate",
    },
    {
      key: "month-paid" as const,
      label: "Incassi mese",
      value: kpis.monthPaidTotal,
      helper: kpis.monthPaidLabel,
      isAmount: true,
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={`min-w-[160px] flex-1 rounded-3xl border px-4 py-3 text-left transition md:min-w-[180px] ${
            active === item.key ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {item.isAmount ? formatCurrency(Number(item.value)) : item.value}
          </p>
          <p className="text-xs text-slate-500">{item.helper}</p>
        </button>
      ))}
    </div>
  );
};
