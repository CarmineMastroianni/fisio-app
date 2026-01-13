import type { Appointment, Deposit } from "../types";
import { formatCurrency } from "./utils";

export const sumDeposits = (deposits?: Deposit[]) =>
  (deposits ?? []).reduce((sum, deposit) => sum + deposit.amount, 0);

export const getTotalAmount = (visit: Appointment) => visit.totalAmount ?? visit.costo;

export const getPaidAmount = (visit: Appointment) => {
  const depositsTotal = sumDeposits(visit.deposits);
  if (depositsTotal > 0) return depositsTotal;
  if (visit.payment?.paid) return visit.payment.amountPaid ?? getTotalAmount(visit);
  return visit.payment?.amountPaid ?? 0;
};

export const getOutstandingAmount = (visit: Appointment) =>
  Math.max(getTotalAmount(visit) - getPaidAmount(visit), 0);

export const getPaymentStatus = (visit: Appointment) => {
  const total = getTotalAmount(visit);
  const paid = getPaidAmount(visit);
  if (paid >= total && total > 0) return "paid";
  if (paid > 0 && paid < total) return "partial";
  return "unpaid";
};

export const getLastDeposit = (visit: Appointment) => {
  const deposits = visit.deposits ?? [];
  if (!deposits.length) return undefined;
  return deposits.reduce((latest, current) =>
    new Date(current.paidAt) > new Date(latest.paidAt) ? current : latest
  );
};

export { formatCurrency };
