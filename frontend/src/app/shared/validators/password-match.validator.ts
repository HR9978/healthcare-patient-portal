import { ValidatorFn } from '@angular/forms';

/** Group validator: password and confirmPassword must be identical. */
export const passwordMatchValidator: ValidatorFn = (group) => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
};
