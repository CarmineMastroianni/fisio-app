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
      color: kpis.todayCount > 0 ? "teal" : "neutral",
    },
    {
      key: "next7" as const,
      label: "Prossimi 7 giorni",
      value: kpis.next7Count,
      helper: "visite programmate",
      color: "neutral",
    },
    {
      key: "unpaid" as const,
      label: "Insoluti",
      value: kpis.unpaidCount,
      helper: kpis.unpaidLabel,
      color: kpis.unpaidCount > 0 ? "rose" : "neutral",
    },
    {
      key: "to-complete" as const,
      label: "Da completare",
      value: kpis.toCompleteCount,
      helper: "visite passate",
      color: kpis.toCompleteCount > 0 ? "amber" : "neutral",
    },
    {
      key: "month-paid" as const,
      label: "Incassi mese",
      value: kpis.monthPaidTotal,
      helper: kpis.monthPaidLabel,
      isAmount: true,
      color: "teal",
    },
  ] as const;

  const colorStyles: Record<string, { idle: string; active: string; value: string }> = {
    neutral: {
      idle: "border-slate-200 bg-white",
      active: "border-teal-500 bg-teal-50",
      value: "text-slate-900",
    },
    teal: {
      idle: "border-teal-100 bg-teal-50/60",
      active: "border-teal-500 bg-teal-50",
      value: "text-teal-700",
    },
    amber: {
      idle: "border-amber-200 bg-amber-50/60",
      active: "border-amber-500 bg-amber-50",
      value: "text-amber-700",
    },
    rose: {
      idle: "border-rose-200 bg-rose-50/60",
      active: "border-rose-500 bg-rose-50",
      value: "text-rose-600",
    },
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map((item) => {
        const styles = colorStyles[item.color];
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`min-w-[150px] flex-1 rounded-3xl border px-4 py-3 text-left transition md:min-w-[170px] ${
              isActive ? styles.active : styles.idle
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className={`mt-2 text-xl font-semibold ${styles.value}`}>
              {item.isAmount ? formatCurrency(Number(item.value)) : item.value}
            </p>
            <p className="text-xs text-slate-500">{item.helper}</p>
          </button>
        );
      })}
    </div>
  );
};
