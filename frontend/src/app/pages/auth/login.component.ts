import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <form class="login-card card" (ngSubmit)="submit()">
        <div class="brand">
          <span class="logo">🔧</span>
          <h1>Repuestos ERP</h1>
          <p class="muted small">Sistema integral de comercialización y gestión</p>
        </div>

        <div class="field">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            class="input"
            type="email"
            [(ngModel)]="email"
            name="email"
            required
            autocomplete="username"
            autofocus
          />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            class="input"
            type="password"
            [(ngModel)]="password"
            name="password"
            required
            autocomplete="current-password"
          />
        </div>

        @if (error()) {
          <div class="login-error">{{ error() }}</div>
        }

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Ingresando…' : 'Iniciar sesión' }}
        </button>
      </form>
    </div>
  `,
  styles: `
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(1200px 600px at 20% -10%, rgba(30, 111, 217, 0.18), transparent), var(--bg);
      padding: 16px;
    }
    .login-card {
      width: min(400px, 100%);
      padding: 30px 32px;
    }
    .brand {
      text-align: center;
      margin-bottom: 20px;
    }
    .brand .logo {
      font-size: 42px;
    }
    .brand p {
      margin: 0;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
      margin-top: 6px;
    }
    .login-error {
      background: rgba(209, 53, 63, 0.12);
      color: var(--danger);
      border-radius: var(--radius-sm);
      padding: 9px 12px;
      font-size: 13px;
      margin-bottom: 12px;
    }
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async submit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e) {
      this.error.set('Credenciales inválidas. Verifique sus datos.');
    } finally {
      this.loading.set(false);
    }
  }
}
