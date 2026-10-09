import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/** Usage: { canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } } */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];
  const user = auth.user();

  if (user && (allowed.length === 0 || allowed.includes(user.role))) {
    return true;
  }
  return router.createUrlTree(['/unauthorized']);
};
