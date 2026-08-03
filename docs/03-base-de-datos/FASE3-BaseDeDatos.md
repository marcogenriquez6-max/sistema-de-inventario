# FASE 3 — Diseño de Base de Datos

> Motor: PostgreSQL 16 · Codificación: UTF-8 · Motor por defecto: InnoDB-equivalente (PostgreSQL row-level)

---

## 3.1 Diagrama Entidad-Relación

```
┌───────────────┐   1      N ┌──────────────────┐
│    users      │───────────▶│   refresh_tokens │
│  (id, PK)     │            │   (id, PK, jti)  │
└───────────────┘            └──────────────────┘
   │ 1
   │ N
   ▼
┌───────────────┐   1      N ┌──────────────────┐
│   audit_logs  │◀───────────│        (actor)   │
│  (id, PK)     │            └──────────────────┘
└───────────────┘

┌─────────────────────────┐  1     N ┌──────────────────────────┐
│      settings           │─────────▶│   settings_history       │
│  (param_id PK)          │          │   (id PK, param_id FK)   │
│  IVA, margen, empresa   │          │   versionado              │
└─────────────────────────┘          └──────────────────────────┘

┌───────────────────────┐
│       products        │  ← tabla central del catálogo
│  (id PK)              │
│  sku UNIQUE, oem,     │
│  barcode, name, ...   │
│  stock, min_stock     │
│  cost_price,          │
│  base_price,          │
│  sale_price (IVA)     │
│  warehouse_location   │
│  (aisle, shelf,       │
│   level, bin)         │
└──────────┬────────────┘
           │ 1
           │ N
   ┌───────┴────────┐        ┌───────────────────────────────┐
   ▼                ▼        ▼
┌───────────┐  ┌──────────┐  ┌───────────────────────────────┐
│  product_ │  │ product_ │  │        stock_movements        │
│  codes    │  │ compat   │  │   (Kardex)                    │
│ (SKU/OEM/ │  │ (brand,  │  │  id PK, product_id FK,        │
│  barcode  │  │  model,  │  │  type (IN/OUT/ADJUST),         │
│  alt)     │  │  year,   │  │  qty, unit_cost, unit_base,   │
└───────────┘  │  engine) │  │  concept, user_id FK,          │
               └──────────┘  │  sale_item_id FK (nullable),  │
                             │  created_at                   │
                             └───────────────────────────────┘
                                          ▲
┌──────────────────────┐ 1     N ┌────────┴─────────────────┐
│  sale_documents      │─────────▶│      sale_items          │
│  (nota/factura)      │          │  (precios congelados)    │
│  id PK, doc_number   │          │  product_id FK,          │
│  type, customer,     │          │  qty, unit_cost,         │
│  subtotal, tax,      │          │  unit_base, unit_sale,   │
│  total, user_id FK,  │          │  tax_amount, line_total  │
│  status              │          └──────────────────────────┘
└──────────────────────┘
```

---

## 3.2 Modelo Relacional — Tablas

### `users` — Usuarios y credenciales

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | Identificador |
| email | VARCHAR(255) | UNIQUE NOT NULL | Correo de acceso |
| password_hash | VARCHAR(255) | NOT NULL | Hash argon2 |
| full_name | VARCHAR(150) | NOT NULL | Nombre completo |
| role | VARCHAR(30) | NOT NULL DEFAULT 'SELLER' | Rol RBAC |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Estado de la cuenta |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `UNIQUE (email)`; `idx_users_role (role)`.

### `refresh_tokens` — Sesiones (refresh token rotativo)

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| jti | VARCHAR(64) | UNIQUE NOT NULL | Identificador único del token (JWT ID) |
| user_id | BIGINT | FK → users.id NOT NULL | Dueño |
| token_hash | VARCHAR(255) | NOT NULL | Hash del refresh token (seguridad) |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiración |
| revoked_at | TIMESTAMPTZ | NULL | Rotación/revocación |
| replaced_by_jti | VARCHAR(64) | NULL | Encadenamiento de rotación |
| ip | INET | NULL | IP de creación |
| user_agent | VARCHAR(300) | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `UNIQUE (jti)`; `idx_refresh_user (user_id)`; `idx_refresh_expires (expires_at)`.

### `audit_logs` — Auditoría append-only

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| user_id | BIGINT | FK → users.id NULL | Actor (NULL = sistema) |
| action | VARCHAR(60) | NOT NULL | VERBO:recurso (ej. `SALE:CREATE`) |
| resource_type | VARCHAR(60) | NOT NULL | Tabla/recurso afectado |
| resource_id | VARCHAR(60) | NULL | Id del recurso |
| metadata | JSONB | NULL | Datos relevantes del cambio |
| ip | INET | NULL | IP |
| user_agent | VARCHAR(300) | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `idx_audit_user (user_id)`, `idx_audit_resource (resource_type, resource_id)`, `idx_audit_created (created_at)`. Sin UPDATE/DELETE de registros de auditoría.

### `settings` y `settings_history` — Parámetros globales versionados

`settings`:
| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| key | VARCHAR(60) | PK | `tax_rate`, `company_name`, `default_margin_pct`, `doc_sequence` |
| value | JSONB | NOT NULL | Valor |
| updated_by | BIGINT | FK → users.id NULL | Quién cambió |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

`settings_history` (versionado para auditoría de cambios de IVA):
| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| key | VARCHAR(60) | NOT NULL | — |
| value | JSONB | NOT NULL | Valor anterior |
| changed_by | BIGINT | FK users.id NULL | — |
| changed_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

### `products` — Catálogo (ficha del repuesto)

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| sku | VARCHAR(50) | UNIQUE NOT NULL | Código interno |
| oem_code | VARCHAR(50) | NULL | Código OEM (número de parte original) |
| barcode | VARCHAR(50) | NULL | Código de barras |
| name | VARCHAR(200) | NOT NULL | Nombre/descripción |
| category | VARCHAR(80) | NULL | Categoría (filtro, frenos, aceite...) |
| brand | VARCHAR(80) | NULL | Marca del repuesto |
| unit | VARCHAR(20) | NOT NULL DEFAULT 'uds' | Unidad de medida |
| stock | INTEGER | NOT NULL DEFAULT 0 CHECK (stock >= 0) | Existencia actual (cero negativo bloqueado a nivel BD) |
| min_stock | INTEGER | NOT NULL DEFAULT 0 | Umbral de reposición |
| cost_price | NUMERIC(14,2) | NOT NULL DEFAULT 0 | Precio de compra (costo) |
| base_price | NUMERIC(14,2) | NOT NULL DEFAULT 0 | PVP sin IVA |
| sale_price | NUMERIC(14,2) | NOT NULL DEFAULT 0 | PVP con IVA (calculado) |
| warehouse_aisle | VARCHAR(20) | NULL | Pasillo |
| warehouse_shelf | VARCHAR(20) | NULL | Estantería |
| warehouse_level | VARCHAR(20) | NULL | Nivel |
| warehouse_bin | VARCHAR(20) | NULL | Casilla |
| image_url | VARCHAR(300) | NULL | Imagen |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Activo |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `UNIQUE (sku)`, `UNIQUE (oem_code) WHERE oem_code IS NOT NULL`, `UNIQUE (barcode) WHERE barcode IS NOT NULL`, `idx_products_name (name gin trgm)`, `idx_products_category`, `idx_products_min_stock (stock, min_stock)`, `idx_products_brand`.

### `product_codes` — Códigos alternativos (multicódigo)

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| product_id | BIGINT | FK → products.id NOT NULL | — |
| code_type | VARCHAR(20) | NOT NULL | `OEM`, `BARCODE`, `SKU_ALT` |
| code_value | VARCHAR(50) | NOT NULL | Valor del código |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `UNIQUE (code_type, code_value)`; `idx_product_codes_product`.

### `product_compat` — Compatibilidad de aplicación

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| product_id | BIGINT | FK → products.id NOT NULL | — |
| vehicle_brand | VARCHAR(80) | NOT NULL | Marca vehículo/equipo |
| vehicle_model | VARCHAR(80) | NOT NULL | Modelo |
| year_from | INTEGER | NULL | Año inicial |
| year_to | INTEGER | NULL | Año final |
| engine_type | VARCHAR(80) | NULL | Cilindrada/tipo de motor |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `idx_compat_product`, `idx_compat_search (vehicle_brand, vehicle_model)`.

### `stock_movements` — Kardex

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| product_id | BIGINT | FK → products.id NOT NULL | Repuesto |
| movement_type | VARCHAR(20) | NOT NULL | `PURCHASE`, `SALE`, `ADJUST`, `MERMA`, `RETURN` |
| quantity | INTEGER | NOT NULL | Positivo = entrada, negativo = salida |
| unit_cost | NUMERIC(14,2) | NOT NULL | Costo en el momento |
| unit_base | NUMERIC(14,2) | NOT NULL | PVP base en el momento |
| unit_sale | NUMERIC(14,2) | NOT NULL | PVP facturado en el momento |
| concept | VARCHAR(200) | NULL | Motivo (ajuste, merma...) |
| reference_type | VARCHAR(30) | NULL | Origen: `SALE`, `PURCHASE`, `ADJUSTMENT` |
| reference_id | BIGINT | NULL | Id del documento origen |
| user_id | BIGINT | FK → users.id NULL | Quién ejecutó |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `idx_moves_product (product_id, created_at DESC)` (Kardex por repuesto), `idx_moves_reference (reference_type, reference_id)`.

### `sale_documents` — Cabecera de nota/factura

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| doc_type | VARCHAR(20) | NOT NULL | `NOTA` o `FACTURA` |
| doc_number | VARCHAR(30) | UNIQUE NOT NULL | Correlativo |
| customer_name | VARCHAR(200) | NOT NULL | Cliente |
| customer_doc | VARCHAR(30) | NULL | CI/RUC cliente |
| subtotal | NUMERIC(14,2) | NOT NULL | Suma de venta base |
| tax_rate | NUMERIC(5,2) | NOT NULL | IVA aplicado (congelado) |
| tax_amount | NUMERIC(14,2) | NOT NULL | Total impuesto |
| total | NUMERIC(14,2) | NOT NULL | Total facturado |
| status | VARCHAR(20) | NOT NULL DEFAULT 'COMPLETED' | `COMPLETED`, `VOIDED` |
| void_reason | VARCHAR(200) | NULL | Motivo de anulación |
| user_id | BIGINT | FK → users.id NOT NULL | Vendedor |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | — |

Índices: `idx_doc_number`, `idx_doc_created (created_at DESC)`, `idx_doc_user (user_id)`. `doc_number` único: el correlativo se asigna dentro de la transacción atómica (secuencia por tabla) para evitar duplicados por concurrencia.

### `sale_items` — Detalle con precios congelados

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| id | BIGSERIAL | PK | — |
| sale_id | BIGINT | FK → sale_documents.id NOT NULL | Cabecera |
| product_id | BIGINT | FK → products.id NOT NULL | Repuesto |
| product_sku | VARCHAR(50) | NOT NULL | SKU congelado (si se re-nombra) |
| product_name | VARCHAR(200) | NOT NULL | Descripción congelada |
| quantity | INTEGER | NOT NULL CHECK (quantity > 0) | Cantidad |
| unit_cost | NUMERIC(14,2) | NOT NULL | Costo al cierre |
| unit_base | NUMERIC(14,2) | NOT NULL | PVP sin IVA al cierre |
| unit_sale | NUMERIC(14,2) | NOT NULL | PVP con IVA al cierre |
| tax_rate | NUMERIC(5,2) | NOT NULL | IVA al cierre |
| tax_amount | NUMERIC(14,2) | NOT NULL | IVA del ítem |
| line_total | NUMERIC(14,2) | NOT NULL | qty × unit_sale |

Índices: `idx_sale_items_sale (sale_id)`, `idx_sale_items_product (product_id)`.

---

## 3.3 Normalización

- Modelo en **3FN**: precios calculables (`sale_price`, `total`) se denormalizan **deliberadamente** como valores derivados para rendimiento y trazabilidad (técnica aceptada en modelos financieros; integridad garantizada por cálculo en la capa de aplicación + triggers de consistencia).
- `sale_items` denormaliza `sku`, `product_name`, precios y `tax_rate`: requisito **RF-14** (congelado histórico). Sin esta denormalización, un cambio de costo/IVA alteraría ventas pasadas.
- Códigos alternativos en `product_codes` (relación 1-N) para soportar multicódigo sin romper `UNIQUE` de `products`.

---

## 3.4 Restricciones y Triggers

### Checks de integridad
1. `products.stock >= 0` — cero stock negativo a nivel BD (defensa en profundidad).
2. `sale_items.quantity > 0`.
3. `sale_documents.total = subtotal + tax_amount` (consistencia financiera).

### Triggers

`trg_products_updated_at` — mantiene `updated_at` en UPDATE.
`trg_prevent_audit_mutation` — bloquea UPDATE/DELETE sobre `audit_logs` (append-only).
`trg_set_doc_number` — opcional: asigna correlativo de `sale_documents` en INSERT dentro de la transacción. (Se implementará en aplicación con `SELECT ... FOR UPDATE` sobre secuencia para control total; el trigger queda documentado como alternativa.)

**Nota**: El descuento de stock y el registro de Kardex se realizan en **una transacción en la capa de aplicación** (ver 2.11), con `SELECT ... FOR UPDATE` sobre `products`. Esto ofrece mejor mensajería de errores (409) y control de dominio que un trigger.

---

## 3.5 Migraciones

Las migraciones se gestionan con **TypeORM Migrations** (scripts `src/database/migrations`). El DDL de referencia del sistema completo se entrega en `database/schema.sql` y los datos iniciales en `database/seed.sql`:

- `schema.sql` — DDL completo (idempotente para la versión 1).
- `seed.sql` — Usuario admin, parámetros iniciales (IVA 16%), categorías, repuestos de demostración, ubicaciones.

---

## 3.6 Justificación de cada tabla (resumen)

| Tabla | Aporta |
|---|---|
| users | Identidad y credenciales (RBAC) |
| refresh_tokens | Sesiones seguras con rotación y revocación |
| audit_logs | Cumplimiento y trazabilidad inmutable |
| settings / settings_history | Parámetros globales versionados (IVA histórico) |
| products | Ficha central multicódigo + precios + stock + ubicación |
| product_codes | Códigos alternativos (OEM/barras) sin violar unicidad |
| product_compat | Compatibilidad por vehículo (evita error de despacho) |
| stock_movements | Kardex completo (quién/cuándo/por qué) |
| sale_documents | Cabecera de nota/factura con correlativo único |
| sale_items | Detalle con precios congelados (RF-14) |

---

## 3.7 Conclusión FASE 3

Modelo relacional en 3FN con denormalización intencional y controlada (precios congelados y derivados), restricciones de integridad a nivel BD (stock ≥ 0, montos consistentes), índices optimizados para búsquedas por código y Kardex, auditoría append-only y parámetros versionados. La estrategia transaccional del dominio crítico (venta) queda definida y será implementada en la FASE 4.

Se procede a la **FASE 4: Backend**.
