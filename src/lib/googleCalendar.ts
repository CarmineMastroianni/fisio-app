import type { Appointment } from "../types";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const buildEventBody = (appointment: Appointment, patientName: string) => ({
  summary: `${appointment.trattamento} — ${patientName}`,
  location: appointment.luogo || undefined,
  start: { dateTime: appointment.start },
  end: { dateTime: appointment.end },
  description: appointment.notes?.subjective
    ? `Note: ${appointment.notes.subjective}`
    : undefined,
});

export const createCalendarEvent = async (
  accessToken: string,
  appointment: Appointment,
  patientName: string
): Promise<string | null> => {
  try {
    const body = buildEventBody(appointment, patientName);
    const res = await fetch(CALENDAR_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[GoogleCalendar] createEvent failed", res.status, err);
      return null;
    }
    const data = (await res.json()) as { id: string };
    return data.id;
  } catch (e) {
    console.error("[GoogleCalendar] createEvent exception", e);
    return null;
  }
};

export const updateCalendarEvent = async (
  accessToken: string,
  googleEventId: string,
  appointment: Appointment,
  patientName: string
): Promise<void> => {
  try {
    const res = await fetch(`${CALENDAR_API}/${googleEventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEventBody(appointment, patientName)),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[GoogleCalendar] updateEvent failed", res.status, err);
    }
  } catch (e) {
    console.error("[GoogleCalendar] updateEvent exception", e);
  }
};

export const deleteCalendarEvent = async (
  accessToken: string,
  googleEventId: string
): Promise<void> => {
  try {
    await fetch(`${CALENDAR_API}/${googleEventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // silenzioso
  }
};
