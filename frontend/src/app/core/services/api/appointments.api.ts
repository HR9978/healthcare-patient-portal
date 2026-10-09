import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { Appointment } from '../../models/appointment.model';

export type PaymentMethod = 'CARD' | 'INSURANCE';

export interface CreateAppointmentRequest {
  doctorId: string;
  startsAt: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${API_URL}/appointments`);
  }

  create(body: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${API_URL}/appointments`, body);
  }

  pay(id: string, method: PaymentMethod): Observable<Appointment> {
    return this.http.post<Appointment>(`${API_URL}/appointments/${id}/pay`, { method });
  }

  cancel(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${API_URL}/appointments/${id}/cancel`, {});
  }
}
