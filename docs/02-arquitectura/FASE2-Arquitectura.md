# FASE 2 — Arquitectura del Sistema

> Sistema Especializado de Inventarios, Precios y Facturación para Comercialización de Repuestos
> Stack: NestJS (Backend) · React (Frontend) · PostgreSQL (Base de datos)

---

## 2.1 Decisión Arquitectónica: Monolito Modular

**Decisión**: Monolito modular con capas (Clean Architecture), no microservicios.

### Justificación

| Criterio | Evaluación |
|---|---|
| **Tamaño del dominio** | Un solo negocio (comercializadora de repuestos); los dominios (catálogo, precios, stock, ventas, kardex) están fuertemente acoplados a nivel transaccional. La venta atómica toca inventario + precios + kardex + documento en la misma transacción. |
| **Consistencia transaccional** | En microservicios, el descuento de stock + inserción de detalle + kardex serían distribuidos → necesitaría Sagas/Outbox (complejidad innecesaria). En monolito: una sola transacción ACID. |
| **Equipo y velocidad** | El ciclo de entrega es rápido y el costo operativo bajo. |
| **Escalabilidad** | El monolito modular es **stateless** (JWT), por lo que se escala horizontalmente con réplicas detrás de un load balancer/NGINX. La BD es el único estado. |
| **Evolución** | Los límites de módulo están marcados desde el inicio (módulos NestJS independientes). Si un día el POS exige escalado independiente, se extrae como microservicio sin rediseñar el dominio. |

**Conclusión**: Monolito modular + Clean Architecture = consistencia ACID garantizada, YAGNI aplicado, escalable horizontalmente.

---

## 2.2 Vista de Componentes (C4 — Nivel 1 y 2)

```
┌─────────────────────────── CLIENTES ───────────────────────────┐
│                                                               │
│   Navegador Web (React SPA)                                    │
│   - POS / Catálogo / Inventario / Reportes / Admin             │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTPS / JSON (REST)
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                    NGINX (reverse proxy)                       │
│  · SSL/TLS · gzip · static frontend · rate limit · proxy API  │
└──────────────────────────────┬────────────────────────────────┘
                               ▼
┌────────────────────────────────────────────────────────────────┐
│            NESTJS API (módulo principal, stateless)           │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐│
│  │ Auth    │ Users   │ Catalog │ Pricing │Inventory│  POS/   ││
│  │ (JWT)   │ (RBAC)  │ (SKU/   │ (IVA,   │(Stock,  │  Sales  ││
│  │         │         │  OEM)   │ margen) │ Kardex) │ (fact.) ││
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘│
│  │ Common (guards, filters, interceptors, prisma/typeorm)      │
└──────────────┬─────────────────────────────────────────────────┘
               │ TypeORM (pool de conexiones)
               ▼
┌────────────────────────────────────────────────────────────────┐
│                 PostgreSQL 16 (estado único)                   │
│  · Transacciones ACID · FK constraints · índices · triggers   │
│  · Kardex, ventas, catálogo, usuarios, auditoría              │
└────────────────────────────────────────────────────────────────┘
```

---

## 2.3 Arquitectura por Capas (Clean Architecture en NestJS)

NestJS ya impone una separación controller/service. Se refuerza con la separación dominio/aplicación/infraestructura por módulo.

```
src/
  common/                    # Capa de infraestructura transversal
    decorators/              # @Roles(), @CurrentUser()
    dto/                     # pagination.dto, response DTOs
    filters/                 # GlobalExceptionFilter (HTTP + domain)
    guards/                  # JwtAuthGuard, RolesGuard
    interceptors/            # TransformInterceptor, AuditInterceptor
    interceptors/            # LoggingInterceptor
    interfaces/              # Repositorios abstractos (puertos)
    services/                # ConfigService, LoggerService, CacheService
  modules/
    auth/                    # Dominio: autenticación
      domain/                # entidades, value objects, reglas
      application/           # casos de uso (services) + DTOs
      infrastructure/        # implementaciones (repositorios, JWT strategy)
      auth.module.ts
    users/                   # Dominio: usuarios y roles (RBAC)
    catalog/                 # Dominio: repuestos, compatibilidad, ubicaciones
    pricing/                 # Dominio: precios, IVA, márgenes
    inventory/               # Dominio: stock, entradas, ajustes, mermas, kardex
    sales/                   # Dominio: POS, carrito, notas, facturas
    reports/                 # Dominio: reportes (ventas, márgenes, stock crítico)
    audit/                   # Dominio: auditoría
    settings/                # Dominio: parámetros globales (IVA, empresa)
  main.ts                    # bootstrap, Swagger, CORS, helmet, rate limit
  app.module.ts
  config/                    # variables de entorno tipadas (Joi/class-validator)
```

**Flujo de dependencias** (regla de oro): `controller → application (use case) → port (interface de repositorio) ← infrastructure (implementación TypeORM)`. Las entidades de dominio nunca dependen de TypeORM (se mapea a tablas en la capa de infraestructura).

---

## 2.4 Tecnologías del Backend

| Componente | Tecnología | Justificación |
|---|---|---|
| Framework | NestJS 10 (TypeScript) | DI, modularidad, guards/interceptors, ecosistema maduro |
| ORM | TypeORM | Migraciones, repository pattern, decoradores, transacciones |
| BD | PostgreSQL 16 | ACID, constraints, JSONB para flexibilidad de compatibilidad |
| Validación | class-validator + class-transformer | Validación declarativa en DTOs |
| Auth | @nestjs/jwt + Passport JWT | Access token (15 min) + refresh token rotativo |
| Hash | argon2 | Resistente a ataques GPU, estándar moderno |
| Swagger | @nestjs/swagger | OpenAPI 3 generado desde decoradores |
| Config | @nestjs/config + Joi | Validación de env en arranque |
| Logging | nestjs-pino | JSON estructurado, request logging, bajo overhead |
| Rate limiting | @nestjs/throttler | Protección de endpoints públicos y login |
| Tests | Jest + Supertest | Unit/integration; e2e de flujo crítico |

---

## 2.5 Tecnologías del Frontend

| Componente | Tecnología | Justificación |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | SPA rápida, tipada, HMR |
| Enrutado | React Router v6 | Lazy loading por ruta |
| Estado | TanStack Query (server) + Zustand (UI/local) | Cache de datos del servidor; estado ligero |
| UI | Tailwind CSS + shadcn/ui | Dark mode nativo, accesible, componentes reutilizables |
| Formularios | React Hook Form + Zod | Formularios reactivos con validación tipada |
| Tablas | TanStack Table | Tablas inteligentes: filtros, orden, paginación |
| Gráficos | Recharts | Dashboard con métricas |
| Notificaciones | sonner | Toasts accesibles |
| HTTP | Axios + interceptores | Refresh token automático |

---

## 2.6 Seguridad (resumen — detalle en Fase 6)

- **Autenticación**: JWT access (15 min) + refresh token rotativo en HTTP-only cookie o body con `jti` revocable, store con hash.
- **Autorización**: RBAC mediante guards `@Roles('SELLER')` + ABAC básico (mismo negocio).
- **Transporte**: HTTPS en producción (NGINX + certbot).
- **API**: helmet, CORS restringido, throttler (login 5/min), validación estricta de DTOs, sanitización (class-validator `@Transform`), parametrización de SQL vía ORM (anti SQLi), escape de salida en frontend (React automático, anti XSS).
- **Datos**: hash argon2, `bcrypt`-like para refresh; secretos en env.
- **Auditoría**: tabla `audit_logs` registra actor, acción, recurso, IP, timestamp (integridad append-only).

---

## 2.7 Logs, Monitoreo y Observabilidad

- Logs JSON estructurados (pino) por request: `traceId`, método, ruta, status, duración, usuario.
- Logs de dominio: ventas creadas, stock movido, ajustes, intentos de login fallidos.
- Health checks: `GET /api/health` (liveness) y `GET /api/health/db` (readiness con ping a PostgreSQL).
- Exportación de métricas para prometheus (endpoint `/api/metrics`) en Fase 8.
- Auditoría persistente e inmutable para cumplimiento.

---

## 2.8 Caché y Colas

- **Caché** (decisión YAGNI inicial): catálogo de parámetros (IVA, empresa) se cachea en memoria con invalidation por evento. No se introduce Redis hasta que haya evidencia de cuello de botella. Se deja la interfaz `CachePort` para añadirlo sin tocar dominio.
- **Colas**: no requeridas. La emisión de factura y descuento de stock es síncrona (operación < 1 s). Reportes pesados se generan bajo demanda con paginación server-side. Se documenta el punto de extensión (BullMQ) para futuro.

---

## 2.9 Almacenamiento

- **Archivos** (imágenes de repuestos): se sirven estáticos vía NGINX en volumen Docker montado; URL persistida en la BD. Fase inicial: opcional.
- **Backups**: pg_dump programado (cron) + restauración documentada (Fase 8).

---

## 2.10 Escalabilidad y Despliegue

- API stateless → réplicas detrás de NGINX upstream.
- Frontend estático compilado servido por NGINX; API en `/api`.
- PostgreSQL en volumen persistente + backups.
- `docker-compose.yml` orquesta: `postgres`, `api`, `web` (nginx).

---

## 2.11 Estrategia Transaccional del Dominio Crítico

Venta (caso crítico):

```
BEGIN;
  SELECT * FROM products WHERE id=$1 FOR UPDATE;      -- bloqueo de fila (evita over-sell)
  IF stock_disponible < cantidad → ROLLBACK (error 409)
  INSERT INTO sale_documents (...) RETURNING id;      -- cabecera
  INSERT INTO sale_items (producto, precio_congelado, iva, cantidad); -- detalle (histórico)
  UPDATE products SET stock = stock - cantidad;
  INSERT INTO stock_movements (kardex) (...)          -- trazabilidad
COMMIT;  -- todo o nada
```

Se ejecuta en una única transacción con `EntityManager.transaction()` y bloqueo pesimista (`PESSIMISTIC_WRITE`) sobre la fila del producto. Esto cumple RF-07, RF-08, RF-13, RF-14.

---

## 2.12 Estructura de Paquetes (Diagrama)

```
┌───────────────────────────────┐
│            React SPA          │
│  pages·components·hooks·lib  │
└──────────────┬────────────────┘
               │ REST /api
┌──────────────▼────────────────┐
│         NestJS API            │
│ ┌──────────┐ ┌──────────────┐ │
│ │application│ │   domain     │ │   <- reglas de negocio puras
│ └──────────┘ └──────────────┘ │
│      │            │           │
│ ┌──────────┐ ┌──────────────┐ │
│ │ infrastructure             │ │   <- TypeORM, JWT, guards
│ └──────────┘ └──────────────┘ │
└──────────────┬────────────────┘
               │ TypeORM
┌──────────────▼────────────────┐
│       PostgreSQL 16           │
└───────────────────────────────┘
```

---

## 2.13 Mapa de Módulos del Backend

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `AuthModule` | Login, access/refresh, logout, cambio contraseña | Users, Audit, Settings |
| `UsersModule` | CRUD usuarios, roles, estado | Audit |
| `SettingsModule` | Parámetros: IVA, datos empresa | Audit |
| `CatalogModule` | Repuestos, códigos (SKU/OEM/barras), compatibilidad, ubicaciones | Settings (IVA/margen), Pricing |
| `PricingModule` | Cálculo de precios, márgenes, historial | Settings |
| `InventoryModule` | Stock, entradas, ajustes, mermas, Kardex | Catalog, Pricing, Audit |
| `SalesModule` | POS, carrito, notas, facturas, transacción atómica | Catalog, Inventory, Pricing, Settings, Audit |
| `ReportsModule` | Ventas, márgenes, stock crítico, kardex | Sales, Inventory, Catalog |
| `AuditModule` | Registro/lectura de auditoría | — |
| `CommonModule` | Guards, filtros, interceptors, paginación | — |

---

## 2.14 Conclusión FASE 2

Arquitectura definida y justificada:

- **Monolito modular** con Clean Architecture (consistencia ACID para el dominio crítico).
- Frontend React SPA, responsive, dark mode, lazy loading.
- PostgreSQL como única fuente de estado; API stateless y escalable.
- Seguridad integrada desde el diseño (JWT+refresh, RBAC, throttling, sanitización, auditoría).
- Estrategia transaccional documentada para el caso crítico de venta.
- Puntos de extensión claros: caché (interfaz CachePort), colas (BullMQ), microservicios (límites de módulo).

Se procede a la **FASE 3: Diseño de Base de Datos**.
