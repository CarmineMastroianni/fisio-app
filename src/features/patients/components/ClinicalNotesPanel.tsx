import { useEffect, useMemo, useState } from "react";
import { Card } from "../../../components/Card";
import { useQueryClient } from "@tanstack/react-query";
import { updatePatientNotes } from "../../../lib/storage";
import type { ClinicalNotes, Patient } from "../../../types";

const emptyNotes: ClinicalNotes = {
  problema: "",
  obiettivi: "",
  esercizi: "",
  note: "",
};

type ClinicalNotesPanelProps = {
  patient: Patient;
};

export const ClinicalNotesPanel = ({ patient }: ClinicalNotesPanelProps) => {
  const queryClient = useQueryClient();
  const initial = useMemo(() => patient.clinicalNotes ?? { ...emptyNotes, note: patient.noteCliniche }, [patient]);
  const [notes, setNotes] = useState<ClinicalNotes>(initial);
  const [status, setStatus] = useState("Salvataggio automatico attivo");

  useEffect(() => {
    setNotes(initial);
  }, [initial]);

  useEffect(() => {
    const handle = setTimeout(() => {
      updatePatientNotes(patient.id, notes);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setStatus(`Aggiornato ${new Date().toLocaleTimeString("it-IT")}`);
    }, 800);
    return () => clearTimeout(handle);
  }, [notes, patient.id, queryClient]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Note cliniche</h3>
          <p className="text-xs text-slate-500">Template rapido per aggiornamenti clinici.</p>
        </div>
        <span className="text-xs text-slate-400">{status}</span>
      </div>
      <div className="mt-4 grid gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Problema
          <textarea
            value={notes.problema}
            onChange={(event) => setNotes({ ...notes, problema: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Obiettivi
          <textarea
            value={notes.obiettivi}
            onChange={(event) => setNotes({ ...notes, obiettivi: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Esercizi assegnati
          <textarea
            value={notes.esercizi}
            onChange={(event) => setNotes({ ...notes, esercizi: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Note aggiuntive
          <textarea
            value={notes.note}
            onChange={(event) => setNotes({ ...notes, note: event.target.value })}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </Card>
  );
};
