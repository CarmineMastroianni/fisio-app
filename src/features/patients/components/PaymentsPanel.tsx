import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { formatCurrency, formatDateTime } from "../../../lib/utils";
import type { Appointment } from "../../../types";

const buildCsv = (appointments: Appointment[]) => {
  const header = ["Data", "Trattamento", "Costo", "Metodo", "Pagata"].join(",");
  const rows = appointments.map((apt) =>
    [
      new Date(apt.start).toISOString(),
      apt.trattamento,
      apt.costo,
      apt.metodoPagamento,
      apt.pagata ? "si" : "no",
    ].join(",")
  );
  return [header, ...rows].join("\n");
};

type PaymentsPanelProps = {
  appointments: Appointment[];
  onMarkPaid: (appointmentId: string) => void;
};

export const PaymentsPanel = ({ appointments, onMarkPaid }: PaymentsPanelProps) => {
  const unpaid = appointments.filter((apt) => !apt.pagata);
  const paid = appointments.filter((apt) => apt.pagata);

  const downloadCsv = () => {
    const csv = buildCsv(appointments);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pagamenti-paziente.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Da incassare</h3>
          <span className="text-xs text-slate-500">{unpaid.length} insoluti</span>
        </div>
        <div className="mt-4 space-y-3">
          {unpaid.map((apt) => (
            <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="font-semibold text-slate-800">{apt.trattamento}</p>
              <p className="text-xs text-slate-500">{formatDateTime(apt.start)}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-rose-600">{formatCurrency(apt.costo)}</span>
                <Button size="sm" variant="outline" onClick={() => onMarkPaid(apt.id)}>
                  Segna pagato
                </Button>
              </div>
            </div>
          ))}
          {unpaid.length === 0 ? (
            <p className="text-sm text-slate-500">Nessun insoluto attivo.</p>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Storico pagamenti</h3>
          <Button size="sm" variant="ghost" onClick={downloadCsv}>
            Esporta CSV
          </Button>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {paid.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2">
              <span>{formatDateTime(apt.start)}</span>
              <span className="text-slate-500">{apt.metodoPagamento}</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(apt.costo)}</span>
            </div>
          ))}
          {paid.length === 0 ? (
            <p className="text-sm text-slate-500">Nessun pagamento registrato.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
