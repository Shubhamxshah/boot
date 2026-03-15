package orchestrator

import (
	"context"
	"fmt"

	"github.com/rs/zerolog/log"
)

// GPURouter routes session launches between a primary orchestrator and an
// optional overflow orchestrator (e.g. RunPod) when the primary has no GPU
// capacity.
type GPURouter struct {
	primary  ContainerOrchestrator
	overflow ContainerOrchestrator // may be nil
	enabled  bool
}

// NewGPURouter creates a GPURouter. overflow may be nil to disable routing.
func NewGPURouter(primary ContainerOrchestrator, overflow ContainerOrchestrator) *GPURouter {
	return &GPURouter{
		primary:  primary,
		overflow: overflow,
		enabled:  overflow != nil,
	}
}

// Launch routes the session to the appropriate orchestrator.
// If GPUEnabled and primary has no GPU capacity and overflow is available,
// the overflow orchestrator is used.
func (r *GPURouter) Launch(ctx context.Context, config SessionConfig) (*SessionInfo, error) {
	if config.GPUEnabled && !r.primary.HasGPUCapacity(ctx) && r.enabled && r.overflow != nil {
		log.Info().
			Str("session_id", config.SessionID).
			Msg("primary has no GPU capacity, routing to overflow orchestrator")
		return r.overflow.Launch(ctx, config)
	}
	return r.primary.Launch(ctx, config)
}

// Stop attempts to stop on the primary orchestrator first, then overflow.
func (r *GPURouter) Stop(ctx context.Context, sessionID string) error {
	err := r.primary.Stop(ctx, sessionID)
	if err != nil {
		if r.overflow != nil {
			log.Warn().
				Err(err).
				Str("session_id", sessionID).
				Msg("primary stop failed, trying overflow")
			return r.overflow.Stop(ctx, sessionID)
		}
		return fmt.Errorf("stop session on primary: %w", err)
	}
	return nil
}

// GetStatus checks status on the primary orchestrator.
func (r *GPURouter) GetStatus(ctx context.Context, sessionID string) (string, error) {
	status, err := r.primary.GetStatus(ctx, sessionID)
	if err != nil && r.overflow != nil {
		// Session might be on overflow
		return r.overflow.GetStatus(ctx, sessionID)
	}
	return status, err
}

// Reconcile reconciles from primary only.
func (r *GPURouter) Reconcile(ctx context.Context) ([]string, error) {
	primaryIDs, err := r.primary.Reconcile(ctx)
	if err != nil {
		return nil, err
	}

	if r.overflow == nil {
		return primaryIDs, nil
	}

	overflowIDs, err := r.overflow.Reconcile(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("overflow reconcile failed")
		return primaryIDs, nil
	}

	all := make([]string, 0, len(primaryIDs)+len(overflowIDs))
	all = append(all, primaryIDs...)
	all = append(all, overflowIDs...)
	return all, nil
}

// HasGPUCapacity checks primary first, then overflow.
func (r *GPURouter) HasGPUCapacity(ctx context.Context) bool {
	if r.primary.HasGPUCapacity(ctx) {
		return true
	}
	if r.overflow != nil {
		return r.overflow.HasGPUCapacity(ctx)
	}
	return false
}
