-- ============================================================================
-- Migración 20260804: Chat interno (salas, miembros y mensajes)
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
