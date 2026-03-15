package db

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type User struct {
	ID           uuid.UUID    `json:"id"`
	Email        string       `json:"email"`
	Name         string       `json:"name"`
	AvatarUrl    pgtype.Text  `json:"avatar_url"`
	GoogleID     pgtype.Text  `json:"google_id"`
	PasswordHash pgtype.Text  `json:"-"`
	AuthProvider string       `json:"auth_provider"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
	LastLoginAt  time.Time    `json:"last_login_at"`
}

type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type Session struct {
	ID            uuid.UUID          `json:"id"`
	UserID        uuid.UUID          `json:"user_id"`
	AppID         string             `json:"app_id"`
	Status        string             `json:"status"`
	ContainerID   pgtype.Text        `json:"container_id"`
	PodName       pgtype.Text        `json:"pod_name"`
	NodePort      pgtype.Int4        `json:"node_port"`
	VncUrl        pgtype.Text        `json:"vnc_url"`
	CpuCores      float64            `json:"cpu_cores"`
	MemoryGb      int32              `json:"memory_gb"`
	GpuEnabled    bool               `json:"gpu_enabled"`
	IdleMinutes   int32              `json:"idle_minutes"`
	StartupBoost  int32              `json:"startup_boost"`
	ErrorMessage  pgtype.Text        `json:"error_message"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
	LastHeartbeat time.Time          `json:"last_heartbeat"`
	StoppedAt     pgtype.Timestamptz `json:"stopped_at"`
}
