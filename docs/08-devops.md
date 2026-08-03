# FASE 8 — DevOps (Docker Compose)

## Servicios

| Servicio | Imagen | Puerto | Función |
|---|---|---|---|
| `db` | postgres:15-alpine | 5432 | PostgreSQL con esquemas auto-cargados |
| `api` | backend/Dockerfile | 3000 | API NestJS (multi-stage: build → runtime node) |
| `web` | frontend/Dockerfile | 8080→80 | SPA servida por nginx + proxy inverso `/api` |

## Puesta en marcha

```bash
docker compose up --build -d
```

- Esquema y seed se cargan al crear el volumen (`/docker-entrypoint-initdb.d/*.sql`).
- `db` espera healthy (pg_isready) antes de arrancar `api`.
- El frontend (nginx) redirige `/api/*` → `api:3000` sin CORS (mismo origen).
- Volumen `pgdata` persistente para los datos.

## Variables de entorno relevantes

| Variable | Default | Nota |
|---|---|---|
| `JWT_ACCESS_SECRET` | `cambia_este_secret_access` | **cambiar en producción** |
| `JWT_REFRESH_SECRET` | `cambia_este_secret_refresh` | **cambiar en producción** |
| `CORS_ORIGINS` | `http://localhost:8080` | origen del frontend |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | 60 / 100 | rate limiting |
| `NODE_ENV` | `production` | oculta Swagger en el API |

## Despliegue en producción

1. Cambiar secretos JWT y contraseña admin.
2. Servir detrás de un reverse proxy con HTTPS.
3. `docker compose up -d` (sin `--build` tras el primer build, o con CI).
