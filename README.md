# Sistema de Repuestos ERP

Sistema especializado de **inventarios, control de precios y facturación** para comercialización de repuestos.
Inventario multicódigo, POS con descuento de stock en tiempo real, precios congelados por venta, y módulos
empresariales completos (ventas, compras, caja, contabilidad, tesorería, RR.HH., gestión documental, auditoría y reportes).

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11 · TypeORM · PostgreSQL 15 · JWT (access/refresh) · RBAC · Rate-limiting |
| Frontend | Angular 22 (standalone, signals) · ng-apexcharts · CSS design system light/dark |
| Infra | Docker Compose (postgres + api + web nginx) |

## Estructura

```
sistema_repuestos/
├── backend/              # API NestJS (módulos por dominio)
├── frontend/             # SPA Angular
├── database/
│   ├── schema.sql        # Esquema núcleo: productos, ventas, inventario, usuarios…
│   ├── schema-erp.sql    # Módulos ERP: clientes, compras, caja, contabilidad, bancos…
│   └── seed.sql          # Datos demo + usuario admin
├── docs/                 # Documentación por fase (análisis, arquitectura, BD…)
└── docker-compose.yml    # Orquestación completa
```

## Requisitos

- Node.js **24+** (backend y build del frontend)
- PostgreSQL **15** (o Docker)
- Docker + Docker Compose (opcional, para despliegue)

## Despliegue con Docker (recomendado)

```bash
docker compose up --build -d
```

- Web (SPA): http://localhost:8080
- API (Swagger): http://localhost:3000/api/docs (solo si `NODE_ENV != production`)
- PostgreSQL: localhost:5432 (`repuestos` / `repuestos_secret` / `repuestos_db`)

El esquema y los datos demo se cargan automáticamente al crear el volumen (`database/*.sql`).

## Desarrollo local

### 1. Base de datos

```bash
# PostgreSQL local: crear usuario y BD, luego cargar esquemas
psql -U postgres -c "CREATE USER repuestos WITH PASSWORD 'repuestos_secret';"
psql -U postgres -c "CREATE DATABASE repuestos_db OWNER repuestos;"
psql -U repuestos -h localhost -d repuestos_db -f database/schema.sql
psql -U repuestos -h localhost -d repuestos_db -f database/schema-erp.sql
psql -U repuestos -h localhost -d repuestos_db -f database/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # ajustar credenciales
npm install
npm run start:dev           # http://localhost:3000/api
```

### 3. Frontend

```bash
cd frontend
npm install
npm start                   # http://localhost:4200 (proxy /api -> :3000)
```

## Credenciales demo

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@sistema.com` | `Admin@123` |

> En producción cambie la contraseña y los secretos JWT (`.env` o variables de Docker).

## Roles y permisos

| Rol | Alcance |
|---|---|
| `ADMIN` | Todo: configuración, anulaciones, usuarios, cuentas contables |
| `SELLER` | POS y consulta de catálogo |
| `INVENTORY_MANAGER` | Compras, ajustes/mermas, catálogo |
| `MANAGER` | Reportes, kardex, caja |
| `AUDITOR` | Auditoría y trazabilidad (solo lectura) |

## Seguridad implementada

- JWT con access (15m) + refresh (7d) y rotación de sesión.
- RBAC global (guards `JwtAuthGuard` + `RolesGuard`).
- Rate-limiting global (100 req/min) y login endurecido (5 intentos/min).
- Helmet (CSP, HSTS, nosniff, frame-ancestors) + CORS restringido a orígenes configurados.
- Validación estricta de DTOs (`whitelist` + `forbidNonWhitelisted`).
- Timeouts de servidor anti-slowloris y `trust proxy` para IPs reales tras proxy.
- Auditoría append-only de acciones (QUIÉN/CUÁNDO/DÓNDE).

## Pruebas

```bash
cd backend
npm run test:e2e          # 7 pruebas E2E (health, auth, RBAC, API)
npm run lint              # ESLint
npx prettier --check "{src,test}/**/*.ts"

cd frontend
npx prettier --check "src/**/*.{ts,html,scss}"
npx ng build              # verificación de compilación
```

## Decisiones de diseño relevantes

- **`synchronize: false`**: `schema.sql` es la fuente de verdad; TypeORM nunca muta el esquema (evita degradar `BIGSERIAL` y eliminar datos).
- **Precios congelados**: el detalle de venta guarda costo, PVP e IVA al momento de la venta (histórico inmutable).
- **Descuento atómico de stock**: ventas y compras usan `SELECT … FOR UPDATE` para evitar sobreventa concurrente; stock negativo bloqueado (409).
- **Integridad contable**: asientos validados (debe = haber) en el servicio; balances y trial-balance derivados de movimientos reales.
- **Degradación elegante**: si Redis no está disponible, la caché pasa a memoria y BullMQ se deshabilita (sin bloqueo del servicio).
