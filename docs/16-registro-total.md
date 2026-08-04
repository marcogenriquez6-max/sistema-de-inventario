# Sistema de Repuestos — Registro Total del Sistema

> Registro completo de cómo funciona el sistema y cómo se almacena cada dato.
> Cobertura: arquitectura, 24 módulos, todos los flujos y las 31 tablas de la base de datos.
> Base de datos: PostgreSQL 16 (`repuestos_db`).

---

## 1. Visión general

```
┌──────────────┐      HTTPS/HTTP       ┌──────────────────┐      SQL       ┌──────────────────────┐
│  Frontend    │ ────────────────────► │   Backend API    │ ─────────────► │   PostgreSQL 16      │
│  Angular 17  │   (proxy 127.0.0.1:   │   NestJS 10      │                │   repuestos_db       │
│  puerto 4200 │    3000)              │   puerto 3000    │                │   31 tablas          │
└──────────────┘                      └──────────────────┘                └──────────────────────┘
                                          │      │
                                       BullMQ   FCM
                                     (reportes/  (push)
                                      notif. si
                                      REDIS_URL)
```

- **Frontend**: Angular, `http://localhost:4200`. Llama a `/api/*` vía proxy hacia `http://127.0.0.1:3000`.
- **Backend**: NestJS, `http://127.0.0.1:3000`. API en `/api`, Swagger en `/api/docs`.
- **Base de datos**: PostgreSQL 16, usuario `repuestos`, base `repuestos_db`, puerto 5432.

El catálogo de precios usa la estructura financiera **Costo → Venta Base → Facturado (PVP con IVA)**.
El IVA se lee de la tabla `settings` (`tax_rate`, 16%).

---

## 2. Roles de usuario

| Rol                  | Descripción                          |
|----------------------|--------------------------------------|
| `ADMIN`              | Acceso total al sistema              |
| `SELLER`             | Vendedor (POS)                       |
| `INVENTORY_MANAGER`  | Encargado de inventario              |
| `MANAGER`            | Gerente (reportes)                   |
| `AUDITOR`            | Solo lectura / auditoría             |

Se almacenan en `users.role` (CHECK constraint, tabla `users`).

---

## 3. Mapa completo de la base de datos (31 tablas)

### 3.1 Tablas base (`database/schema.sql`)

| Tabla               | Propósito                                             | Clave / relaciones                                |
|---------------------|-------------------------------------------------------|---------------------------------------------------|
| `users`             | Usuarios del sistema                                  | `email` UNIQUE; `role` CHECK                      |
| `refresh_tokens`    | Sesiones rotativas (JWT refresh)                      | `jti` UNIQUE; `user_id` → `users` (CASCADE)       |
| `audit_logs`        | Auditoría **append-only** (no se puede editar/borrar) | `user_id` → `users` (SET NULL); trigger bloqueante |
| `settings`          | Parámetros globales (JSONB)                           | PK `key`                                          |
| `settings_history`  | Historial versionado de parámetros                    | `changed_by` → `users`                            |
| `products`          | Ficha central del repuesto                            | `sku`/`oem_code`/`barcode` UNIQUE                 |
| `product_codes`     | Códigos alternativos (multicódigo)                    | `product_id` → `products` (CASCADE)               |
| `product_compat`    | Compatibilidad de aplicación (marca/modelo/año)       | `product_id` → `products` (CASCADE)               |
| `stock_movements`   | Kardex de inventario                                  | `product_id` → `products` (CASCADE)               |
| `sale_documents`    | Cabecera de nota/factura                              | `doc_number` UNIQUE; `user_id` → `users`          |
| `sale_items`        | Detalle de venta (precios **congelados**)             | `sale_id` → `sale_documents` (CASCADE)            |
| `notifications`     | Notificaciones en app                                 | `user_id` → `users` (CASCADE)                     |
| `fcm_tokens`        | Tokens de push (Firebase)                             | `user_id` → `users` (CASCADE); `token` UNIQUE     |
| `chat_rooms`        | Salas de chat (direct/group/announcement)             | `created_by` → `users`                            |
| `chat_room_members` | Miembros por sala                                     | PK compuesta `(room_id, user_id)`                 |
| `chat_messages`     | Mensajes                                             | `room_id`/`sender_id` → (CASCADE)                 |
| `tasks`             | Tareas Kanban + calendario                            | `assignee_id`/`created_by` → `users`              |

### 3.2 Tablas ERP (`database/schema-erp.sql`)

| Tabla               | Propósito                                             | Clave / relaciones                                |
|---------------------|-------------------------------------------------------|---------------------------------------------------|
| `customers`         | Clientes                                              | `code` UNIQUE; índice por nombre y documento      |
| `suppliers`         | Proveedores                                           | `code` UNIQUE                                     |
| `purchase_documents`| Cabecera de compra                                    | `doc_number` UNIQUE; `supplier_id`, `user_id`     |
| `purchase_items`    | Detalle de compra                                     | `purchase_id` → CASCADE; `product_id`             |
| `cash_registers`    | Apertura/cierre de caja                               | `opened_by`/`closed_by` → `users`                 |
| `cash_movements`    | Movimientos de caja (INCOME/EXPENSE/DEPOSIT/WITHDRAWAL)| `register_id` → CASCADE                           |
| `chart_of_accounts` | Plan de cuentas                                       | `code` UNIQUE; `parent_id` jerárquico             |
| `journal_entries`   | Asientos contables                                    | `entry_number` UNIQUE; `created_by` → `users`     |
| `journal_lines`     | Líneas de asiento (debe/haber)                        | `entry_id` → CASCADE; `account_id`                |
| `employees`         | Empleados (RR.HH.)                                    | `code` UNIQUE                                     |
| `documents`         | Gestión documental (adjuntos)                         | `uploaded_by` → `users` (SET NULL)                |
| `bank_accounts`     | Cuentas bancarias                                     | —                                                 |
| `bank_movements`    | Movimientos bancarios                                 | `account_id`, `user_id`                           |
| `integrations`      | API keys de integraciones externas                    | `name` UNIQUE; `api_key_hash`                     |

---

## 4. Cómo se almacena cada dato (reglas de persistencia)

1. **Fechas**: siempre `TIMESTAMPTZ` con default `now()` (UTC). En `products` y `users` el `updated_at` se actualiza solo mediante el trigger `trg_*_updated_at` (`fn_set_updated_at`).
2. **Dinero**: siempre `NUMERIC(14,2)` (o `16,2` en bancos). El backend redondea a 2 decimales y evita coma flotante.
3. **Ventas**: los precios se **congelan** en `sale_items` (`unit_cost`, `unit_base`, `unit_sale`, `tax_rate`, `tax_amount`) para que una factura no cambie aunque después se modifique el precio del producto. Además `sale_documents` guarda `customer_name`/`customer_doc` **desnormalizados** (copia al momento de vender).
4. **Compras**: igual, `purchase_documents.supplier_name` es copia del proveedor y `purchase_items` congelan `product_sku`, `product_name`, `unit_cost`.
5. **Inventario**: el stock actual está en `products.stock`; cada cambio deja una huella en `stock_movements` (Kardex) con `quantity <> 0`. Tipos: `PURCHASE | SALE | ADJUST | MERMA | RETURN`. El stock nunca baja de 0 (CHECK `stock >= 0`).
6. **Auditoría**: `audit_logs` es append-only. El trigger `trg_audit_no_update` (`fn_block_audit_mutation`) **lanza excepción** ante cualquier UPDATE o DELETE. Solo se agregan filas.
7. **Parámetros**: `settings` guarda valores en `JSONB` (`{"value": 16.00}`); cada cambio se registra en `settings_history`.
8. **Validaciones de dinero en BD** (CHECK): `sale_documents.total = subtotal + tax_amount`; `sale_items.line_total = quantity * unit_sale`; `purchase_items.line_total`; precios `>= 0`.
9. **Búsqueda de repuestos**: índice GIN con `pg_trgm` sobre `products.name` para búsqueda difusa.

---

## 5. Flujo por módulo (cómo va)

### 5.1 Autenticación (`/auth`) — tablas: `users`, `refresh_tokens`
1. `POST /auth/login` (público): valida email + contraseña (hash Argon2id), emite JWT de acceso.
2. Guarda el refresh token **hasheado** en `refresh_tokens` (con `jti`, IP, user-agent, expiración).
3. `POST /auth/refresh` (público): rota la sesión — se revoca el token viejo y se apunta `replaced_by_jti` al nuevo.
4. `POST /auth/logout`: revoca el refresh token (`revoked_at`).
5. `POST /auth/change-password`: actualiza `users.password_hash` y revoca todas las sesiones del usuario.

### 5.2 Catálogo de repuestos (`/products`) — tablas: `products`, `product_codes`, `product_compat`
- `GET /products` lista; `GET /products/by-code/:code` busca por SKU, OEM o código de barras.
- `POST /products` crea la ficha; calcula precios con el módulo `pricing`:
  - `base_price = cost * (1 + margin/100)` (margen desde `settings.default_margin_pct`, 50%).
  - `sale_price = base_price * (1 + tax/100)` (IVA 16%).
- `POST/PATCH /products` también registran códigos alternativos (`product_codes`, tipos `OEM|BARCODE|SKU_ALT`) y compatibilidad (`product_compat`).
- `DELETE /products/:id` borra la ficha (los movimientos y códigos se borran en cascada).

### 5.3 Inventario (`/inventory`) — tablas: `products`, `stock_movements`
- `POST /inventory/purchases`: suma stock y escribe movimiento tipo `PURCHASE`.
- `POST /inventory/adjustments`: ajuste manual (tipo `ADJUST`); el backend recalcula `products.stock` a partir del Kardex o ajusta por diferencia según implementación.
- `GET /inventory/kardex/:productId`: historial de movimientos del producto.
- El reporte `low-stock` compara `products.stock <= products.min_stock`.

### 5.4 Ventas / POS (`/sales`) — tablas: `sale_documents`, `sale_items`, `products`, `stock_movements`
1. `POST /sales` ejecuta una **transacción atómica**:
   - Valida stock suficiente para cada línea.
   - Congela precios y grava: cabecera en `sale_documents` (genera `doc_number` por tipo `NOTA`/`FACTURA` desde `settings.doc_sequence`), detalle en `sale_items`.
   - Descuenta `products.stock` y escribe `stock_movements` tipo `SALE`.
   - Si algo falla, hace rollback de todo.
2. `GET /sales/:id/pdf`: genera la **factura PDF (A4)** con PDFKit a partir de la venta guardada.
3. `POST /sales/:id/void`: marca `status = VOIDED` (con `void_reason`), **restaura stock** y escribe `stock_movements` tipo `RETURN`.
4. En el POS el ticket de 80 mm se imprime con `window.print()` desde el frontend.

### 5.5 Clientes (`/customers`) — tabla: `customers`
- CRUD. Si no se envía `code`, el backend lo **autogenera** en secuencia (`CLI-00001`, `CLI-00002`, …).
- Se busca por nombre o por documento (`idx_customers_name`, `idx_customers_doc`). En el POS se puede crear cliente al vuelo y se puede facturar a cliente genérico.

### 5.6 Compras (`/purchases`) — tablas: `purchase_documents`, `purchase_items`, `suppliers`
- `POST /purchases`: crea cabecera (con `supplier_name` copiado), detalle con `unit_cost`/`line_total`, estado `RECEIVED`. Puede incrementar stock (movimiento `PURCHASE`) según la implementación conectada.
- `GET /purchases`, `GET /purchases/:id`: consulta/leer compra.

### 5.7 Proveedores (`/suppliers`) — tabla: `suppliers`
- CRUD básico (código, razón social, NIT, contacto).

### 5.8 Caja (`/cash-registers`) — tablas: `cash_registers`, `cash_movements`
- `POST /cash-registers`: apertura con `initial_balance`, estado `OPEN`.
- `POST /cash-registers/:id/movements`: registra `INCOME | EXPENSE | DEPOSIT | WITHDRAWAL` y actualiza `expected`.
- `POST /cash-registers/:id/close`: cierre con `counted_amount` y `difference = expected - counted`; estado `CLOSED`.
- `GET /cash-registers/mine` y `GET /:id/movements`: consultas.

### 5.9 Contabilidad (`/accounting`) — tablas: `chart_of_accounts`, `journal_entries`, `journal_lines`
- CRUD de cuentas (`ASSET|LIABILITY|EQUITY|REVENUE|EXPENSE`).
- `POST /accounting/entries`: crea asiento con líneas debit/credit (debe = haber).
- `GET /accounting/trial-balance`: balanza de comprobación.

### 5.10 Bancos (`/banking`) — tablas: `bank_accounts`, `bank_movements`
- CRUD de cuentas con `balance` y moneda (`BOB` por defecto).
- `POST /banking/accounts/:id/movements`: `DEPOSIT | WITHDRAWAL`.
- `POST /banking/accounts/:id/transfer`: genera `TRANSFER_OUT` en origen y `TRANSFER_IN` en destino en la misma operación.

### 5.11 RR.HH. (`/employees`) — tabla: `employees`
- CRUD de empleados (código, cargo, departamento, salario, fecha de ingreso).

### 5.12 Documentos (`/documents`) — tabla: `documents`
- Alta/baja de adjuntos (nombre, tipo, categoría, `file_path`, referencia a otra entidad).

### 5.13 Chat (`/chat`) — tablas: `chat_rooms`, `chat_room_members`, `chat_messages`
- `POST /chat/rooms`: crea sala (direct/group/announcement) y agrega miembros.
- `POST /chat/rooms/:id/messages`: guarda mensaje; `POST /rooms/:id/read` actualiza `last_read_at`.
- `GET /chat/unread-count`: contador de mensajes no leídos.

### 5.14 Tareas (`/tasks`) — tabla: `tasks`
- CRUD + `PATCH /tasks/:id/move` para el Kanban (orden `board_order`, estados `todo|doing|done`) y `due_date` para el calendario.

### 5.15 Notificaciones (`/notifications`) — tablas: `notifications`, `fcm_tokens`
- En app: guarda filas en `notifications` con `is_read`.
- Push: `POST /notifications/fcm-token` registra el token del dispositivo; el envío usa BullMQ (cola `notifications`) si hay `REDIS_URL`, si no se degrada a envío directo.

### 5.16 Reportes (`/reports`) — lectura agregada
- `GET /reports/dashboard`: KPIs del día (ventas, ticket promedio, etc.).
- `GET /reports/low-stock`: productos con `stock <= min_stock`.
- `GET /reports/sales-by-day`: serie de ventas por día.
- Con `REDIS_URL` disponible, los reportes pueden encolarse en BullMQ (cola `reports`, worker `reports.processor.ts`).

### 5.17 Auditoría (`/audit`) — tabla: `audit_logs`
- `GET /audit`: lista de eventos (quién, qué acción, qué recurso, metadata JSONB, IP, user-agent, cuándo). Solo lectura; la tabla es inmutable.

### 5.18 Búsqueda global (`/search`)
- `GET /search?q=...`: busca repuestos por nombre (índice trigrama) y códigos.

### 5.19 Exportación (`/export`)
- `GET /export/formats`: formatos disponibles.
- `GET /export/:resource`: exporta un recurso (productos, ventas, etc.).

### 5.20 Integraciones / API pública (`/public`, `integrations`)
- `GET /public/products` y `GET /public/status` son accesibles sin autenticación.
- `integrations` guarda `api_key_hash` + `scopes` para integraciones externas.

### 5.21 Salud (`/health`) — público
- `GET /health`, `GET /health/db` (verifica conexión a BD), `GET /health/modules` (estado de los módulos).

---

## 6. Trabajos en segundo plano (BullMQ)

| Cola           | Procesador                     | Uso                              |
|----------------|--------------------------------|----------------------------------|
| `reports`      | `reports.processor.ts`         | Generación asíncrona de reportes |
| `notifications`| `notifications.processor.ts`   | Envío de notificaciones/push     |

Solo se activan si existe `REDIS_URL`; si no, las operaciones se ejecutan en línea (degradación controlada).

---

## 7. Cómo verificar el almacenamiento (consultas útiles)

```bash
PGPASSWORD=repuestos_secret /c/Program\ Files/PostgreSQL/15/bin/psql.exe \
  -U repuestos -h 127.0.0.1 -d repuestos_db
```

```sql
-- Últimas ventas con su detalle
SELECT d.doc_number, d.doc_type, d.customer_name, d.total, d.status, d.created_at
FROM sale_documents d ORDER BY d.id DESC LIMIT 10;

-- Kardex de un producto
SELECT * FROM stock_movements WHERE product_id = <id> ORDER BY created_at DESC;

-- Inventario actual con bajo stock
SELECT sku, name, stock, min_stock FROM products WHERE stock <= min_stock;

-- Auditoría reciente
SELECT user_id, action, resource_type, resource_id, created_at
FROM audit_logs ORDER BY id DESC LIMIT 50;

-- Parámetros globales e historial
SELECT key, value, updated_at FROM settings;
SELECT * FROM settings_history ORDER BY id DESC LIMIT 10;

-- Resumen por módulo (conteo de filas)
SELECT 'users' t, count(*) FROM users
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'stock_movements', count(*) FROM stock_movements
UNION ALL SELECT 'sale_documents', count(*) FROM sale_documents
UNION ALL SELECT 'sale_items', count(*) FROM sale_items
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;
```

---

## 8. Archivos de referencia

| Archivo                        | Contenido                                   |
|--------------------------------|---------------------------------------------|
| `database/schema.sql`          | Tablas base + triggers (auditoría inmutable)|
| `database/schema-erp.sql`      | Tablas ERP (clientes, compras, caja, contab.)|
| `database/seed.sql`            | Datos iniciales (admin, IVA 16%, demo)      |
| `database/migrations/`         | Migraciones recientes (notif, chat, FCM, tareas) |
| `backend/src/modules/`         | Código de los 24 módulos                    |
| `docs/03-base-de-datos.md`     | Documentación de BD (detalle por entidad)   |
| `docs/11-uml.md`               | Diagramas UML                               |
| `docs/13-manual-tecnico.md`    | Manual técnico                              |
| `docs/14-manual-usuario.md`    | Manual de usuario                           |
