package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/bootx/backend/internal/auth"
)

const (
	CtxUserID = "user_id"
	CtxEmail  = "email"
)

// JWT returns a Gin middleware that validates JWT tokens.
// Tokens can be provided via:
//   - Authorization: Bearer <token> header
//   - access_token cookie
func JWT(jwtManager *auth.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractToken(c)
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "missing authentication token",
				"code":  "UNAUTHORIZED",
			})
			return
		}

		claims, err := jwtManager.VerifyToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
				"code":  "UNAUTHORIZED",
			})
			return
		}

		c.Set(CtxUserID, claims.UserID.String())
		c.Set(CtxEmail, claims.Email)
		c.Next()
	}
}

func extractToken(c *gin.Context) string {
	// Check Authorization header first
	header := c.GetHeader("Authorization")
	if header != "" {
		parts := strings.SplitN(header, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
			return parts[1]
		}
	}

	// Check query param (used for WebSocket connections)
	if t := c.Query("token"); t != "" {
		return t
	}

	// Fall back to cookie
	if cookie, err := c.Cookie("access_token"); err == nil && cookie != "" {
		return cookie
	}

	return ""
}
