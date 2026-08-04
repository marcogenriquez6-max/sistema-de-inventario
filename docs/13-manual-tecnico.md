# Manual técnico

Guía de instalación, configuración, migraciones y despliegue del ERP de
repuestos (NestJS + Angular + PostgreSQL).

## 1. Requisitos

| Componente | Versión |
|---|---|
| Node.js | ≥ 22 |
| PostgreSQL | 15+ |
| Docker + Docker Compose | opcional (despliegue) |
| npm | 10+ |

## 2. Estructura del repositorio

```
sistema_repuestos/
├── backend/            # API NestJS (TypeScript)
│   ├── src/modules/    # Módulos por dominio
│   ├── scripts/        # apply-schema.js, run-migration.js
│   └── dist/           # build de producción (node dist/main)
├── frontend/           # SPA Angular 22 (standalone, signals)
├── database/           # schema.sql (fuente de verdad) + migrations/ + seed.sql
├── docs/               # documentación
├── docker-compose.yml  # db + redis + api + web + backup
└── .github/workflows/  # CI (ci.yml) y Deploy (deploy.yml)
```

## 3. Instalación en desarrollo

### Backend

```bash
cd backend
cp .env.example .env   # ajustar credenciales
npm install
npm run build
npm run start:dev      # o: node dist/main (producción)
```

Variables de entorno clave (ver `.env.example`):

| Variable | Descripción |
|---|---|
| `DATABASE_HOST/PORT/USER/PASSWORD/NAME` | conexión PostgreSQL |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | firmas JWT |
| `JWT_ACCESS_EXPIRES` (15m) / `JWT_REFRESH_EXPIRES` (7d) | vigencias |
| `CORS_ORIGINS` | orígenes permitidos (default `http://localhost:4200`) |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | rate limit |
| `REDIS_URL` | **opcional**. Si se define, activa cache Redis y BullMQ |

### Base de datos

`synchronize` está **deshabilitado**. El esquema se gestiona por SQL:

```bash
# Crear base y aplicar esquema + seed en una BD vacía:
node backend/scripts/apply-schema.js

# Aplicar una migración incremental:
node backend/scripts/run-migration.js ../database/migrations/20260804_chat.sql
```

La fuente de verdad es `database/schema.sql`. Toda nueva tabla debe añadirse
allí **y** como migración en `database/migrations/`.

Migraciones existentes:
- `20260803_notifications.sql` — notificaciones
- `20260804_chat.sql` — chat interno
- `20260804_tasks.sql` — tareas (Kanban/Calendario)

### Frontend

```bash
cd frontend
npm install
npm start    # dev server en :4200 con proxy /api -> :3000
npm run build
```

### Usuarios seed

| Email | Contraseña | Rol |
|---|---|---|
| `admin@sistema.com` | `Admin@123` | ADMIN |
| `ventas@sistema.com` | `Admin@123` | SELLER |
| `gerente@sistema.com` | `Admin@123` | MANAGER |

> Cambiar las contraseñas antes de producción.

## 4. Despliegue con Docker Compose

```bash
docker compose up -d --build
```

Servicios:

| Servicio | Puerto | Descripción |
|---|---|---|
| `db` | 5432 | PostgreSQL 15 con esquema + seed automáticos |
| `redis` | 6379 | Redis 7 (cache + BullMQ opcional) |
| `api` | 3000 | API NestJS |
| `web` | 8080 | nginx sirviendo la SPA |
| `backup` | — | `pg_dump -Fc` diario, retención 7 días en volumen `backups` |

Verificación: `curl http://localhost:3000/api/health/db`.

### HTTPS (producción)

Ver el bloque comentado en `frontend/nginx.conf` (TLS 1.2/1.3 + HSTS).
Montar certificados en `/etc/nginx/certs` y cambiar los puertos del contenedor.

## 5. CI/CD (GitHub Actions)

- **`ci.yml`**: lint + build + tests unitarios + e2e (PostgreSQL service) +
  build de imágenes Docker. Se ejecuta en push a `main`/`develop` y PRs.
- **`deploy.yml`**: en push a `main`, copia el código al servidor
  (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`) y ejecuta
  `docker compose build && docker compose up -d`, con verificación de salud.

Secrets requeridos para deploy: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.

## 6. API

Formato de respuesta uniforme:

```json
{ "success": true, "data": { }, "timestamp": "2026-08-04T12:00:00.000Z" }
```

Errores: `{ statusCode, message, error, details, path, timestamp }`.

Todos los endpoints (excepto `login`, `refresh` y `/public/*`) requieren
`Authorization: Bearer <accessToken>`.

Documentación interactiva (Swagger): `http://localhost:3000/api/docs`.

Exportación de datos: `GET /api/export/:resource?format=csv|xlsx|pdf`
con recursos `products, inventory, sales, customers, suppliers, purchases,
employees, audit`. Colección de Postman en `docs/postman/`.

## 7. Pruebas

```bash
cd backend
npm test            # unitarias (jest)
npm run test:e2e    # e2e (requiere PostgreSQL local)
```

## 8. Copias de seguridad

- Contenedor `backup` (Compose): volcado diario, retención 7 días.
- Restauración manual:
  ```bash
  docker compose exec -T db pg_restore -U repuestos -d repuestos_db < volcado.dump
  ```

## 9. Seguridad aplicada

- Contraseñas con argon2id, sesiones rotativas (refresh tokens con revocación).
- Rate limiting (`@nestjs/throttler`), validación de entrada (`class-validator`).
- Cabeceras de seguridad (Helmet) y CSP en la SPA.
- Auditoría de acciones sensibles en `audit_logs`.
- Ver `docs/06-seguridad.md`.
