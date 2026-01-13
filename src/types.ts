export type ClinicalNotes = {
  problema: string;
  obiettivi: string;
  logistica?: string;
  esercizi: string;
  note: string;
  updatedAt?: string;
};

export type PatientDocumentCategory = "referto" | "prescrizione" | "altro";

export type PatientDocument = {
  id: string;
  patientId: string;
  name: string;
  category: PatientDocumentCategory;
  uploadedAt: string;
  dataUrl?: string;
};

export type VisitAttachmentCategory = "referto" | "foto" | "esercizi" | "altro";

export type VisitAttachment = {
  id: string;
  visitId: string;
  name: string;
  category: VisitAttachmentCategory;
  uploadedAt: string;
  dataUrl?: string;
};

export type VisitNotes = {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
};

export type PaymentMethodType = "contanti" | "bonifico" | "pos";

export type Deposit = {
  id: string;
  visitId: string;
  amount: number;
  method: PaymentMethodType;
  paidAt: string;
  note?: string;
};

export type VisitPayment = {
  paid: boolean;
  method?: PaymentMethodType;
  paidAt?: string;
  amountPaid?: number;
};

export type VisitFilters = {
  period: "today" | "week" | "month" | "custom" | "all";
  status: AppointmentStatus | "all";
  paid: "all" | "paid" | "unpaid";
  patientId?: string;
  query?: string;
  startDate?: string;
  endDate?: string;
};

export type Patient = {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  indirizzo: string;
  noteCliniche: string;
  noteLogistiche?: string;
  tags?: string[];
  clinicalNotes?: ClinicalNotes;
  createdAt: string;
};

export type AppointmentStatus = "programmata" | "completata" | "cancellata" | "no-show";

export type Appointment = {
  id: string;
  patientId: string;
  start: string;
  end: string;
  luogo: string;
  trattamento: string;
  costo: number;
  totalAmount?: number;
  status: AppointmentStatus;
  payment: VisitPayment;
  notes?: VisitNotes;
  deposits?: Deposit[];
  seriesId?: string;
};

export type Treatment = {
  id: string;
  nome: string;
  durata: number;
  costoDefault: number;
};

export type PaymentMethod = {
  id: string;
  nome: string;
};

export type Settings = {
  tariffaStandard: number;
  trattamenti: Treatment[];
  metodiPagamento: PaymentMethod[];
};

export type Session = {
  email: string;
  nome: string;
};

export type Database = {
  patients: Patient[];
  appointments: Appointment[];
  settings: Settings;
  documents: PatientDocument[];
  visitAttachments: VisitAttachment[];
};
