// Package embed provides the embedded SQL migration files for use with goose.
package embed

import "embed"

// Migrations contains all SQL migration files.
//
//go:embed migrations
var Migrations embed.FS
