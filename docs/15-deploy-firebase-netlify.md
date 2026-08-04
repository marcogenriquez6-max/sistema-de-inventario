# Deploy: Netlify + Firebase (FCM)

El frontend Angular se despliega como SPA en **Netlify** (recomendado) o **Firebase Hosting**.
Las notificaciones push del navegador usan **Firebase Cloud Messaging (FCM)** y están **desactivadas por
defecto**: se activan solas cuando existe el archivo de configuración (frontend) y la variable de
entorno (backend).

## Arquitectura

```
Navegador ──► Netlify / Firebase Hosting (Angular SPA)
                │
                ├── /api/* ──────────► Backend público (HTTPS): Render / Railway / VPS / Docker
                └── FCM token ───────► firebase-admin (backend) ──► Firebase Messaging ──► push
```

## 1. Backend público (requisito previo)

La SPA necesita un API HTTPS accesible desde internet. Opciones:

| Opción | Cómo |
| --- | --- |
| **Render / Railway** | Subir `backend/`, variables de entorno, Postgres y Redis gestionados |
| **VPS / Docker** | `docker compose up -d` en un servidor con dominio + TLS |

Variables mínimas del backend en producción:

```env
NODE_ENV=production
DATABASE_HOST=... DATABASE_PORT=5432 DATABASE_USER=... DATABASE_PASSWORD=... DATABASE_NAME=...
JWT_SECRET=... JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://tu-app.netlify.app        # o el dominio de Firebase Hosting
# Opcional (push):
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

> Nota: las migraciones se aplican con `node scripts/apply-schema.js` y
> `node scripts/run-migration.js ../database/migrations/<archivo>.sql`.

## 2. Opción A — Netlify (recomendada)

Ya configurado en `frontend/netlify.toml`:
- Build: `ng build` + `scripts/netlify-redirects.mjs` (genera `_redirects`).
- Publish: `frontend/dist/frontend/browser`.
- Proxy: `/api/*  →  <API_ORIGIN>/api/:splat` (se genera en build si `API_ORIGIN` está definida).
- Fallback SPA: `/* → /index.html 200`.

Pasos:

1. Sube el repo a GitHub.
2. Netlify → **Add new site → Import from Git**.
3. Build command: `npm run build && node scripts/netlify-redirects.mjs` (directorio `frontend`).
4. Publish directory: `dist/frontend/browser`.
5. Environment variable: `API_ORIGIN=https://tu-api.onrender.com` (sin barra final).
6. Deploy. Tu app queda en `https://<site>.netlify.app`.

Para un backend con otros path (`/v1`…), ajusta `frontend/scripts/netlify-redirects.mjs`.

## 2b. Backend en Render (recomendado)

El backend necesita un proceso vivo (SSE, Postgres, Redis) → **no** sirve Netlify Functions.

`render.yaml` (raíz del repo) provisiona todo con un clic:

1. Sube el repo a GitHub.
2. [render.com](https://render.com) → **New → Blueprint** → selecciona el repo.
3. Render crea: servicio `repuestos-api` (Docker), Postgres `repuestos-db` y Redis `repuestos-redis`.
4. El servicio arranca solo. URL resultante, p. ej. `https://repuestos-api.onrender.com`.
5. Verifica `GET https://repuestos-api.onrender.com/api/health` → 200.
6. Aplica el esquema por primera vez: Render → Shell del servicio →
   `npm run migration:apply` (ver sección "Migraciones" abajo) o usa el comando manual del CI.

> Al desplegar por primera vez con BD vacía, ejecuta la migración del esquema una vez.
> `render.yaml` ya inyecta `CORS_ORIGINS` con tu dominio de Firebase y genera los secretos JWT.

## 2c. Backend en Railway (gratis)

El proyecto `backend/railway.json` ya indica Dockerfile, healthcheck `/api/health` y arranque
automático con migración del esquema (`node scripts/apply-schema.js && node dist/main.js`, idempotente).

1. Sube el repo a GitHub.
2. [railway.app](https://railway.app) → **Start a New Project** → **Deploy from GitHub repo**.
3. En el servicio, fija **Root Directory = `backend`** (Railway detecta el Dockerfile).
4. Añade los plugins **PostgreSQL** y **Redis**.
5. Variables del servicio (Reference del plugin):
   ```
   NODE_ENV=production
   DATABASE_HOST   = ${{Postgres.PGHOST}}
   DATABASE_PORT   = ${{Postgres.PGPORT}}
   DATABASE_USER   = ${{Postgres.PGUSER}}
   DATABASE_PASSWORD = ${{Postgres.PGPASSWORD}}
   DATABASE_NAME   = ${{Postgres.PGDATABASE}}
   REDIS_URL       = ${{Redis.REDIS_URL}}
   CORS_ORIGINS    = https://sistema-de-repuestos-864a9.web.app
   JWT_ACCESS_SECRET  = <aleatorio 32+>
   JWT_REFRESH_SECRET = <aleatorio 32+>
   # Opcional: FIREBASE_SERVICE_ACCOUNT = <JSON> (push)
   ```
6. **Generate Domain** en el servicio → obtienes `https://repuestos-api.up.railway.app`.
7. Verifica `GET /api/health` → 200. El esquema + seed se aplican solos al primer arranque.

## 3. Opción B — Firebase Hosting

Config listo en `firebase.json` y `.firebaserc` (raíz del repo).

```bash
npm install -g firebase-tools
firebase login
firebase use repuestos-erp        # o tu projectId real
firebase deploy --only hosting
```

- Public: `frontend/dist/frontend/browser`; rewrite SPA `** → /index.html`.
- El backend **debe** vivir fuera de Hosting (Render/Railway/VPS) y `api.service.ts`
  apuntará a su URL real (ver sección 5).
- En Firebase Hosting no hay proxy nativo a otro dominio: en producción el frontend usa la
  URL del API configurada en build (ver sección 5), o bien implementas Cloud Functions
  para `/api/*` (fuera del alcance de esta guía).

## 4. Push notifications (FCM)

El push se activa **solo** si ambas condiciones se cumplen:

### 4.1 Frontend (cliente)
1. En Firebase Console → **Project settings → Cloud Messaging** guarda la clave **Web push (VAPID)**.
2. Crea `frontend/public/firebase-config.json` copiando `frontend/public/firebase-config.example.json`
   y rellenando `apiKey`, `messagingSenderId`, `appId`, `projectId`, `vapidKey`, etc.
3. `public/firebase-messaging-sw.js` (ya incluido) se registra solo si ese archivo existe.
4. `push-notifications.service.ts` pide permiso, obtiene el token y lo envía a
   `POST /api/notifications/fcm-token`.

> El archivo `firebase-config.json` contiene claves públicas del lado cliente. Si no quieres
> subirlo al repo, añádelo a `.gitignore` y súbelo al hosting manualmente (Netlify: arrastrar al
> deploy; Firebase: `firebase deploy --only hosting`).

### 4.2 Backend (envío)
1. Firebase Console → **Project settings → Service accounts → Generate new private key**.
2. Define en el backend la variable `FIREBASE_SERVICE_ACCOUNT` con el JSON completo
   (escapado), p. ej. en Render: `Settings → Environment`.
3. El backend guarda tokens (`POST /notifications/fcm-token`) y al crear una notificación
   (`notifications.service.ts → create()`) envía el push vía `fcm.service.ts`.
4. Tokens inválidos se purgan automáticamente.

### 4.3 Flujo completo
- Navegador con pestaña abierta → notificación en el centro + badge (SSE en tiempo real).
- Navegador cerrado → notificación push del sistema operativo (FCM).

## 5. URL del API en el frontend

`api.service.ts` usa `/api` relativo por defecto (funciona en desarrollo y en Netlify gracias al
proxy de `_redirects`). Para hosts sin proxy (**Firebase Hosting**, dominio propio) define la
variable global antes del bundle:

```html
<!-- frontend/index.html -->
<script>window.__API_ORIGIN__ = 'https://tu-api.onrender.com';</script>
```

Todos los servicios (incl. SSE de chat y notificaciones, y exportaciones) ya la respetan. Si la
variable no está, todo vuelve a `/api` relativo.

## Checklist de verificación

- [ ] `npm run build` OK en `frontend` y `backend`.
- [ ] Backend público responde `GET /api/health` → 200.
- [ ] Login en producción funciona (CORS configurado).
- [ ] Push: `firebase-config.json` presente y `FIREBASE_SERVICE_ACCOUNT` definido → se crea una
      notificación y llega el push al navegador.
- [ ] Sin FCM configurado, la app funciona igual (el push se ignora silenciosamente).
