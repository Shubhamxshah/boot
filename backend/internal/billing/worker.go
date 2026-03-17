package billing

import (
	"context"
	"time"

	db "github.com/bootx/backend/db/generated"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

const billingInterval = 60 * time.Second

// SessionStopper is the minimal interface the worker needs from session.Manager.
type SessionStopper interface {
	StopSession(ctx context.Context, sessionID uuid.UUID) error
}

// Worker periodically deducts credits for all running sessions.
type Worker struct {
	queries    *db.Queries
	sessionMgr SessionStopper
	cfg        Config
	stopCh     chan struct{}
}

// NewWorker creates a billing Worker.
func NewWorker(queries *db.Queries, sessionMgr SessionStopper, cfg Config) *Worker {
	return &Worker{
		queries:    queries,
		sessionMgr: sessionMgr,
		cfg:        cfg,
		stopCh:     make(chan struct{}),
	}
}

// Start begins the billing worker loop in a background goroutine.
func (w *Worker) Start(ctx context.Context) {
	go w.run(ctx)
}

// Stop signals the worker to stop.
func (w *Worker) Stop() {
	close(w.stopCh)
}

func (w *Worker) run(ctx context.Context) {
	ticker := time.NewTicker(billingInterval)
	defer ticker.Stop()

	log.Info().Msg("billing worker started")

	for {
		select {
		case <-ticker.C:
			w.tick(ctx)
		case <-w.stopCh:
			log.Info().Msg("billing worker stopped")
			return
		case <-ctx.Done():
			return
		}
	}
}

func (w *Worker) tick(ctx context.Context) {
	sessions, err := w.queries.GetActiveSessionsForBilling(ctx)
	if err != nil {
		log.Error().Err(err).Msg("billing: get active sessions failed")
		return
	}

	for _, s := range sessions {
		cost := CalcCostPerMinute(s.CPUCores, int(s.MemoryGB), s.GPUEnabled, w.cfg)

		credits, err := w.queries.DeductCredits(ctx, db.DeductCreditsParams{
			UserID: s.UserID,
			Amount: cost,
		})
		if err == pgx.ErrNoRows {
			log.Warn().
				Str("session_id", s.ID.String()).
				Str("user_id", s.UserID.String()).
				Msg("billing: insufficient credits, stopping session")
			if stopErr := w.sessionMgr.StopSession(ctx, s.ID); stopErr != nil {
				log.Error().Err(stopErr).Str("session_id", s.ID.String()).Msg("billing: stop session failed")
			}
			continue
		}
		if err != nil {
			log.Error().Err(err).Str("session_id", s.ID.String()).Msg("billing: deduct credits failed")
			continue
		}

		_, err = w.queries.CreateCreditTransaction(ctx, db.CreateCreditTransactionParams{
			UserID:       s.UserID,
			Type:         "session_usage",
			Amount:       -cost,
			BalanceAfter: credits.Balance,
			Description:  "Session usage (1 min)",
			SessionID:    pgtype.UUID{Bytes: s.ID, Valid: true},
		})
		if err != nil {
			log.Error().Err(err).Str("session_id", s.ID.String()).Msg("billing: create transaction failed")
		}
	}

	if len(sessions) > 0 {
		log.Debug().Int("sessions_billed", len(sessions)).Msg("billing tick complete")
	}
}
