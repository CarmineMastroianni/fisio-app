import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDeposit,
  addPatientDocument,
  addVisitAttachment,
  deleteVisit,
  computePatientKpi,
  getAppointments,
  listVisits,
  getDocumentsByPatient,
  getPatientById,
  getPatients,
  getSettings,
  getVisitAttachments,
  getVisitAttachmentsByPatientId,
  getVisitById,
  getVisitsByPatientId,
  removePatientDocument,
  removeVisitAttachment,
  duplicateVisit,
  markVisitCompleted,
  removeDeposit,
  setAppointments,
  setPatients,
  setSettings,
  updateVisitDateTime,
  updateVisitNotes,
  updateVisitPayment,
  updateVisitStatus,
} from "../lib/storage";
import type {
  Appointment,
  Deposit,
  Patient,
  PatientDocument,
  Settings,
  VisitAttachment,
  VisitNotes,
  VisitPayment,
  VisitFilters,
} from "../types";

export const usePatients = () =>
  useQuery({
    queryKey: ["patients"],
    queryFn: async () => getPatients(),
  });

export const usePatient = (patientId?: string) =>
  useQuery({
    queryKey: ["patients", patientId],
    queryFn: async () => (patientId ? getPatientById(patientId) : null),
    enabled: Boolean(patientId),
  });

export const useAppointments = () =>
  useQuery({
    queryKey: ["appointments"],
    queryFn: async () => getAppointments(),
  });

export const useVisitsList = (filters: VisitFilters) =>
  useQuery({
    queryKey: ["appointments", "list", filters],
    queryFn: async () => listVisits(filters),
  });

export const useVisitsByPatient = (patientId?: string) =>
  useQuery({
    queryKey: ["appointments", patientId],
    queryFn: async () => (patientId ? getVisitsByPatientId(patientId) : []),
    enabled: Boolean(patientId),
  });

export const useVisit = (visitId?: string) =>
  useQuery({
    queryKey: ["appointments", visitId],
    queryFn: async () => (visitId ? getVisitById(visitId) : null),
    enabled: Boolean(visitId),
  });

export const usePatientKpi = (patientId?: string) =>
  useQuery({
    queryKey: ["patient-kpi", patientId],
    queryFn: async () => (patientId ? computePatientKpi(patientId) : null),
    enabled: Boolean(patientId),
  });

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => getSettings(),
  });

export const useDocuments = (patientId?: string) =>
  useQuery({
    queryKey: ["documents", patientId],
    queryFn: async () => (patientId ? getDocumentsByPatient(patientId) : []),
    enabled: Boolean(patientId),
  });

export const useVisitAttachments = (visitId?: string) =>
  useQuery({
    queryKey: ["visit-attachments", visitId],
    queryFn: async () => (visitId ? getVisitAttachments(visitId) : []),
    enabled: Boolean(visitId),
  });

export const useVisitAttachmentsByPatient = (patientId?: string) =>
  useQuery({
    queryKey: ["visit-attachments", "patient", patientId],
    queryFn: async () => (patientId ? getVisitAttachmentsByPatientId(patientId) : []),
    enabled: Boolean(patientId),
  });

export const usePatientsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patients: Patient[]) => setPatients(patients),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"], exact: false }),
  });
};

export const useAppointmentsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointments: Appointment[]) => setAppointments(appointments),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Settings) => setSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
};

export const useAddDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (document: PatientDocument) => addPatientDocument(document),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["documents"], exact: false }),
  });
};

export const useRemoveDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; patientId: string }) => removePatientDocument(payload.id),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["documents"], exact: false }),
  });
};

export const useAddVisitAttachmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attachment: VisitAttachment) => addVisitAttachment(attachment),
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
    mutationFn: async (payload: { id: string; visitId: string }) => removeVisitAttachment(payload.id),
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
    mutationFn: async (payload: { visitId: string; notes: VisitNotes }) =>
      updateVisitNotes(payload.visitId, payload.notes),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments", variables.visitId] }),
      ]),
  });
};

export const useUpdateVisitPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { visitId: string; payment: VisitPayment }) =>
      updateVisitPayment(payload.visitId, payload.payment),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments", variables.visitId] }),
      ]),
  });
};

export const useAddDepositMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { visitId: string; deposit: Deposit }) =>
      addDeposit(payload.visitId, payload.deposit),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments", variables.visitId] }),
      ]),
  });
};

export const useRemoveDepositMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { visitId: string; depositId: string }) =>
      removeDeposit(payload.visitId, payload.depositId),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments", variables.visitId] }),
      ]),
  });
};

export const useUpdateVisitStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { visitId: string; status: Appointment["status"] }) =>
      updateVisitStatus(payload.visitId, payload.status),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments", variables.visitId] }),
      ]),
  });
};

export const useUpdateVisitDateTimeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { visitId: string; start: string; end: string }) =>
      updateVisitDateTime(payload.visitId, payload.start, payload.end),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments", variables.visitId] }),
      ]),
  });
};

export const useMarkVisitCompletedMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visitId: string) => markVisitCompleted(visitId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useDeleteVisitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visitId: string) => deleteVisit(visitId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};

export const useDuplicateVisitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visitId: string) => duplicateVisit(visitId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
  });
};
