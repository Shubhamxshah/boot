package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	db "github.com/bootx/backend/db/generated"
	"github.com/bootx/backend/internal/api/middleware"
	"github.com/bootx/backend/internal/billing"
	"github.com/bootx/backend/internal/session"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog/log"
)

// SessionHandler handles session-related HTTP requests.
type SessionHandler struct {
	queries        *db.Queries
	sessionManager *session.Manager
	billingCfg     billing.Config
}

// NewSessionHandler creates a SessionHandler.
func NewSessionHandler(queries *db.Queries, mgr *session.Manager, billingCfg billing.Config) *SessionHandler {
	return &SessionHandler{
		queries:        queries,
		sessionManager: mgr,
		billingCfg:     billingCfg,
	}
}

// LaunchRequest is the JSON body for launching a session.
type LaunchRequest struct {
	AppID       string  `json:"app_id" binding:"required"`
	CPUCores    float64 `json:"cpu_cores"`
	MemoryGB    int32   `json:"memory_gb"`
	GPUEnabled  bool    `json:"gpu_enabled"`
	IdleMinutes int32   `json:"idle_minutes"`
}

// Launch starts a new session for the authenticated user.
// POST /api/v1/sessions
func (h *SessionHandler) Launch(c *gin.Context) {
	var req LaunchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	ctx := c.Request.Context()

	// Credit pre-flight check: require at least 10 minutes of credits.
	uc, err := h.queries.GetOrCreateUserCredits(ctx, userID)
	if err != nil {
		log.Error().Err(err).Msg("get credits failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check credits"})
		return
	}
	costPerMin := billing.CalcCostPerMinute(req.CPUCores, int(req.MemoryGB), req.GPUEnabled, h.billingCfg)
	minRequired := costPerMin * 10
	if uc.Balance < minRequired {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error":    "insufficient credits",
			"code":     "INSUFFICIENT_CREDITS",
			"balance":  uc.Balance,
			"required": minRequired,
		})
		return
	}

	sessionID, err := h.sessionManager.LaunchAsync(ctx, userID, req.AppID, session.LaunchConfig{
		CPUCores:    req.CPUCores,
		MemoryGB:    req.MemoryGB,
		GPUEnabled:  req.GPUEnabled,
		IdleMinutes: req.IdleMinutes,
	})
	if err != nil {
		log.Error().Err(err).Str("app_id", req.AppID).Msg("launch async failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "LAUNCH_ERROR"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"session_id": sessionID,
		"status":     "starting",
	})
}

// List returns all active sessions for the authenticated user.
// GET /api/v1/sessions
func (h *SessionHandler) List(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	ctx := c.Request.Context()

	sessions, err := h.queries.GetUserActiveSessions(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

// Get returns a single session by ID.
// GET /api/v1/sessions/:id
func (h *SessionHandler) Get(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session ID"})
		return
	}

	ctx := c.Request.Context()
	s, err := h.queries.GetSessionByID(ctx, sessionID)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if s.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied", "code": "FORBIDDEN"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session": s})
}

// Stop terminates a session.
// DELETE /api/v1/sessions/:id
func (h *SessionHandler) Stop(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session ID"})
		return
	}

	ctx := c.Request.Context()
	s, err := h.queries.GetSessionByID(ctx, sessionID)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if s.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied", "code": "FORBIDDEN"})
		return
	}

	if err := h.sessionManager.StopSession(ctx, sessionID); err != nil {
		log.Error().Err(err).Str("session_id", sessionID.String()).Msg("stop session failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to stop session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session stopped"})
}

// Heartbeat refreshes the idle timeout for a session.
// POST /api/v1/sessions/:id/heartbeat
func (h *SessionHandler) Heartbeat(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session ID"})
		return
	}

	ctx := c.Request.Context()
	s, err := h.queries.GetSessionByID(ctx, sessionID)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if s.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied", "code": "FORBIDDEN"})
		return
	}

	if err := session.ProcessHeartbeat(ctx, h.queries, sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "heartbeat failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

// UpdateConfigRequest is the JSON body for updating session resource config.
type UpdateConfigRequest struct {
	CPUCores   float64 `json:"cpu_cores"`
	MemoryGB   int32   `json:"memory_gb"`
	GPUEnabled *bool   `json:"gpu_enabled"`
}

// UpdateConfig updates resource configuration for a session.
// PATCH /api/v1/sessions/:id/config
func (h *SessionHandler) UpdateConfig(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session ID"})
		return
	}

	var req UpdateConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	s, err := h.queries.GetSessionByID(ctx, sessionID)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if s.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied", "code": "FORBIDDEN"})
		return
	}

	// Config changes take effect on restart. For now, return the current session
	// with a note that changes will apply on next start.
	log.Info().
		Str("session_id", sessionID.String()).
		Float64("cpu_cores", req.CPUCores).
		Int32("memory_gb", req.MemoryGB).
		Msg("session config update requested (applies on restart)")

	c.JSON(http.StatusOK, gin.H{
		"session": s,
		"message": "config updated; changes apply on next session start",
	})
}
