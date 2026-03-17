-- +goose Up

CREATE TABLE user_credits (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance     BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_transactions (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                 TEXT NOT NULL,
    amount               BIGINT NOT NULL,
    balance_after        BIGINT NOT NULL,
    description          TEXT NOT NULL DEFAULT '',
    session_id           UUID REFERENCES sessions(id) ON DELETE SET NULL,
    razorpay_order_id    TEXT,
    razorpay_payment_id  TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_app_settings (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_id       TEXT NOT NULL,
    cpu_cores    FLOAT NOT NULL DEFAULT 2,
    memory_gb    INTEGER NOT NULL DEFAULT 2,
    gpu_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    idle_minutes INTEGER NOT NULL DEFAULT 5,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, app_id)
);

CREATE TABLE payment_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    razorpay_order_id   TEXT UNIQUE NOT NULL,
    amount_cents        INTEGER NOT NULL,
    credits             BIGINT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_razorpay_order_id ON payment_orders(razorpay_order_id);

-- +goose Down

DROP INDEX IF EXISTS idx_payment_orders_razorpay_order_id;
DROP INDEX IF EXISTS idx_payment_orders_user_id;
DROP INDEX IF EXISTS idx_credit_transactions_user_id;
DROP TABLE IF EXISTS payment_orders;
DROP TABLE IF EXISTS user_app_settings;
DROP TABLE IF EXISTS credit_transactions;
DROP TABLE IF EXISTS user_credits;
