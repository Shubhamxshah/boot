package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	Name         string     `json:"name"`
	AvatarURL    *string    `json:"avatar_url,omitempty"`
	GoogleID     *string    `json:"-"`
	PasswordHash *string    `json:"-"`
	AuthProvider string     `json:"auth_provider"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	LastLoginAt  time.Time  `json:"last_login_at"`
}

type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type Session struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	AppID         string     `json:"app_id"`
	Status        string     `json:"status"`
	ContainerID   *string    `json:"container_id,omitempty"`
	PodName       *string    `json:"pod_name,omitempty"`
	NodePort      *int32     `json:"node_port,omitempty"`
	VNCUrl        *string    `json:"vnc_url,omitempty"`
	CPUCores      float64    `json:"cpu_cores"`
	MemoryGB      int32      `json:"memory_gb"`
	GPUEnabled    bool       `json:"gpu_enabled"`
	IdleMinutes   int32      `json:"idle_minutes"`
	StartupBoost  int32      `json:"startup_boost"`
	ErrorMessage  *string    `json:"error_message,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	LastHeartbeat time.Time  `json:"last_heartbeat"`
	StoppedAt     *time.Time `json:"stopped_at,omitempty"`
}

type AppDefinition struct {
	ID           string  `yaml:"id" json:"id"`
	Name         string  `yaml:"name" json:"name"`
	Description  string  `yaml:"description" json:"description"`
	Image        string  `yaml:"image" json:"image"`
	CPUCores     float64 `yaml:"cpu_cores" json:"cpu_cores"`
	MemoryGB     int     `yaml:"memory_gb" json:"memory_gb"`
	GPURequired  bool    `yaml:"gpu_required" json:"gpu_required"`
	GPUOptional  bool    `yaml:"gpu_optional" json:"gpu_optional"`
	IdleMinutes  int     `yaml:"idle_minutes" json:"idle_minutes"`
	WarmPoolSize int     `yaml:"warm_pool_size" json:"warm_pool_size"`
	Category     string  `yaml:"category" json:"category"`
}

type AppsConfig struct {
	Apps []AppDefinition `yaml:"apps"`
}
