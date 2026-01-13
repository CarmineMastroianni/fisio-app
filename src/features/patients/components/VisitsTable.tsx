import { useMemo, useState } from "react";
import { endOfMonth, isWithinInterval, startOfMonth } from "date-fns";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { formatCurrency, formatDateTime, isInCurrentWeek, isToday } from "../../../lib/utils";
import { getPaymentStatus } from "../../../lib/payments";
import type { Appointment } from "../../../types";

const statusLabels: Record<string, string> = {
  programmata: "Programmata",
  completata: "Completata",
  cancellata: "Cancellata",
  "no-show": "No-show",
};

type VisitsTableProps = {
  appointments: Appointment[];
  onOpen: (appointmentId: string) => void;
  onDuplicate: (appointmentId: string) => void;
  onMarkCompleted: (appointmentId: string) => void;
  onMarkPaid: (appointmentId: string) => void;
  onDelete: (appointmentId: string) => void;
};

export const VisitsTable = ({
  appointments,
  onOpen,
  onDuplicate,
  onMarkCompleted,
  onMarkPaid,
  onDelete,
}: VisitsTableProps) => {
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [paid, setPaid] = useState("all");

  const filtered = useMemo(() => {
    return appointments.filter((apt) => {
      const periodOk =
        period === "all" ||
        (period === "today" && isToday(apt.start)) ||
        (period === "week" && isInCurrentWeek(apt.start)) ||
        (period === "month" &&
          isWithinInterval(new Date(apt.start), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }));
      const statusOk = status === "all" || apt.status === status;
      const paymentStatus = getPaymentStatus(apt);
      const paidOk = paid === "all" || (paid === "yes" ? paymentStatus === "paid" : paymentStatus !== "paid");
      return periodOk && statusOk && paidOk;
    });
  }, [appointments, paid, period, status]);

  return (
    <Card>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-slate-500">Periodo</label>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tutti</option>
            <option value="today">Oggi</option>
            <option value="week">Questa settimana</option>
            <option value="month">Questo mese</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Stato</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tutti</option>
            <option value="programmata">Programmata</option>
            <option value="completata">Completata</option>
            <option value="cancellata">Cancellata</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Pagata</label>
          <select
            value={paid}
            onChange={(event) => setPaid(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tutte</option>
            <option value="yes">Pagate</option>
            <option value="no">Non pagate</option>
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="py-2">Data/Ora</th>
              <th>Trattamento</th>
              <th>Luogo</th>
              <th>Stato</th>
              <th>Pagata</th>
              <th>Costo</th>
              <th className="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((apt) => (
              <tr key={apt.id} className="text-slate-700">
                <td className="py-3 pr-4 font-semibold text-slate-800">{formatDateTime(apt.start)}</td>
                <td className="pr-4">{apt.trattamento}</td>
                <td className="pr-4 text-xs text-slate-500">{apt.luogo}</td>
                <td className="pr-4 text-xs uppercase tracking-wider text-slate-500">
                  {statusLabels[apt.status] ?? apt.status}
                </td>
                <td className={`pr-4 ${getPaymentStatus(apt) === "paid" ? "text-emerald-600" : "text-rose-600"}`}>
                  {getPaymentStatus(apt) === "paid" ? "Sì" : "No"}
                </td>
                <td className="pr-4">{formatCurrency(apt.totalAmount ?? apt.costo)}</td>
                <td className="py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => onOpen(apt.id)}>
                      Apri
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDuplicate(apt.id)}>
                      Duplica
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onMarkCompleted(apt.id)}>
                      Segna completata
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onMarkPaid(apt.id)}>
                      Segna pagata
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(apt.id)}>
                      Elimina
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">Nessuna visita trovata.</p>
        ) : null}
      </div>
    </Card>
  );
};
