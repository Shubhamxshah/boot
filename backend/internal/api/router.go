package api

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/infinityos/backend/internal/api/handlers"
	"github.com/infinityos/backend/internal/api/middleware"
	"github.com/infinityos/backend/internal/auth"
	"github.com/rs/zerolog/log"
)

// RouterConfig groups all handler dependencies.
type RouterConfig struct {
	AuthHandler     *handlers.AuthHandler
	SessionHandler  *handlers.SessionHandler
	AppHandler      *handlers.AppHandler
	FileHandler     *handlers.FileHandler
	TerminalHandler *handlers.TerminalHandler
	JWTManager      *auth.JWTManager
	FrontendURL     string
}

// NewRouter builds and returns the configured Gin engine.
func NewRouter(cfg RouterConfig) *gin.Engine {
	r := gin.New()

	// Middleware
	r.Use(zerologMiddleware())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(cfg.FrontendURL))

	// Public routes
	r.GET("/health", handlers.HealthCheck)

	v1 := r.Group("/api/v1")

	authGroup := v1.Group("/auth")
	{
		authGroup.GET("/google/login", cfg.AuthHandler.GoogleLogin)
		authGroup.GET("/google/callback", cfg.AuthHandler.GoogleCallback)
		authGroup.POST("/register", cfg.AuthHandler.Register)
		authGroup.POST("/login", cfg.AuthHandler.Login)
		authGroup.POST("/refresh", cfg.AuthHandler.Refresh)
	}

	// Protected routes
	protected := v1.Group("/")
	protected.Use(middleware.JWT(cfg.JWTManager))
	{
		protected.GET("/auth/me", cfg.AuthHandler.Me)
		protected.POST("/auth/logout", cfg.AuthHandler.Logout)

		// Apps
		protected.GET("/apps", cfg.AppHandler.ListApps)
		protected.GET("/apps/:id", cfg.AppHandler.GetApp)

		// Sessions
		protected.POST("/sessions", cfg.SessionHandler.Launch)
		protected.GET("/sessions", cfg.SessionHandler.List)
		protected.GET("/sessions/:id", cfg.SessionHandler.Get)
		protected.DELETE("/sessions/:id", cfg.SessionHandler.Stop)
		protected.POST("/sessions/:id/heartbeat", cfg.SessionHandler.Heartbeat)
		protected.PATCH("/sessions/:id/config", cfg.SessionHandler.UpdateConfig)

		// Files
		protected.GET("/files", cfg.FileHandler.List)
		protected.GET("/files/download", cfg.FileHandler.Download)
		protected.POST("/files/upload", cfg.FileHandler.Upload)
		protected.POST("/files/mkdir", cfg.FileHandler.Mkdir)
		protected.DELETE("/files", cfg.FileHandler.Delete)
		protected.POST("/files/rename", cfg.FileHandler.Rename)

		// Terminal (WebSocket)
		protected.GET("/terminal/ws", cfg.TerminalHandler.WS)
	}

	return r
}

// zerologMiddleware returns a Gin middleware that logs requests with zerolog.
func zerologMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		duration := time.Since(start)
		statusCode := c.Writer.Status()

		event := log.Info()
		if statusCode >= 500 {
			event = log.Error()
		} else if statusCode >= 400 {
			event = log.Warn()
		}

		if query != "" {
			path = path + "?" + query
		}

		event.
			Str("method", c.Request.Method).
			Str("path", path).
			Int("status", statusCode).
			Dur("duration", duration).
			Str("ip", c.ClientIP()).
			Msg("request")
	}
}
