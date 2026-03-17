package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	db "github.com/bootx/backend/db/generated"
	"github.com/bootx/backend/internal/api/middleware"
	"github.com/bootx/backend/internal/billing"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// CreditPack describes a purchasable credit bundle.
type CreditPack struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Credits     int64  `json:"credits"`
	AmountCents int32  `json:"amount_cents"`
}

var creditPacks = []CreditPack{
	{ID: "starter", Name: "Starter", Credits: 500, AmountCents: 500},            // $5
	{ID: "professional", Name: "Professional", Credits: 2000, AmountCents: 2000}, // $20
	{ID: "team", Name: "Team", Credits: 7000, AmountCents: 7000},                // $70
}

// BillingHandler handles billing-related HTTP requests.
type BillingHandler struct {
	queries      *db.Queries
	rzp          *billing.RazorpayService
	cfg          billing.Config
	razorpayKeyID string
	pool         *pgxpool.Pool
}

// NewBillingHandler creates a BillingHandler.
func NewBillingHandler(queries *db.Queries, rzp *billing.RazorpayService, cfg billing.Config, razorpayKeyID string, pool *pgxpool.Pool) *BillingHandler {
	return &BillingHandler{
		queries:      queries,
		rzp:          rzp,
		cfg:          cfg,
		razorpayKeyID: razorpayKeyID,
		pool:         pool,
	}
}

// GetCredits returns the caller's balance and recent transactions.
// GET /credits
func (h *BillingHandler) GetCredits(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	ctx := c.Request.Context()

	uc, err := h.queries.GetOrCreateUserCredits(ctx, userID)
	if err != nil {
		log.Error().Err(err).Msg("get credits failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get credits"})
		return
	}

	txns, err := h.queries.GetUserTransactions(ctx, db.GetUserTransactionsParams{
		UserID: userID,
		Limit:  20,
		Offset: 0,
	})
	if err != nil {
		txns = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"balance":      uc.Balance,
		"transactions": txns,
	})
}

// CreateOrderRequest is the JSON body for creating a payment order.
type CreateOrderRequest struct {
	PackID string `json:"pack_id" binding:"required"`
}

// CreateOrder creates a Razorpay order for a credit pack.
// POST /credits/orders
func (h *BillingHandler) CreateOrder(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var pack *CreditPack
	for i := range creditPacks {
		if creditPacks[i].ID == req.PackID {
			pack = &creditPacks[i]
			break
		}
	}
	if pack == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid pack_id"})
		return
	}

	ctx := c.Request.Context()
	receiptID := fmt.Sprintf("rcpt_%s_%s", userID.String()[:8], pack.ID)

	// amountPaise: we treat AmountCents as USD cents × 100 → paise equivalent for Razorpay.
	// In production use actual INR conversion; for now paise = cents * 100.
	amountPaise := int(pack.AmountCents) * 100

	orderID, err := h.rzp.CreateOrder(amountPaise, receiptID)
	if err != nil {
		log.Error().Err(err).Str("pack_id", req.PackID).Msg("razorpay create order failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payment order"})
		return
	}

	_, err = h.queries.CreatePaymentOrder(ctx, db.CreatePaymentOrderParams{
		UserID:          userID,
		RazorpayOrderID: orderID,
		AmountCents:     pack.AmountCents,
		Credits:         pack.Credits,
	})
	if err != nil {
		log.Error().Err(err).Str("order_id", orderID).Msg("save payment order failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":        orderID,
		"amount_cents":    pack.AmountCents,
		"credits":         pack.Credits,
		"razorpay_key_id": h.razorpayKeyID,
	})
}

// VerifyPaymentRequest is the JSON body for verifying a completed Razorpay payment.
type VerifyPaymentRequest struct {
	RazorpayOrderID   string `json:"razorpay_order_id" binding:"required"`
	RazorpayPaymentID string `json:"razorpay_payment_id" binding:"required"`
	RazorpaySignature string `json:"razorpay_signature" binding:"required"`
}

// VerifyPayment verifies signature, marks order paid, and credits the user.
// POST /credits/verify
func (h *BillingHandler) VerifyPayment(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !h.rzp.VerifySignature(req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid signature", "code": "INVALID_SIGNATURE"})
		return
	}

	ctx := c.Request.Context()

	order, err := h.queries.GetPaymentOrder(ctx, req.RazorpayOrderID)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if order.Status == "paid" {
		c.JSON(http.StatusConflict, gin.H{"error": "order already processed"})
		return
	}

	// Atomic: mark paid + add credits + record transaction
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction error"})
		return
	}
	defer tx.Rollback(ctx)

	qtx := h.queries.WithTx(tx)

	_, err = qtx.UpdatePaymentOrderStatus(ctx, db.UpdatePaymentOrderStatusParams{
		RazorpayOrderID: req.RazorpayOrderID,
		Status:          "paid",
	})
	if err != nil {
		log.Error().Err(err).Msg("update payment order status failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update order"})
		return
	}

	// Ensure credit record exists
	_, err = qtx.GetOrCreateUserCredits(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to init credits"})
		return
	}

	uc, err := qtx.AddCredits(ctx, db.AddCreditsParams{
		UserID: userID,
		Amount: order.Credits,
	})
	if err != nil {
		log.Error().Err(err).Msg("add credits failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add credits"})
		return
	}

	_, err = qtx.CreateCreditTransaction(ctx, db.CreateCreditTransactionParams{
		UserID:            userID,
		Type:              "purchase",
		Amount:            order.Credits,
		BalanceAfter:      uc.Balance,
		Description:       fmt.Sprintf("Credit purchase (%d credits)", order.Credits),
		RazorpayOrderID:   pgtype.Text{String: req.RazorpayOrderID, Valid: true},
		RazorpayPaymentID: pgtype.Text{String: req.RazorpayPaymentID, Valid: true},
	})
	if err != nil {
		log.Error().Err(err).Msg("create transaction failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record transaction"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance":       uc.Balance,
		"credits_added": order.Credits,
	})
}

// GetAppSettings returns saved settings for an app.
// GET /apps/:id/settings
func (h *BillingHandler) GetAppSettings(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	appID := c.Param("id")
	ctx := c.Request.Context()

	settings, err := h.queries.GetUserAppSettings(ctx, db.GetUserAppSettingsParams{
		UserID: userID,
		AppID:  appID,
	})
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "no saved settings"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

// SaveAppSettingsRequest is the JSON body for saving app settings.
type SaveAppSettingsRequest struct {
	CPUCores    float64 `json:"cpu_cores"`
	MemoryGB    int32   `json:"memory_gb"`
	GPUEnabled  bool    `json:"gpu_enabled"`
	IdleMinutes int32   `json:"idle_minutes"`
}

// SaveAppSettings upserts per-user per-app resource settings.
// PUT /apps/:id/settings
func (h *BillingHandler) SaveAppSettings(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	appID := c.Param("id")

	var req SaveAppSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	settings, err := h.queries.UpsertUserAppSettings(ctx, db.UpsertUserAppSettingsParams{
		UserID:      userID,
		AppID:       appID,
		CPUCores:    req.CPUCores,
		MemoryGB:    req.MemoryGB,
		GPUEnabled:  req.GPUEnabled,
		IdleMinutes: req.IdleMinutes,
	})
	if err != nil {
		log.Error().Err(err).Str("app_id", appID).Msg("upsert app settings failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}
