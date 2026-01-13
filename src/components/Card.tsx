import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className = "" }: CardProps) => (
  <div className={`rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm ${className}`}>
    {children}
  </div>
);
