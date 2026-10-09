import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { Invoice } from '../../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingApi {
  private readonly http = inject(HttpClient);

  invoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${API_URL}/invoices`);
  }
}
