import { useEffect, useRef, useState } from "react";
import type { VisitNotes } from "../../../types";

type SoapNotesPanelProps = {
  value: VisitNotes;
  onSave: (notes: VisitNotes) => void;
  title?: string;
};

export const SoapNotesPanel = ({ value, onSave, title = "Note visita (SOAP)" }: SoapNotesPanelProps) => {
  const [notes, setNotes] = useState<VisitNotes>(value);
  const timerRef = useRef<number | null>(null);
  const initialRef = useRef(true);

  useEffect(() => {
    setNotes(value);
    initialRef.current = true;
  }, [value]);

  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onSave(notes);
    }, 700);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [notes, onSave]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      {([
        { label: "Subjective", key: "subjective" },
        { label: "Objective", key: "objective" },
        { label: "Assessment", key: "assessment" },
        { label: "Plan", key: "plan" },
      ] as const).map((field) => (
        <label key={field.key} className="text-xs font-semibold text-slate-500">
          {field.label}
          <textarea
            value={notes[field.key] ?? ""}
            onChange={(event) => setNotes({ ...notes, [field.key]: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      ))}
    </div>
  );
};
