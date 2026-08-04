-- ============================================================================
-- Sistema de Repuestos - Esquema de Base de Datos (PostgreSQL 16)
-- Version: 1.0.0
-- Ejecutar como superusuario:  psql -U postgres -f schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(30)  NOT NULL DEFAULT 'SELLER',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN','SELLER','INVENTORY_MANAGER','MANAGER','AUDITOR'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ----------------------------------------------------------------------------
-- refresh_tokens (sesiones rotativas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id               BIGSERIAL PRIMARY KEY,
    jti              VARCHAR(64)  NOT NULL,
    user_id          BIGINT       NOT NULL,
    token_hash       VARCHAR(255) NOT NULL,
    expires_at       TIMESTAMPTZ  NOT NULL,
    revoked_at       TIMESTAMPTZ,
    replaced_by_jti  VARCHAR(64),
    ip               INET,
    user_agent       VARCHAR(300),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_refresh_jti UNIQUE (jti),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_user    ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_expires ON refresh_tokens (expires_at);

-- ----------------------------------------------------------------------------
-- audit_logs (append-only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT,
    action        VARCHAR(60)  NOT NULL,
    resource_type VARCHAR(60)  NOT NULL,
    resource_id   VARCHAR(60),
    metadata      JSONB,
    ip            INET,
    user_agent    VARCHAR(300),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_logs (created_at);

-- ----------------------------------------------------------------------------
-- settings + settings_history (parámetros versionados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    key         VARCHAR(60) PRIMARY KEY,
    value       JSONB       NOT NULL,
    updated_by  BIGINT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings_history (
    id         BIGSERIAL PRIMARY KEY,
    key        VARCHAR(60)  NOT NULL,
    value      JSONB        NOT NULL,
    changed_by BIGINT,
    changed_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_settings_hist_user FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_hist_key ON settings_history (key, changed_at);

-- ----------------------------------------------------------------------------
-- products (ficha central del repuesto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL PRIMARY KEY,
    sku             VARCHAR(50)  NOT NULL,
    oem_code        VARCHAR(50),
    barcode         VARCHAR(50),
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(80),
    brand           VARCHAR(80),
    unit            VARCHAR(20)  NOT NULL DEFAULT 'uds',
    stock           INTEGER      NOT NULL DEFAULT 0,
    min_stock       INTEGER      NOT NULL DEFAULT 0,
    cost_price      NUMERIC(14,2) NOT NULL DEFAULT 0,
    base_price      NUMERIC(14,2) NOT NULL DEFAULT 0,
    sale_price      NUMERIC(14,2) NOT NULL DEFAULT 0,
    warehouse_aisle VARCHAR(20),
    warehouse_shelf VARCHAR(20),
    warehouse_level VARCHAR(20),
    warehouse_bin   VARCHAR(20),
    image_url       VARCHAR(300),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_products_sku     UNIQUE (sku),
    CONSTRAINT uq_products_oem     UNIQUE (oem_code),
    CONSTRAINT uq_products_barcode UNIQUE (barcode),
    CONSTRAINT ck_products_stock_ge0 CHECK (stock >= 0),
    CONSTRAINT ck_products_prices_ge0 CHECK (cost_price >= 0 AND base_price >= 0 AND sale_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_name     ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_brand    ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_minstock ON products (stock, min_stock);

-- ----------------------------------------------------------------------------
-- product_codes (códigos alternativos multicódigo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_codes (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT      NOT NULL,
    code_type  VARCHAR(20) NOT NULL,
    code_value VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_codes UNIQUE (code_type, code_value),
    CONSTRAINT fk_codes_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT ck_codes_type CHECK (code_type IN ('OEM','BARCODE','SKU_ALT'))
);

CREATE INDEX IF NOT EXISTS idx_product_codes_product ON product_codes (product_id);

-- ----------------------------------------------------------------------------
-- product_compat (compatibilidad de aplicación)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_compat (
    id            BIGSERIAL PRIMARY KEY,
    product_id    BIGINT      NOT NULL,
    vehicle_brand VARCHAR(80) NOT NULL,
    vehicle_model VARCHAR(80) NOT NULL,
    year_from     INTEGER,
    year_to       INTEGER,
    engine_type   VARCHAR(80),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_compat_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT ck_compat_years CHECK (year_from IS NULL OR year_to IS NULL OR year_from <= year_to)
);

CREATE INDEX IF NOT EXISTS idx_compat_product ON product_compat (product_id);
CREATE INDEX IF NOT EXISTS idx_compat_search  ON product_compat (vehicle_brand, vehicle_model);

-- ----------------------------------------------------------------------------
-- stock_movements (Kardex)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
    id             BIGSERIAL PRIMARY KEY,
    product_id     BIGINT       NOT NULL,
    movement_type  VARCHAR(20)  NOT NULL,
    quantity       INTEGER      NOT NULL,
    unit_cost      NUMERIC(14,2) NOT NULL,
    unit_base      NUMERIC(14,2) NOT NULL,
    unit_sale      NUMERIC(14,2) NOT NULL,
    concept        VARCHAR(200),
    reference_type VARCHAR(30),
    reference_id   BIGINT,
    user_id        BIGINT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_moves_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_moves_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_moves_type CHECK (movement_type IN ('PURCHASE','SALE','ADJUST','MERMA','RETURN')),
    CONSTRAINT ck_moves_qty_ne0 CHECK (quantity <> 0)
);

CREATE INDEX IF NOT EXISTS idx_moves_product   ON stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moves_reference ON stock_movements (reference_type, reference_id);

-- ----------------------------------------------------------------------------
-- sale_documents (cabecera de nota/factura)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_documents (
    id            BIGSERIAL PRIMARY KEY,
    doc_type      VARCHAR(20)   NOT NULL,
    doc_number    VARCHAR(30)   NOT NULL,
    customer_name VARCHAR(200)  NOT NULL,
    customer_doc  VARCHAR(30),
    subtotal      NUMERIC(14,2) NOT NULL,
    tax_rate      NUMERIC(5,2)  NOT NULL,
    tax_amount    NUMERIC(14,2) NOT NULL,
    total         NUMERIC(14,2) NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'COMPLETED',
    void_reason   VARCHAR(200),
    user_id       BIGINT        NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_doc_number UNIQUE (doc_number),
    CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_doc_type CHECK (doc_type IN ('NOTA','FACTURA')),
    CONSTRAINT ck_doc_status CHECK (status IN ('COMPLETED','VOIDED')),
    CONSTRAINT ck_doc_total CHECK (total = subtotal + tax_amount)
);

CREATE INDEX IF NOT EXISTS idx_doc_created ON sale_documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_user    ON sale_documents (user_id);

-- ----------------------------------------------------------------------------
-- sale_items (detalle con precios congelados - RF-14)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
    id            BIGSERIAL PRIMARY KEY,
    sale_id       BIGINT        NOT NULL,
    product_id    BIGINT        NOT NULL,
    product_sku   VARCHAR(50)   NOT NULL,
    product_name  VARCHAR(200)  NOT NULL,
    quantity      INTEGER       NOT NULL,
    unit_cost     NUMERIC(14,2) NOT NULL,
    unit_base     NUMERIC(14,2) NOT NULL,
    unit_sale     NUMERIC(14,2) NOT NULL,
    tax_rate      NUMERIC(5,2)  NOT NULL,
    tax_amount    NUMERIC(14,2) NOT NULL,
    line_total    NUMERIC(14,2) NOT NULL,
    CONSTRAINT fk_items_sale    FOREIGN KEY (sale_id)    REFERENCES sale_documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT ck_items_qty_gt0 CHECK (quantity > 0),
    CONSTRAINT ck_items_line_total CHECK (line_total = quantity * unit_sale)
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items (product_id);

-- ----------------------------------------------------------------------------
-- notifications (centro de notificaciones en tiempo real)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    type       VARCHAR(30)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    VARCHAR(500),
    data       JSONB,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read, created_at DESC);

-- ============================================================================
-- Push notifications (Firebase Cloud Messaging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token       TEXT         NOT NULL,
    device      VARCHAR(200),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_fcm_tokens_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON fcm_tokens (user_id);

-- ============================================================================
-- Chat interno
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(20)  NOT NULL DEFAULT 'direct',  -- direct | group | announcement
    name        VARCHAR(150),
    created_by  BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_chat_rooms_type CHECK (type IN ('direct','group','announcement'))
);

CREATE TABLE IF NOT EXISTS chat_room_members (
    room_id      BIGINT       NOT NULL REFERENCES chat_rooms (id) ON DELETE CASCADE,
    user_id      BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_room_members (user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id         BIGSERIAL PRIMARY KEY,
    room_id    BIGINT        NOT NULL REFERENCES chat_rooms (id) ON DELETE CASCADE,
    sender_id  BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content    VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room_id, id);

-- ============================================================================
-- Tareas (Kanban + Calendario)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'todo',   -- todo | doing | done
    priority    VARCHAR(10)  NOT NULL DEFAULT 'medium', -- low | medium | high
    assignee_id BIGINT       REFERENCES users (id) ON DELETE SET NULL,
    due_date    DATE,
    board_order INT          NOT NULL DEFAULT 0,
    created_by  BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_tasks_status   CHECK (status IN ('todo','doing','done')),
    CONSTRAINT ck_tasks_priority CHECK (priority IN ('low','medium','high'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- 1) updated_at automático en products y users
CREATE OR REPLACE FUNCTION fn_set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 2) auditoría append-only: prohibir UPDATE/DELETE
CREATE OR REPLACE FUNCTION fn_block_audit_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs es append-only: no se permite modificar o eliminar registros';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_no_update ON audit_logs;
CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION fn_block_audit_mutation();
