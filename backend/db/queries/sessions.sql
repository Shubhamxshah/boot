-- name: CreateSession :one
INSERT INTO sessions (user_id, app_id, cpu_cores, memory_gb, gpu_enabled, idle_minutes, startup_boost)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetSessionByID :one
SELECT * FROM sessions WHERE id = $1;

-- name: GetUserActiveSessions :many
SELECT * FROM sessions
WHERE user_id = $1 AND status NOT IN ('stopped', 'error')
ORDER BY created_at DESC;

-- name: UpdateSessionStatus :one
UPDATE sessions
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateSessionReady :one
UPDATE sessions
SET status = 'ready', container_id = $2, pod_name = $3,
    node_port = $4, vnc_url = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateSessionHeartbeat :exec
UPDATE sessions
SET last_heartbeat = NOW(), status = 'ready', updated_at = NOW()
WHERE id = $1;

-- name: GetIdleSessions :many
SELECT * FROM sessions
WHERE status = 'ready'
AND last_heartbeat < NOW() - (idle_minutes || ' minutes')::INTERVAL;

-- name: StopSession :exec
UPDATE sessions
SET status = 'stopped', stopped_at = NOW(), updated_at = NOW()
WHERE id = $1;

-- name: UpdateSessionError :exec
UPDATE sessions
SET status = 'error', error_message = $2, updated_at = NOW()
WHERE id = $1;
