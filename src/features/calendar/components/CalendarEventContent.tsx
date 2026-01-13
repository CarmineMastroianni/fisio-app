import { format } from "date-fns";
import type { AppointmentStatus } from "../../../types";

type CalendarEventContentProps = {
  patientName: string;
  treatment: string;
  visitStatus: AppointmentStatus;
  paymentStatus: "paid" | "partial" | "unpaid";
  viewType: string;
  start: Date | null;
  end: Date | null;
};

const statusBorder: Record<AppointmentStatus, string> = {
  programmata: "border-sky-400",
  completata: "border-emerald-400",
  cancellata: "border-slate-300",
  "no-show": "border-rose-300",
};

const paymentTone: Record<CalendarEventContentProps["paymentStatus"], string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  unpaid: "bg-rose-100 text-rose-700",
};

const paymentLabel: Record<CalendarEventContentProps["paymentStatus"], string> = {
  paid: "Pagata",
  partial: "Parziale",
  unpaid: "Insoluta",
};

export const CalendarEventContent = ({
  patientName,
  treatment,
  visitStatus,
  paymentStatus,
  viewType,
  start,
  end,
}: CalendarEventContentProps) => {
  const isWeek = viewType === "timeGridWeek";
  const isDay = viewType === "timeGridDay";
  const isTimeGrid = isWeek || isDay;
  const title = patientName || treatment;
  const secondary = patientName ? treatment : "";
  const timeLabel =
    start && end ? `${format(start, "HH:mm")}–${format(end, "HH:mm")}` : start ? format(start, "HH:mm") : "";

  return (
    <div className={`fisio-event-content h-full w-full overflow-hidden ${isTimeGrid ? "fisio-timegrid" : "fisio-full"}`}>
      {isTimeGrid && timeLabel ? (
        <div className="fisio-event-line fisio-event-time">{timeLabel}</div>
      ) : null}
      <div className="fisio-event-line fisio-event-title">{title}</div>
      {secondary ? <div className="fisio-event-line fisio-event-subtitle">{secondary}</div> : null}
      {isTimeGrid ? (
        <div className="mt-1 flex min-w-0 items-center">
          <span className={`fisio-chip ${paymentTone[paymentStatus]}`}>
            {paymentLabel[paymentStatus]}
          </span>
        </div>
      ) : (
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
          <span className={`fisio-chip ${paymentTone[paymentStatus]}`}>
            {paymentLabel[paymentStatus]}
          </span>
          <span className="fisio-chip bg-slate-100 text-slate-700">{visitStatus}</span>
        </div>
      )}
    </div>
  );
};
