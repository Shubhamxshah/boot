package session

import (
	"context"
	"fmt"

	db "github.com/bootx/backend/db/generated"
	"github.com/google/uuid"
)

// ProcessHeartbeat updates the session's last_heartbeat timestamp.
// It also resets the status to 'ready' to clear any stale state.
func ProcessHeartbeat(ctx context.Context, queries *db.Queries, sessionID uuid.UUID) error {
	if err := queries.UpdateSessionHeartbeat(ctx, sessionID); err != nil {
		return fmt.Errorf("update heartbeat for session %s: %w", sessionID, err)
	}
	return nil
}
