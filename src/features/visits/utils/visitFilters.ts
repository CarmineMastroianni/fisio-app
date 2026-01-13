import { addDays } from "date-fns";
import { getPaymentStatus } from "../../../lib/payments";
import type { Appointment, Patient, VisitFilters } from "../../../types";

export type VisitsFilters = VisitFilters;

export const matchesSearch = (visit: Appointment, patient: Patient | undefined, query: string) => {
  if (!query) return true;
  const haystack = `${visit.trattamento} ${visit.luogo} ${patient?.nome ?? ""} ${patient?.cognome ?? ""} ${patient?.indirizzo ?? ""}`
    .toLowerCase()
    .trim();
  return haystack.includes(query.toLowerCase().trim());
};

export const applyVisitFilters = (
  visits: Appointment[],
  filters: VisitsFilters,
  patientMap: Map<string, Patient>
) => {
  const { period, status, paid, patientId, query, startDate, endDate } = filters;
  const normalizedQuery = query?.toLowerCase().trim() ?? "";
  const now = new Date();

  return visits.filter((visit) => {
    const visitDate = new Date(visit.start);
    const matchesPeriod =
      period === "all" ||
      (period === "today" && visitDate.toDateString() === now.toDateString()) ||
      (period === "week" && visitDate >= addDays(now, -7)) ||
      (period === "month" && visitDate >= addDays(now, -30)) ||
      (period === "custom" &&
        (!startDate || visitDate >= new Date(startDate)) &&
        (!endDate || visitDate <= addDays(new Date(endDate), 1)));

    const matchesStatus = status === "all" || visit.status === status;
    const paymentStatus = getPaymentStatus(visit);
    const matchesPaid =
      paid === "all" || (paid === "paid" ? paymentStatus === "paid" : paymentStatus !== "paid");
    const matchesPatient = !patientId || visit.patientId === patientId;
    const patient = patientMap.get(visit.patientId);
    const matchesText = matchesSearch(visit, patient, normalizedQuery);

    return matchesPeriod && matchesStatus && matchesPaid && matchesPatient && matchesText;
  });
};
