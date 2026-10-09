import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Observable, shareReplay, tap, throwError } from 'rxjs';
import { API_URL } from '../config/api.config';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Role,
  User,
} from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

const HOME_BY_ROLE: Record<Role, string> = {
  PATIENT: '/portal',
  DOCTOR: '/doctor',
  ADMIN: '/admin',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(this.storage.getUser());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /** Shared so several parallel 401s trigger only one refresh call. */
  private refreshInFlight$: Observable<AuthResponse> | null = null;

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, body)
      .pipe(tap((session) => this.setSession(session)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, body)
      .pipe(tap((session) => this.setSession(session)));
  }

  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = this.storage.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken })
        .pipe(
          tap((session) => this.setSession(session)),
          finalize(() => (this.refreshInFlight$ = null)),
          shareReplay(1),
        );
    }
    return this.refreshInFlight$;
  }

  logout(): void {
    const refreshToken = this.storage.refreshToken;
    if (refreshToken && this.storage.accessToken) {
      // Best effort: revoke the refresh token on the server.
      this.http
        .post(`${API_URL}/auth/logout`, { refreshToken })
        .subscribe({ error: () => undefined });
    }
    this.clearSession();
    void this.router.navigate(['/auth/login']);
  }

  /** Clears local state without calling the API (used when a refresh fails). */
  clearSession(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }

  homeFor(role: Role): string {
    return HOME_BY_ROLE[role];
  }

  /** Keeps the name shown in the header in sync after a profile edit. */
  updateUser(changes: Partial<Pick<User, 'firstName' | 'lastName'>>): void {
    const current = this.currentUser();
    if (!current) {
      return;
    }
    const updated = { ...current, ...changes };
    this.storage.saveUser(updated);
    this.currentUser.set(updated);
  }

  private setSession(session: AuthResponse): void {
    this.storage.save(session);
    this.currentUser.set(session.user);
  }
}
