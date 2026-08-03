-- Migración: tabla notifications (centro de notificaciones)
-- Fecha: 2026-08-03
-- Ejecutar una vez en bases existentes (PostgreSQL 15/16)

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
