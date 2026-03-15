package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/infinityos/backend/internal/warmpool"
)

// AppHandler serves app definition endpoints.
type AppHandler struct {
	registry *warmpool.AppRegistry
}

// NewAppHandler creates an AppHandler.
func NewAppHandler(registry *warmpool.AppRegistry) *AppHandler {
	return &AppHandler{registry: registry}
}

// ListApps returns all available app definitions.
// GET /api/v1/apps
func (h *AppHandler) ListApps(c *gin.Context) {
	apps := h.registry.GetAllApps()
	c.JSON(http.StatusOK, gin.H{"apps": apps})
}

// GetApp returns a single app definition by ID.
// GET /api/v1/apps/:id
func (h *AppHandler) GetApp(c *gin.Context) {
	id := c.Param("id")
	app, ok := h.registry.GetApp(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "app not found", "code": "NOT_FOUND"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"app": app})
}
