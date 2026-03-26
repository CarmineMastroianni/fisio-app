import { addDays } from "date-fns";
import { supabase } from "./supabase";
import { getOutstandingAmount, getPaidAmount, getPaymentStatus } from "./payments";
import type {
  Appointment,
  ClinicalNotes,
  Deposit,
  Patient,
  PatientDocument,
  Settings,
  VisitAttachment,
  VisitFilters,
  VisitNotes,
  VisitPayment,
} from "../types";

// ============================================================
// MAPPING HELPERS  (DB snake_case ↔ TypeScript camelCase)
// ============================================================

const getCurrentUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (error || !userId) throw new Error("Non autenticato");
  return userId;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPatient = (row: any): Patient => ({
  id: row.id as string,
  nome: (row.nome as string) ?? "",
  cognome: (row.cognome as string) ?? "",
  telefono: (row.telefono as string) ?? "",
  email: (row.email as string) ?? "",
  indirizzo: (row.indirizzo as string) ?? "",
  noteCliniche: (row.note_cliniche as string) ?? "",
  noteLogistiche: (row.note_logistiche as string | undefined) ?? undefined,
  tags: (row.tags as string[]) ?? [],
  clinicalNotes: row.clinical_notes as ClinicalNotes | undefined,
  createdAt: row.created_at as string,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAppointment = (row: any): Appointment => ({
  id: row.id as string,
  patientId: row.patient_id as string,
  start: row.start_time as string,
  end: row.end_time as string,
  luogo: (row.luogo as string) ?? "",
  trattamento: (row.trattamento as string) ?? "",
  costo: Number(row.costo),
  totalAmount: row.total_amount != null ? Number(row.total_amount) : undefined,
  status: (row.status as Appointment["status"]) ?? "programmata",
  payment: (row.payment as VisitPayment) ?? { paid: false },
  deposits: (row.deposits as Deposit[]) ?? [],
  notes: row.notes as VisitNotes | undefined,
  seriesId: row.series_id as string | undefined,
  googleEventId: row.google_event_id as string | undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDocument = (row: any): PatientDocument => ({
  id: row.id as string,
  patientId: row.patient_id as string,
  name: row.name as string,
  category: row.category as PatientDocument["category"],
  uploadedAt: row.uploaded_at as string,
  dataUrl: row.data_url as string | undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAttachment = (row: any): VisitAttachment => ({
  id: row.id as string,
  visitId: row.visit_id as string,
  name: row.name as string,
  category: row.category as VisitAttachment["category"],
  uploadedAt: row.uploaded_at as string,
  dataUrl: row.data_url as string | undefined,
});

const appointmentToRow = (apt: Appointment, userId?: string) => ({
  ...(userId ? { user_id: userId } : {}),
  id: apt.id,
  patient_id: apt.patientId,
  start_time: apt.start,
  end_time: apt.end,
  luogo: apt.luogo,
  trattamento: apt.trattamento,
  costo: apt.costo,
  total_amount: apt.totalAmount ?? apt.costo,
  status: apt.status,
  payment: apt.payment ?? { paid: false },
  deposits: apt.deposits ?? [],
  notes: apt.notes ?? null,
  series_id: apt.seriesId ?? null,
  google_event_id: apt.googleEventId ?? null,
});

// ============================================================
// PATIENTS
// ============================================================

export const getPatients = async (): Promise<Patient[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", userId)
    .order("cognome")
    .order("nome");
  if (error) throw error;
  return (data ?? []).map(mapPatient);
};

export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return mapPatient(data);
};

export const createPatient = async (patient: Patient): Promise<Patient> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      id: patient.id,
      user_id: userId,
      nome: patient.nome,
      cognome: patient.cognome,
      telefono: patient.telefono,
      email: patient.email,
      indirizzo: patient.indirizzo,
      note_cliniche: patient.noteCliniche,
      note_logistiche: patient.noteLogistiche ?? null,
      tags: patient.tags ?? [],
      clinical_notes: patient.clinicalNotes ?? null,
      created_at: patient.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapPatient(data);
};

export const updatePatient = async (patient: Patient): Promise<Patient> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("patients")
    .update({
      nome: patient.nome,
      cognome: patient.cognome,
      telefono: patient.telefono,
      email: patient.email,
      indirizzo: patient.indirizzo,
      note_cliniche: patient.noteCliniche,
      note_logistiche: patient.noteLogistiche ?? null,
      tags: patient.tags ?? [],
      clinical_notes: patient.clinicalNotes ?? null,
    })
    .eq("id", patient.id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return mapPatient(data);
};

/** @deprecated Usa createPatient o updatePatient */
export const setPatients = async (patients: Patient[]): Promise<void> => {
  const userId = await getCurrentUserId();
  const rows = patients.map((p) => ({
    id: p.id,
    user_id: userId,
    nome: p.nome,
    cognome: p.cognome,
    telefono: p.telefono,
    email: p.email,
    indirizzo: p.indirizzo,
    note_cliniche: p.noteCliniche,
    note_logistiche: p.noteLogistiche ?? null,
    tags: p.tags ?? [],
    clinical_notes: p.clinicalNotes ?? null,
    created_at: p.createdAt,
  }));
  const { error } = await supabase.from("patients").upsert(rows);
  if (error) throw error;
};

export const updatePatientNotes = async (patientId: string, notes: ClinicalNotes): Promise<Patient | null> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("patients")
    .update({ clinical_notes: { ...notes, updatedAt: new Date().toISOString() } })
    .eq("id", patientId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return mapPatient(data);
};

export const deletePatient = async (patientId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId)
    .eq("user_id", userId);
  if (error) throw error;
};

// ============================================================
// APPOINTMENTS
// ============================================================

export const getAppointments = async (): Promise<Appointment[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .order("start_time");
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
};

export const getVisitsByPatientId = async (patientId: string): Promise<Appointment[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .order("start_time", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
};

export const getVisitById = async (visitId: string): Promise<Appointment | null> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", visitId)
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return mapAppointment(data);
};

export const upsertAppointment = async (appointment: Appointment): Promise<Appointment> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("appointments")
    .upsert(appointmentToRow(appointment, userId))
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
};

export const createAppointments = async (appointments: Appointment[]): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .insert(appointments.map((appointment) => appointmentToRow(appointment, userId)));
  if (error) throw error;
};

/** @deprecated Usa upsertAppointment o createAppointments */
export const setAppointments = async (appointments: Appointment[]): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .upsert(appointments.map((appointment) => appointmentToRow(appointment, userId)));
  if (error) throw error;
};

export const updateVisitNotes = async (visitId: string, notes: VisitNotes): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .update({ notes })
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const updateVisitPayment = async (visitId: string, payment: VisitPayment): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .update({ payment })
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const addDeposit = async (visitId: string, deposit: Deposit): Promise<void> => {
  const userId = await getCurrentUserId();
  const { data: row, error: fetchError } = await supabase
    .from("appointments")
    .select("deposits, costo, total_amount")
    .eq("id", visitId)
    .eq("user_id", userId)
    .single();
  if (fetchError) throw fetchError;

  const deposits = [...((row.deposits as Deposit[]) ?? []), deposit];
  const totalAmount = Number(row.total_amount ?? row.costo);
  const paidAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
  const payment: VisitPayment = {
    paid: totalAmount > 0 && paidAmount >= totalAmount,
    method: deposit.method,
    paidAt: deposit.paidAt,
    amountPaid: paidAmount,
  };

  const { error } = await supabase
    .from("appointments")
    .update({ deposits, payment })
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const removeDeposit = async (visitId: string, depositId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { data: row, error: fetchError } = await supabase
    .from("appointments")
    .select("deposits, costo, total_amount")
    .eq("id", visitId)
    .eq("user_id", userId)
    .single();
  if (fetchError) throw fetchError;

  const deposits = ((row.deposits as Deposit[]) ?? []).filter((d) => d.id !== depositId);
  const totalAmount = Number(row.total_amount ?? row.costo);
  const paidAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
  const lastDeposit = deposits[deposits.length - 1];
  const payment: VisitPayment = {
    paid: totalAmount > 0 && paidAmount >= totalAmount,
    method: lastDeposit?.method,
    paidAt: lastDeposit?.paidAt,
    amountPaid: paidAmount > 0 ? paidAmount : undefined,
  };

  const { error } = await supabase
    .from("appointments")
    .update({ deposits, payment })
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const updateVisitStatus = async (visitId: string, status: Appointment["status"]): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const updateVisitDateTime = async (visitId: string, start: string, end: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .update({ start_time: start, end_time: end })
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const markVisitCompleted = async (visitId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "completata" })
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const deleteVisit = async (visitId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", visitId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const duplicateVisit = async (visitId: string): Promise<Appointment | null> => {
  const original = await getVisitById(visitId);
  if (!original) return null;
  const copy: Appointment = {
    ...original,
    id: crypto.randomUUID(),
    status: "programmata",
    payment: { paid: false },
    deposits: [],
    totalAmount: original.totalAmount ?? original.costo,
  };
  return upsertAppointment(copy);
};

export const listVisits = async (filters: VisitFilters): Promise<Appointment[]> => {
  const { period, status, paid, patientId, query, startDate, endDate } = filters;
  const now = new Date();
  const userId = await getCurrentUserId();

  let queryBuilder = supabase.from("appointments").select("*").eq("user_id", userId);

  if (status !== "all") {
    queryBuilder = queryBuilder.eq("status", status);
  }
  if (patientId) {
    queryBuilder = queryBuilder.eq("patient_id", patientId);
  }
  if (period === "today") {
    const startOfDay = new Date(now.toDateString()).toISOString();
    const endOfDay = addDays(new Date(now.toDateString()), 1).toISOString();
    queryBuilder = queryBuilder.gte("start_time", startOfDay).lt("start_time", endOfDay);
  } else if (period === "week") {
    queryBuilder = queryBuilder.gte("start_time", addDays(now, -7).toISOString());
  } else if (period === "month") {
    queryBuilder = queryBuilder.gte("start_time", addDays(now, -30).toISOString());
  } else if (period === "custom") {
    if (startDate) queryBuilder = queryBuilder.gte("start_time", new Date(startDate).toISOString());
    if (endDate) queryBuilder = queryBuilder.lt("start_time", addDays(new Date(endDate), 1).toISOString());
  }

  const { data, error } = await queryBuilder.order("start_time", { ascending: false });
  if (error) throw error;

  let appointments = (data ?? []).map(mapAppointment);

  // Payment filter (client-side — dipende da deposits JSON)
  if (paid !== "all") {
    appointments = appointments.filter((v) =>
      paid === "paid" ? getPaymentStatus(v) === "paid" : getPaymentStatus(v) !== "paid"
    );
  }

  // Text search: include anche nome/cognome paziente
  const normalizedQuery = query?.toLowerCase().trim() ?? "";
  if (normalizedQuery) {
    const patients = await getPatients();
    const patientMap = new Map(patients.map((p) => [p.id, p]));
    appointments = appointments.filter((v) => {
      const p = patientMap.get(v.patientId);
      const blob = `${v.trattamento} ${v.luogo} ${p?.nome ?? ""} ${p?.cognome ?? ""} ${p?.indirizzo ?? ""}`.toLowerCase();
      return blob.includes(normalizedQuery);
    });
  }

  return appointments;
};

// ============================================================
// SETTINGS
// ============================================================

const DEFAULT_SETTINGS: Settings = {
  tariffaStandard: 70,
  googleCalendarEnabled: false,
  trattamenti: [
    { id: crypto.randomUUID(), nome: "Terapia manuale", durata: 60, costoDefault: 75 },
    { id: crypto.randomUUID(), nome: "Rieducazione posturale", durata: 45, costoDefault: 65 },
    { id: crypto.randomUUID(), nome: "Rieducazione funzionale", durata: 50, costoDefault: 80 },
    { id: crypto.randomUUID(), nome: "Riabilitazione sportiva", durata: 60, costoDefault: 85 },
  ],
  metodiPagamento: [
    { id: crypto.randomUUID(), nome: "Contanti" },
    { id: crypto.randomUUID(), nome: "POS" },
    { id: crypto.randomUUID(), nome: "Bonifico" },
  ],
};

export const getSettings = async (): Promise<Settings> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("settings").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return {
    tariffaStandard: Number(data.tariffa_standard),
    trattamenti: (data.trattamenti as Settings["trattamenti"]) ?? DEFAULT_SETTINGS.trattamenti,
    metodiPagamento: (data.metodi_pagamento as Settings["metodiPagamento"]) ?? DEFAULT_SETTINGS.metodiPagamento,
    googleCalendarEnabled: (data.google_calendar_enabled as boolean) ?? false,
  };
};

export const setSettings = async (settings: Settings): Promise<void> => {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Non autenticato");

  const { error } = await supabase.from("settings").upsert({
    user_id: userId,
    tariffa_standard: settings.tariffaStandard,
    trattamenti: settings.trattamenti,
    metodi_pagamento: settings.metodiPagamento,
    google_calendar_enabled: settings.googleCalendarEnabled ?? false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
};

// ============================================================
// PATIENT DOCUMENTS
// ============================================================

export const getDocumentsByPatient = async (patientId: string): Promise<PatientDocument[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("patient_documents")
    .select("*")
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocument);
};

export const addPatientDocument = async (document: PatientDocument): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("patient_documents").insert({
    id: document.id,
    user_id: userId,
    patient_id: document.patientId,
    name: document.name,
    category: document.category,
    uploaded_at: document.uploadedAt,
    data_url: document.dataUrl ?? null,
  });
  if (error) throw error;
};

export const removePatientDocument = async (documentId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("patient_documents").delete().eq("id", documentId).eq("user_id", userId);
  if (error) throw error;
};

// ============================================================
// VISIT ATTACHMENTS
// ============================================================

export const getVisitAttachments = async (visitId: string): Promise<VisitAttachment[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("visit_attachments")
    .select("*")
    .eq("user_id", userId)
    .eq("visit_id", visitId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAttachment);
};

export const getVisitAttachmentsByPatientId = async (patientId: string): Promise<VisitAttachment[]> => {
  const userId = await getCurrentUserId();
  const visits = await getVisitsByPatientId(patientId);
  const visitIds = visits.map((v) => v.id);
  if (visitIds.length === 0) return [];

  const { data, error } = await supabase
    .from("visit_attachments")
    .select("*")
    .eq("user_id", userId)
    .in("visit_id", visitIds)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAttachment);
};

export const addVisitAttachment = async (attachment: VisitAttachment): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("visit_attachments").insert({
    id: attachment.id,
    user_id: userId,
    visit_id: attachment.visitId,
    name: attachment.name,
    category: attachment.category,
    uploaded_at: attachment.uploadedAt,
    data_url: attachment.dataUrl ?? null,
  });
  if (error) throw error;
};

export const removeVisitAttachment = async (attachmentId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("visit_attachments").delete().eq("id", attachmentId).eq("user_id", userId);
  if (error) throw error;
};

// ============================================================
// PATIENT KPI
// ============================================================

export const computePatientKpi = async (patientId: string) => {
  const visits = await getVisitsByPatientId(patientId);
  const now = new Date();
  const nextVisit = visits
    .filter((v) => new Date(v.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  const outstandingTotal = visits
    .filter((v) => getPaymentStatus(v) !== "paid")
    .reduce((sum, v) => sum + getOutstandingAmount(v), 0);
  const paidTotal = visits
    .filter((v) => getPaymentStatus(v) === "paid")
    .reduce((sum, v) => sum + getPaidAmount(v), 0);
  return { nextVisit, outstandingTotal, paidTotal };
};

// ============================================================
// COMPAT / LEGACY (no-op con Supabase)
// ============================================================
export const ensureSeed = (): void => { /* no-op con Supabase */ };
export const migrateLegacyVisits = async (): Promise<void> => { /* no-op con Supabase */ };
