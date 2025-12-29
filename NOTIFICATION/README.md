# Studzee Notification API

A production-ready notification service built with Bun and TypeScript that provides comprehensive push notification and email management. It exposes user registration, admin notification management endpoints, and email delivery capabilities. The service leverages PostgreSQL for persistent storage, Prisma ORM for database operations, Clerk for secure authentication, and integrates with Expo Push Notifications and Nodemailer for email delivery.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Clerk Setup](#clerk-setup)
  - [PostgreSQL Setup](#postgresql-setup)
  - [Email Setup (Nodemailer)](#email-setup-nodemailer)
  - [Prisma Setup](#prisma-setup)
- [Usage](#usage)
  - [Development](#development)
  - [Production](#production)
  - [Docker Deployment](#docker-deployment)
  - [Code Quality](#code-quality)
- [Docker Compose Guide](#docker-compose-guide)
  - [Service Architecture](#service-architecture)
  - [Volumes & Data Persistence](#volumes--data-persistence)
  - [Networking](#networking)
  - [Port Mappings](#port-mappings)
  - [Database Management](#database-management)
  - [Health Checks](#health-checks)
  - [Common Docker Commands](#common-docker-commands)
- [Architecture](#architecture)
  - [Key Components](#key-components)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
- [Database Schema](#database-schema)
- [Development](#development-1)
  - [Project Structure](#project-structure)
  - [Available npm Scripts](#available-npm-scripts)
  - [Prisma Commands](#prisma-commands)
  - [Development Authentication Bypass](#development-authentication-bypass)
- [Deployment](#deployment)
  - [Environment Setup](#environment-setup)
  - [Docker Production Build](#docker-production-build)
  - [Docker Compose Production](#docker-compose-production)
- [Scheduled Jobs](#scheduled-jobs)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

- **Bun Runtime**: High-performance JavaScript runtime for fast execution
- **Express.js**: Modern TypeScript-based web framework
- **PostgreSQL**: Robust relational database with Prisma ORM
- **Clerk**: Enterprise-grade authentication and user management
- **Expo Push Notifications**: Native push notification delivery for mobile apps
- **Email Delivery**: Professional HTML email templates with Nodemailer and Gmail SMTP
- **Zod**: Runtime type validation and schema enforcement
- **Scheduled Jobs**: Automated token cleanup and health monitoring with `node-cron`
- **Structured Logging**: Production-ready logging with `pino`
- **Security**: Helmet security headers, CORS, and rate limiting
- **Docker**: Fully containerized development environment with Docker Compose
- **Developer Tools**: ESLint, Prettier, and development auth bypass
- **Production Ready**: Health checks, heartbeat monitoring for deployment

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Bun](https://bun.sh/) (v1.1.30+) - JavaScript runtime
- Clerk account for authentication
- PostgreSQL database (or use Docker Compose)
- Gmail account or SMTP server for email delivery
- Expo account for push notifications (optional for testing)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd NOTIFICATION
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your configuration values in `.env` (see Configuration section below)

4. **Setup Prisma and Database**

   ```bash
   # Generate Prisma Client
   bun run prisma:generate

   # Run database migrations
   bun run prisma:migrate

   # (Optional) Seed the database
   bun run prisma:seed
   ```

5. **Start the service**

   ```bash
   bun run dev
   ```

## Configuration

### Environment Variables

| Variable                | Description                                         | Required | Default     |
| ----------------------- | --------------------------------------------------- | -------- | ----------- |
| `NODE_ENV`              | Environment (development/production/test)           | Yes      | development |
| `PORT`                  | Server port                                         | No       | 3000        |
| `DATABASE_URL`          | PostgreSQL connection string                        | Yes      | -           |
| `CLERK_SECRET_KEY`      | Clerk authentication secret key                     | Yes      | -           |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key                               | Yes      | -           |
| `DEV_TOKEN`             | Development auth bypass token (bypasses Clerk auth) | No       | -           |
| `SMTP_HOST`             | SMTP server host (e.g., smtp.gmail.com)             | Yes      | -           |
| `SMTP_PORT`             | SMTP server port                                    | Yes      | 587         |
| `SMTP_USER`             | SMTP username/email                                 | Yes      | -           |
| `SMTP_PASSWORD`         | SMTP password (App password for Gmail)              | Yes      | -           |
| `EMAIL_FROM`            | Email sender name and address                       | Yes      | -           |
| `HEALTHCHECK_URL`       | URL for heartbeat job to ping (production only)     | No       | -           |

### Clerk Setup

1. Create a Clerk application at [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to API Keys and copy your Secret Key and Publishable Key
3. Add the keys to your `.env` file
4. Set up roles in Clerk and create an `admin` role for admin access

### PostgreSQL Setup

**Option 1: Local PostgreSQL**

1. Install PostgreSQL locally
2. Create a database: `notification_db`
3. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notification_db"
   ```

**Option 2: Docker (Recommended)**

Use the included `docker-compose.yml`:

```bash
docker-compose up postgres -d
```

This will start PostgreSQL on port `5432` with the default credentials.

### Email Setup (Nodemailer)

**Gmail Setup (Recommended)**

1. Create a Gmail account or use an existing one
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Generate a new app password for "Mail"
4. Add credentials to `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   EMAIL_FROM="Studzee Notifications <noreply@studzee.com>"
   ```

**Other SMTP Providers**

For other providers (SendGrid, Mailgun, etc.), update the SMTP configuration accordingly.

### Prisma Setup

After cloning the repository and setting up your database:

1. **Generate Prisma Client**:

   ```bash
   bun run prisma:generate
   ```

2. **Run Migrations**:

   ```bash
   bun run prisma:migrate
   ```

3. **Open Prisma Studio** (optional, for database GUI):
   ```bash
   bun run prisma:studio
   ```

## Usage

### Development

**Start infrastructure (PostgreSQL):**

```bash
# Start PostgreSQL using Docker Compose
docker-compose up postgres -d
```

**Run the API:**

```bash
bun run dev
```

This setup allows you to:

- Modify code and see changes with hot-reload
- Use your local Bun environment
- Easily debug the application

### Production

```bash
bun run start
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f app
```

### Code Quality

```bash
# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Check formatting
bun run format:check
```

## Docker Compose Guide

The project includes a comprehensive Docker Compose setup for local development and production deployment. This section provides detailed information about the containerized environment.

### Service Architecture

The `docker-compose.yml` defines **2 services** that work together to provide a complete environment:

#### 1. **PostgreSQL (`postgres`)**

- **Image**: `postgres:16-alpine`
- **Purpose**: Primary database for notification storage
- **Container Name**: `notification-postgres`
- **Port**: `5432`
- **Credentials**:
  - Username: `postgres`
  - Password: `postgres`
  - Database: `notification_db`
- **Health Check**: Uses `pg_isready` to verify database availability every 10 seconds
- **Volume**: `notification-postgres-data` for data persistence

#### 2. **Notification API (`app`)**

- **Purpose**: Core notification service application
- **Container Name**: `notification-service`
- **Port**: `3000`
- **Runtime**: Bun 1.1.30
- **Features**:
  - Auto-runs Prisma migrations on startup
  - Integrates with PostgreSQL for data storage
  - Provides REST API for notifications and email
  - Scheduled jobs for token cleanup and heartbeat monitoring
- **Depends On**: PostgreSQL service must be healthy before starting

### Volumes & Data Persistence

The Docker Compose setup uses **named volumes** to persist data across container restarts:

| Volume Name                  | Purpose            | Data Stored                         |
| ---------------------------- | ------------------ | ----------------------------------- |
| `notification-postgres-data` | PostgreSQL storage | Database tables, indexes, user data |

**Volume Management**:

```bash
# List volumes
docker volume ls | grep notification

# Inspect a volume
docker volume inspect notification-postgres-data

# Remove all volumes (WARNING: deletes all data)
docker-compose down -v
```

### Networking

All services communicate through a Docker default bridge network:

- **Features**:
  - Automatic DNS resolution between services
  - Services can reference each other by service name (e.g., `postgres`)
  - Containers can access each other using service names

**Example**: When the API connects to PostgreSQL, it uses the hostname `postgres` instead of `localhost` when running inside Docker.

### Port Mappings

Complete reference of all exposed ports:

| Port   | Service    | Purpose             | Environment Variable |
| ------ | ---------- | ------------------- | -------------------- |
| `3000` | API        | Application server  | `PORT`               |
| `5432` | PostgreSQL | Database connection | -                    |

**Accessing Services**:

- API: `http://localhost:3000`
- PostgreSQL: `postgresql://postgres:postgres@localhost:5432/notification_db`

### Database Management

**Access PostgreSQL Shell**:

```bash
# Using Docker Compose
docker-compose exec postgres psql -U postgres -d notification_db

# Or using psql directly (if installed)
psql postgresql://postgres:postgres@localhost:5432/notification_db
```

**Run Prisma Migrations**:

```bash
# Inside the container
docker-compose exec app bunx prisma migrate deploy

# Or locally
bun run prisma:migrate
```

**Seed the Database**:

```bash
# Inside the container
docker-compose exec app bun run prisma:seed

# Or locally
bun run prisma:seed
```

### Health Checks

All core services include health check configurations to ensure reliability:

| Service    | Check Command            | Interval | Timeout | Retries | Start Period |
| ---------- | ------------------------ | -------- | ------- | ------- | ------------ |
| PostgreSQL | `pg_isready -U postgres` | 10s      | 5s      | 5       | -            |

**Health Check Benefits**:

- Container orchestration systems use these to determine service readiness
- `depends_on` with `condition: service_healthy` ensures proper startup order
- Automatic restart of unhealthy containers (with `restart: unless-stopped`)

**Checking Service Health**:

```bash
# View health status of all services
docker-compose ps

# Check specific service health
docker inspect notification-postgres --format='{{json .State.Health}}'
```

### Common Docker Commands

Extended reference of useful Docker Compose commands:

#### Starting & Stopping

```bash
# Start all services
docker-compose up -d

# Start only PostgreSQL
docker-compose up postgres -d

# Stop all services
docker-compose down

# Stop and remove volumes (deletes all data!)
docker-compose down -v
```

#### Monitoring

```bash
# View logs for all services
docker-compose logs

# Follow app logs
docker-compose logs -f app

# View logs for PostgreSQL
docker-compose logs postgres

# Check service status
docker-compose ps
```

#### Database Operations

```bash
# Run Prisma migrations
docker-compose exec app bunx prisma migrate deploy

# Generate Prisma Client
docker-compose exec app bunx prisma generate

# Seed the database
docker-compose exec app bun run prisma:seed

# Open Prisma Studio
docker-compose exec app bunx prisma studio

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d notification_db
```

#### Maintenance

```bash
# Restart a specific service
docker-compose restart app

# Rebuild and restart services
docker-compose up -d --build

# Pull latest images
docker-compose pull

# View resource usage
docker stats
```

## Architecture

The service follows a clean architecture pattern with clear separation of concerns:

```
src/
├── config/             # Configuration (Database, Prisma, environment)
├── controllers/        # Request handlers
│   ├── admin.controller.ts      # Admin operations (users, notifications)
│   ├── email.controller.ts      # Email management
│   ├── notification.controller.ts # Push notification handling
│   └── user.controller.ts       # User registration
├── jobs/               # Scheduled background jobs
│   ├── cleanupTokens.ts         # Token cleanup job
│   ├── heartbeat.ts             # Health monitoring
│   └── index.ts                 # Job scheduler
├── middleware/         # Express middleware
│   ├── clerk.middleware.ts      # Clerk authentication
│   ├── errorHandler.middleware.ts # Error handling
│   ├── rateLimit.middleware.ts  # Rate limiting
│   └── validation.middleware.ts # Request validation
├── routes/             # Route definitions
│   ├── admin.routes.ts          # Admin endpoints
│   ├── health.routes.ts         # Health checks
│   ├── user.routes.ts           # User endpoints
│   └── index.ts                 # Route aggregation
├── services/           # Business logic layer
│   ├── email.service.ts         # Email sending logic
│   ├── expo.service.ts          # Expo push notifications
│   ├── notification.service.ts  # Notification management
│   └── user.service.ts          # User operations
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
│   ├── logger.ts                # Pino logger
│   ├── mail.ts                  # Email templates
│   ├── prisma.ts                # Prisma client
│   └── validation.ts            # Zod schemas
└── index.ts            # Application entry point
```

### Key Components

- **User Service**: Handles user registration and Expo token management
- **Notification Service**: Manages push notification sending and history
- **Email Service**: Handles email delivery with HTML templates and PDF attachments
- **Expo Service**: Integrates with Expo Push Notification API
- **Authentication**: Clerk middleware with role-based access control and development bypass
- **Security Middleware**: Helmet, CORS, and rate limiting (100 req/15min)
- **Scheduled Jobs**: Token cleanup and production heartbeat monitoring
- **Error Handling**: Centralized error handling middleware
- **Validation**: Zod schemas for request/response validation
- **Database Layer**: Prisma ORM with PostgreSQL

## API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

Admin endpoints additionally require the user to have the admin role configured in Clerk.

### Endpoints

For detailed API documentation, see [API.md](./API.md).

#### Health Check

- **GET** `/healthcheck` - Basic health check endpoint (Public)

#### User Endpoints

- **POST** `/api/register` - Register user and add Expo push token (Protected)

#### Admin Endpoints

- **POST** `/api/admin/notification/send` - Send push notification (Admin)
- **GET** `/api/admin/notifications` - Get all notifications with pagination (Admin)
- **GET** `/api/admin/users` - Get all users with pagination (Admin)
- **GET** `/api/admin/emails` - Get all user emails (Admin)
- **POST** `/api/admin/email/send` - Send HTML email with attachments (Admin)
- **GET** `/api/admin/email/logs` - Get email logs with pagination (Admin)

For full request/response examples and detailed documentation, refer to [API.md](./API.md).

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

### User

Stores user information and Expo push tokens.

```prisma
model User {
  id          String   @id @default(cuid())
  clerkId     String   @unique
  email       String   @unique
  expoTokens  String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Notification

Tracks all sent push notifications.

```prisma
model Notification {
  id         String   @id @default(cuid())
  title      String
  message    String
  imageUrl   String?
  recipients String[]
  sentBy     String
  sentAt     DateTime @default(now())
  createdAt  DateTime @default(now())
}
```

### EmailLog

Logs all sent emails.

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  recipients  String[]
  subject     String
  body        String
  messageId   String?
  status      String
  error       String?
  createdAt   DateTime @default(now())
}
```

To view the complete schema, see `prisma/schema.prisma`.

## Development

### Project Structure

```
NOTIFICATION/
├── prisma/                # Prisma schema and migrations
│   ├── migrations/        # Database migration files
│   ├── schema.prisma      # Database schema definition
│   └── seed.ts            # Database seeding script
├── src/                   # Source code (see Architecture section)
├── .env.example           # Environment variable template
├── .prettierrc            # Prettier configuration
├── docker-compose.yml     # Docker compose configuration
├── Dockerfile             # Docker build configuration
├── eslint.config.cjs      # ESLint configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

### Available npm Scripts

```bash
# Development
bun run dev                # Start dev server with hot reload

# Production
bun run start              # Start production server

# Code Quality
bun run lint               # Run ESLint
bun run lint:fix           # Fix ESLint issues
bun run format             # Format code with Prettier
bun run format:check       # Check code formatting

# Docker
bun run docker:build       # Build Docker image
bun run docker:up          # Start Docker containers
bun run docker:down        # Stop Docker containers

# Release
bun run do-release         # Create patch release
bun run do-release:minor   # Create minor release
bun run do-release:major   # Create major release
```

### Prisma Commands

```bash
# Generate Prisma Client
bun run prisma:generate

# Create new migration
bun run prisma:migrate

# Push schema to database (without migration)
bun run prisma:push

# Open Prisma Studio (database GUI)
bun run prisma:studio

# Seed the database
bun run prisma:seed
```

### Development Authentication Bypass

For local development and testing without Clerk authentication:

1. Set `DEV_TOKEN` in your `.env` file:

   ```
   DEV_TOKEN=my-dev-token-123
   ```

2. Use the dev token in your requests:
   ```bash
   curl -H "Authorization: Bearer my-dev-token-123" \
        http://localhost:3000/api/admin/users
   ```

> **Warning**: This bypass only works in `development` mode. Never use this in production!

## Deployment

### Environment Setup

Ensure all required environment variables are configured in your production environment:

- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)
- `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`
- SMTP credentials for email delivery
- `HEALTHCHECK_URL` (optional, for monitoring)

### Docker Production Build

```bash
# Build the Docker image
docker build -t studzee-notification:latest .

# Run the container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name notification-service \
  studzee-notification:latest
```

### Docker Compose Production

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

The Docker setup automatically:

1. Runs Prisma migrations (`prisma migrate deploy`)
2. Starts the application server
3. Schedules background jobs (token cleanup, heartbeat)

## Scheduled Jobs

The service includes automated background jobs:

### Token Cleanup Job

- **Schedule**: Daily at 2:00 AM
- **Purpose**: Removes expired or invalid Expo push tokens
- **Implementation**: `src/jobs/cleanupTokens.ts`

### Heartbeat Job

- **Schedule**: Every 10 minutes (production only)
- **Purpose**: Pings health check URL to prevent service sleep (Render, Heroku, etc.)
- **Implementation**: `src/jobs/heartbeat.ts`

Jobs are automatically started when the application launches (see `src/jobs/index.ts`).

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: Can't reach database server`

**Solution**:

1. Verify PostgreSQL is running: `docker-compose ps`
2. Check `DATABASE_URL` in `.env`
3. Ensure PostgreSQL port `5432` is not blocked
4. Run health check: `docker-compose exec postgres pg_isready -U postgres`

### Prisma Client Not Generated

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:

```bash
bun run prisma:generate
```

### Email Delivery Failures

**Problem**: `Error: Invalid credentials` or `Error: Connection timeout`

**Solution**:

1. Verify SMTP credentials in `.env`
2. For Gmail, ensure you're using an App Password (not your account password)
3. Check firewall settings for port `587` or `465`
4. Test SMTP connection separately

### Push Notification Not Delivered

**Problem**: Notifications not appearing on devices

**Solution**:

1. Verify Expo push token is valid (check format: `ExponentPushToken[...]`)
2. Ensure the device has the Expo Go app or your standalone app installed
3. Check notification permissions on the device
4. Review logs: `docker-compose logs -f app`

### Port Already in Use

**Problem**: `Error: Port 3000 is already in use`

**Solution**:

```bash
# Change PORT in .env
PORT=3001

# Or stop the conflicting service
lsof -ti:3000 | xargs kill -9
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting and formatting: `bun run lint:fix && bun run format`
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a pull request

## License

This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository or contact the maintainer.
