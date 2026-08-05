import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ModuleCatalogComponent } from '../../shared/module-catalog.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ModuleCatalogComponent],
  template: `
    <div class="login-shell">
      <aside class="login-side">
        <div class="side-inner">
          <div class="side-brand">
            <img class="side-logo" src="logo.jpg" alt="Repuestos ERP" />
            <span class="side-name">Repuestos ERP</span>
          </div>

          <h1 class="side-title">
            Controla tu negocio de repuestos <span>desde un solo lugar</span>
          </h1>
          <p class="side-subtitle">
            Ventas, inventario, caja, compras y reportes integrados en una plataforma
            rápida y confiable.
          </p>

          <ul class="side-points">
            <li><span class="pt-icon">🛒</span> Punto de venta ágil y sin complicaciones</li>
            <li><span class="pt-icon">📦</span> Inventario en tiempo real</li>
            <li><span class="pt-icon">📈</span> Reportes y auditoría siempre disponibles</li>
          </ul>

          <div class="side-modules">
            <div class="side-modules-title">Módulos incluidos</div>
            <app-module-catalog mode="chips" [onDark]="true" />
          </div>
        </div>
      </aside>

      <main class="login-main">
        <div class="login-stack">
          <form class="login-card" (ngSubmit)="submit()" novalidate [class.submitted]="submitted()">
            <div class="card-head">
              <h2>Bienvenido de nuevo</h2>
              <p class="muted small">Inicia sesión para continuar</p>
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
                placeholder="usuario@empresa.com"
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
                placeholder="••••••••"
              />
            </div>

            @if (error()) {
              <div class="login-error">{{ error() }}</div>
            }

            <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
              {{ loading() ? 'Ingresando…' : 'Iniciar sesión' }}
            </button>

            <p class="card-foot muted small">
              Sistema integral de comercialización y gestión
            </p>
          </form>

          <section class="login-modules">
            <button
              class="btn btn-ghost modules-toggle"
              type="button"
              (click)="modulesOpen.set(!modulesOpen())"
              [attr.aria-expanded]="modulesOpen()"
            >
              <span aria-hidden="true">🧩</span>
              Ver los módulos del sistema
              <span class="chevron" aria-hidden="true">{{ modulesOpen() ? '▴' : '▾' }}</span>
            </button>
            @if (modulesOpen()) {
              <div class="modules-panel">
                <app-module-catalog [showHeader]="false" />
              </div>
            }
          </section>
        </div>
      </main>
    </div>
  `,
  styles: `
    .login-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(360px, 1.05fr) minmax(400px, 0.95fr);
      background: var(--bg);
    }
    .login-side {
      background:
        radial-gradient(900px 500px at 80% -10%, rgba(124, 58, 237, 0.45), transparent 60%),
        radial-gradient(700px 500px at -10% 110%, rgba(37, 99, 235, 0.5), transparent 55%),
        var(--brand-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }
    .login-side::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      opacity: 0.35;
      pointer-events: none;
    }
    .side-inner {
      position: relative;
      z-index: 1;
      max-width: 460px;
    }
    .side-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 48px;
    }
    .side-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(6px);
      padding: 6px;
    }
    .side-name {
      font-size: 19px;
      font-weight: 750;
      letter-spacing: -0.01em;
    }
    .side-title {
      font-size: 34px;
      line-height: 1.15;
      font-weight: 750;
      letter-spacing: -0.02em;
      margin: 0 0 14px;
    }
    .side-title span {
      display: block;
      color: rgba(255, 255, 255, 0.85);
    }
    .side-subtitle {
      font-size: 15px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.82);
      margin: 0 0 32px;
    }
    .side-points {
      list-style: none;
      padding: 0;
      margin: 0 0 28px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .side-points li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14.5px;
      font-weight: 550;
    }
    .pt-icon {
      width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.16);
      font-size: 17px;
      flex: none;
    }
    .side-modules-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 10px;
    }
    .side-modules {
      border-top: 1px solid rgba(255, 255, 255, 0.16);
      padding-top: 20px;
    }

    .login-main {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 32px;
      overflow-y: auto;
    }
    .login-stack {
      width: min(680px, 100%);
      display: flex;
      flex-direction: column;
      gap: 18px;
      align-items: center;
    }
    .login-card {
      width: min(400px, 100%);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 36px 34px;
    }
    .login-modules {
      width: min(680px, 100%);
    }
    .modules-toggle {
      justify-content: center;
      gap: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text-secondary);
      width: 100%;
    }
    .modules-toggle:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: var(--surface);
    }
    .chevron {
      margin-left: auto;
      font-size: 12px;
    }
    .modules-panel {
      margin-top: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }
    .card-head {
      margin-bottom: 24px;
    }
    .card-head h2 {
      margin-bottom: 4px;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 14.5px;
      margin-top: 6px;
    }
    .login-error {
      background: var(--danger-soft);
      color: var(--danger);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      font-size: 13px;
      margin-bottom: 14px;
    }
    .card-foot {
      text-align: center;
      margin: 22px 0 0;
    }

    @media (max-width: 860px) {
      .login-shell {
        grid-template-columns: 1fr;
      }
      .login-side {
        display: none;
      }
      .login-main {
        min-height: 100vh;
      }
    }
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  submitted = signal(false);
  modulesOpen = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async submit(): Promise<void> {
    if (!this.email || !this.password) {
      this.submitted.set(true);
      return;
    }
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
