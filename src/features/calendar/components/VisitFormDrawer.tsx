import { useEffect, useMemo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { addMinutes, format } from "date-fns";
import { Drawer } from "../../../components/ui/Drawer";
import { Button } from "../../../components/Button";
import { Field } from "../../../components/Field";
import type { Appointment, Patient, Settings, VisitNotes } from "../../../types";

const recurrenceSchema = z.object({
  enabled: z.boolean(),
  pattern: z.enum(["none", "weekly", "monthly", "yearly"]),
  count: z.coerce.number().min(1).max(24),
});

const formSchema = z.object({
  patientId: z.string().min(1, "Seleziona un paziente"),
  start: z.string().min(1),
  duration: z.coerce.number().min(15).max(180),
  luogo: z.string().min(2),
  trattamento: z.string().min(2),
  costo: z.coerce.number().min(0),
  status: z.enum(["programmata", "completata", "cancellata", "no-show"]),
  recurrence: recurrenceSchema,
  notes: z.object({
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
  }),
});

type VisitForm = z.infer<typeof formSchema>;

type VisitFormDrawerProps = {
  open: boolean;
  patients: Patient[];
  settings: Settings;
  initial?: Appointment | null;
  prefill?: { start?: string; end?: string; patientId?: string };
  onClose: () => void;
  onSave: (payload: {
    appointment: Appointment;
    scope: "single" | "series";
    recurrence: { pattern: "none" | "weekly" | "monthly" | "yearly"; count: number };
  }) => void;
  onDelete?: () => void;
};

export const VisitFormDrawer = ({
  open,
  patients,
  settings,
  initial,
  prefill,
  onClose,
  onSave,
  onDelete,
}: VisitFormDrawerProps) => {
  const defaultValues = useMemo<VisitForm>(() => {
    const startDate = initial?.start ?? prefill?.start ?? "";
    const endDate = initial?.end ?? prefill?.end ?? "";
    const durationMinutes = startDate && endDate ? Math.max((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000, 30) : 60;
    return {
      patientId: initial?.patientId ?? prefill?.patientId ?? patients[0]?.id ?? "",
      start: startDate ? format(new Date(startDate), "yyyy-MM-dd'T'HH:mm") : "",
      duration: durationMinutes,
      luogo: initial?.luogo ?? patients[0]?.indirizzo ?? "",
      trattamento: initial?.trattamento ?? settings.trattamenti[0]?.nome ?? "",
      costo: initial?.totalAmount ?? initial?.costo ?? settings.trattamenti[0]?.costoDefault ?? settings.tariffaStandard,
      status: initial?.status ?? "programmata",
      recurrence: { enabled: false, pattern: "weekly", count: 6 },
      notes: initial?.notes ?? {},
    };
  }, [initial, patients, prefill, settings]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitForm>({
    resolver: zodResolver(formSchema) as Resolver<VisitForm>,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const selectedPatient = patients.find((patient) => patient.id === watch("patientId"));

  const onSubmit = (data: VisitForm) => {
    const start = new Date(data.start);
    const end = addMinutes(start, data.duration);
    const notes: VisitNotes = data.notes ?? {};
    const appointment: Appointment = {
      id: initial?.id ?? crypto.randomUUID(),
      patientId: data.patientId,
      start: start.toISOString(),
      end: end.toISOString(),
      luogo: data.luogo,
      trattamento: data.trattamento,
      costo: data.costo,
      totalAmount: data.costo,
      status: data.status,
      payment: { paid: false },
      deposits: initial?.deposits ?? [],
      notes,
      seriesId: initial?.seriesId,
    };

    onSave({
      appointment,
      scope: "single",
      recurrence: data.recurrence.enabled
        ? { pattern: data.recurrence.pattern, count: data.recurrence.count }
        : { pattern: "none", count: 1 },
    });
  };

  useEffect(() => {
    if (selectedPatient) {
      setValue("luogo", selectedPatient.indirizzo);
    }
  }, [selectedPatient, setValue]);

  if (!open) return null;

  return (
    <Drawer open={open} title={initial ? "Modifica visita" : "Nuova visita"} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Paziente">
            <select
              {...register("patientId")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.nome} {patient.cognome}
                </option>
              ))}
            </select>
            {errors.patientId ? <span className="text-xs text-rose-600">{errors.patientId.message}</span> : null}
          </Field>
          <Field label="Trattamento">
            <select
              {...register("trattamento")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {settings.trattamenti.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data e ora">
            <input
              type="datetime-local"
              {...register("start")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Durata (min)">
            <input
              type="number"
              min={15}
              step={5}
              {...register("duration")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Luogo">
            <input
              {...register("luogo")}
              type="text"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Costo">
            <input
              {...register("costo")}
              type="number"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Stato">
            <select
              {...register("status")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="programmata">Programmata</option>
              <option value="completata">Completata</option>
              <option value="cancellata">Cancellata</option>
              <option value="no-show">No-show</option>
            </select>
          </Field>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input type="checkbox" {...register("recurrence.enabled")} className="h-4 w-4" />
            Ricorrente
          </label>
          {watch("recurrence.enabled") ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-slate-500">
                Frequenza
                <select
                  {...register("recurrence.pattern")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="weekly">Settimanale</option>
                  <option value="monthly">Mensile</option>
                  <option value="yearly">Annuale</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Ripetizioni
                <input
                  type="number"
                  min={1}
                  max={24}
                  {...register("recurrence.count")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-600">Note rapide (SOAP)</p>
          <div className="mt-3 grid gap-3">
            {([
              { label: "Subjective", key: "subjective" },
              { label: "Objective", key: "objective" },
              { label: "Assessment", key: "assessment" },
              { label: "Plan", key: "plan" },
            ] as const).map((field) => (
              <label key={field.key} className="text-xs font-semibold text-slate-500">
                {field.label}
                <textarea
                  rows={2}
                  {...register(`notes.${field.key}` as const)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {onDelete ? (
            <Button variant="danger" type="button" onClick={onDelete}>
              Elimina
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit">Salva visita</Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
};
