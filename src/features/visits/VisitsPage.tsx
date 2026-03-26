import { useMemo, useState } from "react";
import { addDays, addMonths, addWeeks, addYears, format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { VisitsKpiBar, type VisitsKpiKey } from "./components/VisitsKpiBar";
import { VisitsFilters as VisitsFiltersPanel } from "./components/VisitsFilters";
import { VisitsTable } from "./components/VisitsTable";
import { VisitDetailDrawer, type VisitDrawerSection } from "./components/VisitDetailDrawer";
import { VisitFormDrawer } from "../calendar/components/VisitFormDrawer";
import { applyVisitFilters } from "./utils/visitFilters";
import { computeVisitsKpis } from "./utils/visitKpis";
import {
  useAppointments,
  useCreateAppointmentsMutation,
  useUpsertAppointmentMutation,
  useAddDepositMutation,
  useDeleteVisitMutation,
  useDuplicateVisitMutation,
  useMarkVisitCompletedMutation,
  usePatients,
  useRemoveDepositMutation,
  useSettings,
  useUpdateVisitNotesMutation,
} from "../../hooks/useData";
import type { Appointment, VisitFilters } from "../../types";
import { useToastStore } from "../../stores/toastStore";

const defaultFilters: VisitFilters = {
  period: "all",
  status: "all",
  paid: "all",
  patientId: undefined,
  query: "",
  startDate: "",
  endDate: "",
};

const kpiFilters = (key: VisitsKpiKey): Partial<VisitFilters> => {
  const today = format(new Date(), "yyyy-MM-dd");
  const nextWeek = format(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), "yyyy-MM-dd");

  switch (key) {
    case "today":
      return { period: "today" };
    case "next7":
      return { period: "custom", startDate: today, endDate: nextWeek };
    case "unpaid":
      return { paid: "unpaid" };
    case "month-paid":
      return { period: "month", paid: "paid" };
    case "to-complete":
    default:
      return { period: "all" };
  }
};

export const VisitsPage = () => {
  const { pushToast } = useToastStore();
  const { data: allVisits = [] } = useAppointments();
  const { data: patients = [] } = usePatients();
  const { data: settings } = useSettings();
  const { mutate: upsertVisit } = useUpsertAppointmentMutation();
  const { mutate: createVisits } = useCreateAppointmentsMutation();
  const { mutate: markCompleted } = useMarkVisitCompletedMutation();
  const { mutate: deleteVisit } = useDeleteVisitMutation();
  const { mutate: duplicateVisit } = useDuplicateVisitMutation();
  const { mutate: updateNotes } = useUpdateVisitNotesMutation();
  const { mutate: addDeposit } = useAddDepositMutation();
  const { mutate: removeDeposit } = useRemoveDepositMutation();

  const [filters, setFilters] = useState<VisitFilters>(defaultFilters);
  const [activeKpi, setActiveKpi] = useState<VisitsKpiKey | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [drawerSection, setDrawerSection] = useState<VisitDrawerSection>("details");
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ patientId?: string } | undefined>(undefined);

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const baseFilteredVisits = useMemo(
    () => applyVisitFilters(allVisits, filters, patientMap),
    [allVisits, filters, patientMap]
  );

  const filteredVisits = useMemo(() => {
    if (activeKpi !== "to-complete") return baseFilteredVisits;
    return baseFilteredVisits.filter((visit) => {
      const date = new Date(visit.start);
      return date < new Date() && visit.status !== "completata" && visit.status !== "cancellata";
    });
  }, [baseFilteredVisits, activeKpi]);

  const kpis = useMemo(() => computeVisitsKpis(filteredVisits), [filteredVisits]);

  const selectedVisit = allVisits.find((visit) => visit.id === selectedVisitId) ?? null;

  const applyKpi = (key: VisitsKpiKey) => {
    if (activeKpi === key) {
      setActiveKpi(null);
      setFilters(defaultFilters);
      return;
    }
    setActiveKpi(key);
    setFilters({
      ...defaultFilters,
      patientId: filters.patientId,
      query: filters.query,
      ...kpiFilters(key),
    });
  };

  const openDrawer = (visitId: string, section: VisitDrawerSection = "details") => {
    setSelectedVisitId(visitId);
    setDrawerSection(section);
  };

  const openNewVisit = () => {
    setSelectedVisitId(null);
    setPrefill(filters.patientId ? { patientId: filters.patientId } : undefined);
    setFormOpen(true);
  };

  const shiftRecurringDate = (
    date: Date,
    pattern: "none" | "daily" | "weekly" | "monthly" | "yearly",
    offset: number
  ) => {
    if (pattern === "none") return date;
    if (pattern === "daily") return addDays(date, offset);
    if (pattern === "weekly") return addWeeks(date, offset);
    if (pattern === "monthly") return addMonths(date, offset);
    return addYears(date, offset);
  };

  const saveVisit = ({
    appointment,
    recurrence,
  }: {
    appointment: Appointment;
    scope: "single" | "series";
    recurrence: { pattern: "none" | "daily" | "weekly" | "monthly" | "yearly"; count: number };
  }) => {
    if (recurrence.pattern === "none") {
      upsertVisit(appointment);
      pushToast({ title: "Visita pianificata", tone: "success" });
    } else {
      const seriesId = crypto.randomUUID();
      const occurrences = Array.from({ length: recurrence.count }).map((_, index) => {
        const startDate = shiftRecurringDate(new Date(appointment.start), recurrence.pattern, index);
        const endDate = shiftRecurringDate(new Date(appointment.end), recurrence.pattern, index);
        return {
          ...appointment,
          id: crypto.randomUUID(),
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          seriesId,
        };
      });
      createVisits(occurrences);
      pushToast({ title: "Visite pianificate", tone: "success" });
    }

    setFormOpen(false);
    setPrefill(undefined);
  };

  const updateVisit = (updated: Appointment) => {
    upsertVisit(updated);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Visite</h2>
          <p className="text-sm text-slate-500">Priorità operative e gestione rapida delle visite.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={openNewVisit}
            disabled={!settings || patients.length === 0}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuova visita
          </Button>
          {patients.length === 0 ? (
            <p className="text-right text-xs text-slate-500">Aggiungi prima un paziente per pianificare una visita.</p>
          ) : null}
        </div>
      </div>

      <VisitsKpiBar kpis={kpis} active={activeKpi} onSelect={applyKpi} />

      <div className="sticky top-16 z-10 space-y-4 bg-sand-50 pt-2 lg:top-24">
        <VisitsFiltersPanel
          filters={filters}
          patients={patients}
          onChange={(next) => {
            setActiveKpi(null);
            setFilters(next);
          }}
          onReset={() => {
            setActiveKpi(null);
            setFilters(defaultFilters);
          }}
        />
      </div>

      <Card>
        <VisitsTable
          visits={filteredVisits}
          patients={patients}
          onOpen={(visitId) => openDrawer(visitId, "details")}
          onMarkCompleted={(visitId) => {
            markCompleted(visitId);
            pushToast({ title: "Visita completata", tone: "success" });
          }}
          onMarkPaid={(visitId) => openDrawer(visitId, "payment")}
          onDuplicate={(visitId) => {
            duplicateVisit(visitId);
            pushToast({ title: "Visita duplicata", tone: "success" });
          }}
          onDelete={(visitId) => {
            if (!window.confirm("Eliminare questa visita?")) return;
            deleteVisit(visitId);
            pushToast({ title: "Visita eliminata", tone: "info" });
            if (visitId === selectedVisitId) setSelectedVisitId(null);
          }}
        />
      </Card>

      <VisitDetailDrawer
        open={Boolean(selectedVisitId)}
        visit={selectedVisit}
        patientName={
          selectedVisit ? `${patientMap.get(selectedVisit.patientId)?.nome ?? ""} ${patientMap.get(selectedVisit.patientId)?.cognome ?? ""}`.trim() : undefined
        }
        initialSection={drawerSection}
        onClose={() => setSelectedVisitId(null)}
        onUpdateVisit={(visit) => {
          updateVisit(visit);
          pushToast({ title: "Visita aggiornata", tone: "success" });
        }}
        onAddDeposit={(visitId, deposit) => {
          addDeposit({ visitId, deposit });
          pushToast({ title: "Acconto registrato", tone: "success" });
        }}
        onRemoveDeposit={(visitId, depositId) => {
          removeDeposit({ visitId, depositId });
          pushToast({ title: "Acconto rimosso", tone: "info" });
        }}
        onUpdateNotes={(visitId, notes) => {
          updateNotes({ visitId, notes });
          pushToast({ title: "Note salvate", tone: "success" });
        }}
      />

      {settings ? (
        <VisitFormDrawer
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setPrefill(undefined);
          }}
          patients={patients}
          settings={settings}
          prefill={prefill}
          onSave={saveVisit}
        />
      ) : null}

    </div>
  );
};
