# Makefile for the studzee backend

.PHONY: help up env-up down env-down build test lint fmt seed logs refresh-cache \
        prisma-generate prisma-migrate prisma-deploy prisma-studio prisma-status db-reset

help:
	@echo "Commands:"
	@echo "  up              : Start all services with Docker Compose."
	@echo "  env-up          : Start all services with Docker Compose with environment variables specified in .env.docker file."
	@echo "  down            : Stop all services."
	@echo "  env-down        : Stop all services with environment variables specified in .env.docker file."
	@echo "  build           : Build the TypeScript source code."
	@echo "  test            : Run tests."
	@echo "  lint            : Lint the source code."
	@echo "  fmt             : Format the source code with Prettier."
	@echo "  seed            : Seed the database with sample data."
	@echo "  logs            : Follow logs for the api service."
	@echo "  refresh-cache   : Manually trigger the cache refresh job."
	@echo ""
	@echo "Postgres (Prisma):"
	@echo "  prisma-generate : Regenerate the Prisma client after a schema change."
	@echo "  prisma-migrate  : Create and apply a migration in development."
	@echo "  prisma-deploy   : Apply existing migrations without creating one. Used in production."
	@echo "  prisma-studio   : Browse the Postgres data in a web UI."
	@echo "  prisma-status   : Show which migrations have been applied."
	@echo "  db-reset        : Drop and recreate the Postgres schema. DESTROYS ALL DATA."


up:
	@echo "Starting docker containers..."
	docker-compose up --build -d

env-up:
	@echo "Starting docker containers with environment variables specified in .env.docker file..."
	docker compose --env-file .env.docker up --build -d

down:
	@echo "Stopping docker containers..."
	docker-compose down


env-down:
	@echo "Stopping docker containers with environment variables specified in .env.docker file..."
	docker compose --env-file .env.docker down

build:
	@echo "Building TypeScript..."
	npm run build

test:
	@echo "Running tests..."
	npm run test

lint:
	@echo "Linting code..."
	npm run lint

fmt:
	@echo "Formatting code..."
	npm run fmt

seed:
	@echo "Seeding database..."
	docker-compose exec api npm run seed

logs:
	@echo "Following api logs..."
	docker-compose logs -f api

refresh-cache:
	@echo "Running cache refresh job..."
	docker-compose exec api npm run job:refresh-cache

# --- Postgres schema (Prisma) ---
# These run against DATABASE_URL from the local .env, not inside a container,
# because the schema is normally managed from the host during development.

prisma-generate:
	@echo "Generating Prisma client..."
	npm run prisma:generate

prisma-migrate:
	@echo "Creating and applying a migration..."
	npm run prisma:migrate

prisma-deploy:
	@echo "Applying pending migrations..."
	npm run prisma:deploy

prisma-studio:
	@echo "Opening Prisma Studio..."
	npm run prisma:studio

prisma-status:
	@echo "Checking migration status..."
	npx prisma migrate status

db-reset:
	@echo "WARNING: this drops the Postgres schema and every row in it."
	@echo "Press Ctrl+C within 5 seconds to cancel."
	@sleep 5
	npx prisma migrate reset --force

