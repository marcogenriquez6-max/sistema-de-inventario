# FASE 6 — Seguridad

## Implementado

| Medida | Detalle |
|---|---|
| **Autenticación JWT** | Access token 15m + Refresh 7d con rotación de sesión y revocación en logout |
| **Autorización RBAC** | `JwtAuthGuard` + `RolesGuard` globales; roles `ADMIN, SELLER, INVENTORY_MANAGER, MANAGER, AUDITOR` |
| **Rate limiting** | Global 100 req/min por IP (`ThrottlerModule`); login 5 intentos/min |
| **Headers** | Helmet: CSP, HSTS, `nosniff`, `frame-ancestors`, DNS-prefetch off |
| **CORS** | Solo orígenes de `CORS_ORIGINS` (dev: `http://localhost:4200`) |
| **Validación de entrada** | `ValidationPipe` con `whitelist` + `forbidNonWhitelisted` en toda la API |
| **SQL Injection** | TypeORM usa consultas parametrizadas; no hay concatenación de SQL |
| **Anti-slowloris** | `requestTimeout` 30s, `headersTimeout` 35s, `keepAliveTimeout` 5s |
| **IP real** | `trust proxy` para throttling/logs correctos tras reverse proxy |
| **Secretos** | JWT secrets vía entorno; `.env` en `.gitignore`; doc Swagger oculto en producción |

## Recomendaciones de despliegue

- Cambiar los secretos JWT por defecto (variable `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`).
- Servir bajo HTTPS (reverse proxy) para activar HSTS de forma efectiva.
- Restringir `CORS_ORIGINS` al dominio real del frontend.
- Cambiar contraseña del admin demo (`Admin@123`) tras el primer ingreso.
