package orchestrator

import "context"

// SessionConfig holds all the parameters needed to launch a session container.
type SessionConfig struct {
	SessionID    string
	AppID        string
	Image        string
	CPUCores     float64
	MemoryGB     int
	GPUEnabled   bool
	IdleMinutes  int
	StartupBoost int
	UserDataDir  string // host path to bind-mount into container at /userdata
}

// SessionInfo is returned after a successful container launch.
type SessionInfo struct {
	ContainerID string
	PodName     string
	Port        int
	VNCUrl      string
}

// ContainerOrchestrator is the interface all backend runtimes must implement.
type ContainerOrchestrator interface {
	// Launch starts a new container for the given session config.
	Launch(ctx context.Context, config SessionConfig) (*SessionInfo, error)

	// Stop terminates the container associated with the given session ID.
	Stop(ctx context.Context, sessionID string) error

	// GetStatus returns the current status string for the given session ID.
	GetStatus(ctx context.Context, sessionID string) (string, error)

	// Reconcile discovers all running containers managed by this orchestrator
	// and returns their session IDs. Used on startup to re-sync state.
	Reconcile(ctx context.Context) ([]string, error)

	// HasGPUCapacity returns true if the backend can launch GPU-enabled sessions.
	HasGPUCapacity(ctx context.Context) bool
}
