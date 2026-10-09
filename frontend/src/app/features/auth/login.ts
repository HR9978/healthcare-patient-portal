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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Role } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

const DEMO_PASSWORD = 'Demo@1234';

@Component({
  selector: 'app-login',
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
          <mat-card-title>Sign in</mat-card-title>
          <mat-card-subtitle>HealthCare Portal (portfolio demo)</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (sessionExpired) {
            <p class="info" role="status">Your session expired. Please sign in again.</p>
          }
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="username" />
              @if (form.controls.email.hasError('required')) {
                <mat-error>Email is required</mat-error>
              } @else if (form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hide() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
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
              @if (form.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button type="submit" [disabled]="loading()">Sign in</button>
          </form>

          <section class="demo" aria-label="Demo accounts">
            <span>Try a demo account:</span>
            <div>
              <button mat-stroked-button type="button" (click)="fillDemo('patient@example.com')">Patient</button>
              <button mat-stroked-button type="button" (click)="fillDemo('dr.carter@example.com')">Doctor</button>
              <button mat-stroked-button type="button" (click)="fillDemo('admin@example.com')">Admin</button>
            </div>
          </section>
        </mat-card-content>

        <mat-card-actions>
          <span>New patient?</span>
          <a mat-button routerLink="/auth/register">Create an account</a>
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
      max-width: 420px;
    }
    mat-card-content {
      padding-top: 16px;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    .error {
      color: #b3261e;
      margin: 0 0 12px;
    }
    .info {
      margin: 0 0 12px;
    }
    .demo {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.9rem;
    }
    .demo div {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    mat-card-actions {
      display: flex;
      align-items: center;
      padding: 8px 16px 16px;
    }
  `,
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly hide = signal(true);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sessionExpired = this.route.snapshot.queryParamMap.has('sessionExpired');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  fillDemo(email: string): void {
    this.form.setValue({ email, password: DEMO_PASSWORD });
    this.error.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        void this.router.navigateByUrl(this.targetFor(session.user.role));
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401
            ? 'Invalid email or password.'
            : 'Unable to sign in right now. Please try again.',
        );
      },
    });
  }

  /** Honour ?returnUrl= only when it stays inside the user's own portal. */
  private targetFor(role: Role): string {
    const home = this.auth.homeFor(role);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl && returnUrl.startsWith(home) ? returnUrl : home;
  }
}
