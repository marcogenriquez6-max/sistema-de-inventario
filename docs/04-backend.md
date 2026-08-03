# FASE 4 — Backend (NestJS API)

> API REST del Sistema de Repuestos · NestJS + TypeORM + PostgreSQL · Autenticación JWT

## Arquitectura de módulos

Cada módulo sigue el patrón Controller → Service → Entity:

| Módulo | Responsabilidad |
|---|---|
| `auth` | Login, refresh (rotación), logout, tokens JWT |
| `users` | Usuarios, roles RBAC |
| `catalog` | Productos y multicódigo (SKU/OEM/barras), categorías, marcas |
| `pricing` | Regla de precios: costo → PVP (+margen) → facturado (+IVA) |
| `inventory` | Kardex, compras (entradas), ajustes/mermas/devoluciones |
| `sales` | Ventas (NOTA/FACTURA), descuento atómico de stock, anulación |
| `customers` / `suppliers` | Clientes y proveedores |
| `purchases` | Compras a proveedores y costeo de inventario |
| `cash-registers` | Apertura, movimientos, arqueo y cierre |
| `accounting` | Plan de cuentas, asientos validados, trial balance |
| `banking` | Cuentas, depósitos/retiros, transferencias |
| `hr` | Empleados |
| `documents` | Gestión documental |
| `audit` | Trazabilidad append-only |
| `reports` | Dashboard, ventas por día, stock crítico |
| `settings` | Parámetros (IVA, margen, secuencias) + endpoint público |
| `public-api` | Consultas públicas sin token (catálogo) |
| `health` | Liveness/readiness |

## Contratos transversales

- Prefijo global `/api`; respuesta envuelta en `{ success, data, timestamp }`.
- Autenticación: `Authorization: Bearer <accessToken>`; endpoints `@Public()` exentos.
- Errores unificados por `AllExceptionsFilter` → `{ success: false, message, statusCode }`.
- Paginación común `{ page, pageSize }` → `{ items, meta: { page, pageSize, totalItems, totalPages } }`.

## Decisiones críticas

- **`synchronize: false`** — el esquema proviene de `database/schema*.sql`; TypeORM no lo muta.
- **Locks pesimistas** en ventas/compras (`createQueryBuilder().setLock('pessimistic_write')`)
  para impedir sobreventa/descuadre bajo concurrencia.
- **Aislamiento READ COMMITTED**: dentro de una transacción los reads post-insert usan el mismo `manager`.
- **Enums estrictos**: `docType` incluye `NIT`; DTOs validados con `whitelist` + `forbidNonWhitelisted`.
