package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bootx/backend/config"
	"github.com/joho/godotenv"
	db "github.com/bootx/backend/db/generated"
	dbembed "github.com/bootx/backend/db/embed"
	"github.com/bootx/backend/internal/api"
	"github.com/bootx/backend/internal/api/handlers"
	"github.com/bootx/backend/internal/auth"
	"github.com/bootx/backend/internal/billing"
	"github.com/bootx/backend/internal/orchestrator"
	"github.com/bootx/backend/internal/session"
	"github.com/bootx/backend/internal/warmpool"
	dockerclient "github.com/docker/docker/client"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load .env file if present (ignored in production where real env vars are set)
	_ = godotenv.Overload()

	// Structured logging setup
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})

	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}

	if cfg.Server.Environment == "production" {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
		if os.Getenv("GIN_MODE") == "" {
			os.Setenv("GIN_MODE", "release")
		}
	}

	ctx := context.Background()

	// Connect to PostgreSQL
	pool, err := pgxpool.New(ctx, cfg.Database.URL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to postgres")
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatal().Err(err).Msg("postgres ping failed")
	}
	log.Info().Msg("connected to postgres")

	// Run migrations
	if err := runMigrations(pool); err != nil {
		log.Fatal().Err(err).Msg("migrations failed")
	}

	// Connect to Redis
	redisOpts, err := redis.ParseURL(cfg.Redis.URL)
	if err != nil {
		log.Fatal().Err(err).Msg("invalid redis URL")
	}
	redisClient := redis.NewClient(redisOpts)
	defer redisClient.Close()

	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatal().Err(err).Msg("redis ping failed")
	}
	log.Info().Msg("connected to redis")

	// Build queries
	queries := db.NewPool(pool)

	// Build orchestrator
	orch, err := buildOrchestrator(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to build orchestrator")
	}

	// Reconcile on startup to re-sync running containers
	sessionIDs, err := orch.Reconcile(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("reconcile failed")
	} else {
		log.Info().Int("live_sessions", len(sessionIDs)).Msg("reconciled running sessions")
	}

	// App registry
	registry, err := warmpool.NewAppRegistry("config/apps.yaml")
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load apps config")
	}

	// Warm pool manager (optional)
	var warmMgr *warmpool.WarmPoolManager
	if cfg.WarmPool.Enabled {
		warmMgr = warmpool.NewWarmPoolManager(registry, orch, redisClient)
		warmMgr.Start(ctx)
		go warmMgr.WatchPool(ctx)
		log.Info().Msg("warm pool started")
	}

	filesBaseDir := os.Getenv("FILES_BASE_DIR")
	if filesBaseDir == "" {
		filesBaseDir = "/data/users"
	}

	// Session manager
	sessionMgr := session.NewManager(queries, orch, warmMgr, registry, filesBaseDir)

	// Idle watcher
	idleWatcher := session.NewIdleWatcher(queries, orch)
	idleWatcher.Start(ctx)

	// Auth components
	log.Info().Str("google_client_id", cfg.Google.ClientID).Str("redirect_url", cfg.Google.RedirectURL).Msg("google oauth config")
	jwtManager := auth.NewJWTManager(cfg.Auth.JWTSecret, cfg.Auth.JWTExpiryHours)
	googleOAuth := auth.NewGoogleOAuth(cfg.Google.ClientID, cfg.Google.ClientSecret, cfg.Google.RedirectURL)

	// Wire up handlers
	authHandler := handlers.NewAuthHandler(
		queries,
		jwtManager,
		googleOAuth,
		redisClient,
		cfg.App.FrontendURL,
		cfg.Auth.RefreshTokenExpiryDays,
		cfg.Billing.WelcomeCredits,
	)
	// Billing config
	billingCfg := billing.Config{
		BaseRate: cfg.Billing.BaseRate,
		CPURate:  cfg.Billing.CPURate,
		MemRate:  cfg.Billing.MemRate,
		GPURate:  cfg.Billing.GPURate,
	}

	// Razorpay service
	rzpService := billing.NewRazorpayService(cfg.Billing.RazorpayKeyID, cfg.Billing.RazorpayKeySecret)

	// Billing worker
	billingWorker := billing.NewWorker(queries, sessionMgr, billingCfg)
	billingWorker.Start(ctx)

	sessionHandler := handlers.NewSessionHandler(queries, sessionMgr, billingCfg)
	appHandler := handlers.NewAppHandler(registry)

	fileHandler := handlers.NewFileHandler(filesBaseDir)

	dockerCli, err := dockerclient.NewClientWithOpts(
		dockerclient.FromEnv,
		dockerclient.WithAPIVersionNegotiation(),
	)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create docker client")
	}
	defer dockerCli.Close()

	terminalHandler := handlers.NewTerminalHandler(queries, dockerCli)
	billingHandler := handlers.NewBillingHandler(queries, rzpService, billingCfg, cfg.Billing.RazorpayKeyID, pool)

	// Build router
	router := api.NewRouter(api.RouterConfig{
		AuthHandler:     authHandler,
		SessionHandler:  sessionHandler,
		AppHandler:      appHandler,
		FileHandler:     fileHandler,
		TerminalHandler: terminalHandler,
		BillingHandler:  billingHandler,
		JWTManager:      jwtManager,
		FrontendURL:     cfg.App.FrontendURL,
	})

	// HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		log.Info().Int("port", cfg.Server.Port).Str("env", cfg.Server.Environment).Msg("server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutdown signal received")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	idleWatcher.Stop()
	billingWorker.Stop()
	if warmMgr != nil {
		warmMgr.Stop()
	}

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("server shutdown error")
	}
	log.Info().Msg("server stopped")
}

func buildOrchestrator(cfg *config.Config) (orchestrator.ContainerOrchestrator, error) {
	switch cfg.App.Orchestrator {
	case "kubernetes", "k8s":
		k8sOrch, err := orchestrator.NewKubernetesOrchestrator(cfg.App.Kubeconfig, cfg.App.GPUEnabled)
		if err != nil {
			return nil, fmt.Errorf("kubernetes orchestrator: %w", err)
		}
		return orchestrator.NewGPURouter(k8sOrch, nil), nil

	default: // "docker"
		dockerOrch, err := orchestrator.NewDockerOrchestrator(cfg.App.GPUEnabled, cfg.App.PublicHost)
		if err != nil {
			return nil, fmt.Errorf("docker orchestrator: %w", err)
		}
		return orchestrator.NewGPURouter(dockerOrch, nil), nil
	}
}

func runMigrations(pool *pgxpool.Pool) error {
	sqlDB := stdlib.OpenDBFromPool(pool)
	defer sqlDB.Close()

	goose.SetBaseFS(dbembed.Migrations)

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("goose set dialect: %w", err)
	}

	if err := goose.Up(sqlDB, "migrations"); err != nil {
		return fmt.Errorf("goose up: %w", err)
	}

	log.Info().Msg("migrations applied")
	return nil
}
