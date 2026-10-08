import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <main class="wrap">
      <mat-icon aria-hidden="true">{{ icon }}</mat-icon>
      <h1>{{ title }}</h1>
      <p>{{ message }}</p>
      <a mat-flat-button routerLink="/">Go to home</a>
    </main>
  `,
  styles: `
    .wrap {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-align: center;
      padding: 16px;
    }
    mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
    }
  `,
})
export class ErrorPage {
  private readonly data = inject(ActivatedRoute).snapshot.data;

  readonly icon: string = this.data['icon'] ?? 'error';
  readonly title: string = this.data['title'] ?? 'Something went wrong';
  readonly message: string = this.data['message'] ?? '';
}
