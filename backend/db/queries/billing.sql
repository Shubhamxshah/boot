-- name: GetOrCreateUserCredits :one
INSERT INTO user_credits (user_id, balance)
VALUES ($1, 0)
ON CONFLICT (user_id) DO UPDATE SET balance = user_credits.balance
RETURNING user_id, balance, updated_at;

-- name: InsertUserCreditsIfNew :one
INSERT INTO user_credits (user_id, balance)
VALUES ($1, 0)
ON CONFLICT (user_id) DO NOTHING
RETURNING user_id, balance, updated_at;

-- name: DeductCredits :one
UPDATE user_credits
SET balance = balance - $2, updated_at = NOW()
WHERE user_id = $1 AND balance >= $2
RETURNING user_id, balance, updated_at;

-- name: AddCredits :one
UPDATE user_credits
SET balance = balance + $2, updated_at = NOW()
WHERE user_id = $1
RETURNING user_id, balance, updated_at;

-- name: CreateCreditTransaction :one
INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, session_id, razorpay_order_id, razorpay_payment_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, user_id, type, amount, balance_after, description, session_id, razorpay_order_id, razorpay_payment_id, created_at;

-- name: GetUserTransactions :many
SELECT id, user_id, type, amount, balance_after, description, session_id, razorpay_order_id, razorpay_payment_id, created_at
FROM credit_transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetActiveSessionsForBilling :many
SELECT id, user_id, cpu_cores, memory_gb, gpu_enabled
FROM sessions
WHERE status = 'ready';

-- name: UpsertUserAppSettings :one
INSERT INTO user_app_settings (user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id, app_id) DO UPDATE SET
    cpu_cores    = EXCLUDED.cpu_cores,
    memory_gb    = EXCLUDED.memory_gb,
    gpu_enabled  = EXCLUDED.gpu_enabled,
    idle_minutes = EXCLUDED.idle_minutes,
    updated_at   = NOW()
RETURNING user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes, updated_at;

-- name: GetUserAppSettings :one
SELECT user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes, updated_at
FROM user_app_settings
WHERE user_id = $1 AND app_id = $2;

-- name: CreatePaymentOrder :one
INSERT INTO payment_orders (user_id, razorpay_order_id, amount_cents, credits)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, razorpay_order_id, amount_cents, credits, status, created_at, updated_at;

-- name: GetPaymentOrder :one
SELECT id, user_id, razorpay_order_id, amount_cents, credits, status, created_at, updated_at
FROM payment_orders
WHERE razorpay_order_id = $1;

-- name: UpdatePaymentOrderStatus :one
UPDATE payment_orders
SET status = $2, updated_at = NOW()
WHERE razorpay_order_id = $1
RETURNING id, user_id, razorpay_order_id, amount_cents, credits, status, created_at, updated_at;
