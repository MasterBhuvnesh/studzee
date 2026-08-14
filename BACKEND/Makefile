# Makefile for the studzee backend
#
# Two things to know before using it.
#
# 1. Compose v2 is required. Every target calls `docker compose`, the plugin
#    subcommand, not the retired `docker-compose` v1 binary. That binary is not
#    installed here and the targets used to call it, which is why several of
#    them failed.
# 2. The API is behind the `api` compose profile, so `make up` starts
#    infrastructure only and leaves port 4000 to `npm run dev` on the host.
#    Use `make api-up` to run the API as a container instead. Both bind 4000,
#    so only one can run at a time.

.DEFAULT_GOAL := help

.PHONY: help up env-up down env-down ps \
        api-up api-down api-logs api-rebuild \
        build test coverage lint typecheck check fmt seed refresh-cache logs \
        prisma-generate prisma-migrate prisma-deploy prisma-studio prisma-status db-reset

help:
	@echo "Stack:"
	@echo "  up              : Start the infrastructure containers."
	@echo "  env-up          : Same, with variable substitution from .env.docker."
	@echo "  down            : Stop the containers."
	@echo "  env-down        : Stop them, with variable substitution from .env.docker."
	@echo "  ps              : Show container status, including the api profile."
	@echo ""
	@echo "API in a container (the 'api' compose profile):"
	@echo "  api-up          : Build and start the API container alongside the stack."
	@echo "  api-rebuild     : Rebuild and restart the API after a code change."
	@echo "  api-logs        : Follow the API container logs."
	@echo "  api-down        : Stop everything, including the API."
	@echo ""
	@echo "Development:"
	@echo "  build           : Compile TypeScript to dist."
	@echo "  test            : Run the Vitest suite. Needs the stack up."
	@echo "  coverage        : Run the suite with a coverage report."
	@echo "  lint            : ESLint. Warnings are tolerated, errors are not."
	@echo "  typecheck       : tsc --noEmit against the base config, tests included."
	@echo "  check           : lint, typecheck and test. The same three gates CI runs."
	@echo "  fmt             : Format with Prettier."
	@echo "  seed            : Load sample documents. Runs on the host, see note below."
	@echo "  refresh-cache   : Trigger the cache refresh job on the host."
	@echo "  logs            : Follow logs for every container."
	@echo ""
	@echo "Postgres (Prisma):"
	@echo "  prisma-generate : Regenerate the Prisma client after a schema change."
	@echo "  prisma-migrate  : Create and apply a migration in development."
	@echo "  prisma-deploy   : Apply existing migrations without creating one. Used in production."
	@echo "  prisma-studio   : Browse the Postgres data in a web UI."
	@echo "  prisma-status   : Show which migrations have been applied."
	@echo "  db-reset        : Drop and recreate the Postgres schema. DESTROYS ALL DATA."
	@echo ""
	@echo "Note: seed and refresh-cache run on the host, not in the API container."
	@echo "      They go through ts-node, a devDependency, and the production"
	@echo "      image installs with --omit=dev, so it cannot run them."

# --- Stack ---

up:
	@echo "Starting the infrastructure containers..."
	docker compose up -d

env-up:
	@echo "Starting the infrastructure containers with .env.docker substitution..."
	docker compose --env-file .env.docker up -d

down:
	@echo "Stopping the containers..."
	docker compose --profile api down

env-down:
	@echo "Stopping the containers with .env.docker substitution..."
	docker compose --env-file .env.docker --profile api down

ps:
	docker compose --profile api ps

# --- API in a container ---
# The profile has to be passed on every one of these. Without it compose does
# not know the api service exists and reports "no such service".

api-up:
	@echo "Building and starting the API container..."
	docker compose --env-file .env.docker --profile api up -d --build

api-rebuild:
	@echo "Rebuilding and restarting the API container..."
	docker compose --env-file .env.docker --profile api up -d --build api

api-logs:
	docker compose --env-file .env.docker --profile api logs -f api

api-down:
	@echo "Stopping the containers, including the API..."
	docker compose --env-file .env.docker --profile api down

# --- Development ---

build:
	@echo "Building TypeScript..."
	npm run build

test:
	@echo "Running tests..."
	npm run test

coverage:
	@echo "Running tests with coverage, report lands in coverage/index.html..."
	npx vitest run --coverage

lint:
	@echo "Linting..."
	npm run lint

# The base tsconfig, not tsconfig.build.json, so test files are checked too.
# Vitest transpiles without typechecking, so a test can pass and still not
# compile. This is the step that catches it.
typecheck:
	@echo "Typechecking, tests included..."
	npx tsc --noEmit -p tsconfig.json

# The three gates the image build is blocked on in CI. Run this before pushing.
check: lint typecheck test
	@echo "All three CI gates passed."

fmt:
	@echo "Formatting..."
	npm run fmt

# On the host, not in the container. The image omits devDependencies and so has
# no ts-node, which both of these scripts need.
seed:
	@echo "Seeding the database..."
	npm run seed

refresh-cache:
	@echo "Running the cache refresh job..."
	npm run job:refresh-cache

logs:
	docker compose --profile api logs -f

# --- Postgres schema (Prisma) ---
# These run against DATABASE_URL from the local .env, not inside a container,
# because the schema is normally managed from the host during development.

prisma-generate:
	@echo "Generating the Prisma client..."
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
