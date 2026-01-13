import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Card } from "../../components/Card";
import { VisitsKpiBar, type VisitsKpiKey } from "./components/VisitsKpiBar";
import { VisitsFilters as VisitsFiltersPanel } from "./components/VisitsFilters";
import { VisitsTable } from "./components/VisitsTable";
import { VisitDetailDrawer, type VisitDrawerSection } from "./components/VisitDetailDrawer";
import { applyVisitFilters } from "./utils/visitFilters";
import { computeVisitsKpis } from "./utils/visitKpis";
import {
  useAppointments,
  useAppointmentsMutation,
  useAddDepositMutation,
  useDeleteVisitMutation,
  useDuplicateVisitMutation,
  useMarkVisitCompletedMutation,
  usePatients,
  useRemoveDepositMutation,
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
  const { mutate: saveAppointments } = useAppointmentsMutation();
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

  const updateVisit = (updated: Appointment) => {
    const base = allVisits.length > 0 ? allVisits : [updated];
    saveAppointments(base.map((visit) => (visit.id === updated.id ? updated : visit)));
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Visite</h2>
        <p className="text-sm text-slate-500">Priorità operative e gestione rapida delle visite.</p>
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
    </div>
  );
};
