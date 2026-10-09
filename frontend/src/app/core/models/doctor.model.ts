export interface Specialty {
  id: string;
  name: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: Specialty;
  bio: string | null;
  yearsExperience: number;
  consultationFee: number;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  available: boolean;
}

export interface SlotsResponse {
  doctorId: string;
  date: string;
  timezoneOffsetMinutes: number;
  slots: Slot[];
}
