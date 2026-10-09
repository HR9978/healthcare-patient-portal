import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { Role } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  link: string;
}

// Add entries here as each portal page is built.
const NAV: Record<Role, NavItem[]> = {
  PATIENT: [
    { label: 'Dashboard', icon: 'dashboard', link: '/portal/dashboard' },
    { label: 'Book appointment', icon: 'event_available', link: '/portal/book' },
    { label: 'Medical history', icon: 'history', link: '/portal/medical-history' },
    { label: 'Prescriptions', icon: 'medication', link: '/portal/prescriptions' },
    { label: 'Billing', icon: 'receipt_long', link: '/portal/billing' },
    { label: 'Profile', icon: 'person', link: '/portal/profile' },
  ],
  DOCTOR: [
    { label: 'Dashboard', icon: 'dashboard', link: '/doctor/dashboard' },
    { label: 'Profile', icon: 'person', link: '/doctor/profile' },
  ],
  ADMIN: [
    { label: 'Dashboard', icon: 'dashboard', link: '/admin/dashboard' },
    { label: 'Profile', icon: 'person', link: '/admin/profile' },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  ADMIN: 'Administrator',
};

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <button
        mat-icon-button
        type="button"
        aria-label="Toggle navigation"
        (click)="drawer.toggle()"
      >
        <mat-icon>menu</mat-icon>
      </button>
      <mat-icon class="brand-icon" aria-hidden="true">local_hospital</mat-icon>
      <span class="title">HealthCare Portal</span>
      <span class="spacer"></span>

      @if (user(); as u) {
        <button mat-button type="button" [matMenuTriggerFor]="menu">
          <mat-icon>account_circle</mat-icon>
          {{ u.firstName }} {{ u.lastName }}
        </button>
        <mat-menu #menu="matMenu">
          <div class="menu-info">
            <div>{{ u.email }}</div>
            <small>{{ roleLabel() }}</small>
          </div>
          <button mat-menu-item type="button" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      }
    </mat-toolbar>

    <mat-sidenav-container class="container">
      <mat-sidenav
        #drawer
        class="sidenav"
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
      >
        <mat-nav-list>
          @for (item of nav(); track item.link) {
            <a
              mat-list-item
              [routerLink]="item.link"
              routerLinkActive
              #rla="routerLinkActive"
              [activated]="rla.isActive"
              (click)="isHandset() && drawer.close()"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .container {
      flex: 1;
    }
    .sidenav {
      width: 240px;
    }
    .brand-icon {
      margin: 0 8px 0 4px;
    }
    .spacer {
      flex: 1;
    }
    .menu-info {
      padding: 8px 16px;
      line-height: 1.4;
      opacity: 0.8;
    }
  `,
})
export class Shell {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly nav = computed(() => {
    const user = this.user();
    return user ? NAV[user.role] : [];
  });
  readonly roleLabel = computed(() => {
    const user = this.user();
    return user ? ROLE_LABEL[user.role] : '';
  });
  readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.Handset)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  logout(): void {
    this.auth.logout();
  }
}
