import { format, isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);

export const formatDateTime = (value: string) => format(parseISO(value), "dd MMM, HH:mm");

export const formatDate = (value: string) => format(parseISO(value), "dd MMM yyyy");

export const isToday = (value: string) => isSameDay(parseISO(value), new Date());

export const isInCurrentWeek = (value: string) =>
  isWithinInterval(parseISO(value), {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

export const toIso = (value: Date) => value.toISOString();

export const clampText = (value: string, max = 120) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;
