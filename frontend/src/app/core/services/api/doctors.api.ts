import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { Doctor, SlotsResponse, Specialty } from '../../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorsApi {
  private readonly http = inject(HttpClient);

  specialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(`${API_URL}/specialties`);
  }

  doctors(filter: { specialtyId?: string | null; search?: string }): Observable<Doctor[]> {
    let params = new HttpParams();
    if (filter.specialtyId) {
      params = params.set('specialtyId', filter.specialtyId);
    }
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    return this.http.get<Doctor[]>(`${API_URL}/doctors`, { params });
  }

  slots(doctorId: string, date: string): Observable<SlotsResponse> {
    return this.http.get<SlotsResponse>(`${API_URL}/doctors/${doctorId}/slots`, {
      params: { date },
    });
  }
}
