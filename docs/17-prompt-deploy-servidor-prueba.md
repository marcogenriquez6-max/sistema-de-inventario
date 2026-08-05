# Prompt listo para desplegar el sistema completo en un servidor de prueba

> Copia y pega el bloque de abajo en opencode, dentro de la carpeta `C:\proyectos\sistema_repuestos`.

---

## Prompt (copiar todo lo que está entre las líneas de `---`)

---

Actúa como ingeniero DevOps senior. Tu misión es dejar el sistema ERP de repuestos (backend NestJS + frontend Angular + PostgreSQL 15 + Redis) **completamente desplegado, funcionando y verificado** en un servidor de prueba.

Trabaja en la carpeta `C:\proyectos\sistema_repuestos`. No inventes configuraciones nuevas: usa los archivos ya existentes (`docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `database/*.sql`).

## 1. Pre-requisitos (verifica antes de empezar)
- [ ] Docker + Docker Compose instalados y en ejecución (`docker info` y `docker compose version`).
- [ ] Node.js 24+ disponible.
- [ ] Puertos libres: 8080 (web), 3000 (API), 5432 (PostgreSQL), 6379 (Redis).

## 2. Preparar despliegue
- [ ] Genera secretos seguros para `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` (valores aleatorios de al menos 32 caracteres) y configúralos como variables de entorno sin guardarlos en git.
- [ ] Verifica que `CORS_ORIGINS` incluya la URL pública del servidor de prueba.
- [ ] Confirma que el esquema y el seed (`database/schema.sql`, `schema-erp.sql`, `seed.sql`, `migrations/`) se cargan automáticamente al crear el volumen PostgreSQL.
- [ ] Limpia el volumen/containers anteriores si existen para garantizar una instalación desde cero.

## 3. Compilar y validar (antes de levantar)
- [ ] Backend: `npm ci` (o `npm install`), `npm run lint` y build (`npm run build`). Si falla, corrige los errores.
- [ ] Frontend: `npm ci` (o `npm install`), `npm run build` (verifica que compile con el modo production) y `npx prettier --check "src/**/*.{ts,html,scss}"`.
- [ ] Si existe `npm run test:e2e` en backend, ejecútalo y corrige fallos.

## 4. Levantar el stack completo
- [ ] Ejecuta `docker compose up --build -d` y espera a que todos los servicios queden `healthy`/`running`.
- [ ] Confirma que el contenedor `db` terminó de cargar los scripts SQL (revisa los logs del primer arranque).

## 5. Verificación obligatoria (end-to-end)
- [ ] `curl -s http://localhost:3000/api/health` → responde `ok` (o similar).
- [ ] Swagger accesible o confirmar que está deshabilitado en production según corresponda.
- [ ] Web accesible en `http://localhost:8080`.
- [ ] Login de prueba con `admin@sistema.com` / `Admin@123` contra el API (token JWT emitido).
- [ ] Comprueba una consulta de catálogo/productos autenticada.
- [ ] Revisa `docker compose ps` y logs (`docker compose logs --tail=50`) sin errores críticos.

## 6. Entregable
- [ ] Devuelve un resumen con: URL de acceso, puertos, credenciales demo, estado de cada contenedor y los comandos útiles (`docker compose ps`, `docker compose logs`, `docker compose down`).
- [ ] Advierte claramente qué cambiar antes de pasar a un servidor de producción real (secretos JWT, contraseña admin, HTTPS).

---

## Variante: servidor de prueba remoto (VPS Linux)

Reemplaza el paso 4 y 5 por:

- Sube el repositorio al VPS con `rsync` o `git clone` (excluyendo `node_modules`, `dist`, `.git` si no se necesita).
- En el VPS: instala Docker + Docker Compose si faltan.
- Copia un `.env` con los secretos generados y ejecuta `docker compose up --build -d`.
- Configura el puerto correcto de `CORS_ORIGINS` (la IP/dominio público del VPS).
- Verifica los mismos checks del paso 5 apuntando a la IP pública (abriendo previamente los puertos en el firewall).

> Si quieres HTTPS en el servidor de prueba, coloca un reverse proxy (nginx/Caddy) delante de los puertos 8080/3000 con certificado Let's Encrypt.
