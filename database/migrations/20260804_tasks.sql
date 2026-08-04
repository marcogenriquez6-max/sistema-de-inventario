-- ============================================================================
-- Migración 20260804: Tareas (tablero Kanban + calendario)
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
