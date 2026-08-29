# Studzee API

A production-ready backend service built with TypeScript that provides document management and notification delivery. It exposes public content listing, authenticated document retrieval, device registration for push, a Clerk webhook, and an admin surface covering documents, notifications, email and users.

The service uses MongoDB for content, PostgreSQL for users and delivery logs, Redis for caching, Supabase Storage for files, and Clerk for authentication.

> **Merged service**: the standalone notification service was folded into this backend on 10-08-2026. Endpoints that used to live behind the `/noti/api` prefix are now served here under `/notifications`, `/admin` and `/webhooks`. See [Endpoints](#endpoints) for the mapping.

## Quickstart

There are two ways to run the API, and they are mutually exclusive because both
want port 4000. Pick one.

| Mode          | Command                                   | Use it when                                                                           |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| **Host**      | `docker compose up -d` then `npm run dev` | Writing code. Hot reloads on save and attaches to a debugger.                         |
| **Container** | `docker compose --profile api up -d`      | Checking the image that actually ships. No hot reload, a code change needs `--build`. |

The API is behind the `api` compose profile, so a plain `docker compose up -d`
starts the infrastructure only and leaves port 4000 free for the host process.

**Already set up?** One command:

```bash
npm run dev                 # API on http://localhost:4000
```

**After a reboot, or once you have run `docker compose down`:**

```bash
docker compose up -d        # mongo, postgres, redis, minio, mailpit, mongo-express
npm run dev
```

**First time on a machine:**

```bash
npm install
cp .env.example .env        # then fill in the Clerk keys and storage credentials
docker compose up -d        # buckets and databases are created for you
npm run prisma:generate     # generate the Prisma client
npm run prisma:migrate      # create the Postgres tables
npm run seed                # load the sample documents
npm run dev
```

**Or run the API in a container instead of on the host:**

```bash
docker compose --profile api up -d --build
docker compose logs -f api
```

That builds the production image from the `Dockerfile`, applies any pending
Postgres migrations on start, and publishes the API on
[http://localhost:4000](http://localhost:4000), the same URL as the host mode.
It reads `.env.container`, which is the only env file that addresses the stack
by compose service name. Stop it with `docker compose --profile api down`.

**Confirm it is healthy:**

```bash
curl http://localhost:4000/health/readiness
# {"status":"ready","checks":{"db":"ok","postgres":"ok","redis":"ok"}}
```

Any `"error"` in that response names the store that is not answering. It round trips all three rather than reading connection flags, so it will not report healthy while a dependency is down.

**Dashboards, while the stack is running:**

| What                           | Where                                          |
| ------------------------------ | ---------------------------------------------- |
| API                            | [http://localhost:4000](http://localhost:4000) |
| Mail inbox (Mailpit)           | [http://localhost:8025](http://localhost:8025) |
| Mongo admin (Mongo Express)    | [http://localhost:8081](http://localhost:8081) |
| Object storage (MinIO console) | [http://localhost:9001](http://localhost:9001) |
| Cache (RedisInsight)           | [http://localhost:8001](http://localhost:8001) |
| Postgres data (Prisma Studio)  | `npm run prisma:studio`                        |

**Authenticating locally**: set `NODE_ENV=development` and `DEV_TOKEN` in `.env`, then send `Authorization: Bearer <DEV_TOKEN>` to reach authenticated and admin routes without a Clerk session. It is ignored in every other environment.

**If something will not start:**

| Symptom                                              | Cause                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Server exits at boot naming a variable               | The config schema validates at import time. Add the variable, see [Environment Variables](#environment-variables).                      |
| `EADDRINUSE` on port 4000                            | `ts-node-dev` can outlive its terminal. Kill the stray node process holding the port.                                                   |
| Hangs with repeated Redis errors                     | `REDIS_URL` points somewhere unreachable. Use `redis://localhost:6379` for local work.                                                  |
| `NoSuchBucket` on upload                             | The `minio-init` container did not run. `docker compose up -d minio-init`.                                                              |
| `make` is not recognised                             | Install it, or use the `docker compose` and npm commands directly. On Windows: `winget install ezwinports.make`, then open a new shell. |
| `Cannot find package '@/...'` from every test file   | Vitest was run from the repository root. It has no `package.json` and no Vitest config. Run from `BACKEND`.                             |
| `docker compose --profile api up` fails to bind 4000 | A host `npm run dev` is still holding the port. Stop it, or set `API_PORT` to something else.                                           |
| API container is `unhealthy` but serves traffic      | Its healthcheck probes port 3000. `.env.container` must keep `PORT=3000`.                                                               |

## Table of Contents

- [Quickstart](#quickstart)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Clerk Setup](#clerk-setup)
  - [MongoDB Setup](#mongodb-setup)
  - [PostgreSQL Setup](#postgresql-setup)
  - [SMTP Setup](#smtp-setup)
  - [Object Storage Setup](#object-storage-setup)
- [Usage](#usage)
  - [Development](#development)
  - [Production](#production)
  - [Docker Deployment](#docker-deployment)
  - [Code Quality](#code-quality)
- [Docker Compose Guide](#docker-compose-guide)
  - [Service Architecture](#service-architecture)
  - [Volumes & Data Persistence](#volumes--data-persistence)
  - [Networking](#networking)
  - [Environment Files](#environment-files)
  - [Port Mappings](#port-mappings)
  - [Using MinIO (Local S3)](#using-minio-local-s3)
  - [Health Checks](#health-checks)
  - [Common Docker Commands](#common-docker-commands)
- [Architecture](#architecture)
  - [Key Components](#key-components)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
- [Caching Strategy](#caching-strategy)
- [Database Schema](#database-schema)
- [Development](#development-1)
  - [Project Structure](#project-structure)
  - [Available Commands (Makefile)](#available-commands-makefile)
  - [Additional npm Scripts](#additional-npm-scripts)
  - [Accessing Dashboards](#accessing-dashboards)
  - [Development Authentication Bypass](#development-authentication-bypass)
- [Testing](#testing)
- [Deployment](#deployment)
  - [Environment Setup](#environment-setup)
  - [Docker Production Build](#docker-production-build)
  - [Docker Compose Production](#docker-compose-production)
  - [Render Deployment](#render-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

- **Express.js**: Modern TypeScript-based web framework
- **MongoDB**: Content storage with Mongoose ODM
- **PostgreSQL**: Users, Expo push tokens, and notification and email audit logs, through Prisma
- **Redis Stack**: High-performance caching layer with RedisInsight dashboard
- **Supabase Storage**: File storage for images and PDFs over the S3 protocol, with MinIO standing in locally
- **Clerk**: Enterprise-grade authentication and user management, plus signed webhooks via `svix`
- **Expo Push**: Batched push delivery with automatic pruning of retired device tokens
- **Email**: Transactional email through `nodemailer` with an attachment host allowlist
- **Zod**: Runtime type validation and schema enforcement
- **Gamification**: Server graded quizzes, points, streaks, badges, levels and point gated content on Postgres
- **Scheduled Jobs**: Cache warming, token cleanup, and heartbeat monitoring with `node-cron`
- **Structured Logging**: Production-ready logging with `pino`
- **File Uploads**: Multipart file upload support with `multer`
- **Security**: Helmet security headers, CORS, compression, and rate limiting
- **Docker**: Fully containerized development environment with Docker Compose
- **Developer Tools**: ESLint, Prettier, Makefile automation, and development auth bypass
- **Testing**: Test suite with `vitest`
- **Production Ready**: Health checks, heartbeat monitoring for Render deployment

## Prerequisites

### Required

| Tool                                      | Version                | Why                                                                                                                                                  |
| ----------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Docker Desktop](https://www.docker.com/) | any current release    | Runs Mongo, Postgres, Redis, MinIO and Mailpit, and optionally the API itself. Must be running before `docker compose`.                              |
| Docker Compose                            | v2                     | Ships inside Docker Desktop. The commands here are `docker compose`, not the older `docker-compose` binary. Profiles are a v2 feature.               |
| [Node.js](https://nodejs.org/)            | 22                     | The Dockerfile builds on `node:22-alpine`, so 22 is what the deployed image runs. Newer versions work locally but are not what CI or production use. |
| npm                                       | 10, ships with Node 22 | `package-lock.json` is the lockfile. CI runs `npm ci` against it, so it is the one that must stay accurate.                                          |

### Optional

| Tool                   | Why                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Bun](https://bun.sh/) | Only as a faster script runner. `bun run dev` and `bun run test` execute the same `package.json` scripts, and the scripts themselves still run on Node through `ts-node-dev`. The Bun **runtime** was dropped from this project on 10-08-2026, so do not add `bun` to the lockfile or the Dockerfile. |
| `make`                 | Convenience wrapper over the commands below, and `make check` runs the three CI gates in one go. Every target works as of 14-08-2026. Install with `winget install ezwinports.make` on Windows, then open a new shell. See [Available Commands](#available-commands-makefile).                        |

### Accounts and services

Local development needs none of these. The compose stack substitutes for all
four, so a fresh clone runs with no external account.

| Service          | Local stand-in                              | Needed for real when                                 |
| ---------------- | ------------------------------------------- | ---------------------------------------------------- |
| Clerk            | `DEV_TOKEN` bearer bypass, development only | Testing real sign-in, or the `/webhooks/clerk` route |
| MongoDB Atlas    | `mongo` container                           | Deploying                                            |
| PostgreSQL       | `postgres` container                        | Deploying                                            |
| Supabase Storage | `minio` plus `minio-init`                   | Deploying, or verifying against the real buckets     |
| SMTP provider    | `mailpit` container                         | Sending mail that leaves the machine                 |

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd BACKEND
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your configuration values in `.env` (see Configuration section below)

4. **Build and start services**

   ```bash
   make up
   ```

5. **Generate the Prisma client and apply migrations**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

   `npm run build` runs `prisma generate` for you, and the Docker image runs
   `prisma migrate deploy` on start. These commands are for local development
   before the first run.

## Configuration

### Environment Variables

Configuration is parsed and validated by Zod at import time. A missing or malformed required variable throws before the server starts, rather than failing on the first request that needs it.

| Variable                       | Description                                                              | Required | Default               |
| ------------------------------ | ------------------------------------------------------------------------ | -------- | --------------------- |
| `NODE_ENV`                     | Environment (development/production/test)                                | Yes      | development           |
| `PORT`                         | Server port                                                              | No       | 4000                  |
| `MONGO_URI`                    | MongoDB connection string                                                | Yes      | -                     |
| `DB_NAME`                      | MongoDB database name                                                    | No       | Studzee_Database      |
| `MONGO_ROOT_USER`              | MongoDB root username (Docker only)                                      | Yes      | -                     |
| `MONGO_ROOT_PASSWORD`          | MongoDB root password (Docker only)                                      | Yes      | -                     |
| `DATABASE_URL`                 | PostgreSQL connection string used by Prisma                              | Yes      | -                     |
| `POSTGRES_USER`                | Postgres username (Docker only)                                          | No       | postgres              |
| `POSTGRES_PASSWORD`            | Postgres password (Docker only)                                          | No       | postgres              |
| `POSTGRES_DB`                  | Postgres database name (Docker only)                                     | No       | studzee_notifications |
| `POSTGRES_PORT`                | Postgres host port (Docker only)                                         | No       | 5432                  |
| `REDIS_URL`                    | Redis connection URL                                                     | Yes      | -                     |
| `CLERK_SECRET_KEY`             | Clerk authentication secret key                                          | Yes      | -                     |
| `CLERK_PUBLISHABLE_KEY`        | Clerk publishable key                                                    | Yes      | -                     |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Signing secret for `/webhooks/clerk`. The webhook returns 500 without it | No       | -                     |
| `LIST_CACHE_TTL`               | List cache TTL in seconds                                                | No       | 300                   |
| `DOC_CACHE_TTL`                | Document cache TTL in seconds                                            | No       | 86400                 |
| `TODAY_CACHE_TTL`              | Today's content cache TTL in seconds                                     | No       | 3600                  |
| `JOB_CRON`                     | Cron expression for cache refresh job (currently unused)                 | No       | 0 0 \* \* \*          |
| `LOG_LEVEL`                    | Logging level (info/debug/error)                                         | No       | info                  |
| `S3_REGION`                    | Storage region. Must match the Supabase project region exactly           | Yes      | -                     |
| `S3_ACCESS_KEY_ID`             | Storage access key ID                                                    | Yes      | -                     |
| `S3_SECRET_ACCESS_KEY`         | Storage secret access key                                                | Yes      | -                     |
| `S3_BUCKET_IMAGES`             | Public bucket holding uploaded images                                    | Yes      | -                     |
| `S3_BUCKET_PDFS`               | Public bucket holding uploaded PDFs                                      | Yes      | -                     |
| `S3_ENDPOINT`                  | S3 API endpoint, Supabase or MinIO                                       | Yes      | -                     |
| `S3_PUBLIC_URL`                | Base public object URLs are built from, bucket and key appended          | Yes      | -                     |
| `SMTP_HOST`                    | SMTP server hostname                                                     | Yes      | -                     |
| `SMTP_PORT`                    | SMTP port. Implicit TLS on 465, STARTTLS elsewhere                       | No       | 587                   |
| `SMTP_USER`                    | SMTP username                                                            | Yes      | -                     |
| `SMTP_PASSWORD`                | SMTP password                                                            | Yes      | -                     |
| `EMAIL_FROM`                   | Sender address on outbound email                                         | Yes      | -                     |
| `SITE_URL`                     | Public site URL used in email templates                                  | No       | https://studzee.in    |
| `EMAIL_BANNER_URL`             | Banner image used in email templates                                     | No       | the S3 brand banner   |
| `EMAIL_ATTACHMENT_HOSTS`       | Comma separated hosts an email attachment may be fetched from            | No       | the S3 asset bucket   |
| `DEV_TOKEN`                    | Development auth bypass token (bypasses Clerk authentication)            | No       | -                     |
| `HEALTHCHECK_URL`              | URL for the heartbeat job to ping. The job is skipped when unset         | No       | -                     |
| `AI_ENABLED`                   | Turns the whole AI layer on. Everything below is ignored while false     | No       | `false`               |
| `AI_BASE_URL`                  | OpenAI compatible endpoint for chat completions and embeddings           | No       | NVIDIA build          |
| `AI_API_KEY`                   | Provider key. **Required** once `AI_ENABLED` is true                     | No       | -                     |
| `AI_MODEL`                     | Chat model for generation and support answers                            | No       | Nemotron 3 Ultra      |
| `AI_EMBED_MODEL`               | Embedding model for the knowledge base                                   | No       | `nemotron-3-embed-1b` |
| `AI_EMBED_DIM`                 | Embedding dimension. Must match the `vector(n)` column in the migration  | No       | `2048`                |
| `AI_TIMEOUT_MS`                | Deadline for one model call                                              | No       | `120000`              |
| `AI_MAX_TOKENS`                | Completion ceiling                                                       | No       | `8192`                |
| `AI_SUPPORT_DAILY_LIMIT`       | Support questions one user may ask per UTC day                           | No       | `30`                  |

### Clerk Setup

1. Create a Clerk application at [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to API Keys and copy your Secret Key and Publishable Key
3. Add the keys to your `.env` file
4. Set up roles in Clerk and create an `admin` role for admin access
5. Add a webhook endpoint pointing at `<your-host>/webhooks/clerk`, subscribe it to `user.created`, and copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`. This is what triggers the welcome email.

> **Note**: `CLERK_WEBHOOK_SIGNING_SECRET` is optional in config, but the webhook route refuses every delivery with a 500 while it is unset, because the signature is that endpoint's only authentication. Leave it unset only if you are not using the webhook at all.

### AI Setup

The AI layer is off by default. `AI_ENABLED=false` means no key is needed, no
job runs, and every AI route answers `503 AI_DISABLED`, so an existing
deployment is unaffected until you turn it on.

To enable it:

1. Create an API key at [build.nvidia.com](https://build.nvidia.com/) and put
   it in `AI_API_KEY`. Any OpenAI compatible host works by changing
   `AI_BASE_URL`.
2. Set `AI_ENABLED=true`. The service now refuses to boot without a key, the
   same way it does for every other credential.
3. Run the migration, then `npm run ai:reindex` to build the knowledge base.

Two things are easy to get wrong.

> **`AI_EMBED_DIM` is not a free choice.** It has to equal the dimension of
> whatever `AI_EMBED_MODEL` returns, and the `KbChunk.embedding` column is
> declared `vector(2048)` in the migration because `nemotron-3-embed-1b`
> returns 2048. Changing the embedding model means writing a migration for the
> new dimension, not editing an environment variable. The client checks the two
> against each other on every embed call and refuses, rather than letting it
> surface as an opaque Postgres error later.

> **Model output is punctuation normalised before anything sees it.** House
> style forbids em dashes and models emit them regardless of what the prompt
> says, which showed up on the very first live generation. `client.ts`
> rewrites a dash used as punctuation into a comma on the raw reply, so one
> pass covers every generated field and every support answer. If you are
> reading generated copy and wondering where a dash went, that is where.

> **There is no vector index, deliberately.** pgvector caps an HNSW index at
> 2000 dimensions and the embeddings are 2048, so the usual
> `hnsw (embedding vector_cosine_ops)` is rejected outright. The knowledge base
> is a few dozen chunks, where an exact scan is already sub millisecond. If the
> corpus ever reaches the thousands, store the column as `halfvec(2048)` and
> index that instead, which HNSW supports up to 4000 dimensions.

> **Postgres needs the `vector` extension.** `docker-compose.yml` runs
> `pgvector/pgvector:pg16` for this reason, and the migration runs
> `CREATE EXTENSION IF NOT EXISTS vector`. If you are upgrading an existing
> local stack from `postgres:16-alpine`, the `studzee-postgres-data` volume may
> need recreating; the migrations and seeders restore local state. RDS, Neon
> and Supabase all offer pgvector, so this does not narrow the deployment
> options.

### MongoDB Setup

1. Create a MongoDB cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or use a local instance
2. Get your connection string
3. Add connection details to your `.env` file

### PostgreSQL Setup

PostgreSQL holds users, Expo push tokens, and the notification and email audit logs. Content stays in MongoDB.

1. Use the `postgres` service in `docker-compose.yml` for local work, or provision a managed instance
2. Set `DATABASE_URL` in your `.env` file
3. Apply the schema:

   ```bash
   npm run prisma:migrate     # development, creates and applies migrations
   npm run prisma:deploy      # production, applies existing migrations only
   ```

4. Inspect the data with `npm run prisma:studio` if needed

### SMTP Setup

**Local development** needs no provider account. `docker-compose.yml` runs Mailpit, which catches every outbound message and shows it in a web UI rather than delivering it. The defaults in `.env.example` already point at it:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=dev
SMTP_PASSWORD=dev
EMAIL_FROM=Studzee <no-reply@studzee.local>
```

Start the stack with `make up`, then open [http://localhost:8025](http://localhost:8025) to read anything the service sends. Mailpit accepts any credentials, so `SMTP_USER` and `SMTP_PASSWORD` can be any value locally.

**Deployed environments:**

1. Obtain SMTP credentials from your mail provider
2. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM`. Port 465 uses implicit TLS, anything else uses STARTTLS
3. If you send email attachments, add every host they are served from to `EMAIL_ATTACHMENT_HOSTS`. Anything not on that list is rejected before the message is sent

### Object Storage Setup

Storage is **Supabase Storage**, which speaks the S3 protocol, so the AWS SDK talks to it directly. MinIO is used for local development and speaks the same protocol, so a single code path serves both and only the endpoint and credentials change.

#### Supabase (deployed environments)

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard)
2. Create two **public** buckets, `images` and `pdfs`. Uploads are separated by type rather than sharing one bucket with key prefixes. A third bucket, `assets`, serves the brand banner used by the email templates; the application never writes to it, so it needs no configuration.
3. Go to **Project Settings > Storage** and generate an **S3 access key**. It yields an access key ID and a secret access key.
4. Fill in the storage block of your `.env`:

   ```env
   S3_REGION=ap-northeast-2
   S3_ACCESS_KEY_ID=<from the dashboard>
   S3_SECRET_ACCESS_KEY=<from the dashboard>
   S3_BUCKET_IMAGES=images
   S3_BUCKET_PDFS=pdfs
   S3_ENDPOINT=https://<project-ref>.storage.supabase.co/storage/v1/s3
   S3_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public
   ```

> **`S3_PUBLIC_URL` ends at `/public`, with no bucket.** The bucket and key are appended per object, because uploads span two buckets.

> **`S3_REGION` must match the project region exactly.** A mismatch fails request signing, and the error does not name the region as the cause.

> **`S3_ENDPOINT` and `S3_PUBLIC_URL` are different hosts.** Supabase serves the S3 API from `<ref>.storage.supabase.co` and public objects from `<ref>.supabase.co`, so the public URL cannot be derived from the endpoint and is configured separately.

> **`forcePathStyle` is always on.** Supabase and MinIO both address a bucket as a path segment. The AWS SDK defaults to virtual-hosted style, which neither resolves. The client sets it unconditionally, so nothing to configure.

#### MinIO (local development)

`docker-compose.yml` runs MinIO, so local work needs no Supabase credentials and cannot touch real files. The defaults in `.env.example` already point at it.

A one-shot `minio-init` container creates the `images`, `pdfs` and `assets` buckets and marks them publicly readable as soon as MinIO reports healthy, so the local layout matches the Supabase project with no manual step. MinIO creates nothing on its own, so without it every upload fails with `NoSuchBucket`. The container runs once and exits; `docker compose ps -a` shows it as `exited (0)`, which is expected.

> **Note**: the upload bucket must allow public read, since the application stores a plain public URL on the document and the clients fetch it directly. No ACL is set per object.

## Usage

### Development

> **Note**: `docker compose up -d` runs the infrastructure only. The API stays on the host for local development, so it hot reloads and can be debugged directly. To run it as a container instead, see [Running the API in a container](#running-the-api-in-a-container).

**1. Start infrastructure services:**

```bash
# Starts Mongo, Postgres, Redis, MinIO, Mailpit and Mongo Express
make up
# Or manually:
docker-compose up -d
```

**2. Apply the Postgres schema** (first run, or after a schema change):

```bash
npm run prisma:migrate
```

**3. Run the API:**

```bash
npm run dev
```

**4. Confirm every dependency is reachable:**

```bash
curl http://localhost:4000/health/readiness
# {"status":"ready","checks":{"db":"ok","postgres":"ok","redis":"ok"}}
```

Any `"error"` in that response names the store that is not answering.

This setup allows you to:

- Modify code and see changes with hot-reload
- Use your local Node.js environment
- Easily debug the application

### Running the API in a container

`docker-compose.yml` defines an `api` service behind the `api` profile. The
profile is what keeps it out of a plain `docker compose up -d`, so the default
still starts infrastructure only and leaves port 4000 to the host process.

```bash
# Build the production image and start it along with every dependency
docker compose --profile api up -d --build

# Follow its logs
docker compose logs -f api

# Rebuild after a code change, there is no hot reload in this mode
docker compose --profile api up -d --build api

# Stop everything, including the API
docker compose --profile api down
```

Details worth knowing:

- It builds the `production` target of the `Dockerfile`, so it is the image that ships, not a development variant. Test code and the toolchain are not in it.
- It reads `.env.container`. That is the only env file that addresses the stack by compose service name rather than `localhost`, which is what a process inside the network needs. Using `.env` or `.env.docker` here fails at boot with `P1001` from `prisma migrate deploy`.
- It publishes `${API_PORT:-4000}:3000`. The container listens on 3000 because the image declares `EXPOSE 3000` and probes 3000 in its healthcheck. Set `API_PORT` if 4000 is taken.
- Its entrypoint runs `prisma migrate deploy` before the app, which is why every dependency is a `service_healthy` dependency. If Postgres is not accepting connections the container exits 1 rather than retrying.

### Production

```bash
npm run build
npm start
```

### Docker Deployment

```bash
# Start the infrastructure containers
docker compose up -d

# Stop them
docker compose down

# View logs for a service
docker compose logs -f mongo
```

To run the API itself in a container rather than on the host, see [Environment Files](#environment-files) for the `.env.container` invocation.

## Docker Compose Guide

The project includes a comprehensive Docker Compose setup for local development and testing. This section provides detailed information about the containerized environment.

### Service Architecture

The `docker-compose.yml` defines **7 infrastructure services** plus the **API itself**. Of the infrastructure, six are long running and one, `minio-init`, runs once and exits.

> **The `api` service does not start by default.** It sits behind the `api` compose profile, so `docker compose up -d` brings up infrastructure only and the API runs on the host under `npm run dev`. Add `--profile api` to run it as a container instead. Both bind port 4000, so only one can run at a time.

#### 1. **MongoDB (`mongo`)**

- **Image**: `mongo:7`
- **Purpose**: Primary database for document storage
- **Container Name**: `studzee_mongo`
- **Port**: `27017` (configurable via `MONGO_PORT`)
- **Credentials**: Set via `MONGO_ROOT_USER` and `MONGO_ROOT_PASSWORD`
- **Health Check**: Uses `mongosh` to ping the database every 30 seconds
- **Volume**: `studzee-mongo-data` for data persistence

#### 2. **PostgreSQL (`postgres`)**

- **Image**: `postgres:16-alpine`
- **Purpose**: Users, Expo push tokens, and the notification and email audit logs
- **Container Name**: `studzee_postgres`
- **Port**: `5432` (configurable via `POSTGRES_PORT`)
- **Credentials**: Set via `POSTGRES_USER` and `POSTGRES_PASSWORD`, database via `POSTGRES_DB`
- **Health Check**: Uses `pg_isready` every 10 seconds
- **Volume**: `studzee-postgres-data` for data persistence
- **Schema**: Managed by Prisma, see `prisma/schema.prisma` and `prisma/migrations`

#### 3. **Redis Stack (`redis`)**

- **Image**: `redis/redis-stack:latest`
- **Purpose**: High-performance caching layer with built-in RedisInsight dashboard
- **Container Name**: `studzee_redis`
- **Ports**:
  - `6379`: Redis server (configurable via `REDIS_PORT`)
  - `8001`: RedisInsight web dashboard (configurable via `REDIS_INSIGHT_PORT`)
- **Health Check**: Uses `redis-cli ping` every 30 seconds
- **Volume**: `studzee-redis-data` for cache persistence

#### 4. **MinIO (`minio`)**

- **Image**: `minio/minio:latest`
- **Purpose**: S3-compatible object storage for local development, standing in for Supabase Storage
- **Container Name**: `studzee_minio`
- **Ports**:
  - `9000`: MinIO API endpoint (configurable via `MINIO_PORT`)
  - `9001`: MinIO web console (configurable via `MINIO_CONSOLE_PORT`)
- **Credentials**: Set via `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
- **Health Check**: Curls the MinIO health endpoint every 30 seconds
- **Volume**: `studzee-minio-data` for object storage persistence

#### 5. **MinIO Init (`minio-init`)**

- **Image**: `minio/mc:latest`
- **Purpose**: Creates the `images`, `pdfs` and `assets` buckets and marks them publicly readable, so local storage matches the Supabase project with no manual console step
- **Container Name**: `studzee_minio_init`
- **Ports**: None, it is not a server
- **Depends On**: MinIO must report healthy before it starts
- **Lifecycle**: Runs once and exits. `docker compose ps -a` shows it as `exited (0)`, which is success, not a failure
- **Why it is required**: MinIO creates no buckets on its own, so without this every upload fails with `NoSuchBucket`

#### 6. **Mailpit (`mailpit`)**

- **Image**: `axllent/mailpit:latest`
- **Purpose**: Local SMTP catcher. Accepts every message and displays it in a web UI instead of delivering it, so development and tests never send real email.
- **Container Name**: `studzee_mailpit`
- **Ports**:
  - `1025`: SMTP endpoint the API sends through (configurable via `MAILPIT_SMTP_PORT`)
  - `8025`: Web UI for reading caught messages (configurable via `MAILPIT_UI_PORT`)
- **Auth**: Accepts any credentials, so `SMTP_USER` and `SMTP_PASSWORD` can be any value locally
- **Health Check**: Polls the Mailpit readiness endpoint every 30 seconds
- **Volume**: `studzee-mailpit-data` so caught messages survive a restart

#### 7. **Mongo Express (`mongo-express`)**

- **Image**: `mongo-express:latest`
- **Purpose**: Web-based MongoDB admin interface
- **Container Name**: `studzee_mongo_express`
- **Port**: `8081` (configurable via `MONGO_EXPRESS_PORT`)
- **Features**: Browse collections, run queries, manage documents
- **Depends On**: MongoDB service must be healthy before starting

#### 8. **The API (`api`)**

- **Build**: the `production` target of the local `Dockerfile`, tagged `studzee-api:local`
- **Purpose**: the service itself, for checking the image that actually ships
- **Container Name**: `studzee_api`
- **Profile**: `api`, so it is skipped unless you pass `--profile api`
- **Port**: `${API_PORT:-4000}` on the host, mapped to `3000` in the container
- **Env**: `.env.container`, the only file that resolves dependencies by compose service name
- **Depends On**: mongo, postgres, redis, minio and mailpit must all report healthy first, because the entrypoint runs `prisma migrate deploy` before the app
- **Health Check**: `GET /health/liveness` on port 3000 every 30 seconds
- **No hot reload**: a code change needs `docker compose --profile api up -d --build api`

By default the API is **not** running as a container. It runs on the host with `npm run dev`, which hot reloads and can be attached to a debugger, and connects to the containers above over `localhost`.

The Makefile matches this. `make seed` and `make refresh-cache` run on the host
rather than shelling into the container, because both scripts go through
`ts-node`, a devDependency the production image omits. `make api-logs` passes
the profile, so it works when the container is up; in the host workflow the API
logs to the terminal running `npm run dev`.

```bash
make seed             # or npm run seed
make refresh-cache    # or npm run job:refresh-cache
make api-logs         # container mode only
```

Management dashboards for the containers are listed under [Accessing Dashboards](#accessing-dashboards).

### Volumes & Data Persistence

The Docker Compose setup uses **named volumes** to persist data across container restarts:

| Volume Name             | Purpose            | Data Stored                                     |
| ----------------------- | ------------------ | ----------------------------------------------- |
| `studzee-mongo-data`    | MongoDB storage    | Content collections, indexes, configurations    |
| `studzee-postgres-data` | PostgreSQL storage | Users, push tokens, notification and email logs |
| `studzee-redis-data`    | Redis storage      | Cache data, persistence snapshots               |
| `studzee-minio-data`    | MinIO storage      | Uploaded images, PDFs, and other objects        |
| `studzee-mailpit-data`  | Mailpit storage    | Caught outbound email                           |

**Volume Management**:

```bash
# List volumes
docker volume ls | grep studzee

# Inspect a volume
docker volume inspect studzee-mongo-data

# Remove all volumes (WARNING: deletes all data)
docker-compose down -v
```

### Networking

All services communicate through a dedicated Docker bridge network:

- **Network Name**: `studzee-network`
- **Driver**: `bridge`
- **Features**:
  - Automatic DNS resolution between services
  - Services can reference each other by service name (e.g., `mongo`, `redis`, `minio`)
  - Isolated from other Docker networks

**Example**: When the API connects to MongoDB, it uses the hostname `mongo` instead of `localhost` when running inside Docker.

### Environment Files

The project has three environment files. The difference that matters is **where the API process runs**, because that decides how it must address the databases.

| File             | Read by                                    | Dependency hosts      | Tracked        |
| ---------------- | ------------------------------------------ | --------------------- | -------------- |
| `.env`           | The API on your host                       | `localhost`           | No, gitignored |
| `.env.docker`    | `docker compose`, and the API on your host | `localhost`           | Yes            |
| `.env.container` | The API inside a container                 | Compose service names | Yes            |

> **`.env.docker` does not mean "for running in Docker".** It means "for talking to the Docker stack" from outside it. Both it and `.env` use `localhost`, which is correct for a host process, because every container publishes its ports to the host.

#### `.env` (default)

Local development, pointed at whichever storage you configure:

```bash
docker compose up -d
npm run dev
```

#### `.env.docker` (host process, pinned to MinIO)

Same as above but with no cloud account needed, and it is also the file `make env-up` feeds to compose for variable substitution:

```bash
make env-up      # docker compose --env-file .env.docker up -d
npm run dev
```

#### `.env.container` (the API inside a container)

The only file that addresses dependencies as `mongo`, `postgres`, `redis`, `minio` and `mailpit`. Inside a container `localhost` is the container itself, so the other two files fail at boot with `P1001: Can't reach database server at localhost:5432` from `prisma migrate deploy`, before the application starts.

```bash
docker build -t studzee-api:local .
docker compose up -d
docker run --rm --name studzee_api \
  --network studzee_network \
  --env-file .env.container \
  -p 4000:3000 \
  studzee-api:local
```

Two details in that file are deliberate and easy to get wrong:

- **`PORT=3000`, not 4000.** The Dockerfile declares `EXPOSE 3000` and its `HEALTHCHECK` probes port 3000, so the app has to listen there or the container is reported `unhealthy` while serving traffic perfectly well. Publishing `-p 4000:3000` keeps the usual `http://localhost:4000` from outside.
- **`S3_ENDPOINT` and `S3_PUBLIC_URL` point at different hosts.** Uploads go to `http://minio:9000` from inside the network, while the URL stored on the document stays `http://localhost:9000` because a browser or mobile client on the host is what fetches it later and cannot resolve `minio`. This mirrors Supabase, where the two are also different hosts.

> **Known limitation**: email attachments are fetched by the API at send time, and stored PDF URLs use `S3_PUBLIC_URL`, so they read `localhost:9000` and the container cannot fetch them. `pdfUrls` on `POST /admin/emails/send` therefore fails from inside Docker. Email without attachments is unaffected.

### Port Mappings

Complete reference of all exposed ports:

| Port    | Service       | Purpose               | Environment Variable |
| ------- | ------------- | --------------------- | -------------------- |
| `4000`  | API           | Application server    | `PORT`               |
| `27017` | MongoDB       | Content database      | `MONGO_PORT`         |
| `5432`  | PostgreSQL    | Notification database | `POSTGRES_PORT`      |
| `6379`  | Redis         | Cache connection      | `REDIS_PORT`         |
| `1025`  | Mailpit SMTP  | Local mail delivery   | `MAILPIT_SMTP_PORT`  |
| `8001`  | RedisInsight  | Redis web dashboard   | `REDIS_INSIGHT_PORT` |
| `8025`  | Mailpit UI    | Read caught email     | `MAILPIT_UI_PORT`    |
| `8081`  | Mongo Express | MongoDB web admin     | `MONGO_EXPRESS_PORT` |
| `9000`  | MinIO         | Object storage API    | `MINIO_PORT`         |
| `9001`  | MinIO Console | MinIO web interface   | `MINIO_CONSOLE_PORT` |

**Accessing Services**:

- API: `http://localhost:4000` (when running)
- MongoDB: `mongodb://localhost:27017`
- PostgreSQL: `postgresql://postgres:postgres@localhost:5432/studzee_notifications`
- Redis: `redis://localhost:6379`
- Mailpit UI: `http://localhost:8025`
- RedisInsight: `http://localhost:8001`
- Mongo Express: `http://localhost:8081`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

### Using MinIO (Local S3)

MinIO provides an S3-compatible storage solution for local development without requiring Supabase credentials.

#### Setup Steps

1. **Start MinIO**:

   ```bash
   make env-up
   ```

2. **Access MinIO Console**:
   - Open `http://localhost:9001` in your browser
   - Login with credentials from `.env.docker`:
     - Username: `minioadmin` (or your `MINIO_ROOT_USER`)
     - Password: `miniopassword` (or your `MINIO_ROOT_PASSWORD`)

3. **Buckets**: nothing to do. The `minio-init` container has already created `images`, `pdfs` and `assets` and set them to public read. Use the console only to inspect them or to add another bucket.

4. **Public Access**: also already applied by `minio-init`, which runs `mc anonymous set download` on each bucket. This is required, not optional, because the application stores a plain public URL on the document and the clients fetch it directly. The equivalent policy, for reference:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": { "AWS": ["*"] },
         "Action": ["s3:GetObject"],
         "Resource": ["arn:aws:s3:::images/*", "arn:aws:s3:::pdfs/*"]
       }
     ]
   }
   ```

5. **Run the API** with MinIO configuration:
   ```bash
   npm run dev
   ```

#### MinIO Features

- **Browser-based UI**: Manage buckets, upload files, set permissions
- **S3-Compatible API**: Works with the AWS SDK without code changes, exactly as Supabase Storage does
- **Local Development**: No internet connection or Supabase account required
- **Fast Testing**: Instant uploads without network latency

#### Bucket Structure

When using the application, files are organized as:

```
images/
└── <document-id>.<extension>   (e.g. 507f1f77bcf86cd799439011.png)
pdfs/
└── <document-title>.pdf        (e.g. introduction-to-typescript.pdf)
assets/
└── studzee_banner.png          (email banner, never written by the app)
```

### Health Checks

All core services include health check configurations to ensure reliability:

| Service    | Check Command                               | Interval | Timeout | Retries | Start Period |
| ---------- | ------------------------------------------- | -------- | ------- | ------- | ------------ |
| MongoDB    | `mongosh --eval "db.adminCommand('ping')"`  | 30s      | 10s     | 5       | 30s          |
| PostgreSQL | `pg_isready -U $POSTGRES_USER`              | 10s      | 5s      | 5       | 10s          |
| Redis      | `redis-cli ping`                            | 30s      | 10s     | 5       | 30s          |
| MinIO      | `curl -f http://localhost:9001/health`      | 30s      | 10s     | 5       | 30s          |
| Mailpit    | `wget -q -O - http://localhost:8025/readyz` | 30s      | 10s     | 5       | 10s          |

**Health Check Benefits**:

- Container orchestration systems (like Kubernetes) use these to determine service readiness
- `depends_on` with `condition: service_healthy` ensures proper startup order
- Automatic restart of unhealthy containers (with `restart: unless-stopped`)

**Checking Service Health**:

```bash
# View health status of all services
docker-compose ps

# Check specific service health
docker inspect studzee_mongo --format='{{json .State.Health}}'
```

### Common Docker Commands

Extended reference of useful Docker Compose commands:

#### Starting & Stopping

```bash
# Start all services (uses .env)
make up
# OR
docker-compose up -d

# Start with .env.docker configuration
make env-up
# OR
docker compose --env-file .env.docker up -d

# Stop all services
make down
# OR
docker-compose down

# Stop and remove volumes (deletes all data!)
docker-compose down -v
```

#### Monitoring

```bash
# View logs for all services
docker compose logs

# Follow API logs. The profile is required, or compose reports no such service.
docker compose --profile api logs -f api
# OR
make api-logs

# View logs for specific service
docker compose logs mongo
docker compose logs postgres
docker compose logs redis
docker compose logs minio
docker compose logs mailpit

# Check service status, api profile included
docker compose --profile api ps
# OR
make ps
```

#### Database Operations

```bash
# Seed the database. Run on the host, not in the container: the image ships
# without devDependencies, so it has no ts-node and these scripts cannot run
# inside it. `make seed` and `make refresh-cache` shell into the container and
# fail for the same reason.
npm run seed

# Refresh cache
npm run job:refresh-cache

# Access MongoDB shell
docker-compose exec mongo mongosh -u root -p password

# Access the Postgres shell
docker-compose exec postgres psql -U postgres -d studzee_notifications

# Access Redis CLI
docker-compose exec redis redis-cli
```

#### Maintenance

```bash
# Restart a specific service
docker-compose restart mongo

# Rebuild and restart services
docker-compose up -d --build

# Pull latest images
docker-compose pull

# View resource usage
docker stats
```

### Code Quality

```bash
# Lint code
make lint

# Format code
make fmt

# Run tests
make test
```

## Architecture

The service follows a clean architecture pattern with clear separation of concerns:

```
prisma/                 # Postgres schema and migration history
src/
├── api/                # HTTP layer
│   ├── controllers/    # admin, content, email, notification, pdf, upload, user, webhook
│   └── routes/         # admin, content, health, healthcheck, notification, pdf, webhook
├── cli/                # Command-line tools
│   ├── seeds/          # Database seeding scripts
│   └── tools/          # Utility tools (cache refresh, etc.)
├── config/             # Configuration (env, mongo, postgres, redis, s3)
├── data/               # Sample data files (JSON, test images/PDFs)
├── jobs/               # Scheduled jobs (cache refresh, heartbeat, token cleanup)
├── middleware/         # auth, errorHandler, helmet, rateLimit, upload, validation
├── models/             # Mongoose models and Zod schemas
├── services/           # Business logic layer
│   ├── admin.service.ts         # Document CRUD
│   ├── content.service.ts       # Content retrieval and caching
│   ├── email.service.ts         # Transactional email
│   ├── expo.service.ts          # Expo push delivery
│   ├── notification.service.ts  # Notification and email audit logs
│   ├── pdf.service.ts           # PDF listing
│   ├── upload.service.ts        # File uploads to S3
│   └── user.service.ts          # Users and push token registration
├── tests/              # Test suite (vitest)
├── types/              # TypeScript type definitions
└── utils/              # Helper functions (cache, logger, mail templates)
```

### Key Components

- **Content Service**: Document listing and retrieval with caching
- **Admin Service**: Document CRUD with cache invalidation
- **Upload Service**: File uploads to object storage
- **User Service**: User records mirrored from Clerk, and Expo push token registration
- **Expo Service**: Push delivery batched to the Expo limit of 100 messages per request, reporting retired tokens for pruning
- **Email Service**: Transactional email with an attachment host allowlist and bcc recipients
- **Notification Service**: Audit logs for notifications and email
- **Cache Layer**: Redis caching with `SCAN` based invalidation
- **Authentication**: Clerk middleware with role-based access control and development bypass
- **Security Middleware**: Helmet, CORS, compression, `trust proxy`, a global rate limit of 100 req/15min, and tighter per route limits on the expensive admin endpoints
- **Scheduled Jobs**: Daily cache refresh, daily token cleanup, and heartbeat monitoring
- **Error Handling**: Centralized error handling middleware
- **Validation**: Zod schemas for request and response validation

## API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

Admin endpoints additionally require the user to have the admin role configured in Clerk.

### Endpoints

For detailed API documentation, see [API.md](./API.md).

#### Health Check Endpoints

- **GET** `/` - Service name and a map of the main endpoints, useful for confirming which build is answering (Public)
- **GET** `/health/liveness` - Check if the process is running, touches no dependency (Public)
- **GET** `/healthcheck` - Simple health check for Render/production (Public)
- **GET** `/health/readiness` - Round trip probe of MongoDB, Postgres and Redis (Public)

#### Content Endpoints

- **GET** `/content/today` - Get documents created today in IST timezone (Public, Cached 1h)
- **GET** `/content` - Get paginated list of documents, optionally filtered by `topic` (Public, Cached 5min)
- **GET** `/content/topics` - The fixed topic registry every document topic is validated against (Public)
- **GET** `/content/:id` - Get document by ID; documents carrying `unlockPoints` answer 403 with code `CONTENT_LOCKED` until the caller has enough points (Authenticated, Cached 24h)

#### PDF Endpoints

- **GET** `/pdfs` - Get paginated list of documents with PDFs (Public)

#### Notification Endpoints

- **POST** `/notifications/register` - Register the caller's device for push, or attach another device token to an existing registration (Authenticated, 10 req/min)

#### Progress Endpoints

- **POST** `/progress/attempts` - Submit quiz answers for server side grading; updates points, streak and badges (Authenticated, 30 req/min)
- **GET** `/progress/me` - Points, level, streak, badges and recent attempts for the caller (Authenticated)

#### Webhook Endpoints

- **POST** `/webhooks/clerk` - Receive Clerk events. Only `user.created` is acted on, which sends the welcome email (Public, authenticated by svix signature)

This router is mounted ahead of the JSON body parser so the signature is verified against the raw request bytes. It requires `CLERK_WEBHOOK_SIGNING_SECRET` and returns 500 without it, since the signature is its only authentication.

#### Admin Endpoints

Documents:

- **POST** `/admin/documents` - Create new document (Admin)
- **PUT** `/admin/documents/:id` - Update document, accepts a partial document (Admin)
- **DELETE** `/admin/documents/:id` - Delete document (Admin)
- **POST** `/admin/documents/:id/upload-image` - Upload document image (Admin, max 10MB)
- **POST** `/admin/documents/:id/upload-pdf` - Attach a PDF to a document (Admin, max 50MB)

Notifications:

- **POST** `/admin/notifications/send` - Broadcast a push notification to all users or to named users (Admin, 20 req/min)
- **GET** `/admin/notifications` - Paginated history of sent notifications (Admin, 30 req/min)

Email:

- **POST** `/admin/emails/send` - Send a transactional email, optionally with PDF attachments (Admin, 10 req/min)
- **GET** `/admin/emails/logs` - Paginated history of sent emails (Admin, 30 req/min)

Users:

- **GET** `/admin/users` - Paginated list of registered users (Admin, 30 req/min)
- **GET** `/admin/users/emails` - Every registered email address (Admin, 30 req/min)

#### Migrated Endpoints

The notification service was merged into this backend. Its endpoints moved as follows, and the old paths no longer exist:

| Old path                                 | New path                         |
| ---------------------------------------- | -------------------------------- |
| `POST /noti/api/register`                | `POST /notifications/register`   |
| `POST /noti/api/admin/notification/send` | `POST /admin/notifications/send` |
| `GET /noti/api/admin/notifications`      | `GET /admin/notifications`       |
| `POST /noti/api/admin/email/send`        | `POST /admin/emails/send`        |
| `GET /noti/api/admin/email/logs`         | `GET /admin/emails/logs`         |
| `GET /noti/api/admin/users`              | `GET /admin/users`               |
| `GET /noti/api/admin/emails`             | `GET /admin/users/emails`        |
| `POST /noti/api/webhooks/clerk`          | `POST /webhooks/clerk`           |

> **Deployment note**: any client already released against the old paths keeps calling them. Either rewrite them at the ingress or ship a client build that uses the new paths before the old service is retired.

Import [postman.collection.json](./postman.collection.json) for ready made requests covering every endpoint above.

---

## Caching Strategy

The service implements a two-tier Redis caching strategy for optimal performance:

### 1. List Cache

- **Endpoint**: `GET /content`
- **Cache Key Pattern**: `content:list:page:<page>:limit:<limit>[:topic:<key>]`
- **TTL**: 5 minutes (300 seconds)
- **Strategy**: Cache the paginated list response. A topic filter adds the `:topic:<key>` suffix, so each filtered page caches independently of the unfiltered one
- **Invalidation**: Automatic expiry after TTL + manual invalidation on admin operations

### 2. Document Cache

- **Endpoint**: `GET /content/:id`
- **Cache Key Pattern**: `content:doc:<id>`
- **TTL**: 24 hours (86400 seconds)
- **Strategy**: Cache individual document responses
- **Invalidation**: Automatic expiry + manual refresh job + admin updates

### Cache Warming

A scheduled background job runs daily at midnight UTC (hardcoded as `'0 0 * * *'`) to automatically:

- Discovers new documents created since the last run
- Pre-warms the cache with new documents
- Invalidates the first page of the list cache
- Runs on application startup (`runOnInit: true`)
- Logs cache statistics for monitoring

> **Note**: The `JOB_CRON` environment variable is currently unused; the cron schedule is hardcoded in `jobs/cache-refresh.ts`.

**Manual cache refresh**:

```bash
npm run job:refresh-cache
```

### Heartbeat Job

An automated heartbeat job runs every 14 minutes to:

- Ping the configured `HEALTHCHECK_URL`
- Prevent services from spinning down due to inactivity (e.g., Render free tier)
- Log health check results

> **Note**: The job is skipped only when `NODE_ENV=test`, and it needs `HEALTHCHECK_URL` to be set. It previously did the opposite, scheduling only under test, which meant the keepalive never ran in the one environment that needed it.

### Token Cleanup Job

A daily job at 02:00 UTC removes malformed Expo push tokens. The main pruning happens inline: every broadcast reads the Expo tickets and immediately deletes any token reported as `DeviceNotRegistered`, so tokens for uninstalled apps stop being counted as recipients.

> **Note**: This job only runs when `NODE_ENV=production`.

## Database Schema

Content lives in MongoDB through Mongoose. Users, push tokens and delivery logs live in PostgreSQL through Prisma. There is no relation between the two, so per user content state is not representable today.

### MongoDB: Document Model

```typescript
interface Document {
  _id: ObjectId // Auto-generated MongoDB ID
  title: string // Document title (min 3 chars)
  content: ContentSection[] | Record<string, unknown> // Structured content, not a plain string
  summary?: string // Optional summary
  facts?: string // Optional facts
  quiz: Record<string, QuizItem> // Quiz questions (required)
  key_notes?: Record<string, string> // Optional key notes
  topic?: string // Registry key from src/models/topics.ts, defaults to machine-learning
  unlockPoints?: number // Optional points cost; gated reads answer 403 below it
  imageUrl?: string // Optional S3 image URL
  pdfUrl?: PdfObject[] // Optional array of PDF objects
  createdAt: Date // Auto-generated timestamp
  updatedAt: Date // Auto-updated timestamp
}

interface QuizItem {
  que: string // Question text
  ans: string // Correct answer
  options: string[] // Answer options (min 2)
}

interface PdfObject {
  name: string // Original filename
  url: string // S3 URL
  uploadedAt: Date // Upload timestamp
  size: number // File size in bytes
}
```

> **Note**: The `imageUrl` and `pdfUrl` fields are optional. Images are replaced on new uploads, while PDFs are stored as an array allowing multiple files per document.

### PostgreSQL: Notification Models

Defined in [`prisma/schema.prisma`](./prisma/schema.prisma) and applied through the migrations in `prisma/migrations`.

```prisma
model User {
  id         String   @id @default(cuid())
  clerkId    String   @unique   // Identity from Clerk
  email      String   @unique
  expoTokens String[]           // One entry per registered device
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Notification {
  id        String   @id @default(cuid())
  title     String
  message   String
  imageUrl  String?
  sentBy    String             // Clerk ID of the admin who sent it
  sentTo    String[]           // Empty when the broadcast went to everyone
  sentToAll Boolean  @default(false)
  status    String   @default("sent")
  createdAt DateTime @default(now())
}

model EmailLog {
  id        String   @id @default(cuid())
  subject   String
  message   String   @db.Text
  pdfUrls   String[]
  sentBy    String
  sentTo    String[]
  status    String   @default("sent")
  createdAt DateTime @default(now())
}
```

> **Note**: a `SystemLog` model existed in the original schema but was never read or written, so it is dropped by the `20260810000000_drop_system_log` migration.

### PostgreSQL: Gamified Tracker Models

Added by the `20260824202549_user_tracker` migration and served by the `/progress` routes.

```prisma
model QuizAttempt {
  id            String   @id @default(cuid())
  userId        String   // Clerk ID of the caller
  contentId     String   // Mongo document the quiz belongs to
  score         Int
  total         Int
  pointsAwarded Int      // Delta over prior best for this content, never negative
  createdAt     DateTime @default(now())
}

model DailyActivity {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date // One row per UTC day with activity; streaks derive from these
  createdAt DateTime @default(now())
}

model AwardedBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeKey  String   // Key into the catalog in src/models/gamification.ts
  awardedAt DateTime @default(now())
}

model UserProgress {
  id            String   @id @default(cuid())
  userId        String   @unique
  points        Int      @default(0)
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  updatedAt     DateTime @updatedAt
}
```

## Development

### Project Structure

```
.
├── src/
│   ├── api/                # HTTP layer
│   │   ├── controllers/    # Request handlers
│   │   │   ├── admin.controller.ts
│   │   │   ├── content.controller.ts
│   │   │   ├── email.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── pdf.controller.ts
│   │   │   ├── upload.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── webhook.controller.ts
│   │   └── routes/         # Route definitions
│   │       ├── admin.route.ts        # Documents, notifications, email, users
│   │       ├── content.route.ts
│   │       ├── health.route.ts
│   │       ├── healthcheck.route.ts  # Render/production healthcheck
│   │       ├── notification.route.ts # Device registration
│   │       ├── pdf.route.ts
│   │       └── webhook.route.ts      # Clerk webhook, raw body
│   ├── cli/                # Command-line tools
│   │   ├── seeds/          # Database seeding
│   │   │   ├── seed.ts         # Main seeding script
│   │   │   └── today.seed.ts   # Seed today's content
│   │   └── tools/          # Utility tools
│   │       └── run-job.ts      # Job runner
│   ├── config/             # App configuration
│   │   ├── index.ts        # Environment variables, validated by Zod
│   │   ├── mongo.ts        # MongoDB connection
│   │   ├── postgres.ts     # Prisma client and connection
│   │   ├── redis.ts        # Redis connection
│   │   └── s3.ts           # Object storage client and URL helpers
│   ├── data/               # Sample data
│   │   ├── data.json
│   │   ├── sample.data.json
│   │   ├── today.data.json
│   │   ├── today.pdf
│   │   └── today.png
│   ├── jobs/               # Scheduled jobs
│   │   ├── cache-refresh.ts    # Daily cache warming
│   │   ├── heartbeat.ts        # Keepalive health pings
│   │   └── token-cleanup.ts    # Daily push token pruning
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # Clerk authentication + dev bypass
│   │   ├── errorHandler.ts
│   │   ├── helmet.ts       # Security headers
│   │   ├── rateLimit.ts    # Per route rate limiting
│   │   ├── upload.ts       # Multer file upload
│   │   └── validation.ts   # Zod body and query validation
│   ├── models/             # Data models
│   │   ├── document.model.ts           # Mongoose model
│   │   ├── document.validation.ts      # Zod schema for documents
│   │   └── notification.validation.ts  # Zod schemas for push and email
│   ├── services/           # Business logic layer
│   │   ├── admin.service.ts        # Document CRUD operations
│   │   ├── content.service.ts      # Content retrieval and caching
│   │   ├── email.service.ts        # Transactional email
│   │   ├── expo.service.ts         # Expo push delivery
│   │   ├── notification.service.ts # Notification and email audit logs
│   │   ├── pdf.service.ts          # PDF listing
│   │   ├── upload.service.ts       # S3 file uploads
│   │   └── user.service.ts         # Users and push tokens
│   ├── tests/              # Test suite
│   ├── types/              # TypeScript types
│   │   └── express.d.ts
│   ├── utils/              # Helper functions
│   │   ├── cache.ts        # Cache utilities
│   │   ├── logger.ts       # Pino logger
│   │   └── mail.ts         # HTML email templates
│   └── index.ts            # Application entry point
├── prisma/                 # Postgres schema and migrations
│   ├── schema.prisma       # User, Notification, EmailLog models
│   └── migrations/         # Applied migration history
├── .dockerignore           # Docker ignore rules
├── .env                    # Local environment, host process, gitignored
├── .env.docker             # Host process against the compose stack, MinIO
├── .env.container          # The API running inside a container
├── .env.example            # Environment variables template
├── .eslintignore           # ESLint ignore rules
├── .eslintrc.js            # ESLint configuration
├── .gitignore              # Git ignore rules
├── .prettierignore         # Prettier ignore rules
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Application container
├── LICENSE                 # License file
├── Makefile                # Development commands
├── package.json            # Dependencies and scripts
├── postman.collection.json # Importable request collection for every endpoint
├── prettier.config.js      # Prettier configuration
├── README.md               # This file
└── tsconfig.json           # TypeScript configuration
```

### Available Commands (Makefile)

`make` with no target prints this list. Every target was repaired on 14-08-2026,
so there are no broken ones left.

**Stack**

| Command         | Description                                         |
| --------------- | --------------------------------------------------- |
| `make up`       | Start the infrastructure containers                 |
| `make env-up`   | Same, with variable substitution from `.env.docker` |
| `make down`     | Stop the containers, API included                   |
| `make env-down` | Same, with `.env.docker` substitution               |
| `make ps`       | Container status, the `api` profile included        |

**API in a container** (the `api` compose profile)

| Command            | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `make api-up`      | Build and start the API container alongside the stack |
| `make api-rebuild` | Rebuild and restart the API after a code change       |
| `make api-logs`    | Follow the API container logs                         |
| `make api-down`    | Stop everything, API included                         |

**Development**

| Command              | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `make build`         | Compile TypeScript to `dist`                                |
| `make test`          | Run the Vitest suite, needs the stack up                    |
| `make coverage`      | Run the suite with a coverage report                        |
| `make lint`          | ESLint                                                      |
| `make typecheck`     | `tsc --noEmit` against the base config, tests included      |
| **`make check`**     | **lint, typecheck and test. The same three gates CI runs.** |
| `make fmt`           | Format with Prettier                                        |
| `make seed`          | Load the sample documents, on the host                      |
| `make refresh-cache` | Trigger the cache refresh job, on the host                  |
| `make logs`          | Follow logs for every container                             |

**Postgres (Prisma)**

| Command                | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `make prisma-generate` | Regenerate the Prisma client after a schema change           |
| `make prisma-migrate`  | Create and apply a migration in development                  |
| `make prisma-deploy`   | Apply existing migrations, used in production                |
| `make prisma-studio`   | Browse the Postgres data in a web UI                         |
| `make prisma-status`   | Show which migrations have been applied                      |
| `make db-reset`        | Drop and recreate the Postgres schema, **destroys all data** |

> **`make check` is the one worth remembering.** It runs the three gates that
> block the image build in CI, so a green `make check` means the pipeline will
> not fail on lint, types or tests.

**What was wrong before 14-08-2026**, in case an older checkout is in play:
`make seed`, `make logs` and `make refresh-cache` shelled into an `api`
container that did not exist. `seed` and `refresh-cache` now run on the host,
because they go through `ts-node` and the production image installs with
`--omit=dev`, so it could never have run them. Every other target called the
retired `docker-compose` v1 binary, which is not installed; they all use the
`docker compose` plugin subcommand now.

### Additional npm Scripts

```bash
# Seeding
npm run seed              # Seed with data.json (uses src/cli/seeds/seed.ts)
npm run seed:topics       # Additive insert of the topic sample documents; skips titles that already exist
npm run seed:today        # Seed today's content (uses src/cli/seeds/today.seed.ts)

# Cache management
npm run job:refresh-cache # Manually refresh cache (uses src/cli/tools/run-job.ts)

# Postgres schema (Prisma)
npm run prisma:generate   # Regenerate the Prisma client
npm run prisma:migrate    # Create and apply a migration in development
npm run prisma:deploy     # Apply existing migrations, used in production
npm run prisma:studio     # Browse the Postgres data in a web UI

# Release management
npm run do-release        # Patch version bump
npm run do-release:minor  # Minor version bump
npm run do-release:major  # Major version bump

# Testing
npm test                  # Run tests once
npm run test:watch        # Run tests in watch mode

# Code quality
npm run lint              # Check for linting errors
npm run fmt               # Format all files
npm run fmt:check         # Check formatting without changes
```

### Accessing Dashboards

The development environment includes web-based admin dashboards:

> **Where the logins come from.** These containers read their credentials from the environment, and `.env` does not currently set any of them, so the defaults in `docker-compose.yml` apply. If you add `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`, `MINIO_ROOT_USER` or `MINIO_ROOT_PASSWORD` to `.env`, use those values instead. Changing them after the volumes exist does not rewrite the stored credentials, so reset the volume as well.

#### MongoDB Dashboard (Mongo Express)

- **URL**: [http://localhost:8081](http://localhost:8081)
- **Credentials**: `root` / `password` by default. The page answers 401 with a browser auth prompt before you log in, which is expected rather than a fault
- **Features**: Browse collections, run queries, manage documents

#### Redis Dashboard (RedisInsight)

- **URL**: [http://localhost:8001](http://localhost:8001)
- **Setup**: No login. On first launch, add a database connection
  - Host: `127.0.0.1`
  - Port: `6379`
  - Password: none
  - Name: Any descriptive name
- **Features**: View cache keys, monitor performance, debug queries

> **Note**: Redis and RedisInsight are the same `redis/redis-stack` container, which is why one service exposes both 6379 and 8001.

#### MinIO Dashboard (MinIO Console)

- **URL**: [http://localhost:9001](http://localhost:9001)
- **Credentials**: `minioadmin` / `miniopassword` by default
- **Features**: View files, manage buckets, monitor performance, debug queries
- **Buckets**: `images`, `pdfs` and `assets` are already created and public read. This is where local uploads land, so it is the fastest way to confirm an upload actually stored an object

#### Mail Inbox (Mailpit)

- **URL**: [http://localhost:8025](http://localhost:8025)
- **Setup**: None, no login required
- **Features**: Read every message the service sends, inspect the rendered HTML, the raw source and any attachments
- **Use it to verify**: the welcome email fired by the Clerk webhook, and anything sent through `POST /admin/emails/send`

#### Postgres Data (Prisma Studio)

- **Command**: `npm run prisma:studio` or `make prisma-studio`
- **Features**: Browse and edit users, push tokens, notification history and email logs

### Development Authentication Bypass

For easier local development, you can bypass Clerk authentication:

1. **Set DEV_TOKEN** in your `.env` file:

   ```env
   NODE_ENV=development
   DEV_TOKEN=my-super-secret-dev-token
   ```

2. **Use the token** in your requests:

   ```bash
   curl -H "Authorization: Bearer my-super-secret-dev-token" \
        http://localhost:4000/content/507f1f77bcf86cd799439011
   ```

3. **Admin access** is automatically granted in development mode when using DEV_TOKEN

> **Warning**: This bypass only works when `NODE_ENV=development`. Never use DEV_TOKEN in production!

## Testing

The project uses **Vitest**. The suite stands at **235 tests across 26 files, all passing**, last verified 14-08-2026.

> [!IMPORTANT]
> Two things decide whether the suite runs at all.
>
> 1. **Run it from `BACKEND`.** The repository root has no `package.json` and no Vitest config. `npx vitest` there downloads an unrelated Vitest from the registry, resolves no `@/*` aliases and never loads the setup file, so every suite fails with `Cannot find package '@/...'`. That looks like a code fault and is not one.
> 2. **Start the stack first.** `docker compose up -d`. The integration tests in `content.route.test.ts` use a real Mongo and Redis. Everything else is mocked and needs nothing running.

```bash
# From BACKEND, with the stack up
npm test

# Watch mode
npm run test:watch

# One file
npm test -- notification.service

# Coverage, HTML report lands in coverage/index.html
npm test -- --coverage
```

### Run the same gates CI runs

The image build is gated on all three of these passing. Running them locally
before pushing avoids a red pipeline:

```bash
npm run lint                        # 0 errors expected, warnings are CRLF noise on Windows
npx tsc --noEmit -p tsconfig.json   # the base config, so test files are typechecked too
npm test
```

The typecheck deliberately uses `tsconfig.json` rather than `tsconfig.build.json`.
`tsconfig.build.json` excludes `src/tests` so test code stays out of `dist`, but
that means the build never typechecks the tests. **Vitest transpiles without
typechecking**, so a test file can pass at runtime and still not compile. This
step is what catches that, and it has caught it before.

### Test environment

`src/tests/setup/globalSetup.ts` supplies a default for every variable the
config schema requires, so the suite runs on a checkout with no `.env` at all.
A real `.env` still wins where set. Two defaults in it are load bearing:

- **The Mongo URI carries credentials and `authSource=admin`**, matching the compose defaults. Without them Mongoose still connects, because it connects lazily, and the failure surfaces only on the first query as `Command aggregate requires authentication`.
- **`CLERK_PUBLISHABLE_KEY` must stay structurally valid**, meaning `pk_test_` followed by base64 of a domain. Clerk decodes it to find its API host and throws `Publishable key not valid` on anything else, which reaches the error handler as a 500 and makes an unauthenticated request look like a server fault instead of a 401.

See [`src/tests/TESTING.md`](src/tests/TESTING.md) for how to write tests.

## Deployment

### Environment Setup

Ensure all required environment variables are set in production:

```env
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/studzee
DATABASE_URL=postgresql://user:password@host:5432/studzee_notifications
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
S3_REGION=ap-northeast-2
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_IMAGES=images
S3_BUCKET_PDFS=pdfs
S3_ENDPOINT=https://<project-ref>.storage.supabase.co/storage/v1/s3
S3_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=Studzee <no-reply@studzee.in>
EMAIL_ATTACHMENT_HOSTS=lammfakgegmrkxdkwukd.supabase.co
LIST_CACHE_TTL=300
DOC_CACHE_TTL=86400
JOB_CRON=0 0 * * *
LOG_LEVEL=info
HEALTHCHECK_URL=https://your-app.onrender.com/healthcheck
```

> **Breaking change from the merge**: `DATABASE_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM` are now required. The config schema throws at startup if any is missing, so add them before the next deploy.

The container applies pending Postgres migrations on start with `prisma migrate deploy`, so no separate migration step is needed in the deployment pipeline.

### Docker Production Build

```bash
# Build production image
docker build -t studzee-api:latest .

# Run it against the local compose stack
docker run --rm --name studzee_api \
  --network studzee_network \
  --env-file .env.container \
  -p 4000:3000 \
  studzee-api:latest
```

> **Use `.env.container`, not `.env`.** `.env` addresses everything as `localhost`, which inside a container means the container itself. See [Environment Files](#environment-files).

> **Publish to container port 3000.** The image listens on whatever `PORT` says, and `.env.container` sets 3000 to match the Dockerfile's `EXPOSE` and `HEALTHCHECK`. `-p 4000:3000` keeps the API on `http://localhost:4000` from outside.

For a real deployment, supply the same variables from your platform's secret store with the managed hostnames rather than shipping an env file. The container runs `prisma migrate deploy` before starting, so pending migrations are applied on boot.

**Known issues with the current image**, worth fixing before this is used in production:

- The image is around 830MB because `node_modules` is copied from the build stage, so `typescript`, `vitest` and `ts-node-dev` all ship with it.
- The `dependencies` stage runs `npm ci` and is then discarded, since production copies from the `build` stage instead. That stage ran `npm install`, so the lockfile is not enforced in the layer that actually ships.

### Docker Compose Production

```bash
# Start production services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Render Deployment

For hosting on Render (or similar platforms with automatic spin-down):

1. **Set environment variables** in Render dashboard:
   - All required variables from the Configuration section
   - `HEALTHCHECK_URL` - Set to your deployed app's healthcheck endpoint (e.g., `https://your-app.onrender.com/healthcheck`)

2. **Heartbeat job** will automatically:
   - Start whenever `HEALTHCHECK_URL` is set and `NODE_ENV` is not `test`
   - Ping `HEALTHCHECK_URL` every 14 minutes
   - Keep your service alive (prevents Render free tier spin-down)
   - Log health check status

3. **Health check endpoints**:
   - `/health/liveness` - For container orchestration
   - `/health/readiness` - For load balancers
   - `/healthcheck` - For simple pings (used by heartbeat job)

## Monitoring

- **Liveness Probe**: Use `/health/liveness` for container health checks. It touches no dependency, so a store outage does not restart an otherwise healthy container.
- **Readiness Probe**: Use `/health/readiness` for load balancer health checks. It round trips MongoDB, Postgres and Redis in parallel with a 2 second timeout each, and returns 503 if any one of them fails.
- **Logging**: Structured JSON logs via pino (on the host, the terminal running `npm run dev`; in a container, `make api-logs`)
- **Cache Metrics**: Monitor cache hit/miss rates in application logs

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**

```bash
# Check MongoDB is running
docker-compose ps

# Check connection string in .env
cat .env | grep MONGO_URI

# View MongoDB logs
docker-compose logs mongo
```

**PostgreSQL or Prisma Failures**

```bash
# Check Postgres is running and healthy
docker-compose ps postgres

# Verify the connection string
cat .env | grep DATABASE_URL

# "@prisma/client did not initialize yet" means the client was never generated
npm run prisma:generate

# Check which migrations have been applied
npx prisma migrate status
```

**Redis Connection Failed**

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

**Clerk Webhook Returns 400**

```bash
# The signature is verified against the raw request bytes, so the webhook
# router must stay mounted before express.json() in src/index.ts.

# Confirm the signing secret matches the endpoint in the Clerk dashboard
cat .env | grep CLERK_WEBHOOK_SIGNING_SECRET

# A 500 with "Webhook secret not configured" means the variable is unset.
# A 500 with "Webhook route misconfigured" means a body parser ran first.
```

**Email Not Arriving in Development**

```bash
# Mailpit catches everything locally, nothing reaches a real inbox by design.
# Open the UI to see what was sent:
#   http://localhost:8025

# Check Mailpit is up
docker-compose ps mailpit

# Confirm the app is pointed at it, not a real provider
cat .env | grep SMTP_

# A 502 from /admin/emails/send with "not allowed" means an attachment host
# is missing from EMAIL_ATTACHMENT_HOSTS, not a transport problem.
```

**Push Notifications Not Arriving**

```bash
# A 404 from /admin/notifications/send means no devices are registered
# for the targeted users. Check the token table:
npm run prisma:studio

# The send response reports sent, failed and prunedTokens counts.
# prunedTokens above zero means those devices uninstalled the app and
# their tokens were deleted.
```

**Storage Upload Failures**

```bash
# Verify the storage settings. The variables are S3_* and there are no AWS_*
# variables any more, so grepping for AWS returns nothing.
cat .env | grep S3_

# NoSuchBucket means the buckets were never created. Locally that is minio-init
# not having run:
docker compose up -d minio-init
docker compose logs minio-init      # ends with "minio buckets ready"

# SignatureDoesNotMatch usually means S3_REGION does not match the Supabase
# project region. The error never names the region as the cause.

# A 200 upload whose URL will not open means S3_PUBLIC_URL is wrong, or the
# bucket is not public read. S3_ENDPOINT and S3_PUBLIC_URL are different hosts
# on Supabase and must both be set.

# Application logs go to the terminal running npm run dev, not to a container.
```

**Authentication Errors**

```bash
# Verify Clerk secret key
cat .env | grep CLERK_SECRET_KEY

# Check Clerk dashboard for key validity
# Ensure JWT is being sent in Authorization header
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run validation: `make lint && make test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## License

This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details.

## Support

For issues, questions, or contributions, please create an issue in the repository or contact the maintainers.
