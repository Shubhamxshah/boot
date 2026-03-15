package warmpool

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/infinityos/backend/internal/orchestrator"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

const (
	warmPoolKeyPrefix = "warmpool:"
	watchInterval     = 30 * time.Second
)

// WarmPoolManager maintains pre-warmed containers for fast session starts.
type WarmPoolManager struct {
	registry     *AppRegistry
	orchestrator orchestrator.ContainerOrchestrator
	redis        *redis.Client
	stopCh       chan struct{}
}

// WarmEntry is stored in Redis to represent a ready warm container.
type WarmEntry struct {
	ContainerID string `json:"container_id"`
	Port        int    `json:"port"`
	VNCUrl      string `json:"vnc_url"`
}

// NewWarmPoolManager creates a WarmPoolManager.
func NewWarmPoolManager(
	registry *AppRegistry,
	orch orchestrator.ContainerOrchestrator,
	redisClient *redis.Client,
) *WarmPoolManager {
	return &WarmPoolManager{
		registry:     registry,
		orchestrator: orch,
		redis:        redisClient,
		stopCh:       make(chan struct{}),
	}
}

// Start fills all warm pools on boot.
func (m *WarmPoolManager) Start(ctx context.Context) {
	apps := m.registry.GetAllApps()
	for _, app := range apps {
		if app.WarmPoolSize > 0 {
			m.replenishToSize(ctx, app.ID, app.Image, app.WarmPoolSize)
		}
	}
}

// AssignFromPool pops one warm container from the Redis list for the given appID.
// Returns nil if the pool is empty.
func (m *WarmPoolManager) AssignFromPool(ctx context.Context, appID string) *orchestrator.SessionInfo {
	key := warmPoolKeyPrefix + appID
	val, err := m.redis.RPop(ctx, key).Result()
	if err == redis.Nil {
		return nil
	}
	if err != nil {
		log.Error().Err(err).Str("app_id", appID).Msg("warm pool rpop failed")
		return nil
	}

	var entry WarmEntry
	if err := json.Unmarshal([]byte(val), &entry); err != nil {
		log.Error().Err(err).Msg("failed to unmarshal warm entry")
		return nil
	}

	return &orchestrator.SessionInfo{
		ContainerID: entry.ContainerID,
		Port:        entry.Port,
		VNCUrl:      entry.VNCUrl,
	}
}

// ReplenishAsync asynchronously boots one warm container and pushes it to Redis.
func (m *WarmPoolManager) ReplenishAsync(ctx context.Context, appID string) {
	app, ok := m.registry.GetApp(appID)
	if !ok {
		return
	}
	go m.bootWarm(ctx, appID, app.Image)
}

// WatchPool periodically checks and replenishes all warm pools.
func (m *WarmPoolManager) WatchPool(ctx context.Context) {
	ticker := time.NewTicker(watchInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			m.checkAndReplenish(ctx)
		case <-m.stopCh:
			return
		case <-ctx.Done():
			return
		}
	}
}

// Stop stops the watch loop.
func (m *WarmPoolManager) Stop() {
	close(m.stopCh)
}

func (m *WarmPoolManager) checkAndReplenish(ctx context.Context) {
	apps := m.registry.GetAllApps()
	for _, app := range apps {
		if app.WarmPoolSize <= 0 {
			continue
		}
		key := warmPoolKeyPrefix + app.ID
		count, err := m.redis.LLen(ctx, key).Result()
		if err != nil {
			log.Error().Err(err).Str("app_id", app.ID).Msg("warm pool llen failed")
			continue
		}
		deficit := app.WarmPoolSize - int(count)
		for i := 0; i < deficit; i++ {
			go m.bootWarm(ctx, app.ID, app.Image)
		}
	}
}

func (m *WarmPoolManager) replenishToSize(ctx context.Context, appID, image string, targetSize int) {
	key := warmPoolKeyPrefix + appID
	count, err := m.redis.LLen(ctx, key).Result()
	if err != nil {
		count = 0
	}
	deficit := targetSize - int(count)
	for i := 0; i < deficit; i++ {
		go m.bootWarm(ctx, appID, image)
	}
}

func (m *WarmPoolManager) bootWarm(ctx context.Context, appID, image string) {
	sessionID := fmt.Sprintf("warm-%s", uuid.New().String())

	app, ok := m.registry.GetApp(appID)
	if !ok {
		return
	}

	cfg := orchestrator.SessionConfig{
		SessionID: sessionID,
		AppID:     appID,
		Image:     image,
		CPUCores:  app.CPUCores,
		MemoryGB:  app.MemoryGB,
	}

	info, err := m.orchestrator.Launch(ctx, cfg)
	if err != nil {
		log.Error().Err(err).Str("app_id", appID).Msg("warm container boot failed")
		return
	}

	entry := WarmEntry{
		ContainerID: info.ContainerID,
		Port:        info.Port,
		VNCUrl:      info.VNCUrl,
	}

	data, err := json.Marshal(entry)
	if err != nil {
		log.Error().Err(err).Msg("marshal warm entry failed")
		return
	}

	key := warmPoolKeyPrefix + appID
	if err := m.redis.LPush(ctx, key, string(data)).Err(); err != nil {
		log.Error().Err(err).Str("app_id", appID).Msg("warm pool lpush failed")
		// Stop the container since we can't track it
		_ = m.orchestrator.Stop(ctx, sessionID)
		return
	}

	log.Info().
		Str("app_id", appID).
		Str("session_id", sessionID).
		Msg("warm container ready")
}
