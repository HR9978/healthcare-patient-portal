import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { passwordMatchValidator } from '../../shared/validators/password-match.validator';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <main class="page">
      <mat-card class="card">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-header>
          <mat-card-title>Create your account</mat-card-title>
          <mat-card-subtitle>Patient registration (demo data only)</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>First name</mat-label>
                <input matInput formControlName="firstName" autocomplete="given-name" />
                @if (form.controls.firstName.hasError('required')) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last name</mat-label>
                <input matInput formControlName="lastName" autocomplete="family-name" />
                @if (form.controls.lastName.hasError('required')) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.hasError('required')) {
                <mat-error>Email is required</mat-error>
              } @else if (form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone (optional)</mat-label>
              <input matInput type="tel" formControlName="phone" autocomplete="tel" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hide() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="new-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                [attr.aria-label]="hide() ? 'Show password' : 'Hide password'"
                (click)="hide.set(!hide())"
              >
                <mat-icon>{{ hide() ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
              <mat-hint>At least 8 characters, with a letter and a number</mat-hint>
              @if (form.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              } @else if (
                form.controls.password.hasError('minlength') ||
                form.controls.password.hasError('pattern')
              ) {
                <mat-error>At least 8 characters, with a letter and a number</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="confirm">
              <mat-label>Confirm password</mat-label>
              <input
                matInput
                [type]="hide() ? 'password' : 'text'"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />
              @if (form.controls.confirmPassword.hasError('required')) {
                <mat-error>Please confirm your password</mat-error>
              }
            </mat-form-field>
            @if (form.hasError('passwordMismatch') && form.controls.confirmPassword.touched) {
              <p class="error" role="alert">Passwords do not match.</p>
            }

            <button mat-flat-button type="submit" [disabled]="loading()">Create account</button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <span>Already registered?</span>
          <a mat-button routerLink="/auth/login">Sign in</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: `
    .page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 16px;
    }
    .card {
      width: 100%;
      max-width: 480px;
    }
    mat-card-content {
      padding-top: 16px;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .confirm {
      margin-top: 4px;
    }
    .error {
      color: #b3261e;
      margin: 0 0 12px;
    }
    mat-card-actions {
      display: flex;
      align-items: center;
      padding: 8px 16px 16px;
    }
  `,
})
export class Register {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly hide = signal(true);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword: _confirm, phone, ...rest } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.auth.register({ ...rest, ...(phone ? { phone } : {}) }).subscribe({
      next: (session) => {
        void this.router.navigateByUrl(this.auth.homeFor(session.user.role));
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 409
            ? 'An account with this email already exists.'
            : err.status === 400
              ? 'Please check the form and try again.'
              : 'Unable to create the account right now. Please try again.',
        );
      },
    });
  }
}
