package billing

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// RazorpayService handles Razorpay API calls.
type RazorpayService struct {
	keyID     string
	keySecret string
}

// NewRazorpayService creates a RazorpayService.
func NewRazorpayService(keyID, keySecret string) *RazorpayService {
	return &RazorpayService{keyID: keyID, keySecret: keySecret}
}

type rzpCreateOrderReq struct {
	Amount   int    `json:"amount"`
	Currency string `json:"currency"`
	Receipt  string `json:"receipt"`
}

type rzpCreateOrderResp struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	Error  *struct {
		Description string `json:"description"`
	} `json:"error,omitempty"`
}

// CreateOrder creates a Razorpay order and returns the order ID.
// amountPaise is the amount in the smallest currency unit (paise for INR).
func (s *RazorpayService) CreateOrder(amountPaise int, receiptID string) (string, error) {
	body, err := json.Marshal(rzpCreateOrderReq{
		Amount:   amountPaise,
		Currency: "INR",
		Receipt:  receiptID,
	})
	if err != nil {
		return "", fmt.Errorf("razorpay marshal: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.razorpay.com/v1/orders", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("razorpay new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	auth := base64.StdEncoding.EncodeToString([]byte(s.keyID + ":" + s.keySecret))
	req.Header.Set("Authorization", "Basic "+auth)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("razorpay request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("razorpay API error %d: %s", resp.StatusCode, string(respBody))
	}

	var result rzpCreateOrderResp
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("razorpay decode: %w", err)
	}

	return result.ID, nil
}

// VerifySignature validates a Razorpay webhook/callback signature.
// signature = HMAC-SHA256(orderID + "|" + paymentID, keySecret)
func (s *RazorpayService) VerifySignature(orderID, paymentID, signature string) bool {
	mac := hmac.New(sha256.New, []byte(s.keySecret))
	mac.Write([]byte(orderID + "|" + paymentID))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
