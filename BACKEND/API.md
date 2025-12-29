# API Documentation

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

Admin endpoints additionally require the user to have the admin role configured in Clerk.

## Endpoints

### Health Check Endpoints

#### Liveness Check

- **Route:** `GET /health/liveness`
- **Description:** Checks if the application is running
- **Protected:** No
- **Request:**
  - Body: None
- **Response:**
  - `200 OK`
    ```json
    {
      "status": "ok"
    }
    ```

#### Healthcheck (Render/Production)

- **Route:** `GET /healthcheck`
- **Description:** Simple health check endpoint for Render or other hosting platforms
- **Protected:** No
- **Request:**
  - Body: None
- **Response:**
  - `200 OK`
    ```json
    {
      "status": "ok",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
    ```

#### Readiness Check

- **Route:** `GET /health/readiness`
- **Description:** Checks if database and Redis are connected and ready
- **Protected:** No
- **Request:**
  - Body: None
- **Response:**
  - `200 OK` (all services healthy)
    ```json
    {
      "status": "ready",
      "checks": {
        "db": "ok",
        "redis": "ok"
      }
    }
    ```
  - `503 Service Unavailable` (one or more services unhealthy)
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

### Content Endpoints

#### Get Today's Content

- **Route:** `GET /content/today`
- **Description:** Retrieve documents created today (India Standard Time / IST timezone)
- **Protected:** No
- **Cache:** Uses `TODAY_CACHE_TTL` (default: 1 hour)
- **Request:**
  - Body: None
- **Response:**
  - `200 OK`
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
- **Example Request:**
  ```bash
  curl "http://localhost:4000/content/today"
  ```

#### Get Paginated Content

- **Route:** `GET /content`
- **Description:** Retrieve a paginated list of documents (cached for 5 minutes)
- **Protected:** No
- **Request:**
  - Query Parameters:
    - `page` (number, optional, default: 1, min: 1) - Page number
    - `limit` (number, optional, default: 20, min: 1, max: 100) - Items per page
- **Response:**
  - `200 OK`
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
- **Example Request:**
  ```bash
  curl "http://localhost:4000/content?page=1&limit=10"
  ```

#### Get Document by ID

- **Route:** `GET /content/:id`
- **Description:** Retrieve a complete document by its ID (cached for 24 hours)
- **Protected:** Yes (Requires Clerk authentication)
- **Request:**
  - Headers:
    ```
    Authorization: Bearer <CLERK_JWT_TOKEN>
    ```
  - URL Parameters:
    - `id` (string, required) - MongoDB document ID
- **Response:**
  - `200 OK`
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
  - `401 Unauthorized` - Missing or invalid authentication token
  - `404 Not Found` - Document does not exist
- **Example Request:**
  ```bash
  curl -H "Authorization: Bearer eyJhbGc..." \
       http://localhost:4000/content/507f1f77bcf86cd799439011
  ```

---

### PDF Endpoints

#### List All PDFs

- **Route:** `GET /pdfs`
- **Description:** Retrieve a paginated list of all documents with uploaded PDFs
- **Protected:** No
- **Request:**
  - Query Parameters:
    - `page` (number, optional, default: 1, min: 1) - Page number
    - `limit` (number, optional, default: 20, min: 1, max: 100) - Items per page
- **Response:**
  - `200 OK`
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
- **Example Request:**
  ```bash
  curl "http://localhost:4000/pdfs?page=1&limit=10"
  ```

---

### Admin Endpoints

All admin endpoints require authentication AND admin role.

**Required Headers:**

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

#### Create Document

- **Route:** `POST /admin/documents`
- **Description:** Create a new document
- **Protected:** Yes (Requires Admin role)
- **Request:**
  - Headers:
    ```
    Authorization: Bearer <CLERK_JWT_TOKEN>
    ```
  - Body:
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
  - **Required Fields:**
    - `title` (string, min: 3 chars) - Document title
    - `content` (string, min: 10 chars) - Full document content
    - `quiz` (object) - Quiz questions (at least one question required)
  - **Optional Fields:**
    - `summary` (string) - Brief summary
    - `facts` (string) - Interesting facts
    - `key_notes` (object) - Important notes
- **Response:**
  - `201 Created`
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
  - `400 Bad Request` - Invalid document data
  - `401 Unauthorized` - Missing or invalid authentication
  - `403 Forbidden` - User does not have admin role

#### Update Document

- **Route:** `PUT /admin/documents/:id`
- **Description:** Update an existing document
- **Protected:** Yes (Requires Admin role)
- **Request:**
  - Headers:
    ```
    Authorization: Bearer <CLERK_JWT_TOKEN>
    ```
  - URL Parameters:
    - `id` (string, required) - MongoDB document ID
  - Body: Partial document updates (same schema as create, but all fields optional)
- **Response:**
  - `200 OK` - Returns the updated document
  - `400 Bad Request` - Invalid update data
  - `401 Unauthorized` - Missing or invalid authentication
  - `403 Forbidden` - User does not have admin role
  - `404 Not Found` - Document does not exist

#### Delete Document

- **Route:** `DELETE /admin/documents/:id`
- **Description:** Delete a document by its ID
- **Protected:** Yes (Requires Admin role)
- **Request:**
  - Headers:
    ```
    Authorization: Bearer <CLERK_JWT_TOKEN>
    ```
  - URL Parameters:
    - `id` (string, required) - MongoDB document ID
- **Response:**
  - `204 No Content` - Document successfully deleted (empty response)
  - `401 Unauthorized` - Missing or invalid authentication
  - `403 Forbidden` - User does not have admin role
  - `404 Not Found` - Document does not exist

#### Upload Document Image

- **Route:** `POST /admin/documents/:id/upload-image`
- **Description:** Upload an image for a document (replaces existing image if present)
- **Protected:** Yes (Requires Admin role)
- **Content-Type:** `multipart/form-data`
- **Request:**
  - Headers:
    ```
    Authorization: Bearer <CLERK_JWT_TOKEN>
    ```
  - URL Parameters:
    - `id` (string, required) - MongoDB document ID
  - Body (multipart/form-data):
    - `file` (file, required) - Image file (JPG, PNG, or WebP, max 10MB)
- **Response:**
  - `200 OK`
    ```json
    {
      "message": "Image uploaded successfully",
      "imageUrl": "https://bucket.s3.region.amazonaws.com/images/507f1f77bcf86cd799439011.png",
      "documentId": "507f1f77bcf86cd799439011"
    }
    ```
  - `400 Bad Request` - No file uploaded or invalid file type
  - `401 Unauthorized` - Missing or invalid authentication
  - `403 Forbidden` - User does not have admin role
  - `404 Not Found` - Document does not exist
  - `500 Internal Server Error` - S3 upload failure
- **Example Request:**
  ```bash
  curl -X POST http://localhost:4000/admin/documents/507f1f77bcf86cd799439011/upload-image \
       -H "Authorization: Bearer eyJhbGc..." \
       -F "file=@/path/to/image.png"
  ```

#### Upload Document PDF

- **Route:** `POST /admin/documents/:id/upload-pdf`
- **Description:** Upload a PDF for a document (adds to PDF array)
- **Protected:** Yes (Requires Admin role)
- **Content-Type:** `multipart/form-data`
- **Request:**
  - Headers:
    ```
    Authorization: Bearer <CLERK_JWT_TOKEN>
    ```
  - URL Parameters:
    - `id` (string, required) - MongoDB document ID
  - Body (multipart/form-data):
    - `file` (file, required) - PDF file (max 50MB)
- **Response:**
  - `200 OK`
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
  - `400 Bad Request` - No file uploaded, invalid file type, or file size exceeded
  - `401 Unauthorized` - Missing or invalid authentication
  - `403 Forbidden` - User does not have admin role
  - `404 Not Found` - Document does not exist
  - `500 Internal Server Error` - S3 upload failure
- **Example Request:**
  ```bash
  curl -X POST http://localhost:4000/admin/documents/507f1f77bcf86cd799439011/upload-pdf \
       -H "Authorization: Bearer eyJhbGc..." \
       -F "file=@/path/to/document.pdf"
  ```

---

## Response Format

### Success Responses

All successful responses follow a consistent structure:

- **2xx Status Codes**: Success
  - `200 OK`: Request succeeded
  - `201 Created`: Resource created successfully
  - `204 No Content`: Request succeeded with no response body

### Error Responses

All error responses include a descriptive message:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common error status codes:

- `400 Bad Request`: Invalid request data or validation failure
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated but lacks required permissions
- `404 Not Found`: Requested resource does not exist
- `500 Internal Server Error`: Server-side error
- `503 Service Unavailable`: Service dependencies are unhealthy

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit**: 100 requests per 15 minutes per IP address
- **Response**: When limit exceeded, returns `429 Too Many Requests`
- **Headers**: Rate limit information included in response headers

## Caching

The API uses Redis for caching to improve performance:

- **List Cache**: 5 minutes (300 seconds)
- **Document Cache**: 24 hours (86400 seconds)
- **Today's Content Cache**: 1 hour (3600 seconds)

Cached responses include `X-Cache-Hit` header when served from cache.
