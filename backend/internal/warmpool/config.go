package warmpool

import (
	"fmt"
	"os"

	"github.com/bootx/backend/internal/models"
	"gopkg.in/yaml.v3"
)

// AppRegistry loads and provides access to app definitions.
type AppRegistry struct {
	apps map[string]*models.AppDefinition
}

// NewAppRegistry loads app definitions from the given YAML file path.
func NewAppRegistry(yamlPath string) (*AppRegistry, error) {
	data, err := os.ReadFile(yamlPath)
	if err != nil {
		return nil, fmt.Errorf("read apps config: %w", err)
	}

	var cfg models.AppsConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse apps config: %w", err)
	}

	registry := &AppRegistry{
		apps: make(map[string]*models.AppDefinition, len(cfg.Apps)),
	}

	for i := range cfg.Apps {
		app := &cfg.Apps[i]
		registry.apps[app.ID] = app
	}

	return registry, nil
}

// GetApp returns the AppDefinition for the given ID, or false if not found.
func (r *AppRegistry) GetApp(id string) (*models.AppDefinition, bool) {
	app, ok := r.apps[id]
	return app, ok
}

// GetAllApps returns a slice of all registered app definitions.
func (r *AppRegistry) GetAllApps() []models.AppDefinition {
	apps := make([]models.AppDefinition, 0, len(r.apps))
	for _, app := range r.apps {
		apps = append(apps, *app)
	}
	return apps
}
