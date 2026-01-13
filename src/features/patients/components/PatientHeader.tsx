import { Mail, MapPin, Pencil, CreditCard, Plus, PhoneCall, Phone } from "lucide-react";
import { Button } from "../../../components/Button";
import { formatCurrency, formatDateTime } from "../../../lib/utils";
import type { Appointment, Patient } from "../../../types";

const buildMapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

type PatientHeaderProps = {
  patient: Patient;
  nextAppointment: Appointment | null;
  unpaidTotal: number;
  onNewVisit: () => void;
  onMarkPaid: () => void;
  onEdit: () => void;
};

export const PatientHeader = ({
  patient,
  nextAppointment,
  unpaidTotal,
  onNewVisit,
  onMarkPaid,
  onEdit,
}: PatientHeaderProps) => (
  <div className="sticky top-16 z-10 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:top-24">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-900">
            {patient.nome} {patient.cognome}
          </h2>
          {(patient.tags ?? []).map((tag) => (
            <span key={tag} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <PhoneCall className="h-3.5 w-3.5" /> {patient.telefono}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> {patient.email}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onNewVisit}>
          <Plus className="mr-2 h-4 w-4" /> Nuova visita
        </Button>
        {unpaidTotal > 0 ? (
          <Button size="sm" variant="outline" onClick={onMarkPaid}>
            <CreditCard className="mr-2 h-4 w-4" /> Segna pagato
          </Button>
        ) : null}
        <a
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          href={`tel:${patient.telefono}`}
        >
          <Phone className="mr-2 h-4 w-4" /> Chiama
        </a>
        <a
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          href={buildMapsUrl(patient.indirizzo)}
          target="_blank"
          rel="noreferrer"
        >
          <MapPin className="mr-2 h-4 w-4" /> Maps
        </a>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> Modifica
        </Button>
      </div>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prossima visita</p>
        <p className="mt-2 font-semibold text-slate-800">
          {nextAppointment ? formatDateTime(nextAppointment.start) : "Non pianificata"}
        </p>
        <p className="text-xs text-slate-500">
          {nextAppointment ? nextAppointment.trattamento : "Imposta una nuova visita"}
        </p>
      </div>
      <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Insoluti</p>
        <p className="mt-2 font-semibold text-rose-600">{formatCurrency(unpaidTotal)}</p>
        <p className="text-xs text-slate-500">Totale da incassare</p>
      </div>
    </div>
  </div>
);
