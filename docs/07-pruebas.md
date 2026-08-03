# FASE 7 — Pruebas y Calidad

## Backend

### Tests E2E (`npm run test:e2e`) — 7/7 PASS

| Caso | Verifica |
|---|---|
| `GET /api/health` | Liveness responde `{ status: ok }` |
| `GET /api/health/db` | Conexión real a PostgreSQL (`SELECT 1`) |
| Login inválido → 401 | Autenticación rechaza credenciales malas |
| Login admin → 200 | Entrega access + refresh; rol `ADMIN` |
| `GET /api/products` sin token → 401 | Guard JWT global bloquea |
| `GET /api/products` con token → 200 | Endpoint protegido responde paginado |
| `GET /api/settings/public/tax_rate` | Endpoint público devuelve IVA configurado |

### Lint y formato

```bash
npm run lint        # ESLint {src,test}/**/*.ts → OK
npx prettier --check "{src,test}/**/*.ts" → OK
```

### Smoke test integral (durante desarrollo)

`/tmp/opencode/smoke.sh` valida el flujo completo contra la API en vivo:
venta atómica con IVA, Kardex consistente, bloqueo de stock negativo, caja en 3 pasos,
asiento cuadrado, trial balance, tesorería y auditoría.

## Frontend

```bash
npx prettier --check "src/**/*.{ts,html,scss}"  # formateado
npx ng build                                    # compilación production OK
```

- 16 páginas standalone compiladas; bundle inicial ~477 kB (476.71 kB raw / 111.76 kB transfer).
- Sin errores de tipo ni de plantillas (Angular template type-checking habilitado).
