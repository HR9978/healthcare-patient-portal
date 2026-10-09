import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ProfileApi } from '../../core/services/api/profile.api';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { apiMessage } from '../../shared/utils/api-error';

function newPasswordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('newPassword')?.value === group.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  template: `
    <h1>My profile</h1>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-card>
      <mat-card-header>
        <mat-card-title>Personal information</mat-card-title>
        <mat-card-subtitle>{{ email() }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>First name</mat-label>
              <input matInput formControlName="firstName" />
              @if (form.controls.firstName.invalid) {
                <mat-error>Required (max 50 characters)</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last name</mat-label>
              <input matInput formControlName="lastName" />
              @if (form.controls.lastName.invalid) {
                <mat-error>Required (max 50 characters)</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput type="tel" formControlName="phone" />
          </mat-form-field>

          @if (isPatient()) {
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Date of birth</mat-label>
                <input matInput type="date" formControlName="dateOfBirth" [max]="today" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender">
                  <mat-option value="">Not specified</mat-option>
                  <mat-option value="MALE">Male</mat-option>
                  <mat-option value="FEMALE">Female</mat-option>
                  <mat-option value="OTHER">Other</mat-option>
                  <mat-option value="PREFER_NOT_TO_SAY">Prefer not to say</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline">
              <mat-label>Address</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Emergency contact</mat-label>
              <input matInput formControlName="emergencyContact" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Insurance number</mat-label>
              <input matInput formControlName="insuranceNumber" />
              <mat-hint>Demo data only. Do not enter a real number.</mat-hint>
            </mat-form-field>
          }

          @if (profileError()) {
            <p class="error" role="alert">{{ profileError() }}</p>
          }
          <div class="actions">
            <button mat-flat-button type="submit" [disabled]="saving()">Save changes</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="second">
      <mat-card-header>
        <mat-card-title>Change password</mat-card-title>
        <mat-card-subtitle>You will be signed out on all devices.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Current password</mat-label>
            <input matInput type="password" formControlName="currentPassword" autocomplete="current-password" />
            @if (passwordForm.controls.currentPassword.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>New password</mat-label>
            <input matInput type="password" formControlName="newPassword" autocomplete="new-password" />
            <mat-hint>At least 8 characters, with a letter and a number</mat-hint>
            @if (passwordForm.controls.newPassword.invalid) {
              <mat-error>At least 8 characters, with a letter and a number</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="confirm">
            <mat-label>Confirm new password</mat-label>
            <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
          </mat-form-field>
          @if (passwordForm.hasError('passwordMismatch') && passwordForm.controls.confirmPassword.touched) {
            <p class="error" role="alert">Passwords do not match.</p>
          }
          @if (passwordError()) {
            <p class="error" role="alert">{{ passwordError() }}</p>
          }
          <div class="actions">
            <button mat-stroked-button type="submit" [disabled]="changing()">Change password</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 720px;
      margin: 0 auto;
    }
    form {
      display: flex;
      flex-direction: column;
      padding-top: 16px;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .second {
      margin-top: 24px;
    }
    .confirm {
      margin-top: 4px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ProfileApi);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  readonly today = new Date().toISOString().slice(0, 10);
  readonly isPatient = computed(() => this.auth.user()?.role === 'PATIENT');

  readonly email = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly changing = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    phone: ['', Validators.maxLength(20)],
    dateOfBirth: [''],
    gender: [''],
    address: ['', Validators.maxLength(300)],
    emergencyContact: ['', Validators.maxLength(200)],
    insuranceNumber: ['', Validators.maxLength(50)],
  });

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: newPasswordsMatch },
  );

  ngOnInit(): void {
    this.api.get().subscribe({
      next: (profile) => {
        this.email.set(profile.email);
        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone ?? '',
          dateOfBirth: profile.patient?.dateOfBirth?.slice(0, 10) ?? '',
          gender: profile.patient?.gender ?? '',
          address: profile.patient?.address ?? '',
          emergencyContact: profile.patient?.emergencyContact ?? '',
          insuranceNumber: profile.patient?.insuranceNumber ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.profileError.set('Could not load your profile.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.profileError.set(null);

    this.api
      .update({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        phone: v.phone.trim(),
        ...(this.isPatient()
          ? {
              ...(v.dateOfBirth ? { dateOfBirth: v.dateOfBirth } : {}),
              gender: v.gender,
              address: v.address.trim(),
              emergencyContact: v.emergencyContact.trim(),
              insuranceNumber: v.insuranceNumber.trim(),
            }
          : {}),
      })
      .subscribe({
        next: (profile) => {
          this.auth.updateUser({
            firstName: profile.firstName,
            lastName: profile.lastName,
          });
          this.saving.set(false);
          this.notify.success('Profile updated');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.profileError.set(apiMessage(err, 'Could not save your profile.'));
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.changing.set(true);
    this.passwordError.set(null);

    this.api.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.notify.success('Password changed. Please sign in again.');
        this.auth.logout();
      },
      error: (err: unknown) => {
        this.changing.set(false);
        this.passwordError.set(apiMessage(err, 'Could not change the password.'));
      },
    });
  }
}
