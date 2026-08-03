# FASE 2.5 — Addendum: Expansión a ERP Modular

> Decisión del cliente (Agosto 2026): el sistema repuestos se expande a un **ERP modular**
> con módulos activables/desactivables. Stack ampliado: **Redis + BullMQ** en backend y
> **Angular 21** en frontend (sustituye a React).

---

## 2.5.1 Cambios de stack respecto a la FASE 2

| Componente | Antes | Ahora | Justificación |
|---|---|---|---|
| Frontend | React 18 + Vite + Tailwind | **Angular 21** + Signals + TypeScript + RxJS + Angular Material + PrimeNG + TailwindCSS + ApexCharts | Framework empresarial, DI, formularios reactivos, modularidad y ecosistema Material/PrimeNG exigido por el cliente |
| Cache | En memoria (interfaz CachePort) | **Redis** (ioredis) + fallback memoria | Cache distribuida compartida entre réplicas |
| Colas | Diferido (YAGNI) | **BullMQ + Redis** | Reportes pesados, notificaciones y tareas asíncronas |
| Módulos | 10 de dominio repuestos | + Clientes, Proveedores, Compras, Caja, Bancos, Tesorería, Contabilidad, RR.HH., Documentos, API pública, Integraciones | ERP modular |

La **BD sigue siendo PostgreSQL** (fuente única de estado). Redis solo sostiene cache y colas.

---

## 2.5.2 Mapa completo de módulos del ERP

| Módulo | Estado | Descripción |
|---|---|---|
| Auth | ✅ | Login, JWT+refresh rotativo, logout, cambio contraseña |
| Users | ✅ | Usuarios y roles (RBAC) |
| Settings | ✅ | Parámetros globales versionados |
| Catalog (Productos) | ✅ | Ficha multicódigo, compatibilidad, ubicación, precios |
| Pricing | ✅ | Costo / Venta base / Facturado, IVA, márgenes |
| Inventory | ✅ | Stock, entradas, ajustes, mermas, Kardex |
| Sales (POS) | ✅ | Ventas, notas, facturas, transacción atómica |
| Reports | ✅ | Dashboard, stock crítico, ventas por día |
| Audit | ✅ | Auditoría append-only |
| Health | ✅ | Liveness/readiness |
| Cache/Queue | 🔜 | Redis (cache) + BullMQ (jobs) |
| Customers | 🔜 | Clientes |
| Suppliers | 🔜 | Proveedores |
| Purchases | 🔜 | Compras a proveedor + integración con inventario |
| Cash Register | 🔜 | Caja: apertura, cierre, arqueo, movimientos |
| Accounting | 🔜 | Plan de cuentas + asientos de diario (integración ventas/compras) |
| Banking/Treasury | 🔜 | Movimientos bancarios y tesorería (sobre asientos) |
| HR | 🔜 | Empleados y asistencias (básico) |
| Documents | 🔜 | Gestión documental (metadatos + archivos) |
| Public API | 🔜 | Endpoints públicos de consulta (catálogo, status) |
| Integrations | 🔜 | Webhooks/API keys (extensible) |

> Los módulos 🔜 se implementan con la misma arquitectura (controller → application → infra)
> y se registran como módulos NestJS independientes que se **activan/desactivan** vía
> configuración `MODULES_ENABLED` (feature flags).

---

## 2.5.3 Feature flags por módulo

Cada módulo puede activarse/desactivarse vía variables de entorno:

```
MODULES_ENABLED=core,customers,suppliers,purchases,cash_register,accounting,documents,public_api,integrations
```

El `AppModule` construye los imports dinámicamente en función de `MODULES_ENABLED`.
Los módulos del núcleo (`auth`, `users`, `catalog`, `sales`, `audit`, `health`) son obligatorios.

---

## 2.5.4 Redis + BullMQ

- **Cache (Redis)**: `CacheService` con interfaz `ICache` y dos implementaciones:
  `MemoryCacheProvider` (default) y `RedisCacheProvider` (activa si `REDIS_URL` está definida).
  Se usa para: settings, catálogo caliente y tokens blacklist (logout previo a expiración).
- **Colas (BullMQ)**: `JobsModule` con colas:
  - `reports` → generación asíncrona de reportes pesados.
  - `notifications` → notificaciones (in-app, futuras push/email).
  - `integration` → sincronización con servicios externos (API keys).
  Worker con reintentos y DLQ (dead-letter) configurados en BullMQ.
- **Arquitectura**: si `REDIS_URL` no está disponible (dev sin Redis), las colas se degradan a
  ejecución síncrona inline (fallback) para no romper el flujo.

---

## 2.5.5 Frontend Angular 21 (resumen)

| Capa | Tecnología |
|---|---|
| Framework | Angular 21 + TypeScript + Signals |
| UI | Angular Material 3 (Design Tokens) + PrimeNG (tablas, calendarios) |
| Estilos | TailwindCSS + Material 3 + modo dark/light |
| Gráficos | ApexCharts |
| Estado | Services con Signals + NgRx (opcional, módulos grandes) |
| HTTP | HttpClient + interceptores (JWT, refresh automático, error handling) |
| Formularios | Reactive Forms + validación |
| i18n | @angular/localize (es-ES default) |

Estructura:
```
frontend/src/app/
  core/        # auth store, http, interceptores, guards, permisos
  shared/      # componentes reutilizables (data-table, filter-bar, empty-state...)
  layout/      # sidebar colapsable, header, breadcrumbs, tabs
  modules/     # un feature module por módulo del ERP (POS, inventory, customers...)
```

El diseño UX/UI se detalla en FASE 5 (wireframes, sistema de diseño, estados).

---

## 2.5.6 Seguridad ampliada

- RBAC (roles) + ABAC básico (reglas por recurso/negocio) en guards.
- Rate limiting global + específico (login 5/min).
- Helmet, CORS restringido, sanitización, validación estricta de DTOs.
- API keys para el módulo de integraciones (hash de la key en BD).
- Auditoría de acciones sensibles en todos los módulos.
- (FASE 6 detalla el cumplimiento OWASP Top 10).

---

## 2.5.7 Impacto en BD

Se añaden tablas:
- `customers`, `suppliers`
- `purchase_documents`, `purchase_items`
- `cash_registers` (apertura/cierre), `cash_movements`
- `chart_of_accounts`, `journal_entries`, `journal_lines`
- `employees` (RR.HH. básico)
- `documents`
- `integrations` (claves API)

El DDL incremental se entrega como migraciones TypeORM (FASE 4) y en `database/` (FASE 8).

---

## 2.5.8 Conclusión

La expansión mantiene el monolito modular + Clean Architecture de la FASE 2, añade
Redis/BullMQ para cache y colas, incorpora Angular 21 en frontend y define el catálogo
completo de módulos del ERP con feature flags. El núcleo repuestos queda intacto y
funcional; los nuevos módulos se integran por las mismas puertas (ports) de dominio.
