package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims represents the JWT payload.
type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	jwt.RegisteredClaims
}

// JWTManager handles token creation and verification.
type JWTManager struct {
	secret      []byte
	expiryHours int
}

// NewJWTManager creates a new JWTManager.
func NewJWTManager(secret string, expiryHours int) *JWTManager {
	return &JWTManager{
		secret:      []byte(secret),
		expiryHours: expiryHours,
	}
}

// IssueAccessToken creates a signed JWT for the given user.
func (m *JWTManager) IssueAccessToken(userID uuid.UUID, email string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(m.expiryHours) * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// VerifyToken validates a JWT string and returns its claims.
func (m *JWTManager) VerifyToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return claims, nil
}

// GenerateRefreshToken creates a cryptographically random refresh token (32 bytes, base64url encoded).
func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate refresh token: %w", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// HashRefreshToken returns the SHA-256 hex digest of the given token.
// Only hashes are stored in the database.
func HashRefreshToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
