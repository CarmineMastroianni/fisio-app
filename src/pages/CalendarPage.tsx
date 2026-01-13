import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import itLocale from "@fullcalendar/core/locales/it";
import { addMonths, addWeeks, addYears, format } from "date-fns";
import { Filter, Users } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Drawer } from "../components/ui/Drawer";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useAddDepositMutation,
  useAppointments,
  useAppointmentsMutation,
  usePatients,
  useRemoveDepositMutation,
  useSettings,
  useUpdateVisitDateTimeMutation,
  useUpdateVisitNotesMutation,
  useUpdateVisitStatusMutation,
} from "../hooks/useData";
import type { Appointment } from "../types";
import { getPaymentStatus } from "../lib/payments";
import { VisitDetailDrawer } from "../features/calendar/components/VisitDetailDrawer";
import { VisitFormDrawer } from "../features/calendar/components/VisitFormDrawer";
import "../styles/fullcalendar-theme.css";

export const CalendarPage = () => {
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: settings } = useSettings();
  const { mutate } = useAppointmentsMutation();
  const { mutate: updateDateTime } = useUpdateVisitDateTimeMutation();
  const { mutate: updateStatus } = useUpdateVisitStatusMutation();
  const { mutate: updateNotes } = useUpdateVisitNotesMutation();
  const { mutate: addDeposit } = useAddDepositMutation();
  const { mutate: removeDeposit } = useRemoveDepositMutation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const calendarRef = useRef<FullCalendar | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ start?: string; end?: string } | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "partial" | "unpaid">("all");
  const [onlyOutstanding, setOnlyOutstanding] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === "undefined") return "timeGridWeek";
    if (window.matchMedia("(max-width: 480px)").matches) return "listWeek";
    if (window.matchMedia("(max-width: 767px)").matches) return "timeGridDay";
    return "timeGridWeek";
  });
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  const [isSmallMobile, setIsSmallMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 480px)").matches : false
  );

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const paymentStatus = getPaymentStatus(apt);
      const matchesPatient = selectedPatientId === "all" || apt.patientId === selectedPatientId;
      const matchesPayment =
        paymentFilter === "all" ? true : paymentStatus === paymentFilter;
      const matchesOutstanding = onlyOutstanding ? paymentStatus !== "paid" : true;
      return matchesPatient && matchesPayment && matchesOutstanding;
    });
  }, [appointments, selectedPatientId, paymentFilter, onlyOutstanding]);

  const events = useMemo(
    () =>
      filteredAppointments.map((apt) => {
        const patient = patientMap.get(apt.patientId);
        const patientName = `${patient?.nome ?? ""} ${patient?.cognome ?? ""}`.trim();
        const paymentStatus = getPaymentStatus(apt);
        return {
          id: apt.id,
          title: patientName || apt.trattamento,
          start: apt.start,
          end: apt.end,
          extendedProps: {
            ...apt,
            patientName,
            treatment: apt.trattamento,
            visitStatus: apt.status,
            paymentStatus,
            paymentStatusLabel: paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta",
          },
        };
      }),
    [filteredAppointments, patientMap]
  );

  const openNew = (start: Date, end: Date) => {
    setEditing(null);
    setPrefill({
      start: format(start, "yyyy-MM-dd'T'HH:mm"),
      end: format(end, "yyyy-MM-dd'T'HH:mm"),
    });
    setFormOpen(true);
  };

  const onSave = ({ appointment, scope, recurrence }: { appointment: Appointment; scope: "single" | "series"; recurrence: { pattern: "none" | "weekly" | "monthly" | "yearly"; count: number } }) => {
    let updated = [...appointments];

    if (editing) {
      if (scope === "series" && editing.seriesId) {
        updated = updated.map((apt) =>
          apt.seriesId === editing.seriesId
            ? { ...apt, ...appointment, id: apt.id, start: apt.start, end: apt.end }
            : apt
        );
      } else {
        updated = updated.map((apt) => (apt.id === editing.id ? appointment : apt));
      }
    } else {
      if (recurrence.pattern === "none") {
        updated.push(appointment);
      } else {
        const seriesId = crypto.randomUUID();
        const occurrences = Array.from({ length: recurrence.count }).map((_, index) => {
          const offset = index;
          const startDate =
            recurrence.pattern === "weekly"
              ? addWeeks(new Date(appointment.start), offset)
              : recurrence.pattern === "monthly"
                ? addMonths(new Date(appointment.start), offset)
                : addYears(new Date(appointment.start), offset);
          const endDate =
            recurrence.pattern === "weekly"
              ? addWeeks(new Date(appointment.end), offset)
              : recurrence.pattern === "monthly"
                ? addMonths(new Date(appointment.end), offset)
                : addYears(new Date(appointment.end), offset);
          return { ...appointment, id: crypto.randomUUID(), start: startDate.toISOString(), end: endDate.toISOString(), seriesId };
        });
        updated = updated.concat(occurrences);
      }
    }

    mutate(updated);
    setFormOpen(false);
    setEditing(null);
    setPrefill(undefined);
  };

  const onDelete = () => {
    if (!editing) return;
    mutate(appointments.filter((apt) => apt.id !== editing.id));
    setFormOpen(false);
    setEditing(null);
  };

  const onEventDrop = (info: { event: { id: string; start: Date | null; end: Date | null } }) => {
    if (!info.event.start || !info.event.end) return;
    updateDateTime({
      visitId: info.event.id,
      start: info.event.start.toISOString(),
      end: info.event.end.toISOString(),
    });
  };

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const formatHHmm = (value: Date) =>
    `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`;

  const formatPatientShort = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      return `${first.charAt(0)}. ${last}`;
    }
    return trimmed.length >= 3 ? trimmed.slice(0, 3) : trimmed;
  };

  const renderEventHtml = (args: {
    viewType: string;
    patientName: string;
    treatment: string;
    location: string;
    start: Date | null;
    end: Date | null;
    visitStatus: Appointment["status"];
    paymentStatus: "paid" | "partial" | "unpaid";
    paymentLabel: string;
    isMobile: boolean;
  }) => {
    const durationMinutes =
      args.start && args.end ? Math.max(0, (args.end.getTime() - args.start.getTime()) / 60000) : 0;
    const timeLabel =
      args.start && args.end
        ? `${formatHHmm(args.start)}–${formatHHmm(args.end)}`
        : args.start
          ? formatHHmm(args.start)
          : "";

    if (args.viewType === "timeGridWeek" || args.viewType === "timeGridDay") {
      const isCompact = durationMinutes > 0 && durationMinutes < 30;
      const chipMarkup = args.isMobile
        ? `
          <div class="fisio-event__chips">
            <span class="fisio-event__chip">${escapeHtml(args.visitStatus)}</span>
            <span class="fisio-event__chip">${escapeHtml(args.paymentLabel)}</span>
          </div>
        `
        : `
          <div class="fisio-event__chips">
            <span class="fisio-event__chip">${escapeHtml(args.visitStatus)}</span>
            <span class="fisio-event__chip">${escapeHtml(args.paymentLabel)}</span>
          </div>
        `;
      return `
        <div class="fisio-event">
          <div class="fisio-event__time">${escapeHtml(timeLabel)}</div>
          <div class="fisio-event__title">${escapeHtml(args.patientName)}</div>
          ${isCompact ? "" : `<div class="fisio-event__subtitle">${escapeHtml(args.treatment)}</div>`}
          ${chipMarkup}
          <span class="fisio-event__dot" aria-hidden="true"></span>
        </div>
      `;
    }

    if (args.viewType === "dayGridMonth") {
      const patientLabel = formatPatientShort(args.patientName) || formatPatientShort(args.treatment) || args.patientName;
      const monthLabel = args.treatment ? `${patientLabel} — ${args.treatment}` : patientLabel;
      return `
        <div class="fisio-month-pill is-${escapeHtml(args.visitStatus)} pay-${escapeHtml(args.paymentStatus)}">
          <span class="fisio-dot fisio-dot--status"></span>
          <span class="fisio-month-text">${escapeHtml(monthLabel)}</span>
          <span class="fisio-dot fisio-dot--pay"></span>
        </div>
      `;
    }

    if (args.viewType === "multiMonthYear") {
      const label = formatPatientShort(args.patientName) || formatPatientShort(args.treatment) || args.patientName;
      return `
        <div class="fisio-year-item is-${escapeHtml(args.visitStatus)} pay-${escapeHtml(args.paymentStatus)}">
          <span class="fisio-dot fisio-dot--status"></span>
          <span class="fisio-year-text">${escapeHtml(label)}</span>
        </div>
      `;
    }

    if (args.viewType === "listWeek") {
      return `
        <div class="fisio-event fisio-event--list">
          <div class="fisio-event__time">${escapeHtml(timeLabel)}</div>
          <div class="fisio-event__title">${escapeHtml(args.patientName)}</div>
          <div class="fisio-event__subtitle">${escapeHtml(args.treatment)}</div>
          ${args.location ? `<div class="fisio-event__meta">Luogo: ${escapeHtml(args.location)}</div>` : ""}
          <div class="fisio-event__chips">
            <span class="fisio-event__chip">${escapeHtml(args.visitStatus)}</span>
            <span class="fisio-event__chip">${escapeHtml(args.paymentLabel)}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="fisio-event">
        <div class="fisio-event__title">${escapeHtml(args.patientName)}</div>
        <div class="fisio-event__subtitle">${escapeHtml(args.treatment)}</div>
      </div>
    `;
  };

  const eventDays = useMemo(() => {
    const set = new Set<string>();
    filteredAppointments.forEach((apt) => {
      const date = format(new Date(apt.start), "yyyy-MM-dd");
      set.add(date);
    });
    return set;
  }, [filteredAppointments]);

  const selectedVisit = appointments.find((apt) => apt.id === selectedVisitId) ?? null;
  const selectedPatient = selectedVisit ? patientMap.get(selectedVisit.patientId) ?? null : null;
  const activeFiltersCount =
    (selectedPatientId !== "all" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0) + (onlyOutstanding ? 1 : 0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 480px)");
    const onChange = (event: MediaQueryListEvent) => setIsSmallMobile(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const nextView = isMobile ? (isSmallMobile ? "listWeek" : "timeGridDay") : "timeGridWeek";
    if (api.view.type !== nextView) {
      api.changeView(nextView);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!searchParams.get("new")) return;
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openNew(start, end);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const container = calendarContainerRef.current;
    const api = calendarRef.current?.getApi();
    if (!container || !api) return;
    let startX = 0;
    let startY = 0;
    let isTouching = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      isTouching = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!isTouching) return;
      isTouching = false;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      if (deltaX > 0) api.prev();
      else api.next();
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  if (!settings) return null;

  return (
    <div className="w-full space-y-6 pb-24 lg:pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Calendario visite</h2>
          <p className="text-sm text-slate-500">Gestisci agenda, ricorrenze e pagamenti in un unico punto.</p>
        </div>
        {!isMobile && (
          <Button size="sm" onClick={() => openNew(new Date(), new Date(Date.now() + 60 * 60 * 1000))}>
            + Nuova visita
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:hidden">
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-500 shadow-sm">
          {[
            { id: "timeGridDay", label: "Giorno" },
            { id: "timeGridWeek", label: "Settimana" },
            { id: "listWeek", label: "Lista" },
            { id: "dayGridMonth", label: "Mese" },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => {
                calendarRef.current?.getApi().changeView(view.id);
                setActiveView(view.id);
              }}
              className={`rounded-xl px-3 py-2 ${
                activeView === view.id ? "bg-teal-600 text-white" : "text-slate-500"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            calendarRef.current?.getApi().today();
            calendarRef.current?.getApi().scrollToTime?.("08:00:00");
          }}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
        >
          Oggi
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
        >
          <Filter className="h-4 w-4" />
          Filtri{activeFiltersCount ? ` (${activeFiltersCount})` : ""}
        </button>
      </div>

      {!isMobile && (
        <Card className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
            <label className="text-xs font-semibold text-slate-500">
              Paziente
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <Users className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedPatientId}
                  onChange={(event) => setSelectedPatientId(event.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                >
                  <option value="all">Tutti</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.nome} {patient.cognome}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Stato pagamento
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value as "all" | "paid" | "partial" | "unpaid")}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Tutti</option>
                <option value="paid">Pagate</option>
                <option value="partial">Parziali</option>
                <option value="unpaid">Insolute</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={onlyOutstanding}
                onChange={(event) => setOnlyOutstanding(event.target.checked)}
                className="h-4 w-4"
              />
              Solo insoluti
            </label>
            <Button size="sm" onClick={() => openNew(new Date(), new Date(Date.now() + 60 * 60 * 1000))}>
              + Nuova visita
            </Button>
          </div>

          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-500">
            <span className="font-semibold">Legenda:</span>
            <Badge label="Programmata" tone="info" />
            <Badge label="Completata" tone="success" />
            <Badge label="Cancellata/No-show" tone="neutral" />
            <Badge label="Pagata" tone="success" />
            <Badge label="Parziale" tone="warning" />
            <Badge label="Insoluta" tone="danger" />
          </div>
        </Card>
      )}

      <Card className="min-h-[calc(100vh-220px)] overflow-hidden">
        <div ref={calendarContainerRef}>
          <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
          initialView={isMobile ? (isSmallMobile ? "listWeek" : "timeGridDay") : "timeGridWeek"}
          locale={itLocale}
          firstDay={1}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: isMobile
              ? ""
              : "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{
            today: "Oggi",
            month: "Mese",
            week: "Settimana",
            day: "Giorno",
            year: "Anno",
            list: "Lista",
          }}
          views={{
            timeGridDay: { buttonText: "Giorno" },
            timeGridWeek: { buttonText: "Settimana" },
            dayGridMonth: { buttonText: "Mese" },
            multiMonthYear: { type: "multiMonthYear", buttonText: "Anno" },
            listWeek: { buttonText: "Lista" },
          }}
          titleFormat={{ month: "short", day: "numeric", year: "numeric" }}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          stickyHeaderDates
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          scrollTime="08:00:00"
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          allDaySlot={false}
          expandRows
          height={isMobile ? "calc(100vh - 240px)" : "calc(100vh - 300px)"}
          contentHeight="auto"
          handleWindowResize
          eventDisplay="block"
          displayEventTime={false}
          eventMinHeight={36}
          eventShortHeight={36}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayMaxEvents
          dayMaxEventRows={isMobile ? 2 : undefined}
          slotEventOverlap
          eventOverlap
          events={events}
          datesSet={(info) => setActiveView(info.view.type)}
          selectable
          editable
          nowIndicator
          select={(info) => openNew(info.start, info.end)}
          dateClick={(info) => {
            if (info.view.type === "multiMonthYear") {
              calendarRef.current?.getApi().changeView("timeGridWeek", info.date);
              return;
            }
            const start = new Date(info.date);
            start.setHours(9, 0, 0, 0);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            openNew(start, end);
          }}
          eventClick={(info) => {
            const apt = info.event.extendedProps as Appointment;
            if (info.view.type === "multiMonthYear") {
              calendarRef.current?.getApi().changeView("timeGridWeek", info.event.start ?? new Date());
              return;
            }
            setSelectedVisitId(apt.id);
          }}
          eventDrop={(info) => onEventDrop(info)}
          eventResize={(info) => onEventDrop(info)}
          eventClassNames={(arg) => {
            const ext = arg.event.extendedProps as Appointment & {
              visitStatus?: Appointment["status"];
              paymentStatus?: string;
            };
            const view = arg.view.type;
            const classes: string[] = ["fc-event-card", "fisio-event"];
            if (view === "timeGridWeek" || view === "timeGridDay") {
              classes.push("fisio-view--timegrid");
            } else if (view === "dayGridMonth") {
              classes.push("fisio-view--month");
            } else if (view === "multiMonthYear") {
              classes.push("fisio-view--year");
            } else if (view === "listWeek") {
              classes.push("fisio-view--list");
            }
            const status = ext.visitStatus ?? ext.status;
            if (status === "completata") classes.push("is-completed");
            else if (status === "cancellata" || status === "no-show") classes.push("is-cancelled");
            else classes.push("is-scheduled");

            const paymentStatus = ext.paymentStatus ?? getPaymentStatus(ext);
            if (paymentStatus === "paid") classes.push("pay-paid");
            else if (paymentStatus === "partial") classes.push("pay-partial");
            else classes.push("pay-unpaid");

            return classes;
          }}
          eventContent={(arg) => {
            const ext = arg.event.extendedProps as Appointment & {
              patientName?: string;
              treatment?: string;
              paymentStatusLabel?: string;
              paymentStatus?: string;
              visitStatus?: Appointment["status"];
            };
            const paymentStatus = (ext.paymentStatus ?? "unpaid") as "paid" | "partial" | "unpaid";
            const patientName = ext.patientName || arg.event.title || "Visita";
            return {
              html: renderEventHtml({
                viewType: arg.view.type,
                patientName,
                treatment: ext.treatment ?? "",
                location: ext.luogo ?? "",
                start: arg.event.start,
                end: arg.event.end,
                visitStatus: ext.visitStatus ?? ext.status,
                paymentStatus,
                paymentLabel:
                  ext.paymentStatusLabel ??
                  (paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"),
                isMobile,
              }),
            };
          }}
          eventDidMount={(info) => {
            if (info.view.type === "timeGridWeek" || info.view.type === "timeGridDay") {
              const hasContent = info.el.querySelector(".fisio-event");
              if (!hasContent) {
                const main = info.el.querySelector(".fc-event-main");
                if (main) {
                  main.innerHTML = renderEventHtml({
                    viewType: info.view.type,
                    patientName: info.event.title || "Visita",
                    treatment: "",
                    location: "",
                    start: info.event.start,
                    end: info.event.end,
                    visitStatus: "programmata",
                    paymentStatus: "unpaid",
                    paymentLabel: "",
                    isMobile,
                  });
                }
              }
            }
          }}
          dayCellClassNames={(arg) =>
            eventDays.has(format(arg.date, "yyyy-MM-dd")) ? ["fc-day-has-events"] : []
          }
        />
        </div>
      </Card>

      {(appointmentsLoading || patientsLoading) && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
          Caricamento calendario...
        </div>
      )}
      {!appointmentsLoading && filteredAppointments.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
          Nessuna visita con i filtri attivi.
          <div className="mt-3 flex justify-center">
            <Button size="sm" onClick={() => openNew(new Date(), new Date(Date.now() + 60 * 60 * 1000))}>
              Nuova visita
            </Button>
          </div>
        </div>
      )}

      <Drawer open={filtersOpen} title="Filtri" onClose={() => setFiltersOpen(false)}>
        <div className="space-y-4">
          <label className="text-xs font-semibold text-slate-500">
            Paziente
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <Users className="h-4 w-4 text-slate-400" />
              <select
                value={selectedPatientId}
                onChange={(event) => setSelectedPatientId(event.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              >
                <option value="all">Tutti</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.nome} {patient.cognome}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Stato pagamento
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as "all" | "paid" | "partial" | "unpaid")}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Tutti</option>
              <option value="paid">Pagate</option>
              <option value="partial">Parziali</option>
              <option value="unpaid">Insolute</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={onlyOutstanding}
              onChange={(event) => setOnlyOutstanding(event.target.checked)}
              className="h-4 w-4"
            />
            Solo insoluti
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPatientId("all");
                setPaymentFilter("all");
                setOnlyOutstanding(false);
              }}
            >
              Reset
            </Button>
            <Button size="sm" onClick={() => setFiltersOpen(false)}>
              Applica
            </Button>
          </div>
        </div>
      </Drawer>


      <VisitDetailDrawer
        open={Boolean(selectedVisitId)}
        visit={selectedVisit}
        patient={selectedPatient}
        onClose={() => setSelectedVisitId(null)}
        onUpdateStatus={(visitId, status) => updateStatus({ visitId, status })}
        onAddDeposit={(visitId, deposit) => addDeposit({ visitId, deposit })}
        onRemoveDeposit={(visitId, depositId) => removeDeposit({ visitId, depositId })}
        onUpdateNotes={(visitId, notes) => updateNotes({ visitId, notes })}
        onOpenPatient={(patientId) => navigate(`/patients/${patientId}`)}
        onOpenVisit={(visitId) => navigate(`/patients/${selectedVisit?.patientId ?? ""}/visits/${visitId}`)}
      />

      <VisitFormDrawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setPrefill(undefined);
        }}
        patients={patients}
        settings={settings}
        initial={editing}
        prefill={prefill}
        onSave={onSave}
        onDelete={editing ? onDelete : undefined}
      />
    </div>
  );
};
