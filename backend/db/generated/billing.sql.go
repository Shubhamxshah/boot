package db

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ──────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────

type UserCredits struct {
	UserID    uuid.UUID `json:"user_id"`
	Balance   int64     `json:"balance"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreditTransaction struct {
	ID                uuid.UUID   `json:"id"`
	UserID            uuid.UUID   `json:"user_id"`
	Type              string      `json:"type"`
	Amount            int64       `json:"amount"`
	BalanceAfter      int64       `json:"balance_after"`
	Description       string      `json:"description"`
	SessionID         pgtype.UUID `json:"session_id"`
	RazorpayOrderID   pgtype.Text `json:"razorpay_order_id"`
	RazorpayPaymentID pgtype.Text `json:"razorpay_payment_id"`
	CreatedAt         time.Time   `json:"created_at"`
}

type UserAppSettings struct {
	UserID      uuid.UUID `json:"user_id"`
	AppID       string    `json:"app_id"`
	CPUCores    float64   `json:"cpu_cores"`
	MemoryGB    int32     `json:"memory_gb"`
	GPUEnabled  bool      `json:"gpu_enabled"`
	IdleMinutes int32     `json:"idle_minutes"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PaymentOrder struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	RazorpayOrderID string    `json:"razorpay_order_id"`
	AmountCents     int32     `json:"amount_cents"`
	Credits         int64     `json:"credits"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// ActiveSessionForBilling is a lightweight projection used by the billing worker.
type ActiveSessionForBilling struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	CPUCores   float64   `json:"cpu_cores"`
	MemoryGB   int32     `json:"memory_gb"`
	GPUEnabled bool      `json:"gpu_enabled"`
}

// ──────────────────────────────────────────────
// Params
// ──────────────────────────────────────────────

type DeductCreditsParams struct {
	UserID uuid.UUID
	Amount int64
}

type AddCreditsParams struct {
	UserID uuid.UUID
	Amount int64
}

type CreateCreditTransactionParams struct {
	UserID            uuid.UUID
	Type              string
	Amount            int64
	BalanceAfter      int64
	Description       string
	SessionID         pgtype.UUID
	RazorpayOrderID   pgtype.Text
	RazorpayPaymentID pgtype.Text
}

type GetUserTransactionsParams struct {
	UserID uuid.UUID
	Limit  int32
	Offset int32
}

type UpsertUserAppSettingsParams struct {
	UserID      uuid.UUID
	AppID       string
	CPUCores    float64
	MemoryGB    int32
	GPUEnabled  bool
	IdleMinutes int32
}

type GetUserAppSettingsParams struct {
	UserID uuid.UUID
	AppID  string
}

type CreatePaymentOrderParams struct {
	UserID          uuid.UUID
	RazorpayOrderID string
	AmountCents     int32
	Credits         int64
}

type UpdatePaymentOrderStatusParams struct {
	RazorpayOrderID string
	Status          string
}

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

const getOrCreateUserCredits = `-- name: GetOrCreateUserCredits :one
INSERT INTO user_credits (user_id, balance)
VALUES ($1, 0)
ON CONFLICT (user_id) DO UPDATE SET balance = user_credits.balance
RETURNING user_id, balance, updated_at`

func (q *Queries) GetOrCreateUserCredits(ctx context.Context, userID uuid.UUID) (UserCredits, error) {
	row := q.db.QueryRow(ctx, getOrCreateUserCredits, userID)
	var uc UserCredits
	err := row.Scan(&uc.UserID, &uc.Balance, &uc.UpdatedAt)
	return uc, err
}

const insertUserCreditsIfNew = `-- name: InsertUserCreditsIfNew :one
INSERT INTO user_credits (user_id, balance)
VALUES ($1, 0)
ON CONFLICT (user_id) DO NOTHING
RETURNING user_id, balance, updated_at`

// InsertUserCreditsIfNew inserts a zero-balance credits row only when no row exists yet.
// Returns pgx.ErrNoRows if the user already has a credits record (conflict).
func (q *Queries) InsertUserCreditsIfNew(ctx context.Context, userID uuid.UUID) (UserCredits, error) {
	row := q.db.QueryRow(ctx, insertUserCreditsIfNew, userID)
	var uc UserCredits
	err := row.Scan(&uc.UserID, &uc.Balance, &uc.UpdatedAt)
	return uc, err
}

const deductCredits = `-- name: DeductCredits :one
UPDATE user_credits
SET balance = balance - $2, updated_at = NOW()
WHERE user_id = $1 AND balance >= $2
RETURNING user_id, balance, updated_at`

func (q *Queries) DeductCredits(ctx context.Context, arg DeductCreditsParams) (UserCredits, error) {
	row := q.db.QueryRow(ctx, deductCredits, arg.UserID, arg.Amount)
	var uc UserCredits
	err := row.Scan(&uc.UserID, &uc.Balance, &uc.UpdatedAt)
	return uc, err
}

const addCredits = `-- name: AddCredits :one
UPDATE user_credits
SET balance = balance + $2, updated_at = NOW()
WHERE user_id = $1
RETURNING user_id, balance, updated_at`

func (q *Queries) AddCredits(ctx context.Context, arg AddCreditsParams) (UserCredits, error) {
	row := q.db.QueryRow(ctx, addCredits, arg.UserID, arg.Amount)
	var uc UserCredits
	err := row.Scan(&uc.UserID, &uc.Balance, &uc.UpdatedAt)
	return uc, err
}

const createCreditTransaction = `-- name: CreateCreditTransaction :one
INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, session_id, razorpay_order_id, razorpay_payment_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, user_id, type, amount, balance_after, description, session_id, razorpay_order_id, razorpay_payment_id, created_at`

func (q *Queries) CreateCreditTransaction(ctx context.Context, arg CreateCreditTransactionParams) (CreditTransaction, error) {
	row := q.db.QueryRow(ctx, createCreditTransaction,
		arg.UserID,
		arg.Type,
		arg.Amount,
		arg.BalanceAfter,
		arg.Description,
		arg.SessionID,
		arg.RazorpayOrderID,
		arg.RazorpayPaymentID,
	)
	var ct CreditTransaction
	err := row.Scan(
		&ct.ID,
		&ct.UserID,
		&ct.Type,
		&ct.Amount,
		&ct.BalanceAfter,
		&ct.Description,
		&ct.SessionID,
		&ct.RazorpayOrderID,
		&ct.RazorpayPaymentID,
		&ct.CreatedAt,
	)
	return ct, err
}

const getUserTransactions = `-- name: GetUserTransactions :many
SELECT id, user_id, type, amount, balance_after, description, session_id, razorpay_order_id, razorpay_payment_id, created_at
FROM credit_transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3`

func (q *Queries) GetUserTransactions(ctx context.Context, arg GetUserTransactionsParams) ([]CreditTransaction, error) {
	rows, err := q.db.Query(ctx, getUserTransactions, arg.UserID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txns []CreditTransaction
	for rows.Next() {
		var ct CreditTransaction
		if err := rows.Scan(
			&ct.ID,
			&ct.UserID,
			&ct.Type,
			&ct.Amount,
			&ct.BalanceAfter,
			&ct.Description,
			&ct.SessionID,
			&ct.RazorpayOrderID,
			&ct.RazorpayPaymentID,
			&ct.CreatedAt,
		); err != nil {
			return nil, err
		}
		txns = append(txns, ct)
	}
	return txns, rows.Err()
}

const getActiveSessionsForBilling = `-- name: GetActiveSessionsForBilling :many
SELECT id, user_id, cpu_cores, memory_gb, gpu_enabled
FROM sessions
WHERE status = 'ready'`

func (q *Queries) GetActiveSessionsForBilling(ctx context.Context) ([]ActiveSessionForBilling, error) {
	rows, err := q.db.Query(ctx, getActiveSessionsForBilling)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []ActiveSessionForBilling
	for rows.Next() {
		var s ActiveSessionForBilling
		if err := rows.Scan(&s.ID, &s.UserID, &s.CPUCores, &s.MemoryGB, &s.GPUEnabled); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

const upsertUserAppSettings = `-- name: UpsertUserAppSettings :one
INSERT INTO user_app_settings (user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id, app_id) DO UPDATE SET
    cpu_cores    = EXCLUDED.cpu_cores,
    memory_gb    = EXCLUDED.memory_gb,
    gpu_enabled  = EXCLUDED.gpu_enabled,
    idle_minutes = EXCLUDED.idle_minutes,
    updated_at   = NOW()
RETURNING user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes, updated_at`

func (q *Queries) UpsertUserAppSettings(ctx context.Context, arg UpsertUserAppSettingsParams) (UserAppSettings, error) {
	row := q.db.QueryRow(ctx, upsertUserAppSettings,
		arg.UserID,
		arg.AppID,
		arg.CPUCores,
		arg.MemoryGB,
		arg.GPUEnabled,
		arg.IdleMinutes,
	)
	var s UserAppSettings
	err := row.Scan(&s.UserID, &s.AppID, &s.CPUCores, &s.MemoryGB, &s.GPUEnabled, &s.IdleMinutes, &s.UpdatedAt)
	return s, err
}

const getUserAppSettings = `-- name: GetUserAppSettings :one
SELECT user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes, updated_at
FROM user_app_settings
WHERE user_id = $1 AND app_id = $2`

func (q *Queries) GetUserAppSettings(ctx context.Context, arg GetUserAppSettingsParams) (UserAppSettings, error) {
	row := q.db.QueryRow(ctx, getUserAppSettings, arg.UserID, arg.AppID)
	var s UserAppSettings
	err := row.Scan(&s.UserID, &s.AppID, &s.CPUCores, &s.MemoryGB, &s.GPUEnabled, &s.IdleMinutes, &s.UpdatedAt)
	return s, err
}

const createPaymentOrder = `-- name: CreatePaymentOrder :one
INSERT INTO payment_orders (user_id, razorpay_order_id, amount_cents, credits)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, razorpay_order_id, amount_cents, credits, status, created_at, updated_at`

func (q *Queries) CreatePaymentOrder(ctx context.Context, arg CreatePaymentOrderParams) (PaymentOrder, error) {
	row := q.db.QueryRow(ctx, createPaymentOrder, arg.UserID, arg.RazorpayOrderID, arg.AmountCents, arg.Credits)
	var o PaymentOrder
	err := row.Scan(&o.ID, &o.UserID, &o.RazorpayOrderID, &o.AmountCents, &o.Credits, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	return o, err
}

const getPaymentOrder = `-- name: GetPaymentOrder :one
SELECT id, user_id, razorpay_order_id, amount_cents, credits, status, created_at, updated_at
FROM payment_orders
WHERE razorpay_order_id = $1`

func (q *Queries) GetPaymentOrder(ctx context.Context, razorpayOrderID string) (PaymentOrder, error) {
	row := q.db.QueryRow(ctx, getPaymentOrder, razorpayOrderID)
	var o PaymentOrder
	err := row.Scan(&o.ID, &o.UserID, &o.RazorpayOrderID, &o.AmountCents, &o.Credits, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	return o, err
}

const updatePaymentOrderStatus = `-- name: UpdatePaymentOrderStatus :one
UPDATE payment_orders
SET status = $2, updated_at = NOW()
WHERE razorpay_order_id = $1
RETURNING id, user_id, razorpay_order_id, amount_cents, credits, status, created_at, updated_at`

func (q *Queries) UpdatePaymentOrderStatus(ctx context.Context, arg UpdatePaymentOrderStatusParams) (PaymentOrder, error) {
	row := q.db.QueryRow(ctx, updatePaymentOrderStatus, arg.RazorpayOrderID, arg.Status)
	var o PaymentOrder
	err := row.Scan(&o.ID, &o.UserID, &o.RazorpayOrderID, &o.AmountCents, &o.Credits, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	return o, err
}
