# FASE 5 — Frontend (Angular SPA)

> Angular 22 standalone (signals) · design system propio light/dark · ng-apexcharts

## Módulos y páginas

| Ruta | Página | Rol mínimo |
|---|---|---|
| `/login` | Autenticación | público |
| `/dashboard` | Métricas + gráfica 14 días | todos |
| `/pos` | Punto de venta (carrito, límite stock, IVA) | SELLER |
| `/catalog`, `/catalog/new`, `/catalog/:id` | Catálogo + formulario producto | ADMIN/INV (edición) |
| `/sales` | Historial + detalle + anulación | ADMIN |
| `/inventory` | Stock crítico, kardex, ajustes | ADMIN/INV (ajustes) |
| `/customers`, `/suppliers` | CRUD | ADMIN/SELLER |
| `/purchases` | Nueva compra + historial | ADMIN/INV |
| `/cash-register` | Caja: apertura/movimientos/arqueo | ADMIN/MANAGER |
| `/accounting` | Plan, asientos, trial balance | ADMIN/MANAGER |
| `/banking` | Cuentas, depósitos, transferencias | ADMIN |
| `/hr` | Empleados | ADMIN |
| `/documents` | Gestión documental | ADMIN |
| `/audit` | Trazabilidad (solo lectura) | AUDITOR |
| `/reports` | Ventas por rango, stock crítico | MANAGER/ADMIN |
| `/settings` | Parámetros JSON | ADMIN |

## Estructura interna

```
src/app/
├── core/            # models.ts, services (api, auth, storage, toast), interceptors, guards
├── layout/          # shell (sidebar+topbar+theme) y toast-host
├── shared/          # status-chip, confirm-dialog
└── pages/           # una carpeta por módulo
```

## Convenciones

- **Signals** para estado reactivo (`signal`/`computed`) y `inject()` para DI.
- `ApiService` centraliza `/api`, desempaqueta `{ success, data }` y arma `HttpParams`.
- Interceptor `jwt` adjunta token; interceptor `error` muestra toasts y maneja 401/refresh.
- Guards de ruta: `authGuard` + `roleGuard(...roles)`.
- Pipes comunes (`date`, `number`, `json`) vía `CommonModule` en cada componente standalone.
- Montos del backend llegan como `string` → helper `num()` para conversión segura en templates.
