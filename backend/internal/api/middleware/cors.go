package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS returns a Gin middleware that sets CORS headers.
// allowedOrigin should be the frontend URL (e.g. "http://localhost:3000").
func CORS(allowedOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// Allow the configured frontend origin, or all origins in development
		if origin == allowedOrigin || allowedOrigin == "*" {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
