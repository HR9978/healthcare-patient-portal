import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { Profile, UpdateProfileRequest } from '../../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);

  get(): Observable<Profile> {
    return this.http.get<Profile>(`${API_URL}/profile`);
  }

  update(body: UpdateProfileRequest): Observable<Profile> {
    return this.http.patch<Profile>(`${API_URL}/profile`, body);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/profile/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
