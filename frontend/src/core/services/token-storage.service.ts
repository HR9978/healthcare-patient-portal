import { Injectable } from '@angular/core';
import { AuthResponse, User } from '../models/user.model';

const ACCESS_KEY = 'hp_access_token';
const REFRESH_KEY = 'hp_refresh_token';
const USER_KEY = 'hp_user';

/**
 * Portfolio demo: tokens live in localStorage. A production app would prefer
 * an HttpOnly cookie for the refresh token to reduce XSS exposure.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get accessToken(): string | null {
    return this.read(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return this.read(REFRESH_KEY);
  }

  getUser(): User | null {
    const raw = this.read(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  save(session: AuthResponse): void {
    this.write(ACCESS_KEY, session.accessToken);
    this.write(REFRESH_KEY, session.refreshToken);
    this.write(USER_KEY, JSON.stringify(session.user));
  }

  clear(): void {
    for (const key of [ACCESS_KEY, REFRESH_KEY, USER_KEY]) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* storage unavailable */
      }
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  }
}
