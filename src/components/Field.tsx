import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export const Field = ({ label, children, hint }: FieldProps) => (
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium text-slate-600">{label}</span>
    {children}
    {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
  </label>
);
