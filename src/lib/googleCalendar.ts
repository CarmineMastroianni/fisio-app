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
    const res = await fetch(CALENDAR_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEventBody(appointment, patientName)),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string };
    return data.id;
  } catch {
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
    await fetch(`${CALENDAR_API}/${googleEventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEventBody(appointment, patientName)),
    });
  } catch {
    // silenzioso: il calendario Google non è critico
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
