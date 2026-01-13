import { addDays, addHours, formatISO, isAfter } from "date-fns";
import { getOutstandingAmount, getPaidAmount, getPaymentStatus } from "./payments";
import type {
  Appointment,
  ClinicalNotes,
  Database,
  Deposit,
  Patient,
  PatientDocument,
  Settings,
  VisitAttachment,
  VisitNotes,
  VisitPayment,
  VisitFilters,
} from "../types";

const STORAGE_KEY = "fisio-db-v1";

const makeId = () => crypto.randomUUID();

const toPaymentMethod = (value?: string) => {
  if (!value) return undefined;
  const lowered = value.toLowerCase();
  if (lowered.includes("cont")) return "contanti";
  if (lowered.includes("bon")) return "bonifico";
  if (lowered.includes("pos") || lowered.includes("card")) return "pos";
  return undefined;
};

const createSeedPatients = (): Patient[] => {
  const baseDate = new Date();
  return [
    {
      id: makeId(),
      nome: "Giulia",
      cognome: "Rossi",
      telefono: "+39 348 1122334",
      email: "giulia.rossi@email.it",
      indirizzo: "Via Garibaldi 12, Milano",
      noteCliniche: "Lombalgia cronica, miglioramento dopo ciclo precedente.",
      noteLogistiche: "Scala B, citofono Rossi, parcheggio in via laterale.",
      tags: ["posturale", "domicilio"],
      clinicalNotes: {
        problema: "Dolore lombare da postura sedentaria.",
        obiettivi: "Riduzione dolore e aumento mobilità.",
        esercizi: "Stretching catena posteriore, core stability.",
        note: "Controllo settimanale con progressi costanti.",
        updatedAt: formatISO(addDays(baseDate, -10)),
      },
      createdAt: formatISO(addDays(baseDate, -120)),
    },
    {
      id: makeId(),
      nome: "Marco",
      cognome: "Bianchi",
      telefono: "+39 333 5566778",
      email: "marco.bianchi@email.it",
      indirizzo: "Corso Europa 45, Milano",
      noteCliniche: "Recupero post intervento spalla destra.",
      noteLogistiche: "Secondo piano senza ascensore.",
      tags: ["riabilitazione"],
      clinicalNotes: {
        problema: "Ridotta mobilità spalla destra post intervento.",
        obiettivi: "Recupero range di movimento entro 6 settimane.",
        esercizi: "Mobilizzazione passiva e attiva assistita.",
        note: "Buona adesione agli esercizi domiciliari.",
        updatedAt: formatISO(addDays(baseDate, -7)),
      },
      createdAt: formatISO(addDays(baseDate, -200)),
    },
    {
      id: makeId(),
      nome: "Elena",
      cognome: "Sala",
      telefono: "+39 320 9988776",
      email: "elena.sala@email.it",
      indirizzo: "Via dei Navigli 8, Milano",
      noteCliniche: "Cervicalgia, consigliate sedute settimanali.",
      noteLogistiche: "Portineria presente fino alle 18:00.",
      tags: ["cervicale"],
      clinicalNotes: {
        problema: "Cervicalgia con rigidità mattutina.",
        obiettivi: "Ridurre tensione e migliorare postura.",
        esercizi: "Mobilità cervicale e respirazione diaframmatica.",
        note: "Referisce beneficio dopo trattamento.",
        updatedAt: formatISO(addDays(baseDate, -5)),
      },
      createdAt: formatISO(addDays(baseDate, -90)),
    },
    {
      id: makeId(),
      nome: "Paolo",
      cognome: "Ferrari",
      telefono: "+39 347 2233445",
      email: "paolo.ferrari@email.it",
      indirizzo: "Piazza Duomo 3, Milano",
      noteCliniche: "Riabilitazione ginocchio post corsa.",
      noteLogistiche: "Ingresso principale, interno 5.",
      tags: ["sport"],
      clinicalNotes: {
        problema: "Infiammazione tendinea ginocchio.",
        obiettivi: "Ritorno alla corsa senza dolore.",
        esercizi: "Forza quadricipite e stabilità.",
        note: "Sessioni ogni 10 giorni.",
        updatedAt: formatISO(addDays(baseDate, -3)),
      },
      createdAt: formatISO(addDays(baseDate, -50)),
    },
    {
      id: makeId(),
      nome: "Sara",
      cognome: "Galli",
      telefono: "+39 351 7788990",
      email: "sara.galli@email.it",
      indirizzo: "Via Torino 21, Milano",
      noteCliniche: "Trattamento posturale, miglioramento costante.",
      noteLogistiche: "Citofono Galli, facile accesso.",
      tags: ["posturale"],
      clinicalNotes: {
        problema: "Scompenso posturale e dolori diffusi.",
        obiettivi: "Allineamento e gestione dolore.",
        esercizi: "Allungamenti e rinforzo dorsale.",
        note: "Programma mantenimento mensile.",
        updatedAt: formatISO(addDays(baseDate, -2)),
      },
      createdAt: formatISO(addDays(baseDate, -30)),
    },
    {
      id: makeId(),
      nome: "Davide",
      cognome: "Ricci",
      telefono: "+39 329 1122777",
      email: "davide.ricci@email.it",
      indirizzo: "Via Marconi 9, Milano",
      noteCliniche: "Contrattura lombare, sedute ogni 2 settimane.",
      noteLogistiche: "Appartamento 12, ascensore disponibile.",
      tags: ["domicilio"],
      clinicalNotes: {
        problema: "Contrattura lombare ricorrente.",
        obiettivi: "Ridurre frequenza episodi.",
        esercizi: "Mobilità lombare e core.",
        note: "Preferisce sedute mattutine.",
        updatedAt: formatISO(addDays(baseDate, -1)),
      },
      createdAt: formatISO(addDays(baseDate, -15)),
    },
  ];
};

const createSeedSettings = (): Settings => ({
  tariffaStandard: 70,
  trattamenti: [
    { id: makeId(), nome: "Terapia manuale", durata: 60, costoDefault: 75 },
    { id: makeId(), nome: "Rieducazione posturale", durata: 45, costoDefault: 65 },
    { id: makeId(), nome: "Linfodrenaggio", durata: 50, costoDefault: 80 },
    { id: makeId(), nome: "Riabilitazione sportiva", durata: 60, costoDefault: 85 },
  ],
  metodiPagamento: [
    { id: makeId(), nome: "Contanti" },
    { id: makeId(), nome: "POS" },
    { id: makeId(), nome: "Bonifico" },
  ],
});

const buildPayment = (paid: boolean, method?: string, amountPaid?: number, paidAt?: string): VisitPayment =>
  paid
    ? {
        paid: true,
        method: toPaymentMethod(method),
        paidAt: paidAt ?? formatISO(new Date()),
        amountPaid,
      }
    : { paid: false };

const buildDeposit = (visitId: string, amount: number, method?: string, paidAt?: string, note?: string): Deposit => ({
  id: makeId(),
  visitId,
  amount,
  method: toPaymentMethod(method) ?? "contanti",
  paidAt: paidAt ?? formatISO(new Date()),
  note,
});

const createSeedAppointments = (patients: Patient[]): Appointment[] => {
  const today = new Date();
  const [giulia, marco, elena, paolo, sara, davide] = patients;
  const giuliaVisitPaidId = makeId();
  const giuliaVisitUnpaidId = makeId();
  const giuliaVisitCompletedId = makeId();
  const elenaVisitId = makeId();
  const saraVisitId = makeId();

  return [
    {
      id: giuliaVisitPaidId,
      patientId: giulia.id,
      start: formatISO(addDays(today, -3)),
      end: formatISO(addHours(addDays(today, -3), 1)),
      luogo: giulia.indirizzo,
      trattamento: "Terapia manuale",
      costo: 75,
      totalAmount: 75,
      status: "completata",
      payment: buildPayment(true, "POS", 75, formatISO(addDays(today, -3))),
      deposits: [buildDeposit(giuliaVisitPaidId, 75, "POS", formatISO(addDays(today, -3)))],
      notes: {
        subjective: "Dolore lombare ridotto, rigidità al mattino.",
        objective: "Mobilità migliorata, tensione lombare moderata.",
        assessment: "Progressi costanti con esercizi assegnati.",
        plan: "Continuare core stability + seduta tra 10 giorni.",
      },
    },
    {
      id: giuliaVisitUnpaidId,
      patientId: giulia.id,
      start: formatISO(addHours(today, 2)),
      end: formatISO(addHours(today, 3)),
      luogo: giulia.indirizzo,
      trattamento: "Rieducazione posturale",
      costo: 65,
      totalAmount: 65,
      status: "programmata",
      payment: buildPayment(false),
      deposits: [],
    },
    {
      id: giuliaVisitCompletedId,
      patientId: giulia.id,
      start: formatISO(addDays(today, -12)),
      end: formatISO(addHours(addDays(today, -12), 1)),
      luogo: giulia.indirizzo,
      trattamento: "Terapia manuale",
      costo: 75,
      totalAmount: 75,
      status: "completata",
      payment: buildPayment(false),
      deposits: [buildDeposit(giuliaVisitCompletedId, 30, "Contanti", formatISO(addDays(today, -12)), "Acconto iniziale")],
    },
    {
      id: makeId(),
      patientId: marco.id,
      start: formatISO(addHours(today, 4)),
      end: formatISO(addHours(today, 5)),
      luogo: marco.indirizzo,
      trattamento: "Riabilitazione sportiva",
      costo: 85,
      totalAmount: 85,
      status: "programmata",
      payment: buildPayment(false),
      deposits: [],
    },
    {
      id: elenaVisitId,
      patientId: elena.id,
      start: formatISO(addDays(today, 1)),
      end: formatISO(addHours(addDays(today, 1), 1)),
      luogo: elena.indirizzo,
      trattamento: "Rieducazione posturale",
      costo: 65,
      totalAmount: 65,
      status: "programmata",
      payment: buildPayment(true, "Contanti", 65, formatISO(addDays(today, 1))),
      deposits: [buildDeposit(elenaVisitId, 65, "Contanti", formatISO(addDays(today, 1)))],
    },
    {
      id: makeId(),
      patientId: paolo.id,
      start: formatISO(addDays(today, 2)),
      end: formatISO(addHours(addDays(today, 2), 1)),
      luogo: paolo.indirizzo,
      trattamento: "Riabilitazione sportiva",
      costo: 85,
      totalAmount: 85,
      status: "programmata",
      payment: buildPayment(false),
      deposits: [],
    },
    {
      id: saraVisitId,
      patientId: sara.id,
      start: formatISO(addDays(today, -2)),
      end: formatISO(addHours(addDays(today, -2), 1)),
      luogo: sara.indirizzo,
      trattamento: "Linfodrenaggio",
      costo: 80,
      totalAmount: 80,
      status: "completata",
      payment: buildPayment(true, "Contanti", 80, formatISO(addDays(today, -2))),
      deposits: [buildDeposit(saraVisitId, 80, "Contanti", formatISO(addDays(today, -2)))],
    },
    {
      id: makeId(),
      patientId: davide.id,
      start: formatISO(addDays(today, -5)),
      end: formatISO(addHours(addDays(today, -5), 1)),
      luogo: davide.indirizzo,
      trattamento: "Terapia manuale",
      costo: 75,
      totalAmount: 75,
      status: "completata",
      payment: buildPayment(false),
      deposits: [],
    },
  ];
};

const createSeedDocuments = (patients: Patient[]): PatientDocument[] => [
  {
    id: makeId(),
    patientId: patients[0]?.id ?? "",
    name: "Referto controllo lombare.pdf",
    category: "referto",
    uploadedAt: formatISO(addDays(new Date(), -30)),
    dataUrl: undefined,
  },
];

const createSeedVisitAttachments = (appointments: Appointment[]): VisitAttachment[] => [
  {
    id: makeId(),
    visitId: appointments[0]?.id ?? "",
    name: "Esercizi_lombalgia.pdf",
    category: "esercizi",
    uploadedAt: formatISO(addDays(new Date(), -3)),
    dataUrl: undefined,
  },
];

const seedDatabase = (): Database => {
  const patients = createSeedPatients();
  const appointments = createSeedAppointments(patients);
  return {
    patients,
    appointments,
    settings: createSeedSettings(),
    documents: createSeedDocuments(patients),
    visitAttachments: createSeedVisitAttachments(appointments),
  };
};

const normalizeAppointment = (appointment: Appointment): Appointment => {
  const legacy = appointment as Appointment & {
    pagata?: boolean;
    metodoPagamento?: string;
    paidAt?: string;
    stato?: Appointment["status"];
  };
  const totalAmount = appointment.totalAmount ?? appointment.costo;
  const hasDeposits = appointment.deposits && appointment.deposits.length > 0;
  const paidAmountFromPayment = appointment.payment?.amountPaid ?? (legacy.pagata ? totalAmount : 0);
  const shouldCreateDeposit =
    !hasDeposits && (legacy.pagata || appointment.payment?.paid || paidAmountFromPayment > 0);
  const deposits = (hasDeposits
    ? appointment.deposits
    : shouldCreateDeposit
      ? [
          buildDeposit(
            appointment.id,
            paidAmountFromPayment || totalAmount,
            appointment.payment?.method ?? legacy.metodoPagamento,
            appointment.payment?.paidAt ?? legacy.paidAt ?? appointment.end
          ),
        ]
      : []) ?? [];
  const paidAmount = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
  const lastDeposit = deposits.length ? deposits[deposits.length - 1] : undefined;
  const payment: VisitPayment = {
    paid: paidAmount >= totalAmount && totalAmount > 0,
    method: lastDeposit?.method ?? appointment.payment?.method ?? toPaymentMethod(legacy.metodoPagamento),
    paidAt: lastDeposit?.paidAt ?? appointment.payment?.paidAt ?? legacy.paidAt,
    amountPaid: paidAmount > 0 ? paidAmount : appointment.payment?.amountPaid,
  };
  return {
    ...appointment,
    status: legacy.stato ?? appointment.status ?? "programmata",
    totalAmount,
    payment,
    deposits,
  };
};

const normalizeDatabase = (db: Database): Database => {
  const normalized: Database = {
    ...db,
    settings: db.settings ?? createSeedSettings(),
    documents: (db.documents ?? []).map((doc) => ({
      id: doc.id,
      patientId: doc.patientId,
      name: doc.name,
      category: doc.category ?? "altro",
      uploadedAt: doc.uploadedAt ?? (doc as { createdAt?: string }).createdAt ?? formatISO(new Date()),
      dataUrl: doc.dataUrl,
    })),
    visitAttachments: db.visitAttachments ?? [],
    appointments: (db.appointments ?? []).map(normalizeAppointment),
  };

  if (!normalized.visitAttachments.length) {
    normalized.visitAttachments = createSeedVisitAttachments(normalized.appointments);
  }

  return normalized;
};

export const loadDatabase = (): Database => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = seedDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as Database;
    const normalized = normalizeDatabase(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    const seed = seedDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
};

export const saveDatabase = (db: Database) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const getPatients = (): Patient[] => loadDatabase().patients;

export const getPatientById = (patientId: string) =>
  getPatients().find((patient) => patient.id === patientId) ?? null;

export const setPatients = (patients: Patient[]) => {
  const db = loadDatabase();
  db.patients = patients;
  saveDatabase(db);
};

export const getAppointments = (): Appointment[] => loadDatabase().appointments;

export const getVisitsByPatientId = (patientId: string) =>
  getAppointments().filter((appointment) => appointment.patientId === patientId);

export const getVisitById = (visitId: string) =>
  getAppointments().find((appointment) => appointment.id === visitId) ?? null;

export const setAppointments = (appointments: Appointment[]) => {
  const db = loadDatabase();
  db.appointments = appointments.map(normalizeAppointment);
  saveDatabase(db);
};

export const migrateLegacyVisits = () => {
  const db = loadDatabase();
  db.appointments = db.appointments.map(normalizeAppointment);
  saveDatabase(db);
};

export const updateVisitNotes = (visitId: string, notes: VisitNotes) => {
  const db = loadDatabase();
  db.appointments = db.appointments.map((visit) =>
    visit.id === visitId ? { ...visit, notes } : visit
  );
  saveDatabase(db);
};

export const updateVisitPayment = (visitId: string, payment: VisitPayment) => {
  const db = loadDatabase();
  db.appointments = db.appointments.map((visit) =>
    visit.id === visitId ? normalizeAppointment({ ...visit, payment }) : visit
  );
  saveDatabase(db);
};

export const addDeposit = (visitId: string, deposit: Deposit) => {
  const db = loadDatabase();
  db.appointments = db.appointments.map((visit) => {
    if (visit.id !== visitId) return visit;
    const deposits = [...(visit.deposits ?? []), deposit];
    return normalizeAppointment({ ...visit, deposits });
  });
  saveDatabase(db);
};

export const removeDeposit = (visitId: string, depositId: string) => {
  const db = loadDatabase();
  db.appointments = db.appointments.map((visit) => {
    if (visit.id !== visitId) return visit;
    const deposits = (visit.deposits ?? []).filter((item) => item.id !== depositId);
    return normalizeAppointment({ ...visit, deposits });
  });
  saveDatabase(db);
};

export const updateVisitStatus = (visitId: string, status: Appointment["status"]) => {
  const db = loadDatabase();
  db.appointments = db.appointments.map((visit) =>
    visit.id === visitId ? { ...visit, status } : visit
  );
  saveDatabase(db);
};

export const updateVisitDateTime = (visitId: string, start: string, end: string) => {
  const db = loadDatabase();
  db.appointments = db.appointments.map((visit) =>
    visit.id === visitId ? { ...visit, start, end } : visit
  );
  saveDatabase(db);
};

export const markVisitCompleted = (visitId: string) => {
  const db = loadDatabase();
  db.appointments = db.appointments.map((visit) =>
    visit.id === visitId ? { ...visit, status: "completata" } : visit
  );
  saveDatabase(db);
};

export const deleteVisit = (visitId: string) => {
  const db = loadDatabase();
  db.appointments = db.appointments.filter((visit) => visit.id !== visitId);
  saveDatabase(db);
};

export const duplicateVisit = (visitId: string) => {
  const db = loadDatabase();
  const original = db.appointments.find((visit) => visit.id === visitId);
  if (!original) return null;
  const copy: Appointment = {
    ...original,
    id: makeId(),
    status: "programmata",
    payment: { paid: false },
    deposits: [],
    totalAmount: original.totalAmount ?? original.costo,
  };
  db.appointments = [...db.appointments, copy];
  saveDatabase(db);
  return copy;
};

export const listVisits = (filters: VisitFilters) => {
  const { period, status, paid, patientId, query, startDate, endDate } = filters;
  const normalizedQuery = query?.toLowerCase().trim() ?? "";
  const patientMap = new Map(getPatients().map((patient) => [patient.id, patient]));

  return getAppointments().filter((visit) => {
    const patient = patientMap.get(visit.patientId);
    const patientBlob = patient ? `${patient.nome} ${patient.cognome} ${patient.indirizzo}` : "";
    const visitDate = new Date(visit.start);
    const now = new Date();
    const matchesPeriod =
      period === "all" ||
      (period === "today" && visitDate.toDateString() === now.toDateString()) ||
      (period === "week" && visitDate >= addDays(now, -7)) ||
      (period === "month" && visitDate >= addDays(now, -30)) ||
      (period === "custom" &&
        (!startDate || visitDate >= new Date(startDate)) &&
        (!endDate || visitDate <= addDays(new Date(endDate), 1)));

    const matchesStatus = status === "all" || visit.status === status;
    const matchesPaid =
      paid === "all" || (paid === "paid" ? getPaymentStatus(visit) === "paid" : getPaymentStatus(visit) !== "paid");
    const matchesPatient = !patientId || visit.patientId === patientId;

    const matchesQuery =
      !normalizedQuery ||
      `${visit.trattamento} ${visit.luogo} ${patientBlob}`.toLowerCase().includes(normalizedQuery);

    return matchesPeriod && matchesStatus && matchesPaid && matchesPatient && matchesQuery;
  });
};

export const getSettings = (): Settings => loadDatabase().settings;

export const setSettings = (settings: Settings) => {
  const db = loadDatabase();
  db.settings = settings;
  saveDatabase(db);
};

export const getDocumentsByPatient = (patientId: string) =>
  loadDatabase().documents.filter((document) => document.patientId === patientId);

export const addPatientDocument = (document: PatientDocument) => {
  const db = loadDatabase();
  db.documents = [...db.documents, document];
  saveDatabase(db);
};

export const removePatientDocument = (documentId: string) => {
  const db = loadDatabase();
  db.documents = db.documents.filter((document) => document.id !== documentId);
  saveDatabase(db);
};

export const getVisitAttachments = (visitId: string) =>
  loadDatabase().visitAttachments.filter((attachment) => attachment.visitId === visitId);

export const getVisitAttachmentsByPatientId = (patientId: string) => {
  const visitIds = getVisitsByPatientId(patientId).map((visit) => visit.id);
  return loadDatabase().visitAttachments.filter((attachment) => visitIds.includes(attachment.visitId));
};

export const addVisitAttachment = (attachment: VisitAttachment) => {
  const db = loadDatabase();
  db.visitAttachments = [...db.visitAttachments, attachment];
  saveDatabase(db);
};

export const removeVisitAttachment = (attachmentId: string) => {
  const db = loadDatabase();
  db.visitAttachments = db.visitAttachments.filter((attachment) => attachment.id !== attachmentId);
  saveDatabase(db);
};

export const updatePatientNotes = (patientId: string, notes: ClinicalNotes) => {
  const db = loadDatabase();
  db.patients = db.patients.map((patient) =>
    patient.id === patientId
      ? {
          ...patient,
          clinicalNotes: { ...notes, updatedAt: formatISO(new Date()) },
          noteCliniche: notes.note || patient.noteCliniche,
        }
      : patient
  );
  saveDatabase(db);
  return db.patients.find((patient) => patient.id === patientId) ?? null;
};

export const computePatientKpi = (patientId: string) => {
  const visits = getVisitsByPatientId(patientId);
  const nextVisit = visits
    .filter((visit) => isAfter(new Date(visit.start), new Date()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  const outstandingTotal = visits
    .filter((visit) => getPaymentStatus(visit) !== "paid")
    .reduce((sum, visit) => sum + getOutstandingAmount(visit), 0);
  const paidTotal = visits
    .filter((visit) => getPaymentStatus(visit) === "paid")
    .reduce((sum, visit) => sum + getPaidAmount(visit), 0);

  return { nextVisit, outstandingTotal, paidTotal };
};

export const ensureSeed = () => {
  loadDatabase();
};
