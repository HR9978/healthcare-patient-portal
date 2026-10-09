import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Appointment } from '../../../core/models/appointment.model';
import { Doctor, Slot, Specialty } from '../../../core/models/doctor.model';
import {
  AppointmentsApi,
  PaymentMethod,
} from '../../../core/services/api/appointments.api';
import { DoctorsApi } from '../../../core/services/api/doctors.api';
import { apiMessage } from '../../../shared/utils/api-error';
import { offsetToTimezone } from '../../../shared/utils/clinic-time';

/** Wizard state. Provided by BookWizard, so it resets whenever the page is reopened. */
@Injectable()
export class BookingStore {
  private readonly doctorsApi = inject(DoctorsApi);
  private readonly appointmentsApi = inject(AppointmentsApi);

  readonly stepIndex = signal(0);

  // Step 1: doctor
  readonly specialties = signal<Specialty[]>([]);
  readonly doctors = signal<Doctor[]>([]);
  readonly doctorsLoading = signal(false);
  readonly doctorsFailed = signal(false);
  readonly searchText = signal('');
  readonly specialtyId = signal<string | null>(null);
  readonly doctor = signal<Doctor | null>(null);

  // Step 2: date and slot
  readonly date = signal('');
  readonly slots = signal<Slot[]>([]);
  readonly slotsLoading = signal(false);
  readonly slotsError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly offsetMinutes = signal(0);
  readonly slot = signal<Slot | null>(null);

  // Step 3: details
  readonly reason = signal('');

  // Steps 3-5: booking and payment
  readonly appointment = signal<Appointment | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly clinicTimezone = computed(() => offsetToTimezone(this.offsetMinutes()));

  goTo(index: number): void {
    this.error.set(null);
    this.stepIndex.set(index);
  }

  loadSpecialties(): void {
    this.doctorsApi.specialties().subscribe({
      next: (list) => this.specialties.set(list),
      error: () => undefined,
    });
  }

  loadDoctors(): void {
    this.doctorsLoading.set(true);
    this.doctorsFailed.set(false);
    this.doctorsApi
      .doctors({ specialtyId: this.specialtyId(), search: this.searchText() })
      .subscribe({
        next: (list) => {
          this.doctors.set(list);
          this.doctorsLoading.set(false);
        },
        error: () => {
          this.doctorsFailed.set(true);
          this.doctorsLoading.set(false);
        },
      });
  }

  selectDoctor(doctor: Doctor): void {
    if (this.doctor()?.id !== doctor.id) {
      this.date.set('');
      this.slots.set([]);
      this.slot.set(null);
      this.notice.set(null);
    }
    this.doctor.set(doctor);
    this.goTo(1);
  }

  setDate(date: string): void {
    this.date.set(date);
    this.slot.set(null);
    this.notice.set(null);
    if (!date) {
      this.slots.set([]);
      return;
    }
    this.loadSlots();
  }

  loadSlots(): void {
    const doctor = this.doctor();
    const date = this.date();
    if (!doctor || !date) {
      return;
    }
    this.slotsLoading.set(true);
    this.slotsError.set(null);
    this.doctorsApi.slots(doctor.id, date).subscribe({
      next: (res) => {
        this.slots.set(res.slots);
        this.offsetMinutes.set(res.timezoneOffsetMinutes);
        this.slotsLoading.set(false);
      },
      error: (err: unknown) => {
        this.slots.set([]);
        this.slotsError.set(apiMessage(err, 'Could not load time slots.'));
        this.slotsLoading.set(false);
      },
    });
  }

  selectSlot(slot: Slot): void {
    if (slot.available) {
      this.notice.set(null);
      this.slot.set(slot);
    }
  }

  /** Holds the slot (status PENDING). The database rejects a simultaneous double-booking. */
  createAppointment(): void {
    const doctor = this.doctor();
    const slot = this.slot();
    if (!doctor || !slot) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    this.appointmentsApi
      .create({
        doctorId: doctor.id,
        startsAt: slot.startsAt,
        reason: this.reason().trim() || undefined,
      })
      .subscribe({
        next: (appointment) => {
          this.appointment.set(appointment);
          this.busy.set(false);
          this.goTo(3);
        },
        error: (err: HttpErrorResponse) => {
          this.busy.set(false);
          const message = apiMessage(err, 'Could not book this slot. Please try again.');
          if (err.status === 409) {
            // Someone else got there first: send the patient back to pick another time.
            this.slot.set(null);
            this.notice.set(message);
            this.loadSlots();
            this.goTo(1);
          } else {
            this.error.set(message);
          }
        },
      });
  }

  pay(method: PaymentMethod): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    this.appointmentsApi.pay(appointment.id, method).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.busy.set(false);
        this.goTo(4);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(apiMessage(err, 'Payment could not be completed. Please try again.'));
      },
    });
  }

  reset(): void {
    this.stepIndex.set(0);
    this.doctor.set(null);
    this.date.set('');
    this.slots.set([]);
    this.slot.set(null);
    this.reason.set('');
    this.appointment.set(null);
    this.notice.set(null);
    this.error.set(null);
    this.slotsError.set(null);
  }
}
