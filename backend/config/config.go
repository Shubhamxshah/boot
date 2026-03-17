package config

import (
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Auth     AuthConfig
	Google   GoogleConfig
	App      AppConfig
	WarmPool WarmPoolConfig
}

type ServerConfig struct {
	Port        int    `mapstructure:"port"`
	Environment string `mapstructure:"environment"`
}

type DatabaseConfig struct {
	URL string `mapstructure:"url"`
}

type RedisConfig struct {
	URL string `mapstructure:"url"`
}

type AuthConfig struct {
	JWTSecret              string `mapstructure:"jwt_secret"`
	JWTExpiryHours         int    `mapstructure:"jwt_expiry_hours"`
	RefreshTokenExpiryDays int    `mapstructure:"refresh_token_expiry_days"`
}

type GoogleConfig struct {
	ClientID     string `mapstructure:"client_id"`
	ClientSecret string `mapstructure:"client_secret"`
	RedirectURL  string `mapstructure:"redirect_url"`
}

type AppConfig struct {
	Orchestrator string `mapstructure:"orchestrator"`
	Kubeconfig   string `mapstructure:"kubeconfig"`
	GPUEnabled   bool   `mapstructure:"gpu_enabled"`
	RunpodAPIKey string `mapstructure:"runpod_api_key"`
	FrontendURL  string `mapstructure:"frontend_url"`
}

type WarmPoolConfig struct {
	Enabled bool `mapstructure:"enabled"`
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath(".")

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// defaults
	viper.SetDefault("server.port", 8005)
	viper.SetDefault("server.environment", "development")
	viper.SetDefault("auth.jwt_expiry_hours", 24)
	viper.SetDefault("auth.refresh_token_expiry_days", 30)
	viper.SetDefault("app.orchestrator", "docker")
	viper.SetDefault("app.gpu_enabled", false)
	viper.SetDefault("warmpool.enabled", true)

	_ = viper.ReadInConfig()

	// Bind env vars
	_ = viper.BindEnv("server.port", "SERVER_PORT")
	_ = viper.BindEnv("server.environment", "ENVIRONMENT")
	_ = viper.BindEnv("database.url", "DATABASE_URL")
	_ = viper.BindEnv("redis.url", "REDIS_URL")
	_ = viper.BindEnv("auth.jwt_secret", "JWT_SECRET")
	_ = viper.BindEnv("auth.jwt_expiry_hours", "JWT_EXPIRY_HOURS")
	_ = viper.BindEnv("auth.refresh_token_expiry_days", "REFRESH_TOKEN_EXPIRY_DAYS")
	_ = viper.BindEnv("google.client_id", "GOOGLE_CLIENT_ID")
	_ = viper.BindEnv("google.client_secret", "GOOGLE_CLIENT_SECRET")
	_ = viper.BindEnv("google.redirect_url", "GOOGLE_REDIRECT_URL")
	_ = viper.BindEnv("app.frontend_url", "FRONTEND_URL")
	_ = viper.BindEnv("app.orchestrator", "ORCHESTRATOR")
	_ = viper.BindEnv("app.kubeconfig", "KUBECONFIG")
	_ = viper.BindEnv("app.gpu_enabled", "GPU_ENABLED")
	_ = viper.BindEnv("app.runpod_api_key", "RUNPOD_API_KEY")
	_ = viper.BindEnv("warmpool.enabled", "WARM_POOL_ENABLED")

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
