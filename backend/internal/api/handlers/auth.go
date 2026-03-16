package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	db "github.com/infinityos/backend/db/generated"
	"github.com/infinityos/backend/internal/api/middleware"
	"github.com/infinityos/backend/internal/auth"
	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

const (
	oauthStateTTL     = 10 * time.Minute
	refreshCookieName = "refresh_token"
	refreshCookiePath = "/api/v1/auth/refresh"
)

// AuthHandler holds dependencies for authentication handlers.
type AuthHandler struct {
	queries         *db.Queries
	jwtManager      *auth.JWTManager
	googleOAuth     *auth.GoogleOAuth
	redis           *redis.Client
	frontendURL     string
	refreshTokenTTL time.Duration
}

// NewAuthHandler creates an AuthHandler.
func NewAuthHandler(
	queries *db.Queries,
	jwtManager *auth.JWTManager,
	googleOAuth *auth.GoogleOAuth,
	redisClient *redis.Client,
	frontendURL string,
	refreshTokenExpiryDays int,
) *AuthHandler {
	return &AuthHandler{
		queries:         queries,
		jwtManager:      jwtManager,
		googleOAuth:     googleOAuth,
		redis:           redisClient,
		frontendURL:     frontendURL,
		refreshTokenTTL: time.Duration(refreshTokenExpiryDays) * 24 * time.Hour,
	}
}

// GoogleLogin redirects the user to Google's OAuth consent page.
// GET /api/v1/auth/google/login
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	state, err := generateState()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate state"})
		return
	}

	ctx := c.Request.Context()
	if err := h.redis.Set(ctx, "oauth:state:"+state, "1", oauthStateTTL).Err(); err != nil {
		log.Error().Err(err).Msg("failed to store oauth state in redis")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	url := h.googleOAuth.GetAuthURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback handles the OAuth2 callback from Google.
// GET /api/v1/auth/google/callback
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	ctx := c.Request.Context()
	state := c.Query("state")
	code := c.Query("code")

	// Verify CSRF state
	stateKey := "oauth:state:" + state
	val, err := h.redis.GetDel(ctx, stateKey).Result()
	if err == redis.Nil || val != "1" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state parameter", "code": "INVALID_STATE"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "state verification failed"})
		return
	}

	profile, err := h.googleOAuth.Exchange(ctx, code)
	if err != nil {
		log.Error().Err(err).Msg("google exchange failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": "OAuth exchange failed", "code": "OAUTH_ERROR"})
		return
	}

	// Upsert user
	user, err := h.queries.GetUserByGoogleID(ctx, profile.ID)
	if err == pgx.ErrNoRows {
		// Try by email
		user, err = h.queries.GetUserByEmail(ctx, profile.Email)
		if err == pgx.ErrNoRows {
			// Create new user
			user, err = h.queries.CreateUser(ctx, db.CreateUserParams{
				Email:        profile.Email,
				Name:         profile.Name,
				AvatarUrl:    &profile.Picture,
				GoogleID:     &profile.ID,
				AuthProvider: "google",
			})
			if err != nil {
				log.Error().Err(err).Msg("create user failed")
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
				return
			}
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	_ = h.queries.UpdateUserLastLogin(ctx, user.ID)

	token, refreshToken, err := h.issueTokens(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue tokens"})
		return
	}

	h.setRefreshCookie(c, refreshToken)
	c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/auth/callback?token="+token)
}

// RegisterRequest is the JSON body for registration.
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
}

// Register creates a new account with email/password.
// POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	ctx := c.Request.Context()

	// Check for existing user
	_, err := h.queries.GetUserByEmail(ctx, req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered", "code": "EMAIL_TAKEN"})
		return
	}
	if err != pgx.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user, err := h.queries.CreateUser(ctx, db.CreateUserParams{
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: &hash,
		AuthProvider: "password",
	})
	if err != nil {
		log.Error().Err(err).Msg("create user failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	token, refreshToken, err := h.issueTokens(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue tokens"})
		return
	}

	h.setRefreshCookie(c, refreshToken)
	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  userResponse(user),
	})
}

// LoginRequest is the JSON body for login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login authenticates with email/password.
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.queries.GetUserByEmail(ctx, req.Email)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials", "code": "INVALID_CREDENTIALS"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if !user.PasswordHash.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "account uses social login", "code": "WRONG_AUTH_METHOD"})
		return
	}

	if !auth.VerifyPassword(user.PasswordHash.String, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials", "code": "INVALID_CREDENTIALS"})
		return
	}

	_ = h.queries.UpdateUserLastLogin(ctx, user.ID)

	token, refreshToken, err := h.issueTokens(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue tokens"})
		return
	}

	h.setRefreshCookie(c, refreshToken)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  userResponse(user),
	})
}

// RefreshRequest is the optional JSON body for token refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Refresh issues a new JWT using a valid refresh token.
// POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	ctx := c.Request.Context()

	// Try cookie first, then body
	rawToken, err := c.Cookie(refreshCookieName)
	if err != nil || rawToken == "" {
		var req RefreshRequest
		if bindErr := c.ShouldBindJSON(&req); bindErr != nil || req.RefreshToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token required", "code": "MISSING_TOKEN"})
			return
		}
		rawToken = req.RefreshToken
	}

	tokenHash := auth.HashRefreshToken(rawToken)
	rt, err := h.queries.GetRefreshToken(ctx, tokenHash)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token", "code": "UNAUTHORIZED"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	user, err := h.queries.GetUserByID(ctx, rt.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	newToken, err := h.jwtManager.IssueAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": newToken,
		"user":  userResponse(user),
	})
}

// Me returns the currently authenticated user.
// GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	ctx := c.Request.Context()

	user, err := h.queries.GetUserByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": userResponse(user)})
}

// Logout invalidates the refresh token and clears the cookie.
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	ctx := c.Request.Context()

	rawToken, err := c.Cookie(refreshCookieName)
	if err == nil && rawToken != "" {
		tokenHash := auth.HashRefreshToken(rawToken)
		_ = h.queries.DeleteRefreshToken(ctx, tokenHash)
	}

	c.SetCookie(refreshCookieName, "", -1, refreshCookiePath, "", true, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// --- helpers ---

func (h *AuthHandler) issueTokens(ctx context.Context, user db.User) (string, string, error) {
	token, err := h.jwtManager.IssueAccessToken(user.ID, user.Email)
	if err != nil {
		return "", "", err
	}

	rawRefresh, err := auth.GenerateRefreshToken()
	if err != nil {
		return "", "", err
	}

	hash := auth.HashRefreshToken(rawRefresh)
	expiresAt := time.Now().Add(h.refreshTokenTTL)

	_, err = h.queries.CreateRefreshToken(ctx, db.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: hash,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return "", "", err
	}

	return token, rawRefresh, nil
}

func (h *AuthHandler) setRefreshCookie(c *gin.Context, token string) {
	maxAge := int(h.refreshTokenTTL.Seconds())
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(refreshCookieName, token, maxAge, refreshCookiePath, "", false, true)
}

func userResponse(u db.User) gin.H {
	resp := gin.H{
		"id":            u.ID,
		"email":         u.Email,
		"name":          u.Name,
		"auth_provider": u.AuthProvider,
		"created_at":    u.CreatedAt,
		"last_login_at": u.LastLoginAt,
	}
	if u.AvatarUrl.Valid {
		resp["avatar_url"] = u.AvatarUrl.String
	}
	return resp
}

func generateState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
