import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDeposit,
  addPatientDocument,
  addVisitAttachment,
  createAppointments,
  createPatient,
  deletePatient,
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
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "../lib/googleCalendar";
import { useToastStore } from "../stores/toastStore";
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
import { useAuthStore } from "../stores/authStore";

// ============================================================
// QUERY HOOKS
// ============================================================

export const usePatients = () =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["patients", sessionId],
      queryFn: () => getPatients(),
      enabled: Boolean(sessionId),
    });
  };

export const usePatient = (patientId?: string) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["patients", sessionId, patientId],
      queryFn: () => (patientId ? getPatientById(patientId) : null),
      enabled: Boolean(sessionId && patientId),
    });
  };

export const useAppointments = () =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["appointments", sessionId],
      queryFn: () => getAppointments(),
      enabled: Boolean(sessionId),
    });
  };

export const useVisitsList = (filters: VisitFilters) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["appointments", sessionId, "list", filters],
      queryFn: () => listVisits(filters),
      enabled: Boolean(sessionId),
    });
  };

export const useVisitsByPatient = (patientId?: string) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["appointments", sessionId, "patient", patientId],
      queryFn: () => (patientId ? getVisitsByPatientId(patientId) : []),
      enabled: Boolean(sessionId && patientId),
    });
  };

export const useVisit = (visitId?: string) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["appointments", sessionId, "single", visitId],
      queryFn: () => (visitId ? getVisitById(visitId) : null),
      enabled: Boolean(sessionId && visitId),
    });
  };

export const usePatientKpi = (patientId?: string) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["patient-kpi", sessionId, patientId],
      queryFn: () => (patientId ? computePatientKpi(patientId) : null),
      enabled: Boolean(sessionId && patientId),
    });
  };

export const useSettings = () =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["settings", sessionId],
      queryFn: () => getSettings(),
      enabled: Boolean(sessionId),
    });
  };

export const useDocuments = (patientId?: string) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["documents", sessionId, patientId],
      queryFn: () => (patientId ? getDocumentsByPatient(patientId) : []),
      enabled: Boolean(sessionId && patientId),
    });
  };

export const useVisitAttachments = (visitId?: string) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["visit-attachments", sessionId, visitId],
      queryFn: () => (visitId ? getVisitAttachments(visitId) : []),
      enabled: Boolean(sessionId && visitId),
    });
  };

export const useVisitAttachmentsByPatient = (patientId?: string) =>
  {
    const sessionId = useAuthStore((state) => state.session?.id);
    return useQuery({
      queryKey: ["visit-attachments", sessionId, "patient", patientId],
      queryFn: () => (patientId ? getVisitAttachmentsByPatientId(patientId) : []),
      enabled: Boolean(sessionId && patientId),
    });
  };

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

export const useDeletePatientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patientId: string) => deletePatient(patientId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patients"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["documents"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["visit-attachments"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["patient-kpi"], exact: false }),
      ]),
  });
};

// ============================================================
// APPOINTMENT MUTATIONS
// ============================================================

export const useUpsertAppointmentMutation = () => {
  const queryClient = useQueryClient();
  const providerToken = useAuthStore((state) => state.providerToken);
  const sessionId = useAuthStore((state) => state.session?.id);
  const { pushToast } = useToastStore();

  return useMutation({
    mutationFn: (appointment: Appointment) => upsertAppointment(appointment),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });

      const settings = queryClient.getQueryData<Settings>(["settings", sessionId]);
      if (!settings?.googleCalendarEnabled) return;

      if (!providerToken) {
        pushToast({
          title: "Google Calendar non collegato",
          description: "Accedi con Google per sincronizzare le visite.",
          tone: "error",
        });
        return;
      }

      const patients = queryClient.getQueryData<Patient[]>(["patients", sessionId]);
      const patient = patients?.find((p) => p.id === saved.patientId);
      const patientName = patient ? `${patient.nome} ${patient.cognome}` : "Paziente";

      if (saved.googleEventId) {
        await updateCalendarEvent(providerToken, saved.googleEventId, saved, patientName);
        pushToast({ title: "Calendario aggiornato", tone: "success" });
      } else {
        const googleEventId = await createCalendarEvent(providerToken, saved, patientName);
        if (googleEventId) {
          await upsertAppointment({ ...saved, googleEventId });
          await queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
          pushToast({ title: "Visita aggiunta al calendario Google", tone: "success" });
        } else {
          pushToast({
            title: "Sync Google Calendar fallito",
            description: "Controlla che il calendario sia collegato in Settings.",
            tone: "error",
          });
        }
      }
    },
  });
};

export const useCreateAppointmentsMutation = () => {
  const queryClient = useQueryClient();
  const providerToken = useAuthStore((state) => state.providerToken);
  const sessionId = useAuthStore((state) => state.session?.id);

  return useMutation({
    mutationFn: (appointments: Appointment[]) => createAppointments(appointments),
    onSuccess: async (_data, appointments) => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });

      if (!providerToken) return;
      const settings = queryClient.getQueryData<Settings>(["settings", sessionId]);
      if (!settings?.googleCalendarEnabled) return;

      const patients = queryClient.getQueryData<Patient[]>(["patients", sessionId]);
      const patient = patients?.find((p) => p.id === appointments[0]?.patientId);
      const patientName = patient ? `${patient.nome} ${patient.cognome}` : "Paziente";

      const updated = await Promise.all(
        appointments.map(async (apt) => {
          const googleEventId = await createCalendarEvent(providerToken, apt, patientName);
          return googleEventId ? { ...apt, googleEventId } : apt;
        })
      );
      const withEvents = updated.filter((a) => a.googleEventId);
      if (withEvents.length > 0) {
        await Promise.all(withEvents.map((a) => upsertAppointment(a)));
        await queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
      }
    },
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
  const providerToken = useAuthStore((state) => state.providerToken);
  const sessionId = useAuthStore((state) => state.session?.id);

  return useMutation({
    mutationFn: async (visitId: string) => {
      if (providerToken) {
        const settings = queryClient.getQueryData<Settings>(["settings", sessionId]);
        if (settings?.googleCalendarEnabled) {
          const appointments = queryClient.getQueryData<Appointment[]>(["appointments", sessionId]);
          const apt = appointments?.find((a) => a.id === visitId);
          if (apt?.googleEventId) {
            await deleteCalendarEvent(providerToken, apt.googleEventId);
          }
        }
      }
      return deleteVisit(visitId);
    },
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
