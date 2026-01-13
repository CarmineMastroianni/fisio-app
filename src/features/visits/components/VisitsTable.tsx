import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
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

  const renderRowActions = (visit: Appointment) => (
    <details className="relative">
      <summary aria-label="Azioni visita" className="list-none cursor-pointer">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 text-xs shadow-lg">
        {visit.status !== "completata" ? (
          <button
            type="button"
            onClick={() => onMarkCompleted(visit.id)}
            className="w-full rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
          >
            Segna completata
          </button>
        ) : null}
        {getPaymentStatus(visit) !== "paid" ? (
          <button
            type="button"
            onClick={() => onMarkPaid(visit.id)}
            className="w-full rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
          >
            Segna pagata
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDuplicate(visit.id)}
          className="w-full rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
        >
          Duplica
        </button>
        <Link
          to={`/patients/${visit.patientId}`}
          className="block rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
        >
          Vai a scheda paziente
        </Link>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Eliminare questa visita?")) onDelete(visit.id);
          }}
          className="w-full rounded-xl px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
        >
          Elimina
        </button>
      </div>
    </details>
  );

  if (visits.length === 0) {
    return <EmptyState title="Nessuna visita" description="Non ci sono visite con i filtri selezionati." />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="py-2">Data/Ora</th>
              <th>Paziente</th>
              <th>Luogo</th>
              <th>Trattamento</th>
              <th>Stato</th>
              <th>Pagamento</th>
              <th className="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visits.map((visit) => {
              const patient = patientMap.get(visit.patientId);
              const isPast = new Date(visit.start) < new Date();
              const isToday = new Date(visit.start).toDateString() === new Date().toDateString();
              const showToComplete = isPast && visit.status !== "completata" && visit.status !== "cancellata";
              const paymentStatus = getPaymentStatus(visit);
              const showInsoluto = visit.status === "completata" && paymentStatus === "unpaid";
              const showPartial = visit.status === "completata" && paymentStatus === "partial";

              return (
                <tr key={visit.id} className={`text-slate-700 ${isToday ? "bg-amber-50/40" : ""}`}>
                  <td className="py-3 pr-4 font-semibold text-slate-800">
                    {formatDateTime(visit.start)}
                  </td>
                  <td className="pr-4">
                    {patient ? (
                      <Link className="font-semibold text-slate-800 hover:text-teal-600" to={`/patients/${patient.id}`}>
                        {patient.nome} {patient.cognome}
                      </Link>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="pr-4 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Domicilio</span>
                    <span className="ml-2">{visit.luogo.split(",")[0]}</span>
                  </td>
                  <td className="pr-4">{visit.trattamento}</td>
                  <td className="pr-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge label={visit.status} tone={statusTone[visit.status]} />
                      {showToComplete ? <Badge label="Da completare" tone="warning" /> : null}
                      {showPartial ? <Badge label="Parziale" tone="warning" /> : null}
                      {showInsoluto ? <Badge label="Insoluto" tone="danger" /> : null}
                    </div>
                  </td>
                  <td className="pr-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        label={paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"}
                        tone={paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "danger"}
                      />
                      <span className="text-xs text-slate-500">
                        {formatCurrency(getPaidAmount(visit))}
                        {visit.payment.method ? ` · ${visit.payment.method}` : ""}
                        {showInsoluto ? " · Insoluto" : ""}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onOpen(visit.id)}>
                        Apri
                      </Button>
                      {renderRowActions(visit)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {visits.map((visit) => {
          const patient = patientMap.get(visit.patientId);
          const isPast = new Date(visit.start) < new Date();
          const isToday = new Date(visit.start).toDateString() === new Date().toDateString();
          const showToComplete = isPast && visit.status !== "completata" && visit.status !== "cancellata";
          const paymentStatus = getPaymentStatus(visit);
          const showInsoluto = visit.status === "completata" && paymentStatus === "unpaid";
          const showPartial = visit.status === "completata" && paymentStatus === "partial";

          return (
            <div key={visit.id} className={`rounded-2xl border border-slate-200 bg-white p-4 ${isToday ? "bg-amber-50/40" : ""}`}>
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
                {renderRowActions(visit)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={visit.status} tone={statusTone[visit.status]} />
                {showToComplete ? <Badge label="Da completare" tone="warning" /> : null}
                {showPartial ? <Badge label="Parziale" tone="warning" /> : null}
                {showInsoluto ? <Badge label="Insoluto" tone="danger" /> : null}
                <Badge
                  label={paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"}
                  tone={paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "danger"}
                />
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Domicilio</span> <span className="ml-1">{visit.luogo.split(",")[0]}</span></p>
                <p>
                  {formatCurrency(getPaidAmount(visit))}
                  {visit.payment.method ? ` · ${visit.payment.method}` : ""}
                </p>
              </div>
              <div className="mt-3 flex justify-between">
                <Button size="sm" variant="outline" onClick={() => onOpen(visit.id)}>
                  Apri
                </Button>
                {paymentStatus !== "paid" ? (
                  <Button size="sm" variant="ghost" onClick={() => onMarkPaid(visit.id)}>
                    Segna pagata
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
