import { useEffect, useRef, useState } from "react";
import { Badge } from "../../../components/Badge";
import { Drawer } from "../../../components/ui/Drawer";
import { Button } from "../../../components/Button";
import { formatDateTime } from "../../../lib/utils";
import type { Appointment, Deposit, VisitNotes } from "../../../types";
import { PaymentPanel } from "./PaymentPanel";
import { SoapNotesPanel } from "./SoapNotesPanel";

export type VisitDrawerSection = "details" | "payment" | "notes";

type VisitDetailDrawerProps = {
  open: boolean;
  visit: Appointment | null;
  patientName?: string;
  onClose: () => void;
  onUpdateVisit: (visit: Appointment) => void;
  onAddDeposit: (visitId: string, deposit: Deposit) => void;
  onRemoveDeposit: (visitId: string, depositId: string) => void;
  onUpdateNotes: (visitId: string, notes: VisitNotes) => void;
  initialSection?: VisitDrawerSection;
};

export const VisitDetailDrawer = ({
  open,
  visit,
  patientName,
  onClose,
  onUpdateVisit,
  onAddDeposit,
  onRemoveDeposit,
  onUpdateNotes,
  initialSection = "details",
}: VisitDetailDrawerProps) => {
  const [details, setDetails] = useState({ luogo: "", costo: 0, status: "programmata" as Appointment["status"] });
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visit) return;
    setDetails({ luogo: visit.luogo, costo: visit.totalAmount ?? visit.costo, status: visit.status });
  }, [visit]);

  useEffect(() => {
    if (!open) return;
    const target =
      initialSection === "payment" ? paymentRef.current : initialSection === "notes" ? notesRef.current : detailsRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialSection, open]);

  if (!visit) {
    return (
      <Drawer open={open} title="Dettaglio visita" onClose={onClose}>
        <p className="text-sm text-slate-500">Visita non trovata.</p>
      </Drawer>
    );
  }

  const durationMinutes = Math.max(
    0,
    Math.round((new Date(visit.end).getTime() - new Date(visit.start).getTime()) / (1000 * 60))
  );

  return (
    <Drawer open={open} title="Dettaglio visita" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{formatDateTime(visit.start)}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{visit.trattamento}</p>
          <p className="text-sm text-slate-500">{patientName ?? "Paziente"} · {visit.luogo}</p>
          <p className="text-xs text-slate-400">Durata: {durationMinutes} min</p>
          <div className="mt-2">
            <Badge label={visit.status} tone={visit.status === "completata" ? "success" : visit.status === "cancellata" ? "danger" : "info"} />
          </div>
        </div>

        <div ref={detailsRef} className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">Dettagli</h4>
          <label className="text-xs font-semibold text-slate-500">
            Luogo
            <input
              value={details.luogo}
              onChange={(event) => setDetails({ ...details, luogo: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Costo
            <input
              type="number"
              value={details.costo}
              onChange={(event) => setDetails({ ...details, costo: Number(event.target.value) })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Stato
            <select
              value={details.status}
              onChange={(event) => setDetails({ ...details, status: event.target.value as Appointment["status"] })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="programmata">Programmata</option>
              <option value="completata">Completata</option>
              <option value="cancellata">Cancellata</option>
              <option value="no-show">No-show</option>
            </select>
          </label>
        </div>

        <div ref={paymentRef}>
          <PaymentPanel
            visit={visit}
            onAddDeposit={(deposit) => onAddDeposit(visit.id, deposit)}
            onRemoveDeposit={(depositId) => onRemoveDeposit(visit.id, depositId)}
          />
        </div>

        <div ref={notesRef}>
          <SoapNotesPanel value={visit.notes ?? {}} onSave={(notes) => onUpdateNotes(visit.id, notes)} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
          <Button
            onClick={() => {
              onUpdateVisit({ ...visit, luogo: details.luogo, costo: details.costo, totalAmount: details.costo, status: details.status });
              onClose();
            }}
          >
            Salva
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
