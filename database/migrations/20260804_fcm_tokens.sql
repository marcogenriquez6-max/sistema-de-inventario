-- ============================================================================
-- Migración: tokens de push notifications (Firebase Cloud Messaging)
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
