export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

interface PersonName {
  firstName: string;
  lastName: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  reason: string | null;
  room: { name: string } | null;
  doctor: { id: string; specialty: { name: string }; user: PersonName };
  patient: { id: string; user: PersonName };
  invoice: { id: string; amount: string; status: string } | null;
}
