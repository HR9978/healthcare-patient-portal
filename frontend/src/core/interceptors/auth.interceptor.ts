import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

const NO_TOKEN = ['/auth/login', '/auth/register', '/auth/refresh'];
const NO_REFRESH = [...NO_TOKEN, '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const storage = inject(TokenStorageService);
  const router = inject(Router);

  const isApi = req.url.startsWith(API_URL);
  if (!isApi || NO_TOKEN.some((path) => req.url.includes(path))) {
    return next(req);
  }

  const withToken = (request: HttpRequest<unknown>, token: string | null) =>
    token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(withToken(req, storage.accessToken)).pipe(
    catchError((error: unknown) => {
      const canRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !NO_REFRESH.some((path) => req.url.includes(path));

      if (!canRefresh) {
        return throwError(() => error);
      }

      // Access token expired: refresh once, then replay the original request.
      return auth.refreshTokens().pipe(
        catchError((refreshError: unknown) => {
          auth.clearSession();
          void router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: true },
          });
          return throwError(() => refreshError);
        }),
        switchMap((session) => next(withToken(req, session.accessToken))),
      );
    }),
  );
};
