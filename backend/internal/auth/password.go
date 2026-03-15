package auth

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

// HashPassword hashes the plain-text password using bcrypt.
func HashPassword(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcryptCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hash), nil
}

// VerifyPassword compares a bcrypt hash against a plain-text password.
// Returns true if they match.
func VerifyPassword(hash, plain string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
	return err == nil
}
