interface PersonName {
  firstName: string;
  lastName: string;
}

interface DoctorInfo {
  id: string;
  specialty: { name: string };
  user: PersonName;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string | null;
  issuedAt: string;
}

export interface IssuedPrescription extends Prescription {
  doctor: DoctorInfo;
}

export interface MedicalRecord {
  id: string;
  diagnosis: string;
  symptoms: string | null;
  treatment: string | null;
  notes: string | null;
  createdAt: string;
  doctor: DoctorInfo;
  patient: { id: string; user: PersonName };
  appointment: { id: string; startsAt: string } | null;
  prescriptions: Prescription[];
}

export interface PrescriptionRequest {
  medication: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface CreateRecordRequest {
  appointmentId: string;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;
  prescriptions?: PrescriptionRequest[];
}
