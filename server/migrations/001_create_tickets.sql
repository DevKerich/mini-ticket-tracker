-- Status and priority are stored as text guarded by CHECK constraints rather
-- than native Postgres ENUM types: adding/removing a value later is a simple
-- constraint swap instead of an ALTER TYPE dance.
CREATE TABLE tickets (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'closed')),
    priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supports the main list query: optional status filter, newest first.
CREATE INDEX tickets_status_created_at_idx ON tickets (status, created_at DESC);
CREATE INDEX tickets_created_at_idx ON tickets (created_at DESC);
