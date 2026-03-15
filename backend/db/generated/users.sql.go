package db

import (
	"context"
	"time"

	"github.com/google/uuid"
)

const getUserByID = `-- name: GetUserByID :one
SELECT id, email, name, avatar_url, google_id, password_hash, auth_provider, created_at, updated_at, last_login_at FROM users WHERE id = $1`

func (q *Queries) GetUserByID(ctx context.Context, id uuid.UUID) (User, error) {
	row := q.db.QueryRow(ctx, getUserByID, id)
	var u User
	err := row.Scan(
		&u.ID,
		&u.Email,
		&u.Name,
		&u.AvatarUrl,
		&u.GoogleID,
		&u.PasswordHash,
		&u.AuthProvider,
		&u.CreatedAt,
		&u.UpdatedAt,
		&u.LastLoginAt,
	)
	return u, err
}

const getUserByEmail = `-- name: GetUserByEmail :one
SELECT id, email, name, avatar_url, google_id, password_hash, auth_provider, created_at, updated_at, last_login_at FROM users WHERE email = $1`

func (q *Queries) GetUserByEmail(ctx context.Context, email string) (User, error) {
	row := q.db.QueryRow(ctx, getUserByEmail, email)
	var u User
	err := row.Scan(
		&u.ID,
		&u.Email,
		&u.Name,
		&u.AvatarUrl,
		&u.GoogleID,
		&u.PasswordHash,
		&u.AuthProvider,
		&u.CreatedAt,
		&u.UpdatedAt,
		&u.LastLoginAt,
	)
	return u, err
}

const getUserByGoogleID = `-- name: GetUserByGoogleID :one
SELECT id, email, name, avatar_url, google_id, password_hash, auth_provider, created_at, updated_at, last_login_at FROM users WHERE google_id = $1`

func (q *Queries) GetUserByGoogleID(ctx context.Context, googleID string) (User, error) {
	row := q.db.QueryRow(ctx, getUserByGoogleID, googleID)
	var u User
	err := row.Scan(
		&u.ID,
		&u.Email,
		&u.Name,
		&u.AvatarUrl,
		&u.GoogleID,
		&u.PasswordHash,
		&u.AuthProvider,
		&u.CreatedAt,
		&u.UpdatedAt,
		&u.LastLoginAt,
	)
	return u, err
}

type CreateUserParams struct {
	Email        string
	Name         string
	AvatarUrl    *string
	GoogleID     *string
	PasswordHash *string
	AuthProvider string
}

const createUser = `-- name: CreateUser :one
INSERT INTO users (email, name, avatar_url, google_id, password_hash, auth_provider)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, email, name, avatar_url, google_id, password_hash, auth_provider, created_at, updated_at, last_login_at`

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, createUser,
		arg.Email,
		arg.Name,
		arg.AvatarUrl,
		arg.GoogleID,
		arg.PasswordHash,
		arg.AuthProvider,
	)
	var u User
	err := row.Scan(
		&u.ID,
		&u.Email,
		&u.Name,
		&u.AvatarUrl,
		&u.GoogleID,
		&u.PasswordHash,
		&u.AuthProvider,
		&u.CreatedAt,
		&u.UpdatedAt,
		&u.LastLoginAt,
	)
	return u, err
}

const updateUserLastLogin = `-- name: UpdateUserLastLogin :exec
UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`

func (q *Queries) UpdateUserLastLogin(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, updateUserLastLogin, id)
	return err
}

const updateUserPassword = `-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`

func (q *Queries) UpdateUserPassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	_, err := q.db.Exec(ctx, updateUserPassword, id, passwordHash)
	return err
}

type CreateRefreshTokenParams struct {
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
}

const createRefreshToken = `-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id, user_id, token_hash, expires_at, created_at`

func (q *Queries) CreateRefreshToken(ctx context.Context, arg CreateRefreshTokenParams) (RefreshToken, error) {
	row := q.db.QueryRow(ctx, createRefreshToken, arg.UserID, arg.TokenHash, arg.ExpiresAt)
	var rt RefreshToken
	err := row.Scan(
		&rt.ID,
		&rt.UserID,
		&rt.TokenHash,
		&rt.ExpiresAt,
		&rt.CreatedAt,
	)
	return rt, err
}

const getRefreshToken = `-- name: GetRefreshToken :one
SELECT id, user_id, token_hash, expires_at, created_at FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`

func (q *Queries) GetRefreshToken(ctx context.Context, tokenHash string) (RefreshToken, error) {
	row := q.db.QueryRow(ctx, getRefreshToken, tokenHash)
	var rt RefreshToken
	err := row.Scan(
		&rt.ID,
		&rt.UserID,
		&rt.TokenHash,
		&rt.ExpiresAt,
		&rt.CreatedAt,
	)
	return rt, err
}

const deleteRefreshToken = `-- name: DeleteRefreshToken :exec
DELETE FROM refresh_tokens WHERE token_hash = $1`

func (q *Queries) DeleteRefreshToken(ctx context.Context, tokenHash string) error {
	_, err := q.db.Exec(ctx, deleteRefreshToken, tokenHash)
	return err
}

const deleteUserRefreshTokens = `-- name: DeleteUserRefreshTokens :exec
DELETE FROM refresh_tokens WHERE user_id = $1`

func (q *Queries) DeleteUserRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	_, err := q.db.Exec(ctx, deleteUserRefreshTokens, userID)
	return err
}
