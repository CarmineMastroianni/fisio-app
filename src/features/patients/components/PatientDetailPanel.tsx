import { useMemo } from "react";
import { PatientHeader } from "./PatientHeader";
import { PatientTabs } from "./PatientTabs";
import type { Appointment, Patient } from "../../../types";

const getNextAppointment = (appointments: Appointment[]) =>
  appointments
    .filter((apt) => new Date(apt.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null;

type PatientDetailPanelProps = {
  patient: Patient;
  appointments: Appointment[];
  onNewVisit: () => void;
  onMarkPaid: (appointmentId?: string) => void;
  onEdit: () => void;
  onOpenVisit: (appointmentId: string) => void;
  onMarkCompleted: (appointmentId: string) => void;
  onDuplicate: (appointmentId: string) => void;
  onDeleteVisit: (appointmentId: string) => void;
};

export const PatientDetailPanel = ({
  patient,
  appointments,
  onNewVisit,
  onMarkPaid,
  onEdit,
  onOpenVisit,
  onMarkCompleted,
  onDuplicate,
  onDeleteVisit,
}: PatientDetailPanelProps) => {
  const nextAppointment = useMemo(() => getNextAppointment(appointments), [appointments]);
  const unpaidTotal = useMemo(
    () => appointments.filter((apt) => !apt.pagata).reduce((sum, apt) => sum + apt.costo, 0),
    [appointments]
  );

  return (
    <div className="space-y-4">
      <PatientHeader
        patient={patient}
        nextAppointment={nextAppointment}
        unpaidTotal={unpaidTotal}
        onNewVisit={onNewVisit}
        onMarkPaid={() => onMarkPaid()}
        onEdit={onEdit}
      />
      <PatientTabs
        patient={patient}
        appointments={appointments}
        onNewVisit={onNewVisit}
        onMarkPaid={(appointmentId) => onMarkPaid(appointmentId)}
        onMarkCompleted={onMarkCompleted}
        onDuplicate={onDuplicate}
        onOpenVisit={onOpenVisit}
        onDeleteVisit={onDeleteVisit}
      />
    </div>
  );
};
