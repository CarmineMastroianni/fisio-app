import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Drawer } from "../../components/ui/Drawer";
import { EmptyState } from "../../components/ui/EmptyState";
import { usePatients, useCreatePatientMutation } from "../../hooks/useData";
import type { ClinicalNotes, Patient } from "../../types";
import { useToastStore } from "../../stores/toastStore";

const patientSchema = z.object({
  nome: z.string(),
  cognome: z.string(),
  telefono: z.string(),
  email: z.string().refine(
    (value) => value.trim() === "" || z.string().email().safeParse(value).success,
    { message: "Email non valida" }
  ),
  indirizzo: z.string(),
  noteCliniche: z.string(),
  noteLogistiche: z.string().optional(),
  tags: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

const defaultClinicalNotes: ClinicalNotes = {
  problema: "",
  obiettivi: "",
  esercizi: "",
  note: "",
};

export const PatientsPage = () => {
  const navigate = useNavigate();
  const { data: patients = [] } = usePatients();
  const { mutate: createPatientMutate, isPending } = useCreatePatientMutation();
  const { pushToast } = useToastStore();
  const [query, setQuery] = useState("");
  const [openDrawer, setOpenDrawer] = useState(false);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) =>
        `${patient.nome} ${patient.cognome} ${patient.telefono} ${patient.email} ${(patient.tags ?? []).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [patients, query]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientForm>({ resolver: zodResolver(patientSchema) });

  const createPatient = (data: PatientForm) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      nome: data.nome.trim(),
      cognome: data.cognome.trim(),
      telefono: data.telefono.trim(),
      email: data.email.trim(),
      indirizzo: data.indirizzo.trim(),
      noteCliniche: data.noteCliniche.trim(),
      noteLogistiche: data.noteLogistiche?.trim() || "",
      tags: data.tags ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      clinicalNotes: defaultClinicalNotes,
    };
    createPatientMutate(newPatient, {
      onSuccess: () => {
        setOpenDrawer(false);
        reset();
        pushToast({ title: "Paziente creato", tone: "success" });
      },
      onError: () => {
        pushToast({ title: "Errore nel salvataggio", tone: "error" });
      },
    });
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Pazienti</h2>
          <p className="text-sm text-slate-500">Lista rapida per gestione quotidiana.</p>
        </div>
        <Button onClick={() => setOpenDrawer(true)}>+ Nuovo paziente</Button>
      </div>

      <Card>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca paziente, tag, telefono"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
        />
        <div className="mt-4 space-y-2">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <button onClick={() => navigate(`/patients/${patient.id}`)} className="text-left">
                <p className="text-sm font-semibold text-slate-800">
                  {patient.nome} {patient.cognome}
                </p>
                <p className="text-xs text-slate-500">
                  {[patient.telefono, patient.email].filter(Boolean).join(" · ") || "Nessun contatto"}
                </p>
              </button>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(`/patients/${patient.id}`, { state: { openNewVisit: true } })
                  }
                >
                  + Visita
                </Button>
                <Button size="sm" onClick={() => navigate(`/patients/${patient.id}`)}>
                  Apri scheda
                </Button>
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 ? (
            <EmptyState
              title="Nessun paziente trovato"
              description="Prova con un nome diverso o aggiungi un nuovo paziente."
            />
          ) : null}
        </div>
      </Card>

      <Drawer open={openDrawer} title="Nuovo paziente" onClose={() => setOpenDrawer(false)}>
        <form className="space-y-3" onSubmit={handleSubmit(createPatient)}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-500">
              Nome
              <input
                {...register("nome")}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
              {errors.nome ? <span className="text-xs text-rose-600">{errors.nome.message}</span> : null}
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Cognome
              <input
                {...register("cognome")}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Telefono
              <input
                {...register("telefono")}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Email
              <input
                {...register("email")}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
              {errors.email ? <span className="text-xs text-rose-600">{errors.email.message}</span> : null}
            </label>
          </div>
          <label className="text-xs font-semibold text-slate-500">
            Indirizzo
            <input
              {...register("indirizzo")}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Note cliniche (sintesi)
            <textarea
              {...register("noteCliniche")}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Note logistiche
            <textarea
              {...register("noteLogistiche")}
              rows={2}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Tag (separati da virgola)
            <input
              {...register("tags")}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvataggio…" : "Salva paziente"}
          </Button>
        </form>
      </Drawer>
    </div>
  );
};
