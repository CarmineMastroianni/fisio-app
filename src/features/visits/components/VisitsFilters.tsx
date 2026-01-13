import { useEffect, useState } from "react";
import type { Patient, VisitFilters } from "../../../types";

const periodOptions = [
  { value: "today", label: "Oggi" },
  { value: "week", label: "Settimana" },
  { value: "month", label: "Mese" },
  { value: "custom", label: "Custom" },
  { value: "all", label: "Tutti" },
] as const;

const statusOptions = [
  { value: "all", label: "Tutti" },
  { value: "programmata", label: "Programmata" },
  { value: "completata", label: "Completata" },
  { value: "cancellata", label: "Cancellata" },
  { value: "no-show", label: "No-show" },
] as const;

const paidOptions = [
  { value: "all", label: "Tutte" },
  { value: "paid", label: "Pagate" },
  { value: "unpaid", label: "Non pagate" },
] as const;

type VisitsFiltersProps = {
  filters: VisitFilters;
  patients: Patient[];
  onChange: (filters: VisitFilters) => void;
  onReset: () => void;
};

export const VisitsFilters = ({ filters, patients, onChange, onReset }: VisitsFiltersProps) => {
  const selectedPatient = patients.find((patient) => patient.id === filters.patientId);
  const [patientQuery, setPatientQuery] = useState(
    selectedPatient ? `${selectedPatient.nome} ${selectedPatient.cognome}` : ""
  );

  useEffect(() => {
    if (selectedPatient) {
      setPatientQuery(`${selectedPatient.nome} ${selectedPatient.cognome}`);
    }
    if (!selectedPatient && !filters.patientId) {
      setPatientQuery("");
    }
  }, [selectedPatient, filters.patientId]);

  return (
    <details open className="rounded-3xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700 md:hidden">Filtri</summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-slate-500">
          Periodo
          <select
            value={filters.period}
            onChange={(event) => onChange({ ...filters, period: event.target.value as VisitFilters["period"] })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Stato
          <select
            value={filters.status}
            onChange={(event) => onChange({ ...filters, status: event.target.value as VisitFilters["status"] })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Pagata
          <select
            value={filters.paid}
            onChange={(event) => onChange({ ...filters, paid: event.target.value as VisitFilters["paid"] })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {paidOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Paziente
          <input
            list="patients-list"
            value={patientQuery}
            onChange={(event) => {
              const value = event.target.value;
              setPatientQuery(value);
              const match = patients.find((patient) =>
                `${patient.nome} ${patient.cognome}`.toLowerCase() === value.toLowerCase()
              );
              onChange({ ...filters, patientId: match?.id ?? undefined });
            }}
            placeholder="Cerca paziente"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
          <datalist id="patients-list">
            {patients.map((patient) => (
              <option key={patient.id} value={`${patient.nome} ${patient.cognome}`} />
            ))}
          </datalist>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Ricerca
          <input
            value={filters.query ?? ""}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Nome, trattamento, indirizzo"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {filters.period === "custom" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-500">
            Da
            <input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            A
            <input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400">Filtri attivi per la lista visite</span>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-teal-600"
        >
          Reset filtri
        </button>
      </div>
    </details>
  );
};
