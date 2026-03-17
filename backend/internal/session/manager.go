package session

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	db "github.com/bootx/backend/db/generated"
	"github.com/bootx/backend/internal/orchestrator"
	"github.com/bootx/backend/internal/warmpool"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

const (
	pollInterval  = 2 * time.Second
	pollTimeout   = 5 * time.Minute
)

// LaunchConfig contains user-supplied overrides for a new session.
type LaunchConfig struct {
	CPUCores    float64
	MemoryGB    int32
	GPUEnabled  bool
	IdleMinutes int32
}

// Manager handles session lifecycle.
type Manager struct {
	queries      *db.Queries
	orchestrator orchestrator.ContainerOrchestrator
	warmPool     *warmpool.WarmPoolManager // may be nil
	registry     *warmpool.AppRegistry
	filesBaseDir string
}

// NewManager creates a session Manager.
func NewManager(
	queries *db.Queries,
	orch orchestrator.ContainerOrchestrator,
	wp *warmpool.WarmPoolManager,
	registry *warmpool.AppRegistry,
	filesBaseDir string,
) *Manager {
	return &Manager{
		queries:      queries,
		orchestrator: orch,
		warmPool:     wp,
		registry:     registry,
		filesBaseDir: filesBaseDir,
	}
}

// LaunchAsync creates a session record and asynchronously boots the container.
// Returns the session ID immediately.
func (m *Manager) LaunchAsync(ctx context.Context, userID uuid.UUID, appID string, cfg LaunchConfig) (uuid.UUID, error) {
	app, ok := m.registry.GetApp(appID)
	if !ok {
		return uuid.Nil, fmt.Errorf("app %q not found", appID)
	}

	// Apply defaults from app definition if not overridden
	cpuCores := cfg.CPUCores
	if cpuCores <= 0 {
		cpuCores = app.CPUCores
	}
	memGB := cfg.MemoryGB
	if memGB <= 0 {
		memGB = int32(app.MemoryGB)
	}
	idleMinutes := cfg.IdleMinutes
	if idleMinutes <= 0 {
		idleMinutes = int32(app.IdleMinutes)
	}

	// Initialize per-user data directory and pre-create default subdirs
	userDataDir := filepath.Join(m.filesBaseDir, userID.String())
	for _, sub := range []string{"", "workspace", ".config", "blender-projects", "downloads"} {
		if err := os.MkdirAll(filepath.Join(userDataDir, sub), 0755); err != nil {
			log.Warn().Err(err).Str("dir", filepath.Join(userDataDir, sub)).Msg("failed to create user data dir")
		}
	}

	session, err := m.queries.CreateSession(ctx, db.CreateSessionParams{
		UserID:       userID,
		AppID:        appID,
		CpuCores:     cpuCores,
		MemoryGb:     memGB,
		GpuEnabled:   cfg.GPUEnabled,
		IdleMinutes:  idleMinutes,
		StartupBoost: 0,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("create session: %w", err)
	}

	go m.bootSession(context.Background(), session.ID, app.Image, orchestrator.SessionConfig{
		SessionID:   session.ID.String(),
		AppID:       appID,
		Image:       app.Image,
		CPUCores:    cpuCores,
		MemoryGB:    int(memGB),
		GPUEnabled:  cfg.GPUEnabled,
		IdleMinutes: int(idleMinutes),
		UserDataDir: userDataDir,
	})

	return session.ID, nil
}

func (m *Manager) bootSession(ctx context.Context, sessionID uuid.UUID, image string, cfg orchestrator.SessionConfig) {
	logger := log.With().Str("session_id", sessionID.String()).Logger()

	// Try warm pool first
	if m.warmPool != nil {
		info := m.warmPool.AssignFromPool(ctx, cfg.AppID)
		if info != nil {
			logger.Info().Msg("assigned from warm pool")
			m.markReady(ctx, sessionID, info)
			// Replenish the pool slot we just consumed
			m.warmPool.ReplenishAsync(ctx, cfg.AppID)
			return
		}
	}

	// Cold start
	logger.Info().Msg("cold start: launching container")
	info, err := m.orchestrator.Launch(ctx, cfg)
	if err != nil {
		logger.Error().Err(err).Msg("launch failed")
		_ = m.queries.UpdateSessionError(ctx, db.UpdateSessionErrorParams{
			ID:           sessionID,
			ErrorMessage: pgtype.Text{String: err.Error(), Valid: true},
		})
		return
	}

	// Poll until container is ready
	deadline := time.Now().Add(pollTimeout)
	for time.Now().Before(deadline) {
		status, err := m.orchestrator.GetStatus(ctx, cfg.SessionID)
		if err != nil {
			logger.Error().Err(err).Msg("get status failed")
			break
		}
		if status == "ready" {
			m.markReady(ctx, sessionID, info)
			return
		}
		if status == "error" || status == "stopped" {
			errMsg := fmt.Sprintf("container entered status: %s", status)
			_ = m.queries.UpdateSessionError(ctx, db.UpdateSessionErrorParams{
				ID:           sessionID,
				ErrorMessage: pgtype.Text{String: errMsg, Valid: true},
			})
			return
		}
		time.Sleep(pollInterval)
	}

	// Timed out
	_ = m.queries.UpdateSessionError(ctx, db.UpdateSessionErrorParams{
		ID:           sessionID,
		ErrorMessage: pgtype.Text{String: "timed out waiting for container to be ready", Valid: true},
	})
	_ = m.orchestrator.Stop(ctx, cfg.SessionID)
}

func (m *Manager) markReady(ctx context.Context, sessionID uuid.UUID, info *orchestrator.SessionInfo) {
	_, err := m.queries.UpdateSessionReady(ctx, db.UpdateSessionReadyParams{
		ID:          sessionID,
		ContainerID: pgtype.Text{String: info.ContainerID, Valid: info.ContainerID != ""},
		PodName:     pgtype.Text{String: info.PodName, Valid: info.PodName != ""},
		NodePort:    pgtype.Int4{Int32: int32(info.Port), Valid: info.Port != 0},
		VncUrl:      pgtype.Text{String: info.VNCUrl, Valid: info.VNCUrl != ""},
	})
	if err != nil {
		log.Error().Err(err).Str("session_id", sessionID.String()).Msg("mark ready failed")
	}
}

// StopSession terminates a session.
func (m *Manager) StopSession(ctx context.Context, sessionID uuid.UUID) error {
	if err := m.orchestrator.Stop(ctx, sessionID.String()); err != nil {
		log.Error().Err(err).Str("session_id", sessionID.String()).Msg("orchestrator stop failed")
	}
	return m.queries.StopSession(ctx, sessionID)
}
