-- ============================================================================
-- Migración 20260808: Procedencia (origen) en products
-- Idempotente: agrega la columna `provenance` si no existe y crea su índice.
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS provenance VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_products_provenance ON products (provenance);
