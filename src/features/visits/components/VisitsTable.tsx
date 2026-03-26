import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { DropdownMenu } from "../../../components/ui/DropdownMenu";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "../../../lib/utils";
import { getPaidAmount, getPaymentStatus } from "../../../lib/payments";
import type { Appointment, Patient } from "../../../types";

const statusTone: Record<string, "info" | "success" | "danger" | "warning"> = {
  programmata: "info",
  completata: "success",
  cancellata: "danger",
  "no-show": "warning",
};

const statusLabel: Record<string, string> = {
  programmata: "Programmata",
  completata: "Completata",
  cancellata: "Cancellata",
  "no-show": "No-show",
};

type VisitsTableProps = {
  visits: Appointment[];
  patients: Patient[];
  onOpen: (visitId: string) => void;
  onMarkCompleted: (visitId: string) => void;
  onMarkPaid: (visitId: string) => void;
  onDuplicate: (visitId: string) => void;
  onDelete: (visitId: string) => void;
};

export const VisitsTable = ({ visits, patients, onOpen, onMarkCompleted, onMarkPaid, onDuplicate, onDelete }: VisitsTableProps) => {
  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const buildMenuItems = (visit: Appointment) => {
    const items: Parameters<typeof DropdownMenu>[0]["items"] = [];
    if (visit.status !== "completata") {
      items.push({ type: "action", label: "Segna completata", onClick: () => onMarkCompleted(visit.id) });
    }
    if (getPaymentStatus(visit) !== "paid") {
      items.push({ type: "action", label: "Segna pagata", onClick: () => onMarkPaid(visit.id) });
    }
    items.push({ type: "action", label: "Duplica", onClick: () => onDuplicate(visit.id) });
    items.push({ type: "link", label: "Scheda paziente", to: `/patients/${visit.patientId}` });
    items.push({ type: "separator" });
    items.push({
      type: "action",
      label: "Elimina",
      variant: "danger",
      onClick: () => {
        if (window.confirm("Eliminare questa visita?")) onDelete(visit.id);
      },
    });
    return items;
  };

  if (visits.length === 0) {
    return <EmptyState title="Nessuna visita" description="Non ci sono visite con i filtri selezionati." />;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="py-2 pr-4">Data/Ora</th>
              <th className="pr-4">Paziente</th>
              <th className="pr-4">Trattamento</th>
              <th className="pr-4">Stato</th>
              <th className="pr-4">Completamento</th>
              <th className="pr-4">Pagamento</th>
              <th className="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visits.map((visit) => {
              const patient = patientMap.get(visit.patientId);
              const isPast = new Date(visit.start) < new Date();
              const isToday = new Date(visit.start).toDateString() === new Date().toDateString();
              const toComplete = isPast && visit.status !== "completata" && visit.status !== "cancellata";
              const paymentStatus = getPaymentStatus(visit);
              const showInsoluto = visit.status === "completata" && paymentStatus === "unpaid";
              const showPartial = visit.status === "completata" && paymentStatus === "partial";

              const rowBg = toComplete
                ? "bg-amber-50/60"
                : isToday
                ? "bg-teal-50/40"
                : "";

              return (
                <tr key={visit.id} className={`text-slate-700 ${rowBg}`}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-slate-800">{formatDateTime(visit.start)}</p>
                    {isToday ? <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">Oggi</p> : null}
                  </td>
                  <td className="pr-4">
                    {patient ? (
                      <Link className="font-semibold text-slate-800 hover:text-teal-600" to={`/patients/${patient.id}`}>
                        {patient.nome} {patient.cognome}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="pr-4">
                    <p className="font-medium text-slate-800">{visit.trattamento}</p>
                    {visit.luogo ? <p className="text-xs text-slate-400">{visit.luogo.split(",")[0]}</p> : null}
                  </td>
                  <td className="pr-4">
                    <Badge label={statusLabel[visit.status] ?? visit.status} tone={statusTone[visit.status]} />
                  </td>
                  <td className="pr-4">
                    {toComplete ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Da completare
                      </span>
                    ) : visit.status === "completata" ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="pr-4">
                    <div className="space-y-1">
                      <Badge
                        label={paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"}
                        tone={paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "danger"}
                      />
                      <p className="text-xs text-slate-500">
                        {formatCurrency(getPaidAmount(visit))}
                        {visit.payment.method ? ` · ${visit.payment.method}` : ""}
                      </p>
                      {showInsoluto ? <p className="text-xs font-semibold text-rose-500">Insoluto</p> : null}
                      {showPartial ? <p className="text-xs font-semibold text-amber-600">Parziale</p> : null}
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onOpen(visit.id)}>Apri</Button>
                      <DropdownMenu items={buildMenuItems(visit)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {visits.map((visit) => {
          const patient = patientMap.get(visit.patientId);
          const isPast = new Date(visit.start) < new Date();
          const isToday = new Date(visit.start).toDateString() === new Date().toDateString();
          const toComplete = isPast && visit.status !== "completata" && visit.status !== "cancellata";
          const paymentStatus = getPaymentStatus(visit);
          const showInsoluto = visit.status === "completata" && paymentStatus === "unpaid";
          const showPartial = visit.status === "completata" && paymentStatus === "partial";

          return (
            <div
              key={visit.id}
              className={`rounded-2xl border p-4 ${
                toComplete
                  ? "border-amber-200 bg-amber-50/60"
                  : isToday
                  ? "border-teal-200 bg-teal-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{formatDateTime(visit.start)}</p>
                  <p className="text-xs text-slate-500">{visit.trattamento}</p>
                  {patient ? (
                    <Link className="text-xs font-semibold text-teal-600" to={`/patients/${patient.id}`}>
                      {patient.nome} {patient.cognome}
                    </Link>
                  ) : null}
                </div>
                <DropdownMenu items={buildMenuItems(visit)} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={statusLabel[visit.status] ?? visit.status} tone={statusTone[visit.status]} />
                {toComplete ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    Da completare
                  </span>
                ) : null}
                <Badge
                  label={paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"}
                  tone={paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "danger"}
                />
                {showInsoluto ? <Badge label="Insoluto" tone="danger" /> : null}
                {showPartial ? <Badge label="Parziale" tone="warning" /> : null}
              </div>

              {visit.luogo ? (
                <p className="mt-2 text-xs text-slate-400">{visit.luogo.split(",")[0]}</p>
              ) : null}

              <div className="mt-3 flex items-center justify-between">
                <Button size="sm" variant="outline" onClick={() => onOpen(visit.id)}>Apri</Button>
                {paymentStatus !== "paid" ? (
                  <Button size="sm" variant="ghost" onClick={() => onMarkPaid(visit.id)}>Segna pagata</Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
