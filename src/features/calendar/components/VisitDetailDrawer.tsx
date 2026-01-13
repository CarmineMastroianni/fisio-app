import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { Drawer } from "../../../components/ui/Drawer";
import { Button } from "../../../components/Button";
import { Badge } from "../../../components/Badge";
import { clampText, formatDateTime } from "../../../lib/utils";
import { getPaymentStatus } from "../../../lib/payments";
import type { Appointment, Deposit, Patient, VisitNotes } from "../../../types";
import { PaymentPanel } from "../../visits/components/PaymentPanel";
import { SoapNotesPanel } from "../../visits/components/SoapNotesPanel";

type VisitDetailDrawerProps = {
  open: boolean;
  visit: Appointment | null;
  patient: Patient | null;
  onClose: () => void;
  onUpdateStatus: (visitId: string, status: Appointment["status"]) => void;
  onAddDeposit: (visitId: string, deposit: Deposit) => void;
  onRemoveDeposit: (visitId: string, depositId: string) => void;
  onUpdateNotes: (visitId: string, notes: VisitNotes) => void;
  onOpenPatient: (patientId: string) => void;
  onOpenVisit: (visitId: string) => void;
};

export const VisitDetailDrawer = ({
  open,
  visit,
  patient,
  onClose,
  onUpdateStatus,
  onAddDeposit,
  onRemoveDeposit,
  onUpdateNotes,
  onOpenPatient,
  onOpenVisit,
}: VisitDetailDrawerProps) => {
  const paymentStatus = useMemo(() => (visit ? getPaymentStatus(visit) : "unpaid"), [visit]);

  if (!visit) return null;

  const statusTone =
    visit.status === "completata"
      ? "success"
      : visit.status === "cancellata" || visit.status === "no-show"
        ? "neutral"
        : "info";
  const paymentTone =
    paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "danger";

  return (
    <Drawer open={open} title="Dettaglio visita" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visita</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(visit.start)}</h3>
              <p className="text-sm text-slate-600">{visit.trattamento}</p>
              <p className="text-xs text-slate-500">{patient ? `${patient.nome} ${patient.cognome}` : "Paziente"}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge label={visit.status} tone={statusTone} />
              <Badge
                label={paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"}
                tone={paymentTone}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{visit.luogo}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.luogo)}`}
              className="font-semibold text-teal-600"
              target="_blank"
              rel="noreferrer"
            >
              Apri Maps
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(visit.id, "completata")}>
            Segna completata
          </Button>
          {patient ? (
            <Button size="sm" variant="outline" onClick={() => onOpenPatient(patient.id)}>
              Apri scheda paziente
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => onOpenVisit(visit.id)}>
            Vai a dettaglio visita
          </Button>
        </div>

        <label className="text-xs font-semibold text-slate-500">
          Stato visita
          <select
            value={visit.status}
            onChange={(event) => onUpdateStatus(visit.id, event.target.value as Appointment["status"])}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="programmata">Programmata</option>
            <option value="completata">Completata</option>
            <option value="cancellata">Cancellata</option>
            <option value="no-show">No-show</option>
          </select>
        </label>

        <SoapNotesPanel
          value={visit.notes ?? {}}
          onSave={(notes) => onUpdateNotes(visit.id, notes)}
        />

        <PaymentPanel
          visit={visit}
          onAddDeposit={(deposit) => onAddDeposit(visit.id, deposit)}
          onRemoveDeposit={(depositId) => onRemoveDeposit(visit.id, depositId)}
        />

        {patient ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">Note paziente</p>
              <Button size="sm" variant="ghost" onClick={() => onOpenPatient(patient.id)}>
                Apri paziente
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {clampText(patient.clinicalNotes?.note ?? patient.noteCliniche ?? "Nessuna nota disponibile.", 140)}
            </p>
            {patient.noteLogistiche ? (
              <p className="mt-2 text-xs text-slate-400">Logistica: {clampText(patient.noteLogistiche, 120)}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
};
