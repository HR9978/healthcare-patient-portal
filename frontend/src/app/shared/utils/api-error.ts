import { HttpErrorResponse } from '@angular/common/http';

/** Pulls a readable message out of a NestJS error response. */
export function apiMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join(' ');
    }
  }
  return fallback;
}
