import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  useAddDepositMutation,
  useAddVisitAttachmentMutation,
  useAppointments,
  useAppointmentsMutation,
  usePatient,
  useRemoveDepositMutation,
  useRemoveVisitAttachmentMutation,
  useUpdateVisitNotesMutation,
  useVisitAttachments,
  useVisit,
} from "../../hooks/useData";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { getPaymentStatus } from "../../lib/payments";
import type { Appointment } from "../../types";
import { PaymentPanel } from "./components/PaymentPanel";
import { SoapNotesPanel } from "./components/SoapNotesPanel";
import { useToastStore } from "../../stores/toastStore";

export const VisitDetailPage = () => {
  const { id, visitId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToastStore();
  const { data: visit } = useVisit(visitId);
  const { data: patient } = usePatient(id);
  const { data: appointments = [] } = useAppointments();
  const { data: attachments = [] } = useVisitAttachments(visitId);
  const { mutate: saveAppointments } = useAppointmentsMutation();
  const { mutate: updateNotes } = useUpdateVisitNotesMutation();
  const { mutate: addDeposit } = useAddDepositMutation();
  const { mutate: removeDeposit } = useRemoveDepositMutation();
  const { mutate: addAttachment } = useAddVisitAttachmentMutation();
  const { mutate: removeVisitAttachment } = useRemoveVisitAttachmentMutation();

  const [details, setDetails] = useState({
    luogo: "",
    status: "programmata" as Appointment["status"],
    costo: 0,
  });

  useEffect(() => {
    if (visit) {
      setDetails({ luogo: visit.luogo, status: visit.status, costo: visit.totalAmount ?? visit.costo });
    }
  }, [visit]);

  const updateVisit = (updated: Appointment) => {
    const base = appointments.length > 0 ? appointments : [updated];
    saveAppointments(base.map((apt) => (apt.id === updated.id ? updated : apt)));
  };

  const duplicateVisit = () => {
    if (!visit) return;
    const clone: Appointment = {
      ...visit,
      id: crypto.randomUUID(),
      status: "programmata",
      payment: { paid: false },
      deposits: [],
      totalAmount: visit.totalAmount ?? visit.costo,
    };
    const base = appointments.length > 0 ? appointments : [visit];
    saveAppointments([...base, clone]);
    pushToast({ title: "Visita duplicata", tone: "success" });
  };

  const deleteVisit = () => {
    if (!visit) return;
    const base = appointments.length > 0 ? appointments : [visit];
    saveAppointments(base.filter((apt) => apt.id !== visit.id));
    pushToast({ title: "Visita eliminata", tone: "info" });
    navigate(`/patients/${visit.patientId}`);
  };

  const onFileUpload = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    addAttachment({
      id: crypto.randomUUID(),
      visitId: visitId ?? "",
      name: file.name,
      category: "altro",
      uploadedAt: new Date().toISOString(),
      dataUrl,
    });
    pushToast({ title: "Allegato caricato", tone: "success" });
  };

  const paymentStatus = useMemo(() => (visit ? getPaymentStatus(visit) : "unpaid"), [visit]);

  if (!visit || !patient) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Visita non trovata.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <Breadcrumb
        items={[
          { label: "Pazienti", to: "/patients" },
          { label: `${patient.nome} ${patient.cognome}`, to: `/patients/${patient.id}` },
          { label: "Visita" },
        ]}
      />

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dettaglio visita</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{formatDateTime(visit.start)}</h2>
            <p className="text-sm text-slate-500">{visit.trattamento} · {visit.luogo}</p>
            <p className="text-xs text-slate-500">Costo: {formatCurrency(visit.totalAmount ?? visit.costo)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : paymentStatus === "partial"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
              }`}
            >
              {paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"}
            </span>
            <Button size="sm" variant="outline" onClick={() => updateVisit({ ...visit, status: "completata" })}>
              Segna completata
            </Button>
            <Button size="sm" variant="outline" onClick={duplicateVisit}>
              Duplica
            </Button>
            <Button size="sm" variant="danger" onClick={deleteVisit}>
              Elimina
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Dettagli</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-slate-500">
                Luogo
                <input
                  value={details.luogo}
                  onChange={(event) => setDetails({ ...details, luogo: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Stato
                <select
                  value={details.status}
                  onChange={(event) =>
                    setDetails({ ...details, status: event.target.value as Appointment["status"] })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="programmata">Programmata</option>
                  <option value="completata">Completata</option>
                  <option value="cancellata">Cancellata</option>
                  <option value="no-show">No-show</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Costo
                <input
                  type="number"
                  value={details.costo}
                  onChange={(event) => setDetails({ ...details, costo: Number(event.target.value) })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                updateVisit({ ...visit, luogo: details.luogo, status: details.status, costo: details.costo, totalAmount: details.costo });
                pushToast({ title: "Dettagli aggiornati", tone: "success" });
              }}
            >
              Salva dettagli
            </Button>
          </Card>

          <Card>
            <SoapNotesPanel
              value={visit.notes ?? {}}
              onSave={(notes) => updateNotes({ visitId: visit.id, notes })}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <PaymentPanel
              visit={visit}
              onAddDeposit={(deposit) => {
                addDeposit({ visitId: visit.id, deposit });
                pushToast({ title: "Acconto registrato", tone: "success" });
              }}
              onRemoveDeposit={(depositId) => {
                removeDeposit({ visitId: visit.id, depositId });
                pushToast({ title: "Acconto rimosso", tone: "info" });
              }}
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Allegati visita</h3>
              <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                <Plus className="mr-2 h-4 w-4" /> Carica
                <input type="file" className="hidden" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onFileUpload(file);
                }} />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>{attachment.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {attachment.dataUrl ? (
                      <a className="text-xs font-semibold text-teal-600" href={attachment.dataUrl} download={attachment.name}>Download</a>
                    ) : (
                      <span className="text-slate-400">Solo metadata</span>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (!visitId) return;
                      removeVisitAttachment({ id: attachment.id, visitId });
                      pushToast({ title: "Allegato rimosso", tone: "info" });
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {attachments.length === 0 ? <EmptyState title="Nessun allegato" description="Carica un file per questa visita." /> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
