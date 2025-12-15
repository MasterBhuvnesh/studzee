# Studzee API

A production-ready backend service built with TypeScript that provides comprehensive document management. It exposes public content listing, authenticated document retrieval, and admin management endpoints. The service leverages MongoDB for persistent storage, Redis for high-performance caching, and Clerk for secure authentication.

## Features

- **Express.js**: Modern TypeScript-based web framework
- **MongoDB**: Document storage with Mongoose ODM
- **Redis Stack**: High-performance caching layer
- **Clerk**: Enterprise-grade authentication and user management
- **Zod**: Runtime type validation and schema enforcement
- **Scheduled Jobs**: Automated cache warming with `node-cron`
- **Structured Logging**: Production-ready logging with `pino`
- **Docker**: Fully containerized with Docker Compose
- **Developer Tools**: ESLint, Prettier, and Makefile automation
- **Testing**: Comprehensive test suite with `vitest`

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+) and npm
- `make` (optional, for convenience commands)
- Clerk account for authentication
- MongoDB Atlas account (or local MongoDB instance)

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

| Variable                | Description                           | Required | Default |
| ----------------------- | ------------------------------------- | -------- | ------- |
| `NODE_ENV`              | Environment (development/production)  | Yes      | -       |
| `PORT`                  | Server port                           | No       | 4000    |
| `MONGO_URI`             | MongoDB connection string             | Yes      | -       |
| `MONGO_ROOT_USER`       | MongoDB root username                 | Yes      | -       |
| `MONGO_ROOT_PASSWORD`   | MongoDB root password                 | Yes      | -       |
| `REDIS_HOST`            | Redis server host                     | No       | redis   |
| `REDIS_PORT`            | Redis server port                     | No       | 6379    |
| `CLERK_SECRET_KEY`      | Clerk authentication secret key       | Yes      | -       |
| `CLERK_ADMIN_ROLE`      | Clerk role name for admin access      | Yes      | admin   |
| `LIST_CACHE_TTL`        | List cache TTL in seconds             | No       | 300     |
| `DOC_CACHE_TTL`         | Document cache TTL in seconds         | No       | 86400   |
| `CRON_SCHEDULE`         | Cron expression for cache refresh job | No       | -       |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                 | Yes      | -       |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                    | Yes      | -       |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                 | Yes      | -       |

### Clerk Setup

1. Create a Clerk application at [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to API Keys and copy your Secret Key
3. Add the key to your `.env` file as `CLERK_SECRET_KEY`
4. Set up roles in Clerk and create an `admin` role (or customize `CLERK_ADMIN_ROLE`)

### MongoDB Setup

1. Create a MongoDB cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or use a local instance
2. Get your connection string
3. Add connection details to your `.env` file

## Usage

### Development

```bash
npm run dev
```

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
├── config/             # Configuration (DB, Redis, env)
├── core/               # Business logic
│   └── services/       # Service layer
├── jobs/               # Scheduled background jobs
├── middleware/         # Express middleware
├── models/             # Data models and schemas
├── scripts/            # Utility scripts
└── utils/              # Helper functions
```

### Key Components

- **Content Service**: Handles document listing and retrieval with caching
- **Admin Service**: Manages document CRUD operations
- **Cache Layer**: Redis-based caching with automatic invalidation
- **Authentication**: Clerk middleware with role-based access control
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
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Advanced Node.js",
        "summary": "Deep dive into Node.js internals",
        "createdAt": "2024-01-16T14:20:00.000Z",
        "updatedAt": "2024-01-16T14:20:00.000Z"
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
    "quiz": {
      "q1": {
        "que": "What is TypeScript?",
        "ans": "A typed superset of JavaScript",
        "options": [
          "A typed superset of JavaScript",
          "A new programming language",
          "A JavaScript framework",
          "A database system"
        ]
      },
      "q2": {
        "que": "Who developed TypeScript?",
        "ans": "Microsoft",
        "options": ["Google", "Facebook", "Microsoft", "Apple"]
      }
    },
    "key_notes": {
      "note1": "TypeScript adds static types to JavaScript",
      "note2": "It compiles down to plain JavaScript",
      "note3": "Provides better IDE support and autocomplete"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: Document does not exist
    ```json
    {
      "message": "Document not found"
    }
    ```

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
        "pdfUrl": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/pdfs/introduction-to-typescript.pdf",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "documentId": "507f1f77bcf86cd799439012",
        "title": "Advanced Node.js",
        "pdfUrl": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/pdfs/advanced-nodejs.pdf",
        "uploadedAt": "2024-01-16T14:20:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters
    ```json
    {
      "message": "Invalid query parameters",
      "errors": [
        {
          "path": ["page"],
          "message": "Number must be greater than or equal to 1"
        }
      ]
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
- **Example Request**:
  ```bash
  curl -X POST http://localhost:4000/admin/documents \
       -H "Authorization: Bearer eyJhbGc..." \
       -H "Content-Type: application/json" \
       -d '{
         "title": "New Tutorial",
         "content": "Complete tutorial content...",
         "quiz": {
           "q1": {
             "que": "Sample question?",
             "ans": "Correct answer",
             "options": ["Option 1", "Correct answer"]
           }
         }
       }'
  ```
- **Success Response** (201 Created):
  ```json
  {
    "message": "Document created successfully",
    "doc": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "New Tutorial",
      "content": "Complete tutorial content...",
      "quiz": {
        "q1": {
          "que": "Sample question?",
          "ans": "Correct answer",
          "options": ["Option 1", "Correct answer"]
        }
      },
      "createdAt": "2024-01-17T09:15:00.000Z",
      "updatedAt": "2024-01-17T09:15:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid document data
    ```json
    {
      "message": "Invalid document data",
      "errors": [
        {
          "path": ["title"],
          "message": "Title must be at least 3 characters long"
        }
      ]
    }
    ```
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role

##### Update Document

- **PUT** `/admin/documents/:id`
- **Description**: Update an existing document
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "title": "Updated Title",
    "content": "Updated content...",
    "tags": ["typescript", "tutorial"]
  }
  ```
- **Example Request**:
  ```bash
  curl -X PUT http://localhost:4000/admin/documents/507f1f77bcf86cd799439011 \
       -H "Authorization: Bearer eyJhbGc..." \
       -H "Content-Type: application/json" \
       -d '{
         "title": "Updated Title",
         "content": "Updated content..."
       }'
  ```
- **Success Response** (200 OK):
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Updated Title",
    "content": "Updated content...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-17T10:45:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid update data
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role
  - `404 Not Found`: Document does not exist

##### Delete Document

- **DELETE** `/admin/documents/:id`
- **Description**: Delete a document by its ID
- **Access**: Admin only
- **Example Request**:
  ```bash
  curl -X DELETE http://localhost:4000/admin/documents/507f1f77bcf86cd799439011 \
       -H "Authorization: Bearer eyJhbGc..."
  ```
- **Success Response** (204 No Content):
  ```
  (Empty response body)
  ```
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
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/images/507f1f77bcf86cd799439011.png",
    "documentId": "507f1f77bcf86cd799439011"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: No file uploaded or invalid file type
    ```json
    {
      "message": "Invalid file type. Only JPG, PNG, and WebP images are allowed."
    }
    ```
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role
  - `404 Not Found`: Document does not exist
  - `500 Internal Server Error`: Cloudinary upload failure

##### Upload Document PDF

- **POST** `/admin/documents/:id/upload-pdf`
- **Description**: Upload a PDF for a document (replaces existing PDF if present)
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
    "pdfUrl": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/pdfs/introduction-to-typescript.pdf",
    "documentId": "507f1f77bcf86cd799439011"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: No file uploaded, invalid file type, or file size exceeded
    ```json
    {
      "message": "Invalid file type. Only PDF files are allowed."
    }
    ```
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: User does not have admin role
  - `404 Not Found`: Document does not exist
  - `500 Internal Server Error`: Cloudinary upload failure

## Caching Strategy

The service implements a two-tier Redis caching strategy for optimal performance:

### 1. List Cache

- **Endpoint**: `GET /content`
- **Cache Key Pattern**: `content:list:page:<page>:limit:<limit>`
- **TTL**: 5 minutes (300 seconds)
- **Strategy**: Cache the paginated list response
- **Invalidation**: Automatic expiry after TTL

### 2. Document Cache

- **Endpoint**: `GET /content/:id`
- **Cache Key Pattern**: `content:doc:<id>`
- **TTL**: 24 hours (86400 seconds)
- **Strategy**: Cache individual document responses
- **Invalidation**: Automatic expiry + manual refresh job

### Cache Warming

A scheduled background job (configurable via `CRON_SCHEDULE`) automatically:

- Discovers new documents in the database
- Pre-warms the cache with frequently accessed documents
- Logs cache statistics for monitoring

**Manual cache refresh**:

```bash
make refresh-cache
```

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
  imageUrl?: string // Optional Cloudinary image URL
  pdfUrl?: string // Optional Cloudinary PDF URL
  createdAt: Date // Auto-generated timestamp
  updatedAt: Date // Auto-updated timestamp
}

interface QuizItem {
  que: string // Question text
  ans: string // Correct answer
  options: string[] // Answer options (min 2)
}
```

> **Note**: The `imageUrl` and `pdfUrl` fields are optional and will be `null` or `undefined` if no files have been uploaded for the document.

## Development

### Project Structure

```
.
├── src/
│   ├── api/                # HTTP layer
│   │   ├── controllers/    # Request handlers
│   │   │   ├── admin.controller.ts
│   │   │   └── content.controller.ts
│   │   └── routes/         # Route definitions
│   │       ├── admin.ts
│   │       ├── auth.ts
│   │       ├── content.ts
│   │       └── health.ts
│   ├── config/             # App configuration
│   │   ├── db.ts           # MongoDB connection
│   │   ├── env.ts          # Environment variables
│   │   └── redis.ts        # Redis connection
│   ├── core/               # Business logic
│   │   └── services/       # Service layer
│   │       └── content.service.ts
│   ├── jobs/               # Scheduled jobs
│   │   └── cacheRefresh.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # Clerk authentication
│   │   └── errorHandler.ts
│   ├── models/             # Data models
│   │   ├── document.model.ts    # Mongoose model
│   │   └── document.schema.ts   # Zod schema
│   ├── scripts/            # Utility scripts
│   │   └── seed.ts         # Database seeding
│   ├── utils/              # Helper functions
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

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `make up`            | Start all services (API, MongoDB, Redis) |
| `make down`          | Stop all services                        |
| `make logs`          | View API container logs                  |
| `make test`          | Run test suite with vitest               |
| `make lint`          | Lint codebase with ESLint                |
| `make fmt`           | Format code with Prettier                |
| `make seed`          | Populate database with sample data       |
| `make refresh-cache` | Manually trigger cache warming job       |
| `make build`         | Build TypeScript project                 |

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

## Testing

The project uses **vitest** for comprehensive testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- document.test.ts
```

## Deployment

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
