import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { addHours, format } from "date-fns";
import { Mail, MapPin, Phone, Plus, Pencil } from "lucide-react";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Tabs } from "../../components/ui/Tabs";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Drawer } from "../../components/ui/Drawer";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  useAddDocumentMutation,
  useAppointmentsMutation,
  useAppointments,
  useDocuments,
  usePatient,
  usePatients,
  usePatientsMutation,
  usePatientKpi,
  useRemoveDocumentMutation,
  useSettings,
  useVisitAttachmentsByPatient,
  useVisitsByPatient,
} from "../../hooks/useData";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/utils";
import { getOutstandingAmount, getPaidAmount, getPaymentStatus } from "../../lib/payments";
import type { Appointment, Patient, PatientDocument, Settings, VisitAttachment, VisitPayment } from "../../types";
import { useToastStore } from "../../stores/toastStore";

const paymentMethodOptions: VisitPayment["method"][] = ["contanti", "bonifico", "pos"];

const statusLabels: Record<string, string> = {
  programmata: "Programmata",
  completata: "Completata",
  cancellata: "Cancellata",
  "no-show": "No-show",
};

const buildMapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

type DrawerState =
  | { type: "edit-patient" }
  | { type: "new-visit" }
  | { type: "mark-paid"; visitId: string }
  | null;

export const PatientDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { pushToast } = useToastStore();
  const { data: patient } = usePatient(id);
  const { data: allPatients = [] } = usePatients();
  const { data: allAppointments = [] } = useAppointments();
  const { data: visits = [] } = useVisitsByPatient(id);
  const { data: settings } = useSettings();
  const { data: kpi } = usePatientKpi(id);
  const { data: documents = [] } = useDocuments(id);
  const { data: visitAttachments = [] } = useVisitAttachmentsByPatient(id);
  const { mutate: savePatients } = usePatientsMutation();
  const { mutate: saveVisits } = useAppointmentsMutation();

  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (location.state && (location.state as { openNewVisit?: boolean }).openNewVisit) {
      setDrawer({ type: "new-visit" });
    }
  }, [location.state]);

  const sortedVisits = useMemo(() =>
    [...visits].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()), [visits]);

  const nextVisit = kpi?.nextVisit;
  const outstandingTotal = kpi?.outstandingTotal ?? 0;
  const paidTotal = kpi?.paidTotal ?? 0;

  const lastPayment = useMemo(() => {
    return sortedVisits.find((visit) => getPaymentStatus(visit) === "paid" && visit.payment.paidAt);
  }, [sortedVisits]);

  if (!patient) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Paziente non trovato.</p>
      </Card>
    );
  }

  const updatePatient = (updated: Patient) => {
    savePatients(allPatients.map((p) => (p.id === updated.id ? updated : p)));
  };

  const updateVisit = (updated: Appointment) => {
    const base = allAppointments.length > 0 ? allAppointments : visits;
    saveVisits(base.map((visit) => (visit.id === updated.id ? updated : visit)));
  };

  const markVisitPaid = (visitId: string, payment: VisitPayment) => {
    const target = visits.find((visit) => visit.id === visitId);
    if (!target) return;
    updateVisit({ ...target, payment });
    pushToast({ title: "Pagamento registrato", tone: "success" });
  };

  const markVisitCompleted = (visitId: string) => {
    const target = visits.find((visit) => visit.id === visitId);
    if (!target) return;
    updateVisit({ ...target, status: "completata" });
    pushToast({ title: "Visita completata", tone: "success" });
  };

  const duplicateVisit = (visitId: string) => {
    const original = visits.find((visit) => visit.id === visitId);
    if (!original) return;
    const clone: Appointment = {
      ...original,
      id: crypto.randomUUID(),
      payment: { paid: false },
      deposits: [],
      totalAmount: original.totalAmount ?? original.costo,
      status: "programmata",
    };
    const base = allAppointments.length > 0 ? allAppointments : visits;
    saveVisits([...base, clone]);
    pushToast({ title: "Visita duplicata", tone: "success" });
  };

  const deleteVisit = (visitId: string) => {
    const base = allAppointments.length > 0 ? allAppointments : visits;
    saveVisits(base.filter((visit) => visit.id !== visitId));
    pushToast({ title: "Visita eliminata", tone: "info" });
  };

  const tabs = [
    {
      id: "overview",
      label: "Panoramica",
      content: (
        <OverviewTab
          patient={patient}
          nextVisit={nextVisit}
          paidTotal={paidTotal}
          outstandingTotal={outstandingTotal}
          lastPayment={lastPayment}
          onOpenNotes={() => setActiveTab("notes")}
          onMarkCompleted={markVisitCompleted}
          onMarkPaid={(visitId) => setDrawer({ type: "mark-paid", visitId })}
          onOpenVisit={(visitId) => navigate(`/patients/${patient.id}/visits/${visitId}`)}
        />
      ),
    },
    {
      id: "visits",
      label: "Visite",
      content: (
        <VisitsTab
          visits={sortedVisits}
          onOpen={(visitId) => navigate(`/patients/${patient.id}/visits/${visitId}`)}
          onDuplicate={duplicateVisit}
          onMarkCompleted={markVisitCompleted}
          onMarkPaid={(visitId) => setDrawer({ type: "mark-paid", visitId })}
          onDelete={deleteVisit}
          onNewVisit={() => setDrawer({ type: "new-visit" })}
        />
      ),
    },
    {
      id: "payments",
      label: "Pagamenti",
      content: (
        <PaymentsTab
          visits={sortedVisits}
          onMarkPaid={(visitId) => setDrawer({ type: "mark-paid", visitId })}
        />
      ),
    },
    {
      id: "documents",
      label: "Documenti",
      content: (
        <DocumentsTab
          patientId={patient.id}
          documents={documents}
          visitAttachments={visitAttachments}
          visits={sortedVisits}
          onOpenVisit={(visitId) => navigate(`/patients/${patient.id}/visits/${visitId}`)}
        />
      ),
    },
    {
      id: "notes",
      label: "Note cliniche",
      content: <NotesTab patient={patient} allPatients={allPatients} onSave={savePatients} />,
    },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <Breadcrumb items={[{ label: "Pazienti", to: "/patients" }, { label: `${patient.nome} ${patient.cognome}` }]} />

      <div className="sticky top-16 z-10 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:top-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{patient.nome} {patient.cognome}</h2>
              {(patient.tags ?? []).map((tag) => (
                <span key={tag} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {patient.telefono}</span>
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {patient.email}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDrawer({ type: "new-visit" })}><Plus className="mr-2 h-4 w-4" /> Nuova visita</Button>
            <Button size="sm" variant="outline" onClick={() => setDrawer({ type: "edit-patient" })}><Pencil className="mr-2 h-4 w-4" /> Modifica</Button>
            <a className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`tel:${patient.telefono}`}>
              <Phone className="mr-2 h-4 w-4" /> Chiama
            </a>
            <a className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={buildMapsUrl(patient.indirizzo)} target="_blank" rel="noreferrer">
              <MapPin className="mr-2 h-4 w-4" /> Maps
            </a>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prossima visita</p>
            <p className="mt-2 font-semibold text-slate-800">{nextVisit ? formatDateTime(nextVisit.start) : "Non pianificata"}</p>
            <p className="text-xs text-slate-500">{nextVisit ? nextVisit.trattamento : ""}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Insoluti</p>
            <p className="mt-2 font-semibold text-rose-600">{formatCurrency(outstandingTotal)}</p>
            <p className="text-xs text-slate-500">Totale da incassare</p>
          </div>
        </div>
      </div>

      <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />

      <Drawer open={drawer?.type === "edit-patient"} title="Modifica paziente" onClose={() => setDrawer(null)}>
        <EditPatientForm
          patient={patient}
          onSave={(updated) => {
            updatePatient(updated);
            setDrawer(null);
            pushToast({ title: "Paziente aggiornato", tone: "success" });
          }}
        />
      </Drawer>

      <Drawer open={drawer?.type === "new-visit"} title="Nuova visita" onClose={() => setDrawer(null)}>
        {settings ? (
          <NewVisitForm
            patient={patient}
            settings={settings}
            onSave={(visit) => {
              const base = allAppointments.length > 0 ? allAppointments : visits;
              saveVisits([...base, visit]);
              setDrawer(null);
              pushToast({ title: "Visita pianificata", tone: "success" });
            }}
          />
        ) : null}
      </Drawer>

      <Drawer open={drawer?.type === "mark-paid"} title="Segna pagamento" onClose={() => setDrawer(null)}>
        {drawer?.type === "mark-paid" ? (
          <MarkPaidForm
            visit={visits.find((visit) => visit.id === drawer.visitId) ?? null}
            onConfirm={(payment) => {
              markVisitPaid(drawer.visitId, payment);
              setDrawer(null);
            }}
          />
        ) : null}
      </Drawer>
    </div>
  );
};

type OverviewTabProps = {
  patient: Patient;
  nextVisit?: Appointment;
  paidTotal: number;
  outstandingTotal: number;
  lastPayment?: Appointment;
  onOpenNotes: () => void;
  onOpenVisit: (visitId: string) => void;
  onMarkCompleted: (visitId: string) => void;
  onMarkPaid: (visitId: string) => void;
};

const OverviewTab = ({
  patient,
  nextVisit,
  paidTotal,
  outstandingTotal,
  lastPayment,
  onOpenNotes,
  onOpenVisit,
  onMarkCompleted,
  onMarkPaid,
}: OverviewTabProps) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <Card className="lg:col-span-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prossima visita</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {nextVisit ? formatDateTime(nextVisit.start) : "Nessuna visita pianificata"}
          </p>
          <p className="text-sm text-slate-500">
            {nextVisit ? `${nextVisit.trattamento} · ${nextVisit.luogo}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextVisit ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onOpenVisit(nextVisit.id)}>Apri visita</Button>
              <Button size="sm" variant="outline" onClick={() => onMarkCompleted(nextVisit.id)}>Segna completata</Button>
              <Button size="sm" variant="outline" onClick={() => onMarkPaid(nextVisit.id)}>Segna pagata</Button>
            </>
          ) : (
            <span className="text-xs text-slate-500">Pianifica una nuova visita dal pulsante sopra.</span>
          )}
        </div>
      </div>
    </Card>

    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sintesi clinica</p>
      <p className="mt-2 text-sm text-slate-700">
        {patient.clinicalNotes?.note || patient.noteCliniche}
      </p>
      <Button size="sm" variant="ghost" className="mt-3" onClick={onOpenNotes}>
        Vai a note
      </Button>
    </Card>

    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Riepilogo economico</p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Tot incassato</span>
          <span className="font-semibold text-slate-800">{formatCurrency(paidTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Tot insoluti</span>
          <span className="font-semibold text-rose-600">{formatCurrency(outstandingTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Ultimo pagamento</span>
          <span className="text-slate-700">{lastPayment?.payment.paidAt ? formatDate(lastPayment.payment.paidAt) : "Nessuno"}</span>
        </div>
      </div>
    </Card>

    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Logistica</p>
      <p className="mt-2 text-sm text-slate-700">{patient.indirizzo}</p>
      <p className="mt-2 text-xs text-slate-500">{patient.noteLogistiche || "Nessuna nota logistica."}</p>
      <a className="mt-3 inline-flex text-xs font-semibold text-teal-600" href={buildMapsUrl(patient.indirizzo)} target="_blank" rel="noreferrer">
        Apri Maps
      </a>
    </Card>
  </div>
);

type VisitsTabProps = {
  visits: Appointment[];
  onOpen: (visitId: string) => void;
  onDuplicate: (visitId: string) => void;
  onMarkCompleted: (visitId: string) => void;
  onMarkPaid: (visitId: string) => void;
  onDelete: (visitId: string) => void;
  onNewVisit: () => void;
};

const VisitsTab = ({ visits, onOpen, onDuplicate, onMarkCompleted, onMarkPaid, onDelete, onNewVisit }: VisitsTabProps) => {
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [paid, setPaid] = useState("all");

  const filtered = visits.filter((visit) => {
    const date = new Date(visit.start);
    const periodOk =
      period === "all" ||
      (period === "today" && format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) ||
      (period === "week" && date >= addHours(new Date(), -24 * 7)) ||
      (period === "month" && date >= addHours(new Date(), -24 * 30));
    const statusOk = status === "all" || visit.status === status;
    const paymentStatus = getPaymentStatus(visit);
    const paidOk = paid === "all" || (paid === "yes" ? paymentStatus === "paid" : paymentStatus !== "paid");
    return periodOk && statusOk && paidOk;
  });

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Periodo</label>
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tutti</option>
              <option value="today">Oggi</option>
              <option value="week">Questa settimana</option>
              <option value="month">Questo mese</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Stato</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tutti</option>
              <option value="programmata">Programmata</option>
              <option value="completata">Completata</option>
              <option value="cancellata">Cancellata</option>
              <option value="no-show">No-show</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Pagata</label>
            <select value={paid} onChange={(event) => setPaid(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tutte</option>
              <option value="yes">Pagate</option>
              <option value="no">Non pagate</option>
            </select>
          </div>
        </div>
        <Button size="sm" onClick={onNewVisit}><Plus className="mr-2 h-4 w-4" /> Nuova visita</Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="py-2">Data/Ora</th>
              <th>Trattamento</th>
              <th>Luogo</th>
              <th>Stato</th>
              <th>Pagata</th>
              <th>Costo</th>
              <th className="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((visit) => (
              <tr key={visit.id} className="text-slate-700">
                <td className="py-3 pr-4 font-semibold text-slate-800">{formatDateTime(visit.start)}</td>
                <td className="pr-4">{visit.trattamento}</td>
                <td className="pr-4 text-xs text-slate-500">{visit.luogo}</td>
                <td className="pr-4 text-xs uppercase tracking-wider text-slate-500">{statusLabels[visit.status]}</td>
                <td className={`pr-4 ${getPaymentStatus(visit) === "paid" ? "text-emerald-600" : getPaymentStatus(visit) === "partial" ? "text-amber-600" : "text-rose-600"}`}>
                  {getPaymentStatus(visit) === "paid" ? "Sì" : getPaymentStatus(visit) === "partial" ? "Parziale" : "No"}
                </td>
                <td className="pr-4">{formatCurrency(visit.costo)}</td>
                <td className="py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => onOpen(visit.id)}>Apri</Button>
                    <Button size="sm" variant="ghost" onClick={() => onDuplicate(visit.id)}>Duplica</Button>
                    <Button size="sm" variant="outline" onClick={() => onMarkCompleted(visit.id)}>Segna completata</Button>
                    <Button size="sm" variant="outline" onClick={() => onMarkPaid(visit.id)}>Segna pagata</Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(visit.id)}>Elimina</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <EmptyState title="Nessuna visita" description="Nessuna visita con i filtri selezionati." /> : null}
      </div>
    </Card>
  );
};

type PaymentsTabProps = {
  visits: Appointment[];
  onMarkPaid: (visitId: string) => void;
};

const PaymentsTab = ({ visits, onMarkPaid }: PaymentsTabProps) => {
  const unpaid = visits.filter((visit) => getPaymentStatus(visit) !== "paid");
  const paid = visits.filter((visit) => getPaymentStatus(visit) === "paid");
  const totalUnpaid = unpaid.reduce((sum, visit) => sum + getOutstandingAmount(visit), 0);
  const totalPaid = paid.reduce((sum, visit) => sum + getPaidAmount(visit), 0);

  const downloadCsv = () => {
    const header = "Data,Trattamento,Metodo,Importo,Stato";
    const rows = visits.map((visit) =>
      [
        new Date(visit.start).toISOString(),
        visit.trattamento,
        visit.payment.method ?? "",
        getPaidAmount(visit),
        getPaymentStatus(visit),
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pagamenti-paziente.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              Totale incassato: {formatCurrency(totalPaid)}
            </span>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              Insoluti: {formatCurrency(totalUnpaid)}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={downloadCsv}>Esporta CSV</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Da incassare</h3>
          <span className="text-xs text-slate-500">{unpaid.length} insoluti</span>
        </div>
        <div className="mt-4 space-y-3">
          {unpaid.map((visit) => (
            <div key={visit.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="font-semibold text-slate-800">{visit.trattamento}</p>
              <p className="text-xs text-slate-500">{formatDateTime(visit.start)}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-rose-600">{formatCurrency(getOutstandingAmount(visit))}</span>
                <Button size="sm" variant="outline" onClick={() => onMarkPaid(visit.id)}>
                  Segna pagata
                </Button>
              </div>
            </div>
          ))}
          {unpaid.length === 0 ? <EmptyState title="Nessun insoluto" description="Tutte le visite risultano pagate." /> : null}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-800">Storico pagamenti</h3>
        <div className="mt-4 space-y-2 text-sm">
          {paid.map((visit) => (
            <div key={visit.id} className="flex flex-wrap items-center justify-between rounded-2xl bg-slate-50 px-4 py-2">
              <span>{formatDateTime(visit.start)}</span>
              <span className="text-slate-500">{visit.payment.method ?? "-"}</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(getPaidAmount(visit))}</span>
            </div>
          ))}
          {paid.length === 0 ? <EmptyState title="Nessun pagamento" description="Non ci sono pagamenti registrati." /> : null}
        </div>
      </Card>
    </div>
  );
};

type DocumentsTabProps = {
  patientId: string;
  documents: PatientDocument[];
  visitAttachments: VisitAttachment[];
  visits: Appointment[];
  onOpenVisit: (visitId: string) => void;
};

const DocumentsTab = ({ patientId, documents, visitAttachments, visits, onOpenVisit }: DocumentsTabProps) => {
  const { pushToast } = useToastStore();
  const [category, setCategory] = useState<PatientDocument["category"]>("altro");
  const [uploading, setUploading] = useState(false);
  const { mutate: addDocument } = useAddDocumentMutation();
  const { mutate: removeDocument } = useRemoveDocumentMutation();

  const handleUpload = async (file: File) => {
    setUploading(true);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const payload: PatientDocument = {
      id: crypto.randomUUID(),
      patientId,
      name: file.name,
      category,
      uploadedAt: new Date().toISOString(),
      dataUrl,
    };
    addDocument(payload);
    pushToast({ title: "Documento caricato", tone: "success" });
    setUploading(false);
  };

  const groupedAttachments = visits.map((visit) => ({
    visit,
    attachments: visitAttachments.filter((attachment) => attachment.visitId === visit.id),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Documenti del paziente</h3>
            <p className="text-xs text-slate-500">Referti e documenti generali.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={category} onChange={(event) => setCategory(event.target.value as PatientDocument["category"])} className="rounded-full border border-slate-200 px-3 py-2 text-xs">
              <option value="referto">Referto</option>
              <option value="prescrizione">Prescrizione</option>
              <option value="altro">Altro</option>
            </select>
            <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
              Carica file
              <input
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-800">{doc.name}</p>
                <p className="text-xs text-slate-500">{doc.category} · {formatDate(doc.uploadedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                {doc.dataUrl ? (
                  <a className="text-xs font-semibold text-teal-600" href={doc.dataUrl} download={doc.name}>Download</a>
                ) : (
                  <span className="text-xs text-slate-400">Solo metadata</span>
                )}
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-500"
                  onClick={() => {
                    removeDocument({ id: doc.id, patientId });
                    pushToast({ title: "Documento eliminato", tone: "info" });
                  }}
                >
                  Elimina
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 ? <EmptyState title="Nessun documento" description="Carica il primo documento per il paziente." /> : null}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-800">Documenti per visita</h3>
        <div className="mt-4 space-y-4">
          {groupedAttachments.map(({ visit, attachments }) => (
            <div key={visit.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{visit.trattamento}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(visit.start)}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onOpenVisit(visit.id)}>Apri visita</Button>
              </div>
              <div className="mt-3 space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs">
                    <span>{attachment.name}</span>
                    {attachment.dataUrl ? (
                      <a className="text-xs font-semibold text-teal-600" href={attachment.dataUrl} download={attachment.name}>Download</a>
                    ) : (
                      <span className="text-slate-400">Solo metadata</span>
                    )}
                  </div>
                ))}
                {attachments.length === 0 ? <p className="text-xs text-slate-500">Nessun allegato per questa visita.</p> : null}
              </div>
            </div>
          ))}
          {groupedAttachments.length === 0 ? (
            <EmptyState title="Nessun allegato" description="Gli allegati visita compariranno qui." />
          ) : null}
        </div>
      </Card>
    </div>
  );
};

type NotesTabProps = {
  patient: Patient;
  allPatients: Patient[];
  onSave: (patients: Patient[]) => void;
};

const NotesTab = ({ patient, allPatients, onSave }: NotesTabProps) => {
  const { pushToast } = useToastStore();
  const didMount = useRef(false);
  const [notes, setNotes] = useState({
    problema: patient.clinicalNotes?.problema ?? "",
    obiettivi: patient.clinicalNotes?.obiettivi ?? "",
    esercizi: patient.clinicalNotes?.esercizi ?? "",
    note: patient.clinicalNotes?.note ?? patient.noteCliniche,
  });

  useEffect(() => {
    setNotes({
      problema: patient.clinicalNotes?.problema ?? "",
      obiettivi: patient.clinicalNotes?.obiettivi ?? "",
      esercizi: patient.clinicalNotes?.esercizi ?? "",
      note: patient.clinicalNotes?.note ?? patient.noteCliniche,
    });
    didMount.current = false;
  }, [patient]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const timer = setTimeout(() => {
      const updated: Patient = {
        ...patient,
        clinicalNotes: { ...notes, updatedAt: new Date().toISOString() },
        noteCliniche: notes.note,
      };
      onSave(allPatients.map((p) => (p.id === patient.id ? updated : p)));
      pushToast({ title: "Note aggiornate", tone: "success" });
    }, 900);
    return () => clearTimeout(timer);
  }, [notes, patient, onSave, allPatients, pushToast]);

  const applyTemplate = (template: "Lombalgia" | "Spalla" | "Ginocchio") => {
    const templates = {
      Lombalgia: {
        problema: "Dolore lombare con rigidità mattutina.",
        obiettivi: "Ridurre dolore, migliorare mobilità.",
        esercizi: "Stretching catena posteriore, core stability.",
      },
      Spalla: {
        problema: "Limitazione ROM spalla.",
        obiettivi: "Recupero mobilità e forza.",
        esercizi: "Mobilità attiva assistita + rinforzo rotatori.",
      },
      Ginocchio: {
        problema: "Dolore anteriore ginocchio post attività.",
        obiettivi: "Ridurre dolore e stabilizzare.",
        esercizi: "Rinforzo quadricipite e stabilità.",
      },
    };
    setNotes((prev) => ({ ...prev, ...templates[template] }));
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Note cliniche</h3>
          <p className="text-xs text-slate-500">Editor strutturato con salvataggio automatico.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Lombalgia", "Spalla", "Ginocchio"] as const).map((template) => (
            <Button key={template} size="sm" variant="ghost" onClick={() => applyTemplate(template)}>
              {template}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {(
          [
            { label: "Problema/Diagnosi", key: "problema" },
            { label: "Obiettivi", key: "obiettivi" },
            { label: "Piano esercizi", key: "esercizi" },
            { label: "Note libere", key: "note" },
          ] as const
        ).map((field) => (
          <label key={field.key} className="text-xs font-semibold text-slate-500">
            {field.label}
            <textarea
              value={notes[field.key]}
              onChange={(event) => setNotes({ ...notes, [field.key]: event.target.value })}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
    </Card>
  );
};

type EditPatientFormProps = {
  patient: Patient;
  onSave: (patient: Patient) => void;
};

const EditPatientForm = ({ patient, onSave }: EditPatientFormProps) => {
  const [form, setForm] = useState({
    nome: patient.nome,
    cognome: patient.cognome,
    telefono: patient.telefono,
    email: patient.email,
    indirizzo: patient.indirizzo,
    noteCliniche: patient.noteCliniche,
    noteLogistiche: patient.noteLogistiche ?? "",
    tags: patient.tags?.join(", ") ?? "",
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...patient,
          ...form,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {(
          [
            { label: "Nome", key: "nome" },
            { label: "Cognome", key: "cognome" },
            { label: "Telefono", key: "telefono" },
            { label: "Email", key: "email" },
          ] as const
        ).map((field) => (
          <label key={field.key} className="text-xs font-semibold text-slate-500">
            {field.label}
            <input
              value={form[field.key]}
              onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
      <label className="text-xs font-semibold text-slate-500">
        Indirizzo
        <input
          value={form.indirizzo}
          onChange={(event) => setForm({ ...form, indirizzo: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Note cliniche (sintesi)
        <textarea
          value={form.noteCliniche}
          onChange={(event) => setForm({ ...form, noteCliniche: event.target.value })}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Note logistiche
        <textarea
          value={form.noteLogistiche}
          onChange={(event) => setForm({ ...form, noteLogistiche: event.target.value })}
          rows={2}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Tag
        <input
          value={form.tags}
          onChange={(event) => setForm({ ...form, tags: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit">Aggiorna paziente</Button>
    </form>
  );
};

type NewVisitFormProps = {
  patient: Patient;
  settings: Settings;
  onSave: (visit: Appointment) => void;
};

const NewVisitForm = ({ patient, settings, onSave }: NewVisitFormProps) => {
  const start = format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm");
  const end = format(addHours(new Date(), 3), "yyyy-MM-dd'T'HH:mm");
  const [form, setForm] = useState({
    start,
    end,
    trattamento: settings.trattamenti[0]?.nome ?? "",
    costo: settings.trattamenti[0]?.costoDefault ?? settings.tariffaStandard,
    luogo: patient.indirizzo,
  });

  useEffect(() => {
    const match = settings.trattamenti.find((item) => item.nome === form.trattamento);
    if (match) {
      setForm((prev) => ({ ...prev, costo: match.costoDefault }));
    }
  }, [form.trattamento, settings.trattamenti]);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          id: crypto.randomUUID(),
          patientId: patient.id,
          start: new Date(form.start).toISOString(),
          end: new Date(form.end).toISOString(),
          luogo: form.luogo,
          trattamento: form.trattamento,
          costo: form.costo,
          totalAmount: form.costo,
          status: "programmata",
          payment: { paid: false },
          deposits: [],
        });
      }}
    >
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-semibold">{patient.nome} {patient.cognome}</p>
        <p className="text-xs">{patient.indirizzo}</p>
      </div>
      <label className="text-xs font-semibold text-slate-500">
        Inizio
        <input type="datetime-local" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Fine
        <input type="datetime-local" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Trattamento
        <select value={form.trattamento} onChange={(event) => setForm({ ...form, trattamento: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
          {settings.trattamenti.map((item) => (
            <option key={item.id} value={item.nome}>{item.nome}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Costo
        <input type="number" value={form.costo} onChange={(event) => setForm({ ...form, costo: Number(event.target.value) })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Luogo
        <input value={form.luogo} onChange={(event) => setForm({ ...form, luogo: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <Button type="submit">Salva visita</Button>
    </form>
  );
};

type MarkPaidFormProps = {
  visit: Appointment | null;
  onConfirm: (payment: VisitPayment) => void;
};

const MarkPaidForm = ({ visit, onConfirm }: MarkPaidFormProps) => {
  const [method, setMethod] = useState<VisitPayment["method"]>("contanti");
  const [paidAt, setPaidAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [amount, setAmount] = useState(visit?.totalAmount ?? visit?.costo ?? 0);

  useEffect(() => {
    if (!visit) return;
    setAmount(visit.totalAmount ?? visit.costo);
    setMethod(visit.payment.method ?? "contanti");
  }, [visit]);

  if (!visit) return <p className="text-sm text-slate-500">Visita non trovata.</p>;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm({
          paid: true,
          method,
          paidAt: new Date(paidAt).toISOString(),
          amountPaid: amount,
        });
      }}
    >
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-semibold">{visit.trattamento}</p>
        <p className="text-xs">{formatDateTime(visit.start)}</p>
        <p className="text-xs">Costo: {formatCurrency(visit.totalAmount ?? visit.costo)}</p>
      </div>
      <label className="text-xs font-semibold text-slate-500">
        Metodo pagamento
        <select value={method} onChange={(event) => setMethod(event.target.value as VisitPayment["method"])} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
          {paymentMethodOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Data incasso
        <input type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Importo pagato
        <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <Button type="submit">Conferma pagamento</Button>
    </form>
  );
};
