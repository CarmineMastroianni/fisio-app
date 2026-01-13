import { useMemo, useState } from "react";
import { Tabs } from "../../../components/ui/Tabs";
import type { Appointment, Patient } from "../../../types";
import { formatCurrency, formatDate, formatDateTime } from "../../../lib/utils";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { VisitsTable } from "./VisitsTable";
import { PaymentsPanel } from "./PaymentsPanel";
import { DocumentsPanel } from "./DocumentsPanel";
import { ClinicalNotesPanel } from "./ClinicalNotesPanel";

const buildMapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

type PatientTabsProps = {
  patient: Patient;
  appointments: Appointment[];
  onNewVisit: () => void;
  onMarkPaid: (appointmentId: string) => void;
  onMarkCompleted: (appointmentId: string) => void;
  onDuplicate: (appointmentId: string) => void;
  onOpenVisit: (appointmentId: string) => void;
  onDeleteVisit: (appointmentId: string) => void;
};

export const PatientTabs = ({
  patient,
  appointments,
  onNewVisit,
  onMarkPaid,
  onMarkCompleted,
  onDuplicate,
  onOpenVisit,
  onDeleteVisit,
}: PatientTabsProps) => {
  const [active, setActive] = useState("overview");

  const nextAppointment = useMemo(() => {
    return appointments
      .filter((apt) => new Date(apt.start) >= new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  }, [appointments]);

  const revenue = appointments.filter((apt) => apt.pagata).reduce((sum, apt) => sum + apt.costo, 0);
  const unpaid = appointments.filter((apt) => !apt.pagata).reduce((sum, apt) => sum + apt.costo, 0);
  const lastPaid = appointments
    .filter((apt) => apt.pagata)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())[0];

  const overview = (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prossima visita</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {nextAppointment ? formatDateTime(nextAppointment.start) : "Nessuna visita pianificata"}
            </p>
            <p className="text-sm text-slate-500">
              {nextAppointment ? `${nextAppointment.trattamento} · ${nextAppointment.luogo}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onNewVisit}>
              Nuova visita
            </Button>
            {nextAppointment ? (
              <>
                <Button size="sm" variant="outline" onClick={() => onOpenVisit(nextAppointment.id)}>
                  Modifica
                </Button>
                <Button size="sm" variant="outline" onClick={() => onMarkCompleted(nextAppointment.id)}>
                  Segna completata
                </Button>
                <Button size="sm" variant="outline" onClick={() => onMarkPaid(nextAppointment.id)}>
                  Segna pagata
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Riepilogo economico</p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tot incassato</span>
            <span className="font-semibold text-slate-800">{formatCurrency(revenue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tot insoluti</span>
            <span className="font-semibold text-rose-600">{formatCurrency(unpaid)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Ultimo pagamento</span>
            <span className="text-slate-700">
              {lastPaid ? formatDate(lastPaid.start) : "Nessuno"}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Logistica domicilio</p>
        <p className="mt-2 text-sm text-slate-700">{patient.indirizzo}</p>
        <p className="mt-2 text-xs text-slate-500">
          {patient.noteLogistiche || "Nessuna nota logistica."}
        </p>
        <a
          className="mt-3 inline-flex text-xs font-semibold text-teal-600"
          href={buildMapsUrl(patient.indirizzo)}
          target="_blank"
          rel="noreferrer"
        >
          Apri Maps
        </a>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sintesi clinica</p>
        <p className="mt-2 text-sm text-slate-700">
          {patient.clinicalNotes?.note || patient.noteCliniche}
        </p>
        <Button size="sm" variant="ghost" className="mt-3" onClick={() => setActive("notes")}>
          Apri note cliniche
        </Button>
      </Card>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Panoramica", content: overview },
    {
      id: "visits",
      label: "Visite",
      content: (
        <VisitsTable
          appointments={appointments}
          onOpen={onOpenVisit}
          onDuplicate={onDuplicate}
          onMarkCompleted={onMarkCompleted}
          onMarkPaid={onMarkPaid}
          onDelete={onDeleteVisit}
        />
      ),
    },
    {
      id: "payments",
      label: "Pagamenti",
      content: (
        <PaymentsPanel
          appointments={appointments}
          onMarkPaid={onMarkPaid}
        />
      ),
    },
    {
      id: "documents",
      label: "Documenti",
      content: <DocumentsPanel patientId={patient.id} />, 
    },
    {
      id: "notes",
      label: "Note cliniche",
      content: <ClinicalNotesPanel patient={patient} />,
    },
  ];

  return <Tabs items={tabs} activeId={active} onChange={setActive} />;
};
