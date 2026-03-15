package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

const googleUserInfoURL = "https://www.googleapis.com/oauth2/v2/userinfo"

// GoogleProfile holds the information returned from the Google userinfo endpoint.
type GoogleProfile struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// GoogleOAuth handles Google OAuth2 authentication.
type GoogleOAuth struct {
	config *oauth2.Config
}

// NewGoogleOAuth creates a new GoogleOAuth handler.
func NewGoogleOAuth(clientID, clientSecret, redirectURL string) *GoogleOAuth {
	cfg := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
	return &GoogleOAuth{config: cfg}
}

// GetAuthURL returns the Google OAuth2 authorization URL with the given state.
func (g *GoogleOAuth) GetAuthURL(state string) string {
	return g.config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// Exchange exchanges an authorization code for a GoogleProfile.
func (g *GoogleOAuth) Exchange(ctx context.Context, code string) (*GoogleProfile, error) {
	token, err := g.config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("exchange code: %w", err)
	}

	client := g.config.Client(ctx, token)
	resp, err := client.Get(googleUserInfoURL)
	if err != nil {
		return nil, fmt.Errorf("get userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("userinfo returned %d: %s", resp.StatusCode, body)
	}

	var profile GoogleProfile
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return nil, fmt.Errorf("decode userinfo: %w", err)
	}

	if profile.Email == "" {
		return nil, fmt.Errorf("empty email in Google profile")
	}
	return &profile, nil
}
