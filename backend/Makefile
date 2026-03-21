.PHONY: all build run dev prod test lint migrate-up migrate-down migrate-status docker-up docker-down docker-build tidy sqlc-generate help

BINARY := bin/server
CMD     := ./cmd/server
GO     := /usr/local/go/bin/go
AIR    := $(HOME)/go/bin/air
GOOSE  := $(GO) run github.com/pressly/goose/v3/cmd/goose

# Load .env if present so DATABASE_URL etc. are available
-include .env
export

all: build

## build: Compile the server binary
build:
	$(GO) build -o $(BINARY) $(CMD)

## run: Run the server locally
run:
	$(GO) run $(CMD)

## dev: Run with Air hot reload
dev:
	$(AIR)

## prod: Build and run the server binary with .env.prod
prod: build
	env $(shell grep -v '^#' .env.prod | xargs) ./$(BINARY)

## test: Run all tests
test:
	$(GO) test ./... -v -race -timeout 120s

## lint: Run golangci-lint
lint:
	golangci-lint run ./...

## tidy: Tidy go.mod and go.sum
tidy:
	$(GO) mod tidy

## migrate-up: Apply all pending DB migrations
migrate-up:
	$(GOOSE) -dir db/migrations postgres "$(DATABASE_URL)" up

## migrate-down: Roll back one migration
migrate-down:
	$(GOOSE) -dir db/migrations postgres "$(DATABASE_URL)" down

## migrate-status: Show migration status
migrate-status:
	$(GOOSE) -dir db/migrations postgres "$(DATABASE_URL)" status

## sqlc-generate: Re-generate DB code from SQL queries
sqlc-generate:
	sqlc generate

## docker-up: Start all services via docker-compose
docker-up:
	docker-compose up -d

## docker-down: Stop all docker-compose services
docker-down:
	docker-compose down

## docker-build: Build all Docker images (use NO_CACHE=1 to skip cache)
docker-build:
	docker build $(if $(NO_CACHE),--no-cache) -t bootx/base:latest    -f docker/base/Dockerfile    docker/base
	docker build $(if $(NO_CACHE),--no-cache) -t bootx/vscode:latest  -f docker/vscode/Dockerfile  docker/vscode
	docker build $(if $(NO_CACHE),--no-cache) -t bootx/ubuntu:latest  -f docker/ubuntu/Dockerfile  docker/ubuntu
	docker build $(if $(NO_CACHE),--no-cache) -t bootx/blender:latest -f docker/blender/Dockerfile docker/blender
	docker build $(if $(NO_CACHE),--no-cache) -t bootx/gazebo:latest  -f docker/gazebo/Dockerfile  docker/gazebo