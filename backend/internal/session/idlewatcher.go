package session

import (
	"context"
	"time"

	db "github.com/bootx/backend/db/generated"
	"github.com/bootx/backend/internal/orchestrator"
	"github.com/rs/zerolog/log"
)

const idleCheckInterval = 60 * time.Second

// IdleWatcher periodically scans for idle sessions and terminates them.
type IdleWatcher struct {
	queries      *db.Queries
	orchestrator orchestrator.ContainerOrchestrator
	stopCh       chan struct{}
}

// NewIdleWatcher creates an IdleWatcher.
func NewIdleWatcher(queries *db.Queries, orch orchestrator.ContainerOrchestrator) *IdleWatcher {
	return &IdleWatcher{
		queries:      queries,
		orchestrator: orch,
		stopCh:       make(chan struct{}),
	}
}

// Start begins the idle watcher loop in a background goroutine.
func (w *IdleWatcher) Start(ctx context.Context) {
	go w.run(ctx)
}

// Stop signals the watcher to stop.
func (w *IdleWatcher) Stop() {
	close(w.stopCh)
}

func (w *IdleWatcher) run(ctx context.Context) {
	ticker := time.NewTicker(idleCheckInterval)
	defer ticker.Stop()

	log.Info().Msg("idle watcher started")

	for {
		select {
		case <-ticker.C:
			w.checkIdleSessions(ctx)
		case <-w.stopCh:
			log.Info().Msg("idle watcher stopped")
			return
		case <-ctx.Done():
			return
		}
	}
}

func (w *IdleWatcher) checkIdleSessions(ctx context.Context) {
	sessions, err := w.queries.GetIdleSessions(ctx)
	if err != nil {
		log.Error().Err(err).Msg("get idle sessions failed")
		return
	}

	for _, s := range sessions {
		log.Info().
			Str("session_id", s.ID.String()).
			Str("app_id", s.AppID).
			Msg("stopping idle session")

		if err := w.orchestrator.Stop(ctx, s.ID.String()); err != nil {
			log.Error().
				Err(err).
				Str("session_id", s.ID.String()).
				Msg("orchestrator stop failed")
		}

		if err := w.queries.StopSession(ctx, s.ID); err != nil {
			log.Error().
				Err(err).
				Str("session_id", s.ID.String()).
				Msg("db stop session failed")
		}
	}

	if len(sessions) > 0 {
		log.Info().Int("count", len(sessions)).Msg("stopped idle sessions")
	}
}
