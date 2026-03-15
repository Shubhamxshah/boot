-- +goose Up

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    avatar_url      TEXT,
    google_id       TEXT UNIQUE,
    password_hash   TEXT,
    auth_provider   TEXT NOT NULL DEFAULT 'google',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_id          TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'starting',
    container_id    TEXT,
    pod_name        TEXT,
    node_port       INTEGER,
    vnc_url         TEXT,
    cpu_cores       FLOAT NOT NULL DEFAULT 2,
    memory_gb       INTEGER NOT NULL DEFAULT 2,
    gpu_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    idle_minutes    INTEGER NOT NULL DEFAULT 5,
    startup_boost   INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stopped_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_last_heartbeat ON sessions(last_heartbeat);

-- +goose Down
DROP INDEX idx_sessions_last_heartbeat;
DROP INDEX idx_sessions_status;
DROP INDEX idx_sessions_user_id;
DROP TABLE sessions;
DROP TABLE refresh_tokens;
DROP TABLE users;
