-- ============================================================================
-- Sistema de Repuestos / ERP - Migración de módulos ampliados (PostgreSQL 16)
-- Version: 1.1.0 (Addendum ERP: customers, suppliers, purchases, cash, accounting,
--          hr, documents, banking, integrations)
-- Ejecutar DESPUÉS de schema.sql base.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- customers (Clientes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(30)  NOT NULL,
    name            VARCHAR(200) NOT NULL,
    document_type   VARCHAR(10),
    document_number VARCHAR(30),
    email           VARCHAR(150),
    phone           VARCHAR(30),
    address         VARCHAR(255),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_customers_code UNIQUE (code)
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_doc  ON customers (document_number);

-- ----------------------------------------------------------------------------
-- suppliers (Proveedores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(30)  NOT NULL,
    name       VARCHAR(200) NOT NULL,
    tax_id     VARCHAR(30),
    email      VARCHAR(150),
    phone      VARCHAR(30),
    address    VARCHAR(255),
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_suppliers_code UNIQUE (code)
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);

-- ----------------------------------------------------------------------------
-- purchase_documents + purchase_items (Compras)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_documents (
    id            BIGSERIAL PRIMARY KEY,
    doc_number    VARCHAR(30)   NOT NULL,
    supplier_id   BIGINT        NOT NULL,
    supplier_name VARCHAR(200)  NOT NULL,
    invoice_number VARCHAR(50),
    subtotal      NUMERIC(14,2) NOT NULL,
    tax_rate      NUMERIC(5,2)  NOT NULL,
    tax_amount    NUMERIC(14,2) NOT NULL,
    total         NUMERIC(14,2) NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'RECEIVED',
    void_reason   VARCHAR(200),
    user_id       BIGINT        NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_purchase_doc_number UNIQUE (doc_number),
    CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    CONSTRAINT fk_purchase_user      FOREIGN KEY (user_id)     REFERENCES users (id),
    CONSTRAINT ck_purchase_status    CHECK (status IN ('RECEIVED','VOIDED'))
);
CREATE INDEX IF NOT EXISTS idx_purchase_doc_created ON purchase_documents (created_at DESC);

CREATE TABLE IF NOT EXISTS purchase_items (
    id            BIGSERIAL PRIMARY KEY,
    purchase_id   BIGINT        NOT NULL,
    product_id    BIGINT        NOT NULL,
    product_sku   VARCHAR(50)   NOT NULL,
    product_name  VARCHAR(200)  NOT NULL,
    quantity      INTEGER       NOT NULL CHECK (quantity > 0),
    unit_cost     NUMERIC(14,2) NOT NULL,
    line_total    NUMERIC(14,2) NOT NULL,
    CONSTRAINT fk_purchase_items_doc    FOREIGN KEY (purchase_id) REFERENCES purchase_documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items (purchase_id);

-- ----------------------------------------------------------------------------
-- cash_registers + cash_movements (Caja)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_registers (
    id              BIGSERIAL PRIMARY KEY,
    opened_by       BIGINT        NOT NULL,
    initial_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    expected        NUMERIC(14,2) NOT NULL DEFAULT 0,
    counted_amount  NUMERIC(14,2),
    difference      NUMERIC(14,2),
    status          VARCHAR(10)   NOT NULL DEFAULT 'OPEN',
    closed_by       BIGINT,
    closed_at       TIMESTAMPTZ,
    opened_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_cash_opener FOREIGN KEY (opened_by) REFERENCES users (id),
    CONSTRAINT ck_cash_status CHECK (status IN ('OPEN','CLOSED'))
);
CREATE INDEX IF NOT EXISTS idx_cash_status ON cash_registers (opened_by, status);

CREATE TABLE IF NOT EXISTS cash_movements (
    id             BIGSERIAL PRIMARY KEY,
    register_id    BIGINT        NOT NULL,
    movement_type  VARCHAR(15)   NOT NULL,
    amount         NUMERIC(14,2) NOT NULL,
    description    VARCHAR(200),
    reference_type VARCHAR(30),
    reference_id   BIGINT,
    user_id        BIGINT        NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_cash_mov_register FOREIGN KEY (register_id) REFERENCES cash_registers (id) ON DELETE CASCADE,
    CONSTRAINT fk_cash_mov_user     FOREIGN KEY (user_id)     REFERENCES users (id),
    CONSTRAINT ck_cash_mov_type     CHECK (movement_type IN ('INCOME','EXPENSE','DEPOSIT','WITHDRAWAL'))
);
CREATE INDEX IF NOT EXISTS idx_cash_mov_register ON cash_movements (register_id);

-- ----------------------------------------------------------------------------
-- chart_of_accounts + journal_entries + journal_lines (Contabilidad)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL,
    name       VARCHAR(150) NOT NULL,
    type       VARCHAR(15)  NOT NULL,
    parent_id  BIGINT,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_account_code UNIQUE (code),
    CONSTRAINT ck_account_type CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
    CONSTRAINT fk_account_parent FOREIGN KEY (parent_id) REFERENCES chart_of_accounts (id)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id             BIGSERIAL PRIMARY KEY,
    entry_number   VARCHAR(30) NOT NULL,
    date           DATE        NOT NULL,
    description    VARCHAR(255),
    reference_type VARCHAR(30),
    reference_id   BIGINT,
    created_by     BIGINT      NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_journal_entry_number UNIQUE (entry_number),
    CONSTRAINT fk_journal_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries (date);

CREATE TABLE IF NOT EXISTS journal_lines (
    id         BIGSERIAL PRIMARY KEY,
    entry_id   BIGINT        NOT NULL,
    account_id BIGINT        NOT NULL,
    debit      NUMERIC(14,2) NOT NULL DEFAULT 0,
    credit     NUMERIC(14,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_journal_lines_entry   FOREIGN KEY (entry_id)   REFERENCES journal_entries (id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_lines_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts (id),
    CONSTRAINT ck_journal_lines_debit  CHECK (debit >= 0),
    CONSTRAINT ck_journal_lines_credit CHECK (credit >= 0)
);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines (entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines (account_id);

-- ----------------------------------------------------------------------------
-- employees (RR.HH.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(30)   NOT NULL,
    full_name       VARCHAR(150)  NOT NULL,
    document_number VARCHAR(30),
    position        VARCHAR(80),
    department      VARCHAR(80),
    phone           VARCHAR(30),
    email           VARCHAR(150),
    hire_date       DATE,
    salary          NUMERIC(12,2),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_employees_code UNIQUE (code)
);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (full_name);

-- ----------------------------------------------------------------------------
-- documents (Gestión documental)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    file_type      VARCHAR(20)  NOT NULL DEFAULT 'OTHER',
    category       VARCHAR(80),
    file_path      VARCHAR(500),
    reference_type VARCHAR(30),
    reference_id   BIGINT,
    uploaded_by    BIGINT,
    notes          VARCHAR(500),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_document_uploader FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents (category);

-- ----------------------------------------------------------------------------
-- bank_accounts + bank_movements (Bancos / Tesorería)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_accounts (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150)   NOT NULL,
    bank           VARCHAR(100)   NOT NULL,
    account_type   VARCHAR(15)    NOT NULL DEFAULT 'SAVINGS',
    account_number VARCHAR(50),
    currency       VARCHAR(10)    NOT NULL DEFAULT 'BOB',
    balance        NUMERIC(16,2)  NOT NULL DEFAULT 0,
    is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank ON bank_accounts (bank);

CREATE TABLE IF NOT EXISTS bank_movements (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT        NOT NULL,
    movement_type VARCHAR(15)   NOT NULL,
    amount        NUMERIC(16,2) NOT NULL,
    description   VARCHAR(200),
    user_id       BIGINT        NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_bank_mov_account FOREIGN KEY (account_id) REFERENCES bank_accounts (id),
    CONSTRAINT fk_bank_mov_user    FOREIGN KEY (user_id)    REFERENCES users (id),
    CONSTRAINT ck_bank_mov_type    CHECK (movement_type IN ('DEPOSIT','WITHDRAWAL','TRANSFER_IN','TRANSFER_OUT'))
);
CREATE INDEX IF NOT EXISTS idx_bank_mov_account ON bank_movements (account_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- integrations (API keys para integraciones externas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    api_key_hash  VARCHAR(255)  NOT NULL,
    scopes        VARCHAR(255)  NOT NULL DEFAULT 'read',
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    last_used_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_integrations_name UNIQUE (name)
);
