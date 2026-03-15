package db

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type CreateSessionParams struct {
	UserID       uuid.UUID
	AppID        string
	CpuCores     float64
	MemoryGb     int32
	GpuEnabled   bool
	IdleMinutes  int32
	StartupBoost int32
}

const createSession = `-- name: CreateSession :one
INSERT INTO sessions (user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, user_id, app_id, status, container_id, pod_name, node_port, vnc_url, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost, error_message, created_at, updated_at, last_heartbeat, stopped_at`

func (q *Queries) CreateSession(ctx context.Context, arg CreateSessionParams) (Session, error) {
	row := q.db.QueryRow(ctx, createSession,
		arg.UserID,
		arg.AppID,
		arg.CpuCores,
		arg.MemoryGb,
		arg.GpuEnabled,
		arg.IdleMinutes,
		arg.StartupBoost,
	)
	return scanSession(row)
}

const getSessionByID = `-- name: GetSessionByID :one
SELECT id, user_id, app_id, status, container_id, pod_name, node_port, vnc_url, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost, error_message, created_at, updated_at, last_heartbeat, stopped_at FROM sessions WHERE id = $1`

func (q *Queries) GetSessionByID(ctx context.Context, id uuid.UUID) (Session, error) {
	row := q.db.QueryRow(ctx, getSessionByID, id)
	return scanSession(row)
}

const getUserActiveSessions = `-- name: GetUserActiveSessions :many
SELECT id, user_id, app_id, status, container_id, pod_name, node_port, vnc_url, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost, error_message, created_at, updated_at, last_heartbeat, stopped_at FROM sessions
WHERE user_id = $1 AND status NOT IN ('stopped', 'error')
ORDER BY created_at DESC`

func (q *Queries) GetUserActiveSessions(ctx context.Context, userID uuid.UUID) ([]Session, error) {
	rows, err := q.db.Query(ctx, getUserActiveSessions, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		s, err := scanSessionRow(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

type UpdateSessionStatusParams struct {
	ID     uuid.UUID
	Status string
}

const updateSessionStatus = `-- name: UpdateSessionStatus :one
UPDATE sessions
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, user_id, app_id, status, container_id, pod_name, node_port, vnc_url, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost, error_message, created_at, updated_at, last_heartbeat, stopped_at`

func (q *Queries) UpdateSessionStatus(ctx context.Context, arg UpdateSessionStatusParams) (Session, error) {
	row := q.db.QueryRow(ctx, updateSessionStatus, arg.ID, arg.Status)
	return scanSession(row)
}

type UpdateSessionReadyParams struct {
	ID          uuid.UUID
	ContainerID pgtype.Text
	PodName     pgtype.Text
	NodePort    pgtype.Int4
	VncUrl      pgtype.Text
}

const updateSessionReady = `-- name: UpdateSessionReady :one
UPDATE sessions
SET status = 'ready', container_id = $2, pod_name = $3,
    node_port = $4, vnc_url = $5, updated_at = NOW()
WHERE id = $1
RETURNING id, user_id, app_id, status, container_id, pod_name, node_port, vnc_url, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost, error_message, created_at, updated_at, last_heartbeat, stopped_at`

func (q *Queries) UpdateSessionReady(ctx context.Context, arg UpdateSessionReadyParams) (Session, error) {
	row := q.db.QueryRow(ctx, updateSessionReady,
		arg.ID,
		arg.ContainerID,
		arg.PodName,
		arg.NodePort,
		arg.VncUrl,
	)
	return scanSession(row)
}

const updateSessionHeartbeat = `-- name: UpdateSessionHeartbeat :exec
UPDATE sessions
SET last_heartbeat = NOW(), status = 'ready', updated_at = NOW()
WHERE id = $1`

func (q *Queries) UpdateSessionHeartbeat(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, updateSessionHeartbeat, id)
	return err
}

const getIdleSessions = `-- name: GetIdleSessions :many
SELECT id, user_id, app_id, status, container_id, pod_name, node_port, vnc_url, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost, error_message, created_at, updated_at, last_heartbeat, stopped_at FROM sessions
WHERE status = 'ready'
AND last_heartbeat < NOW() - (idle_minutes || ' minutes')::INTERVAL`

func (q *Queries) GetIdleSessions(ctx context.Context) ([]Session, error) {
	rows, err := q.db.Query(ctx, getIdleSessions)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		s, err := scanSessionRow(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

const stopSession = `-- name: StopSession :exec
UPDATE sessions
SET status = 'stopped', stopped_at = NOW(), updated_at = NOW()
WHERE id = $1`

func (q *Queries) StopSession(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, stopSession, id)
	return err
}

type UpdateSessionErrorParams struct {
	ID           uuid.UUID
	ErrorMessage pgtype.Text
}

const updateSessionError = `-- name: UpdateSessionError :exec
UPDATE sessions
SET status = 'error', error_message = $2, updated_at = NOW()
WHERE id = $1`

func (q *Queries) UpdateSessionError(ctx context.Context, arg UpdateSessionErrorParams) error {
	_, err := q.db.Exec(ctx, updateSessionError, arg.ID, arg.ErrorMessage)
	return err
}

// scanSession scans a single session from a pgx.Row
func scanSession(row interface {
	Scan(dest ...interface{}) error
}) (Session, error) {
	var s Session
	err := row.Scan(
		&s.ID,
		&s.UserID,
		&s.AppID,
		&s.Status,
		&s.ContainerID,
		&s.PodName,
		&s.NodePort,
		&s.VncUrl,
		&s.CpuCores,
		&s.MemoryGb,
		&s.GpuEnabled,
		&s.IdleMinutes,
		&s.StartupBoost,
		&s.ErrorMessage,
		&s.CreatedAt,
		&s.UpdatedAt,
		&s.LastHeartbeat,
		&s.StoppedAt,
	)
	return s, err
}

// scanSessionRow scans a session from pgx.Rows
func scanSessionRow(row interface {
	Scan(dest ...interface{}) error
}) (Session, error) {
	return scanSession(row)
}
