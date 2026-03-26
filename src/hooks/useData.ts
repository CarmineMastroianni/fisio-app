import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDeposit,
  addPatientDocument,
  addVisitAttachment,
  createAppointments,
  createPatient,
  deleteVisit,
  duplicateVisit,
  computePatientKpi,
  getAppointments,
  getDocumentsByPatient,
  getPatientById,
  getPatients,
  getSettings,
  getVisitAttachments,
  getVisitAttachmentsByPatientId,
  getVisitById,
  getVisitsByPatientId,
  listVisits,
  markVisitCompleted,
  removeDeposit,
  removePatientDocument,
  removeVisitAttachment,
  setSettings,
  updatePatient,
  updateVisitDateTime,
  updateVisitNotes,
  updateVisitPayment,
  updateVisitStatus,
  upsertAppointment,
} from "../lib/storage";
import type {
  Appointment,
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
// QUERY HOOKS
// ============================================================

export const usePatients = () =>
  useQuery({
    queryKey: ["patients"],
    queryFn: () => getPatients(),
  });

export const usePatient = (patientId?: string) =>
  useQuery({
    queryKey: ["patients", patientId],
    queryFn: () => (patientId ? getPatientById(patientId) : null),
    enabled: Boolean(patientId),
  });

export const useAppointments = () =>
  useQuery({
    queryKey: ["appointments"],
    queryFn: () => getAppointments(),
  });

export const useVisitsList = (filters: VisitFilters) =>
  useQuery({
    queryKey: ["appointments", "list", filters],
    queryFn: () => listVisits(filters),
  });

export const useVisitsByPatient = (patientId?: string) =>
  useQuery({
    queryKey: ["appointments", "patient", patientId],
    queryFn: () => (patientId ? getVisitsByPatientId(patientId) : []),
    enabled: Boolean(patientId),
  });

export const useVisit = (visitId?: string) =>
  useQuery({
    queryKey: ["appointments", "single", visitId],
    queryFn: () => (visitId ? getVisitById(visitId) : null),
    enabled: Boolean(visitId),
  });

export const usePatientKpi = (patientId?: string) =>
  useQuery({
    queryKey: ["patient-kpi", patientId],
    queryFn: () => (patientId ? computePatientKpi(patientId) : null),
    enabled: Boolean(patientId),
  });

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });

export const useDocuments = (patientId?: string) =>
  useQuery({
    queryKey: ["documents", patientId],
    queryFn: () => (patientId ? getDocumentsByPatient(patientId) : []),
    enabled: Boolean(patientId),
  });

export const useVisitAttachments = (visitId?: string) =>
  useQuery({
    queryKey: ["visit-attachments", visitId],
    queryFn: () => (visitId ? getVisitAttachments(visitId) : []),
    enabled: Boolean(visitId),
  });

export const useVisitAttachmentsByPatient = (patientId?: string) =>
  useQuery({
    queryKey: ["visit-attachments", "patient", patientId],
    queryFn: () => (patientId ? getVisitAttachmentsByPatientId(patientId) : []),
    enabled: Boolean(patientId),
  });

// ============================================================
// PATIENT MUTATIONS
// ============================================================

export const useCreatePatientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patient: Patient) => createPatient(patient),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"], exact: false }),
  });
};

export const useUpdatePatientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patient: Patient) => updatePatient(patient),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"], exact: false }),
  });
};

// ============================================================
// APPOINTMENT MUTATIONS
// ============================================================

export const useUpsertAppointmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment: Appointment) => upsertAppointment(appointment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useCreateAppointmentsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointments: Appointment[]) => createAppointments(appointments),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) => setSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
};

export const useAddDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (document: PatientDocument) => addPatientDocument(document),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"], exact: false }),
  });
};

export const useRemoveDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; patientId: string }) => removePatientDocument(payload.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"], exact: false }),
  });
};

export const useAddVisitAttachmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachment: VisitAttachment) => addVisitAttachment(attachment),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["visit-attachments", variables.visitId] }),
        queryClient.invalidateQueries({ queryKey: ["visit-attachments"], exact: false }),
      ]),
  });
};

export const useRemoveVisitAttachmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; visitId: string }) => removeVisitAttachment(payload.id),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["visit-attachments", variables.visitId] }),
        queryClient.invalidateQueries({ queryKey: ["visit-attachments"], exact: false }),
      ]),
  });
};

export const useUpdateVisitNotesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { visitId: string; notes: VisitNotes }) =>
      updateVisitNotes(payload.visitId, payload.notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useUpdateVisitPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { visitId: string; payment: VisitPayment }) =>
      updateVisitPayment(payload.visitId, payload.payment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useAddDepositMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { visitId: string; deposit: Deposit }) =>
      addDeposit(payload.visitId, payload.deposit),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useRemoveDepositMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { visitId: string; depositId: string }) =>
      removeDeposit(payload.visitId, payload.depositId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useUpdateVisitStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { visitId: string; status: Appointment["status"] }) =>
      updateVisitStatus(payload.visitId, payload.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useUpdateVisitDateTimeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { visitId: string; start: string; end: string }) =>
      updateVisitDateTime(payload.visitId, payload.start, payload.end),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useMarkVisitCompletedMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => markVisitCompleted(visitId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useDeleteVisitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => deleteVisit(visitId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useDuplicateVisitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => duplicateVisit(visitId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};
