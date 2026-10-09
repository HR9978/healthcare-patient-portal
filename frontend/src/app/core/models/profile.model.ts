import { Role } from './user.model';

export interface PatientDetails {
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  insuranceNumber: string | null;
}

export interface Profile {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string | null;
  patient: PatientDetails | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  insuranceNumber?: string;
}
