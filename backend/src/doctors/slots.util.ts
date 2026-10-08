import { AppointmentStatus } from '@prisma/client';

export const MINUTE_MS = 60_000;

/** Appointments with these statuses no longer occupy a slot. */
export const SLOT_FREEING_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

/**
 * The clinic's offset from UTC in minutes (e.g. 300 for Pakistan, which has no DST).
 * Schedules store local clinic times such as "09:00"; this converts them to real instants.
 */
export function clinicOffsetMinutes(): number {
  const value = Number(process.env.CLINIC_UTC_OFFSET_MINUTES ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/** "09:30" -> 570 */
export function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Validates "YYYY-MM-DD" and returns its parts, or null if it is not a real date. */
export function parseDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day, dayOfWeek: date.getUTCDay() };
}

/** Clinic-local calendar date + minutes after midnight -> UTC instant. */
export function clinicLocalToUtc(
  year: number,
  month: number,
  day: number,
  minutesAfterMidnight: number,
): Date {
  return new Date(
    Date.UTC(year, month - 1, day, 0, minutesAfterMidnight) -
      clinicOffsetMinutes() * MINUTE_MS,
  );
}

/** UTC instant -> clinic-local weekday and minutes after midnight. */
export function utcToClinicParts(date: Date) {
  const shifted = new Date(date.getTime() + clinicOffsetMinutes() * MINUTE_MS);
  return {
    dayOfWeek: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}
