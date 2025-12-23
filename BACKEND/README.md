# Studzee API

A production-ready backend service built with TypeScript that provides comprehensive document management. It exposes public content listing, authenticated document retrieval, and admin management endpoints. The service leverages MongoDB for persistent storage, Redis for high-performance caching, AWS S3 for file storage, and Clerk for secure authentication.

## Features

- **Express.js**: Modern TypeScript-based web framework
- **MongoDB**: Document storage with Mongoose ODM
- **Redis Stack**: High-performance caching layer with RedisInsight dashboard
- **AWS S3**: Scalable cloud file storage for documents and PDFs
- **Clerk**: Enterprise-grade authentication and user management
- **Zod**: Runtime type validation and schema enforcement
- **Scheduled Jobs**: Automated cache warming and health monitoring with `node-cron`
- **Structured Logging**: Production-ready logging with `pino`
- **File Uploads**: Multipart file upload support with `multer`
- **Security**: Helmet security headers, CORS, compression, and rate limiting
- **Docker**: Fully containerized development environment with Docker Compose
- **Developer Tools**: ESLint, Prettier, Makefile automation, and development auth bypass
- **Testing**: Comprehensive test suite with `vitest`
- **Production Ready**: Health checks, heartbeat monitoring for Render deployment

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+) and npm
- `make` (optional, for convenience commands)
- Clerk account for authentication
- MongoDB Atlas account (or local MongoDB instance)
- AWS account with S3 bucket created

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

## Configuration

### Environment Variables

| Variable                | Description                                                      | Required | Default      |
| ----------------------- | ---------------------------------------------------------------- | -------- | ------------ |
| `NODE_ENV`              | Environment (development/production/test)                        | Yes      | development  |
| `PORT`                  | Server port                                                      | No       | 4000         |
| `MONGO_URI`             | MongoDB connection string                                        | Yes      | -            |
| `MONGO_ROOT_USER`       | MongoDB root username (Docker only)                              | Yes      | -            |
| `MONGO_ROOT_PASSWORD`   | MongoDB root password (Docker only)                              | Yes      | -            |
| `REDIS_URL`             | Redis connection URL                                             | Yes      | -            |
| `CLERK_SECRET_KEY`      | Clerk authentication secret key                                  | Yes      | -            |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key                                            | Yes      | -            |
| `LIST_CACHE_TTL`        | List cache TTL in seconds                                        | No       | 300          |
| `DOC_CACHE_TTL`         | Document cache TTL in seconds                                    | No       | 86400        |
| `TODAY_CACHE_TTL`       | Today's content cache TTL in seconds                             | No       | 3600         |
| `JOB_CRON`              | Cron expression for cache refresh job (currently unused)         | No       | 0 0 \* \* \* |
| `LOG_LEVEL`             | Logging level (info/debug/error)                                 | No       | info         |
| `AWS_REGION`            | AWS region for S3 (e.g., us-east-1)                              | Yes      | -            |
| `AWS_ACCESS_KEY_ID`     | AWS access key ID                                                | Yes      | -            |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key                                            | Yes      | -            |
| `AWS_S3_BUCKET_NAME`    | S3 bucket name for file storage                                  | Yes      | -            |
| `DEV_TOKEN`             | Development auth bypass token (bypasses Clerk authentication)    | No       | -            |
| `HEALTHCHECK_URL`       | URL for heartbeat job to ping (production only, for Render etc.) | No       | -            |

### Clerk Setup

1. Create a Clerk application at [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to API Keys and copy your Secret Key and Publishable Key
3. Add the keys to your `.env` file
4. Set up roles in Clerk and create an `admin` role for admin access

### MongoDB Setup

1. Create a MongoDB cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or use a local instance
2. Get your connection string
3. Add connection details to your `.env` file

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

> **Note**: The current `docker-compose.yml` only runs MongoDB and Redis services. The API must be run separately for local development.

**Start infrastructure services:**

```bash
# Start MongoDB and Redis
make up
# Or manually:
docker-compose up -d
```

**Run the API:**

```bash
npm run dev
```

This setup allows you to:

- Modify code and see changes with hot-reload
- Use your local Node.js environment
- Easily debug the application

> **Tip**: To run the entire stack (API + MongoDB + Redis) in Docker, uncomment the `api` service section in `docker-compose.yml`.

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
src/
├── api/                # HTTP layer
│   ├── controllers/    # Request handlers
│   └── routes/         # Route definitions
├── config/             # Configuration (DB, Redis, S3, env)
├── core/               # Business logic
│   └── services/       # Service layer
├── data/               # Sample data files
├── jobs/               # Scheduled background jobs
├── middleware/         # Express middleware
├── models/             # Data models and schemas
├── scripts/            # Utility scripts
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

### Key Components

- **Content Service**: Handles document listing and retrieval with caching
- **Admin Service**: Manages document CRUD operations with cache invalidation
- **Upload Service**: Handles file uploads to AWS S3
- **Cache Layer**: Redis-based caching with automatic invalidation
- **Authentication**: Clerk middleware with role-based access control and development bypass
- **Security Middleware**: Helmet, CORS, compression, and rate limiting (100 req/15min)
- **Scheduled Jobs**: Daily cache refresh and production heartbeat monitoring
- **Error Handling**: Centralized error handling middleware
- **Validation**: Zod schemas for request/response validation

## API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

Admin endpoints additionally require the user to have the admin role configured in Clerk.

### Endpoints

#### Health Check Endpoints

##### Liveness Check

- **GET** `/health/liveness`
- **Description**: Checks if the application is running
- **Access**: Public
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

##### Healthcheck (Render/Production)

- **GET** `/healthcheck`
- **Description**: Simple health check endpoint for Render or other hosting platforms
- **Access**: Public
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
  ```

##### Readiness Check

- **GET** `/health/readiness`
- **Description**: Checks if database and Redis are connected and ready
- **Access**: Public
- **Success Response** (200 OK):
  ```json
  {
    "status": "ready",
    "checks": {
      "db": "ok",
      "redis": "ok"
    }
  }
  ```
- **Error Response** (503 Service Unavailable):
  ```json
  {
    "status": "unavailable",
    "checks": {
      "db": "error",
      "redis": "ok"
    }
  }
  ```

---

#### Content Endpoints

##### Get Today's Content

- **GET** `/content/today`
- **Description**: Retrieve documents created today (India Standard Time / IST timezone)
- **Access**: Public
- **Cache**: Uses `TODAY_CACHE_TTL` (default: 1 hour)
- **Example Request**:
  ```bash
  curl "http://localhost:4000/content/today"
  ```
- **Success Response** (200 OK):
  ```json
  {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Introduction to TypeScript",
        "summary": "A comprehensive guide to TypeScript basics",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "meta": {
      "date": "2024-01-15",
      "total": 1
    }
  }
  ```

##### Get Paginated Content

- **GET** `/content`
- **Description**: Retrieve a paginated list of documents (cached for 5 minutes)
- **Access**: Public
- **Query Parameters**:
  - `page` (optional): Page number (default: 1, min: 1)
  - `limit` (optional): Items per page (default: 20, min: 1, max: 100)
- **Example Request**:
  ```bash
  curl "http://localhost:4000/content?page=1&limit=10"
  ```
- **Success Response** (200 OK):
  ```json
  {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Introduction to TypeScript",
        "summary": "A comprehensive guide to TypeScript basics",
        "imageUrl": "https://bucket.s3.region.amazonaws.com/images/507f1f77bcf86cd799439011.jpg",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalItems": 50
    }
  }
  ```

##### Get Document by ID

- **GET** `/content/:id`
- **Description**: Retrieve a complete document by its ID (cached for 24 hours)
- **Access**: Authenticated
- **Headers**:
  ```
  Authorization: Bearer <CLERK_JWT_TOKEN>
  ```
- **Example Request**:
  ```bash
  curl -H "Authorization: Bearer eyJhbGc..." \
       http://localhost:4000/content/507f1f77bcf86cd799439011
  ```
- **Success Response** (200 OK):
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Introduction to TypeScript",
    "content": "TypeScript is a typed superset of JavaScript...",
    "summary": "A comprehensive guide to TypeScript basics",
    "facts": "TypeScript was developed by Microsoft",
    "imageUrl": "https://bucket.s3.region.amazonaws.com/images/507f1f77bcf86cd799439011.jpg",
    "pdfUrl": [
      {
        "name": "typescript-guide.pdf",
        "url": "https://bucket.s3.region.amazonaws.com/pdfs/introduction-to-typescript.pdf",
        "uploadedAt": "2024-01-15T10:30:00.000Z",
        "size": 1234567
      }
    ],
    "quiz": {
      "q1": {
        "que": "What is TypeScript?",
        "ans": "A typed superset of JavaScript",
        "options": [
          "A typed superset of JavaScript",
          "A new programming language"
        ]
      }
    },
    "key_notes": {
      "note1": "TypeScript adds static types to JavaScript",
      "note2": "It compiles down to plain JavaScript"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: Document does not exist

---

#### PDF Endpoints

##### List All PDFs

- **GET** `/pdfs`
- **Description**: Retrieve a paginated list of all documents with uploaded PDFs
- **Access**: Public
- **Query Parameters**:
  - `page` (optional): Page number (default: 1, min: 1)
  - `limit` (optional): Items per page (default: 20, min: 1, max: 100)
- **Example Request**:
  ```bash
  curl "http://localhost:4000/pdfs?page=1&limit=10"
  ```
- **Success Response** (200 OK):
  ```json
  {
    "data": [
      {
        "documentId": "507f1f77bcf86cd799439011",
        "title": "Introduction to TypeScript",
        "pdfs": [
          {
            "name": "typescript-guide.pdf",
            "url": "https://bucket.s3.region.amazonaws.com/pdfs/introduction-to-typescript.pdf",
            "uploadedAt": "2024-01-15T10:30:00.000Z",
            "size": 1234567
          }
        ]
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
  ```

---

#### Admin Endpoints

All admin endpoints require authentication AND admin role.

**Required Headers**:

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

##### Create Document

- **POST** `/admin/documents`
- **Description**: Create a new document
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "title": "New Tutorial",
    "content": "Complete tutorial content goes here...",
    "summary": "Optional summary of the content",
    "facts": "Optional interesting facts",
    "quiz": {
      "q1": {
        "que": "Sample question?",
        "ans": "Correct answer",
        "options": ["Option 1", "Option 2", "Correct answer", "Option 4"]
      }
    },
    "key_notes": {
      "note1": "Important point 1",
      "note2": "Important point 2"
    }
  }
  ```
- **Success Response** (201 Created):
  ```json
  {
    "message": "Document created successfully",
    "doc": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "New Tutorial",
      "content": "Complete tutorial content...",
      "createdAt": "2024-01-17T09:15:00.000Z",
      "updatedAt": "2024-01-17T09:15:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid document data
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role

##### Update Document

- **PUT** `/admin/documents/:id`
- **Description**: Update an existing document
- **Access**: Admin only
- **Request Body**: Partial document updates
- **Success Response** (200 OK): Updated document
- **Error Responses**:
  - `400 Bad Request`: Invalid update data
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role
  - `404 Not Found`: Document does not exist

##### Delete Document

- **DELETE** `/admin/documents/:id`
- **Description**: Delete a document by its ID
- **Access**: Admin only
- **Success Response** (204 No Content): Empty response
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role
  - `404 Not Found`: Document does not exist

##### Upload Document Image

- **POST** `/admin/documents/:id/upload-image`
- **Description**: Upload an image for a document (replaces existing image if present)
- **Access**: Admin only
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Image file (JPG, PNG, or WebP, max 10MB)
- **Example Request**:
  ```bash
  curl -X POST http://localhost:4000/admin/documents/507f1f77bcf86cd799439011/upload-image \
       -H "Authorization: Bearer eyJhbGc..." \
       -F "file=@/path/to/image.png"
  ```
- **Success Response** (200 OK):
  ```json
  {
    "message": "Image uploaded successfully",
    "imageUrl": "https://bucket.s3.region.amazonaws.com/images/507f1f77bcf86cd799439011.png",
    "documentId": "507f1f77bcf86cd799439011"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: No file uploaded or invalid file type
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role
  - `404 Not Found`: Document does not exist
  - `500 Internal Server Error`: S3 upload failure

##### Upload Document PDF

- **POST** `/admin/documents/:id/upload-pdf`
- **Description**: Upload a PDF for a document (adds to PDF array)
- **Access**: Admin only
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: PDF file (max 50MB)
- **Example Request**:
  ```bash
  curl -X POST http://localhost:4000/admin/documents/507f1f77bcf86cd799439011/upload-pdf \
       -H "Authorization: Bearer eyJhbGc..." \
       -F "file=@/path/to/document.pdf"
  ```
- **Success Response** (200 OK):
  ```json
  {
    "message": "PDF uploaded successfully",
    "pdf": {
      "name": "document.pdf",
      "url": "https://bucket.s3.region.amazonaws.com/pdfs/introduction-to-typescript.pdf",
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "size": 1234567
    },
    "documentId": "507f1f77bcf86cd799439011",
    "title": "Introduction to TypeScript"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: No file uploaded, invalid file type, or file size exceeded
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role
  - `404 Not Found`: Document does not exist
  - `500 Internal Server Error`: S3 upload failure

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

### Heartbeat Job (Production)

In production environments, an automated heartbeat job runs every 14 minutes to:

- Ping the configured `HEALTHCHECK_URL`
- Prevent services from spinning down due to inactivity (e.g., Render free tier)
- Log health check results

> **Note**: This job only runs when `NODE_ENV=production`. It is automatically skipped in development mode.

## Database Schema

### Document Model

```typescript
interface Document {
  _id: ObjectId // Auto-generated MongoDB ID
  title: string // Document title (min 3 chars)
  content: string // Full document content (min 10 chars)
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

## Development

### Project Structure

```
.
├── src/
│   ├── api/                # HTTP layer
│   │   ├── controllers/    # Request handlers
│   │   │   ├── admin.controller.ts
│   │   │   ├── content.controller.ts
│   │   │   ├── pdf.controller.ts
│   │   │   └── upload.controller.ts
│   │   └── routes/         # Route definitions
│   │       ├── admin.ts
│   │       ├── auth.ts
│   │       ├── content.ts
│   │       ├── health.ts
│   │       ├── healthcheck.ts   # Render/production healthcheck
│   │       └── pdf.ts
│   ├── config/             # App configuration
│   │   ├── index.ts        # Environment variables
│   │   ├── mongo.ts        # MongoDB connection
│   │   ├── redis.ts        # Redis connection
│   │   └── s3.ts           # AWS S3 configuration
│   ├── core/               # Business logic
│   │   └── services/       # Service layer
│   │       └── content.service.ts
│   ├── data/               # Sample data
│   │   ├── data.json
│   │   ├── sample.data.json
│   │   ├── today.data.json
│   │   ├── today.pdf
│   │   └── today.png
│   ├── jobs/               # Scheduled jobs
│   │   ├── cache-refresh.ts    # Daily cache warming
│   │   └── heartbeat.ts        # Production health pings
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # Clerk authentication + dev bypass
│   │   ├── errorHandler.ts
│   │   ├── helmet.ts       # Security headers
│   │   └── upload.ts       # Multer file upload
│   ├── models/             # Data models
│   │   ├── document.model.ts    # Mongoose model
│   │   └── document.schema.ts   # Zod schema
│   ├── scripts/            # Utility scripts
│   │   ├── run-job.ts
│   │   ├── seed.ts         # Database seeding
│   │   └── today.seed.ts   # Seed today's content
│   ├── types/              # TypeScript types
│   │   └── express.d.ts
│   ├── utils/              # Helper functions
│   │   ├── cache.ts        # Cache utilities
│   │   └── logger.ts       # Pino logger
│   └── index.ts            # Application entry point
├── .env.example            # Environment variables template
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Application container
├── Makefile                # Development commands
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

### Available Commands (Makefile)

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `make up`            | Start MongoDB and Redis containers   |
| `make down`          | Stop all services                    |
| `make logs`          | View API container logs (if running) |
| `make test`          | Run test suite with vitest           |
| `make lint`          | Lint codebase with ESLint            |
| `make fmt`           | Format code with Prettier            |
| `make seed`          | Populate database with sample data   |
| `make refresh-cache` | Manually trigger cache warming job   |
| `make build`         | Build TypeScript project             |

### Additional npm Scripts

```bash
# Seeding
npm run seed              # Seed with data.json
npm run seed:today        # Seed today's content with today.data.json

# Cache management
npm run job:refresh-cache # Manually refresh cache

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
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=studzee-production
LIST_CACHE_TTL=300
DOC_CACHE_TTL=86400
JOB_CRON=0 0 * * *
LOG_LEVEL=info
```

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
   - Start when `NODE_ENV=production`
   - Ping `HEALTHCHECK_URL` every 14 minutes
   - Keep your service alive (prevents Render free tier spin-down)
   - Log health check status

3. **Health check endpoints**:
   - `/health/liveness` - For container orchestration
   - `/health/readiness` - For load balancers
   - `/healthcheck` - For simple pings (used by heartbeat job)

## Monitoring

- **Liveness Probe**: Use `/health/liveness` for container health checks
- **Readiness Probe**: Use `/health/readiness` for load balancer health checks
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

**Redis Connection Failed**

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
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

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please create an issue in the repository or contact the maintainers.
