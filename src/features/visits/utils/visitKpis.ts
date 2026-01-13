import { addDays } from "date-fns";
import { formatCurrency, getOutstandingAmount, getPaidAmount, getPaymentStatus } from "../../../lib/payments";
import type { Appointment } from "../../../types";

export type VisitsKpis = {
  todayCount: number;
  next7Count: number;
  unpaidCount: number;
  unpaidTotal: number;
  toCompleteCount: number;
  monthPaidTotal: number;
  monthPaidCount: number;
  monthPaidLabel: string;
  unpaidLabel: string;
};

export const computeVisitsKpis = (visits: Appointment[], now = new Date()): VisitsKpis => {
  const todayCount = visits.filter((visit) =>
    new Date(visit.start).toDateString() === now.toDateString()
  ).length;

  const next7Count = visits.filter((visit) => {
    const date = new Date(visit.start);
    return date >= now && date <= addDays(now, 7);
  }).length;

  const unpaidVisits = visits.filter((visit) => getPaymentStatus(visit) !== "paid");
  const unpaidCount = unpaidVisits.length;
  const unpaidTotal = unpaidVisits.reduce((sum, visit) => sum + getOutstandingAmount(visit), 0);

  const toCompleteCount = visits.filter((visit) => {
    const date = new Date(visit.start);
    return date < now && visit.status !== "completata" && visit.status !== "cancellata";
  }).length;

  const monthPaid = visits.filter((visit) => {
    const paidAt = visit.payment.paidAt ? new Date(visit.payment.paidAt) : new Date(visit.start);
    return getPaymentStatus(visit) === "paid" && paidAt.getMonth() === now.getMonth() && paidAt.getFullYear() === now.getFullYear();
  });
  const monthPaidCount = monthPaid.length;
  const monthPaidTotal = monthPaid.reduce((sum, visit) => sum + getPaidAmount(visit), 0);

  return {
    todayCount,
    next7Count,
    unpaidCount,
    unpaidTotal,
    toCompleteCount,
    monthPaidTotal,
    monthPaidCount,
    monthPaidLabel: `${monthPaidCount} pagamenti`,
    unpaidLabel: formatCurrency(unpaidTotal),
  };
};
