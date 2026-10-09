import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Shows a toast for errors the user cannot fix in a form. Validation (400),
 * conflicts (409) and auth (401) errors are handled where they happen.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          notify.error('Cannot reach the server. Please check your connection.');
        } else if (error.status === 403) {
          notify.error('You do not have permission to do that.');
        } else if (error.status >= 500) {
          notify.error('Something went wrong on the server. Please try again.');
        }
      }
      return throwError(() => error);
    }),
  );
};
