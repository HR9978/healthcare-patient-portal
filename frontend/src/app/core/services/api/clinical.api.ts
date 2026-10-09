import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../config/api.config';
import {
  CreateRecordRequest,
  IssuedPrescription,
  MedicalRecord,
} from '../../models/clinical.model';

@Injectable({ providedIn: 'root' })
export class ClinicalApi {
  private readonly http = inject(HttpClient);

  records(): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${API_URL}/medical-records`);
  }

  createRecord(body: CreateRecordRequest): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${API_URL}/medical-records`, body);
  }

  prescriptions(): Observable<IssuedPrescription[]> {
    return this.http.get<IssuedPrescription[]>(`${API_URL}/prescriptions`);
  }
}
