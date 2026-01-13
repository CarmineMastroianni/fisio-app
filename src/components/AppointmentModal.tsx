import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { format, parseISO } from "date-fns";
import type { Appointment, Patient, Settings } from "../types";
import { Button } from "./Button";
import { Field } from "./Field";

const recurrenceSchema = z.object({
  pattern: z.enum(["none", "weekly", "monthly", "yearly"]),
  count: z.coerce.number().min(1).max(24),
});

type RecurrenceConfig = z.infer<typeof recurrenceSchema>;

type AppointmentModalProps = {
  open: boolean;
  onClose: () => void;
  patients: Patient[];
  settings: Settings;
  initial?: Appointment | null;
  prefill?: { start?: string; end?: string; patientId?: string };
  onSave: (payload: {
    appointment: Appointment;
    scope: "single" | "series";
    recurrence: RecurrenceConfig;
  }) => void;
  onDelete?: () => void;
};

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Seleziona un paziente"),
  start: z.string().min(1),
  end: z.string().min(1),
  luogo: z.string().min(2),
  trattamento: z.string().min(2),
  costo: z.coerce.number().min(0),
  paymentPaid: z.boolean(),
  paymentMethod: z.string().optional(),
  status: z.enum(["programmata", "completata", "cancellata", "no-show"]),
  scope: z.enum(["single", "series"]),
  recurrence: recurrenceSchema,
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

const toInputDate = (value: string) => format(parseISO(value), "yyyy-MM-dd'T'HH:mm");

export const AppointmentModal = ({
  open,
  onClose,
  patients,
  settings,
  initial,
  prefill,
  onSave,
  onDelete,
}: AppointmentModalProps) => {
  const defaultValues = useMemo<AppointmentForm>(() => {
    const mappedMethod =
      initial?.payment?.method
        ? settings.metodiPagamento.find((method) =>
            method.nome.toLowerCase().includes(initial.payment?.method ?? "")
          )?.nome
        : undefined;
    return {
      patientId: initial?.patientId ?? prefill?.patientId ?? patients[0]?.id ?? "",
      start: initial ? toInputDate(initial.start) : prefill?.start ?? "",
      end: initial ? toInputDate(initial.end) : prefill?.end ?? "",
      luogo: initial?.luogo ?? patients[0]?.indirizzo ?? "",
      trattamento: initial?.trattamento ?? settings.trattamenti[0]?.nome ?? "",
      costo: initial?.totalAmount ?? initial?.costo ?? settings.trattamenti[0]?.costoDefault ?? settings.tariffaStandard,
      paymentPaid: initial?.payment?.paid ?? false,
      paymentMethod: mappedMethod ?? settings.metodiPagamento[0]?.nome ?? "Contanti",
      status: initial?.status ?? "programmata",
      scope: "single",
      recurrence: { pattern: "none", count: 6 },
    };
  }, [initial, patients, prefill, settings]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema) as Resolver<AppointmentForm>,
    defaultValues,
  });

  const selectedPatient = patients.find((p) => p.id === watch("patientId"));

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = (data: AppointmentForm) => {
    const visitId = initial?.id ?? crypto.randomUUID();
    const payload: Appointment = {
      id: visitId,
      patientId: data.patientId,
      start: new Date(data.start).toISOString(),
      end: new Date(data.end).toISOString(),
      luogo: data.luogo,
      trattamento: data.trattamento,
      costo: data.costo,
      totalAmount: data.costo,
      status: data.status,
      payment: {
        paid: data.paymentPaid,
        method: data.paymentPaid ? data.paymentMethod?.toLowerCase() as "contanti" | "bonifico" | "pos" : undefined,
        paidAt: data.paymentPaid ? new Date().toISOString() : undefined,
        amountPaid: data.paymentPaid ? data.costo : undefined,
      },
      deposits: data.paymentPaid
        ? [
            {
              id: crypto.randomUUID(),
              visitId,
              amount: data.costo,
              method: (data.paymentMethod?.toLowerCase() as "contanti" | "bonifico" | "pos") ?? "contanti",
              paidAt: new Date().toISOString(),
            },
          ]
        : [],
      seriesId: initial?.seriesId,
    };

    onSave({ appointment: payload, scope: data.scope, recurrence: data.recurrence });
  };

  const onPatientChange = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setValue("luogo", patient.indirizzo);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {initial ? "Dettaglio visita" : "Nuova visita"}
            </h3>
            <p className="text-xs text-slate-500">Compila i dati essenziali e salva.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Chiudi
          </Button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Paziente">
              <select
                {...register("patientId", {
                  onChange: (event) => onPatientChange(event.target.value),
                })}
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
            <Field label="Inizio">
              <input
                {...register("start")}
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Fine">
              <input
                {...register("end")}
                type="datetime-local"
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
            <Field label="Metodo pagamento">
              <select
                {...register("paymentMethod")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {settings.metodiPagamento.map((method) => (
                  <option key={method.id} value={method.nome}>
                    {method.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stato">
              <select
                {...register("status")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="programmata">Programmato</option>
                <option value="completata">Completata</option>
                <option value="cancellata">Cancellata</option>
                <option value="no-show">No-show</option>
              </select>
            </Field>
            <Field label="Pagata">
              <div className="flex items-center gap-3">
                <input {...register("paymentPaid")} type="checkbox" className="h-4 w-4" />
                <span className="text-sm text-slate-600">{watch("paymentPaid") ? "Sì" : "No"}</span>
              </div>
            </Field>
            {selectedPatient ? (
              <Field label="Nota paziente" hint={selectedPatient.noteCliniche}>
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {selectedPatient.noteCliniche}
                </div>
              </Field>
            ) : null}
          </div>

          {initial?.seriesId ? (
            <Field label="Applica modifiche">
              <select
                {...register("scope")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="single">Solo questa visita</option>
                <option value="series">Tutta la serie</option>
              </select>
            </Field>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Ricorrenza">
                <select
                  {...register("recurrence.pattern")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="none">Nessuna</option>
                  <option value="weekly">Settimanale</option>
                  <option value="monthly">Mensile</option>
                  <option value="yearly">Annuale</option>
                </select>
              </Field>
              <Field label="Numero ripetizioni">
                <input
                  {...register("recurrence.count")}
                  type="number"
                  min={1}
                  max={24}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
      </div>
    </div>
  );
};
