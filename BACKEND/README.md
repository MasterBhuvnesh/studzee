# Studzee API

A production-ready backend service built with TypeScript that provides document management and notification delivery. It exposes public content listing, authenticated document retrieval, device registration for push, a Clerk webhook, and an admin surface covering documents, notifications, email and users.

The service uses MongoDB for content, PostgreSQL for users and delivery logs, Redis for caching, AWS S3 for file storage, and Clerk for authentication.

> **Merged service**: the standalone notification service was folded into this backend on 10-08-2026. Endpoints that used to live behind the `/noti/api` prefix are now served here under `/notifications`, `/admin` and `/webhooks`. See [Endpoints](#endpoints) for the mapping.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Clerk Setup](#clerk-setup)
  - [MongoDB Setup](#mongodb-setup)
  - [PostgreSQL Setup](#postgresql-setup)
  - [SMTP Setup](#smtp-setup)
  - [AWS S3 Setup](#aws-s3-setup)
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
- **AWS S3**: Scalable cloud file storage for images and PDFs
- **Clerk**: Enterprise-grade authentication and user management, plus signed webhooks via `svix`
- **Expo Push**: Batched push delivery with automatic pruning of retired device tokens
- **Email**: Transactional email through `nodemailer` with an attachment host allowlist
- **Zod**: Runtime type validation and schema enforcement
- **Scheduled Jobs**: Cache warming, token cleanup, and heartbeat monitoring with `node-cron`
- **Structured Logging**: Production-ready logging with `pino`
- **File Uploads**: Multipart file upload support with `multer`
- **Security**: Helmet security headers, CORS, compression, and rate limiting
- **Docker**: Fully containerized development environment with Docker Compose
- **Developer Tools**: ESLint, Prettier, Makefile automation, and development auth bypass
- **Testing**: Test suite with `vitest`
- **Production Ready**: Health checks, heartbeat monitoring for Render deployment

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+) and npm
- `make` (optional, for convenience commands)
- Clerk account for authentication
- MongoDB Atlas account (or local MongoDB instance)
- PostgreSQL instance (the Docker Compose file provides one)
- AWS account with S3 bucket created
- SMTP credentials for outbound email

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

| Variable                       | Description                                                                      | Required | Default                        |
| ------------------------------ | -------------------------------------------------------------------------------- | -------- | ------------------------------ |
| `NODE_ENV`                     | Environment (development/production/test)                                        | Yes      | development                    |
| `PORT`                         | Server port                                                                      | No       | 4000                           |
| `MONGO_URI`                    | MongoDB connection string                                                        | Yes      | -                              |
| `DB_NAME`                      | MongoDB database name                                                            | No       | Studzee_Database               |
| `MONGO_ROOT_USER`              | MongoDB root username (Docker only)                                              | Yes      | -                              |
| `MONGO_ROOT_PASSWORD`          | MongoDB root password (Docker only)                                              | Yes      | -                              |
| `DATABASE_URL`                 | PostgreSQL connection string used by Prisma                                      | Yes      | -                              |
| `POSTGRES_USER`                | Postgres username (Docker only)                                                  | No       | postgres                       |
| `POSTGRES_PASSWORD`            | Postgres password (Docker only)                                                  | No       | postgres                       |
| `POSTGRES_DB`                  | Postgres database name (Docker only)                                             | No       | studzee_notifications          |
| `POSTGRES_PORT`                | Postgres host port (Docker only)                                                 | No       | 5432                           |
| `REDIS_URL`                    | Redis connection URL                                                             | Yes      | -                              |
| `CLERK_SECRET_KEY`             | Clerk authentication secret key                                                  | Yes      | -                              |
| `CLERK_PUBLISHABLE_KEY`        | Clerk publishable key                                                            | Yes      | -                              |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Signing secret for `/webhooks/clerk`. The webhook returns 500 without it          | No       | -                              |
| `LIST_CACHE_TTL`               | List cache TTL in seconds                                                        | No       | 300                            |
| `DOC_CACHE_TTL`                | Document cache TTL in seconds                                                    | No       | 86400                          |
| `TODAY_CACHE_TTL`              | Today's content cache TTL in seconds                                             | No       | 3600                           |
| `JOB_CRON`                     | Cron expression for cache refresh job (currently unused)                         | No       | 0 0 \* \* \*                   |
| `LOG_LEVEL`                    | Logging level (info/debug/error)                                                 | No       | info                           |
| `AWS_REGION`                   | AWS region for S3 (e.g., ap-south-1)                                             | Yes      | -                              |
| `AWS_ACCESS_KEY_ID`            | AWS access key ID                                                                | Yes      | -                              |
| `AWS_SECRET_ACCESS_KEY`        | AWS secret access key                                                            | Yes      | -                              |
| `AWS_S3_BUCKET_NAME`           | S3 bucket name for file storage                                                  | Yes      | -                              |
| `AWS_S3_BUCKET_ENDPOINT`       | Custom S3 endpoint, used in development to point at MinIO                        | No       | -                              |
| `SMTP_HOST`                    | SMTP server hostname                                                             | Yes      | -                              |
| `SMTP_PORT`                    | SMTP port. Implicit TLS on 465, STARTTLS elsewhere                               | No       | 587                            |
| `SMTP_USER`                    | SMTP username                                                                    | Yes      | -                              |
| `SMTP_PASSWORD`                | SMTP password                                                                    | Yes      | -                              |
| `EMAIL_FROM`                   | Sender address on outbound email                                                 | Yes      | -                              |
| `SITE_URL`                     | Public site URL used in email templates                                          | No       | https://studzee.in             |
| `EMAIL_BANNER_URL`             | Banner image used in email templates                                             | No       | the S3 brand banner            |
| `EMAIL_ATTACHMENT_HOSTS`       | Comma separated hosts an email attachment may be fetched from                    | No       | the S3 asset bucket            |
| `DEV_TOKEN`                    | Development auth bypass token (bypasses Clerk authentication)                    | No       | -                              |
| `HEALTHCHECK_URL`              | URL for the heartbeat job to ping. The job is skipped when unset                 | No       | -                              |

### Clerk Setup

1. Create a Clerk application at [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to API Keys and copy your Secret Key and Publishable Key
3. Add the keys to your `.env` file
4. Set up roles in Clerk and create an `admin` role for admin access
5. Add a webhook endpoint pointing at `<your-host>/webhooks/clerk`, subscribe it to `user.created`, and copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`. This is what triggers the welcome email.

> **Note**: `CLERK_WEBHOOK_SIGNING_SECRET` is optional in config, but the webhook route refuses every delivery with a 500 while it is unset, because the signature is that endpoint's only authentication. Leave it unset only if you are not using the webhook at all.

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

### AWS S3 Setup

1. Create an AWS account at [AWS Console](https://aws.amazon.com/)
2. Create an S3 bucket for file storage
3. Create an IAM user with `S3` permissions:
   - `s3:PutObject` - Upload files
   - `s3:DeleteObject` - Delete files
   - `s3:GetObject` - Read files (if needed)
4. Generate access credentials for the IAM user
5. Add AWS credentials to your `.env` file

> **Note**: Configure your S3 bucket policy or ACL settings to allow public read access to uploaded files if you want them to be publicly accessible. The application no longer sets ACL on individual objects by default.

## Usage

### Development

> **Note**: `docker-compose.yml` runs the infrastructure only. The API is run separately for local development, so it hot reloads and can be debugged directly.

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

> **Tip**: To run the entire stack (API + MongoDB + Redis + MinIO (S3)) in Docker, uncomment the `api` service section in `docker-compose.yml`.

### Production

```bash
npm run build
npm start
```

### Docker Deployment

```bash
# Build and start all services
make up

# Stop all services
make down

# View logs
make logs
```

## Docker Compose Guide

The project includes a comprehensive Docker Compose setup for local development and testing. This section provides detailed information about the containerized environment.

### Service Architecture

The `docker-compose.yml` defines **5 infrastructure services** that together provide a complete development environment. The API itself is normally run outside Docker with `npm run dev`.

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
- **Purpose**: S3-compatible object storage for local development (alternative to AWS S3)
- **Container Name**: `studzee_minio`
- **Ports**:
  - `9000`: MinIO API endpoint (configurable via `MINIO_PORT`)
  - `9001`: MinIO web console (configurable via `MINIO_CONSOLE_PORT`)
- **Credentials**: Set via `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
- **Health Check**: Curls the MinIO health endpoint every 30 seconds
- **Volume**: `studzee-minio-data` for object storage persistence

#### 5. **Mailpit (`mailpit`)**

- **Image**: `axllent/mailpit:latest`
- **Purpose**: Local SMTP catcher. Accepts every message and displays it in a web UI instead of delivering it, so development and tests never send real email.
- **Container Name**: `studzee_mailpit`
- **Ports**:
  - `1025`: SMTP endpoint the API sends through (configurable via `MAILPIT_SMTP_PORT`)
  - `8025`: Web UI for reading caught messages (configurable via `MAILPIT_UI_PORT`)
- **Auth**: Accepts any credentials, so `SMTP_USER` and `SMTP_PASSWORD` can be any value locally
- **Health Check**: Polls the Mailpit readiness endpoint every 30 seconds
- **Volume**: `studzee-mailpit-data` so caught messages survive a restart

#### 6. **Mongo Express (`mongo-express`)**

- **Image**: `mongo-express:latest`
- **Purpose**: Web-based MongoDB admin interface
- **Container Name**: `studzee_mongo_express`
- **Port**: `8081` (configurable via `MONGO_EXPRESS_PORT`)
- **Features**: Browse collections, run queries, manage documents
- **Depends On**: MongoDB service must be healthy before starting

#### 7. **API (`api`)**

- **Purpose**: Core backend application service
- **Development Workflow**: Usually run locally via `npm run dev` to enable hot-reloading and easier debugging, while connecting to the containerized infrastructure.
- **Management Dashboards**:
  - **Mongo Express**: [http://localhost:8081](http://localhost:8081) — Web UI for MongoDB management.
  - **RedisInsight**: [http://localhost:8001](http://localhost:8001) — GUI for monitoring and interacting with Redis.
  - **MinIO Console**: [http://localhost:9001](http://localhost:9001) — Interface for managing S3-compatible object storage.

### Volumes & Data Persistence

The Docker Compose setup uses **named volumes** to persist data across container restarts:

| Volume Name             | Purpose            | Data Stored                                   |
| ----------------------- | ------------------ | --------------------------------------------- |
| `studzee-mongo-data`    | MongoDB storage    | Content collections, indexes, configurations  |
| `studzee-postgres-data` | PostgreSQL storage | Users, push tokens, notification and email logs |
| `studzee-redis-data`    | Redis storage      | Cache data, persistence snapshots             |
| `studzee-minio-data`    | MinIO storage      | Uploaded images, PDFs, and other objects      |
| `studzee-mailpit-data`  | Mailpit storage    | Caught outbound email                         |

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

The project supports two environment configurations:

#### `.env` (Default - AWS S3)

Used for local development with **real AWS S3**:

```bash
# Start with default .env
make up

# Run API locally
npm run dev
```

#### `.env.docker` (Docker - MinIO)

Used for Docker development with **local MinIO** (S3-compatible):

```bash
# Start with .env.docker
make env-up

# Run API locally with MinIO
npm run dev
```

**Key Differences**:

- `.env`: Points to AWS S3 (`AWS_S3_BUCKET_NAME`, `AWS_REGION`)
- `.env.docker`: Points to MinIO (`AWS_S3_BUCKET_ENDPOINT=http://localhost:9000`)

### Port Mappings

Complete reference of all exposed ports:

| Port    | Service       | Purpose                | Environment Variable |
| ------- | ------------- | ---------------------- | -------------------- |
| `4000`  | API           | Application server     | `PORT`               |
| `27017` | MongoDB       | Content database       | `MONGO_PORT`         |
| `5432`  | PostgreSQL    | Notification database  | `POSTGRES_PORT`      |
| `6379`  | Redis         | Cache connection       | `REDIS_PORT`         |
| `1025`  | Mailpit SMTP  | Local mail delivery    | `MAILPIT_SMTP_PORT`  |
| `8001`  | RedisInsight  | Redis web dashboard    | `REDIS_INSIGHT_PORT` |
| `8025`  | Mailpit UI    | Read caught email      | `MAILPIT_UI_PORT`    |
| `8081`  | Mongo Express | MongoDB web admin      | `MONGO_EXPRESS_PORT` |
| `9000`  | MinIO         | Object storage API     | `MINIO_PORT`         |
| `9001`  | MinIO Console | MinIO web interface    | `MINIO_CONSOLE_PORT` |

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

MinIO provides an S3-compatible storage solution for local development without requiring AWS credentials.

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

3. **Create Bucket**:
   - Click "Buckets" → "Create Bucket"
   - Name: `studzee-assets` (matches `AWS_S3_BUCKET_NAME` in `.env.docker`)
   - Click "Create Bucket"

4. **Configure Public Access** (Optional):
   - Select the bucket → "Manage" → "Access Rules"
   - Add policy to allow public read access if needed
   - Example policy for public read:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Principal": { "AWS": ["*"] },
           "Action": ["s3:GetObject"],
           "Resource": ["arn:aws:s3:::studzee-assets/*"]
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
- **S3-Compatible API**: Works with AWS SDK without code changes
- **Local Development**: No internet connection or AWS account required
- **Fast Testing**: Instant uploads without network latency

#### Bucket Structure

When using the application, files are organized as:

```
studzee-assets/
├── images/
│   └── <document-id>.<extension>  (e.g., 507f1f77bcf86cd799439011.png)
└── pdfs/
    └── <document-title>.pdf       (e.g., introduction-to-typescript.pdf)
```

### Health Checks

All core services include health check configurations to ensure reliability:

| Service    | Check Command                              | Interval | Timeout | Retries | Start Period |
| ---------- | ------------------------------------------ | -------- | ------- | ------- | ------------ |
| MongoDB    | `mongosh --eval "db.adminCommand('ping')"` | 30s      | 10s     | 5       | 30s          |
| PostgreSQL | `pg_isready -U $POSTGRES_USER`             | 10s      | 5s      | 5       | 10s          |
| Redis      | `redis-cli ping`                           | 30s      | 10s     | 5       | 30s          |
| MinIO      | `curl -f http://localhost:9001/health`     | 30s      | 10s     | 5       | 30s          |
| Mailpit    | `wget -q -O - http://localhost:8025/readyz`| 30s      | 10s     | 5       | 10s          |

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
docker-compose logs

# Follow API logs (if API service is running)
make logs
# OR
docker-compose logs -f api

# View logs for specific service
docker-compose logs mongo
docker-compose logs postgres
docker-compose logs redis
docker-compose logs minio
docker-compose logs mailpit

# Check service status
docker-compose ps
```

#### Database Operations

```bash
# Seed the database (requires API service running in Docker)
make seed
# OR
docker-compose exec api npm run seed

# Refresh cache (requires API service running in Docker)
make refresh-cache
# OR
docker-compose exec api npm run job:refresh-cache

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
- **Upload Service**: File uploads to AWS S3
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

- **GET** `/health/liveness` - Check if the process is running, touches no dependency (Public)
- **GET** `/healthcheck` - Simple health check for Render/production (Public)
- **GET** `/health/readiness` - Round trip probe of MongoDB, Postgres and Redis (Public)

#### Content Endpoints

- **GET** `/content/today` - Get documents created today in IST timezone (Public, Cached 1h)
- **GET** `/content` - Get paginated list of documents (Public, Cached 5min)
- **GET** `/content/:id` - Get document by ID (Authenticated, Cached 24h)

#### PDF Endpoints

- **GET** `/pdfs` - Get paginated list of documents with PDFs (Public)

#### Notification Endpoints

- **POST** `/notifications/register` - Register the caller's device for push, or attach another device token to an existing registration (Authenticated, 10 req/min)

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

| Old path                                | New path                       |
| --------------------------------------- | ------------------------------ |
| `POST /noti/api/register`               | `POST /notifications/register` |
| `POST /noti/api/admin/notification/send`| `POST /admin/notifications/send` |
| `GET /noti/api/admin/notifications`     | `GET /admin/notifications`     |
| `POST /noti/api/admin/email/send`       | `POST /admin/emails/send`      |
| `GET /noti/api/admin/email/logs`        | `GET /admin/emails/logs`       |
| `GET /noti/api/admin/users`             | `GET /admin/users`             |
| `GET /noti/api/admin/emails`            | `GET /admin/users/emails`      |
| `POST /noti/api/webhooks/clerk`         | `POST /webhooks/clerk`         |

> **Deployment note**: any client already released against the old paths keeps calling them. Either rewrite them at the ingress or ship a client build that uses the new paths before the old service is retired.

Import [postman.collection.json](./postman.collection.json) for ready made requests covering every endpoint above.

---

## Caching Strategy

The service implements a two-tier Redis caching strategy for optimal performance:

### 1. List Cache

- **Endpoint**: `GET /content`
- **Cache Key Pattern**: `content:list:page:<page>:limit:<limit>`
- **TTL**: 5 minutes (300 seconds)
- **Strategy**: Cache the paginated list response
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
│   │   └── s3.ts           # AWS S3 configuration
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
├── .env                    # Local environment (AWS S3)
├── .env.docker             # Docker environment (MinIO)
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

| Command                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `make up`               | Start the infrastructure containers                  |
| `make env-up`           | Same, using `.env.docker` (MinIO instead of S3)      |
| `make down`             | Stop all services                                    |
| `make env-down`         | Stop all services started with `.env.docker`         |
| `make logs`             | View API container logs (if running)                 |
| `make test`             | Run test suite with vitest                           |
| `make lint`             | Lint codebase with ESLint                            |
| `make fmt`              | Format code with Prettier                            |
| `make seed`             | Populate database with sample data                   |
| `make refresh-cache`    | Manually trigger cache warming job                   |
| `make build`            | Build TypeScript project                             |
| `make prisma-generate`  | Regenerate the Prisma client after a schema change   |
| `make prisma-migrate`   | Create and apply a migration in development          |
| `make prisma-deploy`    | Apply existing migrations, used in production        |
| `make prisma-studio`    | Browse the Postgres data in a web UI                 |
| `make prisma-status`    | Show which migrations have been applied              |
| `make db-reset`         | Drop and recreate the Postgres schema, destroys data |

### Additional npm Scripts

```bash
# Seeding
npm run seed              # Seed with data.json (uses src/cli/seeds/seed.ts)
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

#### MongoDB Dashboard (Mongo Express)

- **URL**: [http://localhost:8081](http://localhost:8081)
- **Credentials**: Use `MONGO_ROOT_USER` and `MONGO_ROOT_PASSWORD` from `.env`
- **Features**: Browse collections, run queries, manage documents

#### Redis Dashboard (RedisInsight)

- **URL**: [http://localhost:8001](http://localhost:8001)
- **Setup**: On first launch, add a database connection
  - Host: `localhost`
  - Port: `6379`
  - Name: Any descriptive name
- **Features**: View cache keys, monitor performance, debug queries

#### MinIO Dashboard (MinIO Console)

- **URL**: [http://localhost:9001](http://localhost:9001)
- **Setup**: Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from `.env.docker`
- **Features**: View files, manage buckets, monitor performance, debug queries

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

> [!IMPORTANT]
> For accurate testing that mirrors the production environment, it is strongly recommended to use Docker for running tests. Start the Docker services (`make up` or `docker-compose up -d`) before running your tests to ensure MongoDB and Redis are available. This provides a consistent testing environment and prevents issues related to local database configurations.

The project uses **vitest** for comprehensive testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- document.test.ts
```

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
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=studzee-production
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=Studzee <no-reply@studzee.in>
EMAIL_ATTACHMENT_HOSTS=studzee-production.s3.ap-south-1.amazonaws.com
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

# Run production container
docker run -p 4000:4000 --env-file .env studzee-api:latest
```

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
- **Logging**: Structured JSON logs via pino (check with `make logs`)
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

**S3 Upload Failures**

```bash
# Verify AWS credentials
cat .env | grep AWS

# Check IAM user permissions in AWS Console
# Ensure bucket exists and is in the correct region

# Review application logs for detailed error messages
make logs
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
