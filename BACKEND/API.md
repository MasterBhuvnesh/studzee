# API Documentation

Reference for the Studzee backend. The notification service was merged into this backend on 10-08-2026, so push registration, email, the Clerk webhook and the user admin endpoints are served here rather than behind the old `/noti` prefix. See [Migrated Endpoints](#migrated-endpoints) for the mapping.

Every response body below is what the handler actually returns. Import [postman.collection.json](./postman.collection.json) for ready made requests.

## Contents

- [Authentication](#authentication)
- [Health Check Endpoints](#health-check-endpoints)
- [Content Endpoints](#content-endpoints)
- [PDF Endpoints](#pdf-endpoints)
- [Notification Endpoints](#notification-endpoints)
- [Webhook Endpoints](#webhook-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Migrated Endpoints](#migrated-endpoints)
- [Response Format](#response-format)
- [Rate Limiting](#rate-limiting)
- [Caching](#caching)

## Authentication

Protected endpoints require a Clerk session token in the Authorization header:

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

Admin endpoints additionally require the user to carry `publicMetadata.role = "admin"` in Clerk.

In development only, setting `NODE_ENV=development` and `DEV_TOKEN` lets you send `Authorization: Bearer <DEV_TOKEN>` instead. That bypass resolves to a synthetic `dev-user-id` with admin rights and is ignored in every other environment.

The Clerk webhook is the one exception. It carries no user token and is authenticated by its svix signature instead.

---

## Health Check Endpoints

### Liveness Check

- **Route:** `GET /health/liveness`
- **Description:** Checks if the application is running
- **Protected:** No
- **Response:**
  - `200 OK`
    ```json
    { "status": "ok" }
    ```

### Healthcheck (Render/Production)

- **Route:** `GET /healthcheck`
- **Description:** Simple health check for Render or other hosting platforms. This is the URL the heartbeat job pings.
- **Protected:** No
- **Response:**
  - `200 OK`
    ```json
    {
      "status": "ok",
      "timestamp": "2026-08-10T10:30:00.000Z"
    }
    ```

### Readiness Check

- **Route:** `GET /health/readiness`
- **Description:** Checks every backing store the service needs to serve traffic: MongoDB for content, Postgres for users and notifications, and Redis for caching
- **Protected:** No
- **Response:**
  - `200 OK` (all stores healthy)
    ```json
    {
      "status": "ready",
      "checks": { "db": "ok", "postgres": "ok", "redis": "ok" }
    }
    ```
  - `503 Service Unavailable` (one or more unhealthy)
    ```json
    {
      "status": "unavailable",
      "checks": { "db": "error", "postgres": "ok", "redis": "ok" }
    }
    ```

> **Note:** `db` is MongoDB. The key kept its original name so existing probes that parse the body do not break.

> **Note:** each check issues a real round trip, `admin().ping()` on MongoDB, `SELECT 1` on Postgres and `PING` on Redis, rather than reading a driver connection flag. A flag reports what the driver believes about its socket, which stays optimistic through a network partition or a server that has stopped answering. Probes run in parallel with a 2 second timeout each, so the endpoint always settles rather than hanging, and every failure is reported in one response rather than stopping at the first.

> **Note:** liveness deliberately touches no dependency. A database outage should not get an otherwise healthy container restarted.

---

## Content Endpoints

### Get Today's Content

- **Route:** `GET /content/today`
- **Description:** Documents created during the current IST day, which runs from 18:30 UTC to 18:30 UTC
- **Protected:** No
- **Cache:** `TODAY_CACHE_TTL`, default 1 hour
- **Response:**
  - `200 OK`
    ```json
    {
      "data": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "id": "507f1f77bcf86cd799439011",
          "title": "Introduction to TypeScript",
          "summary": "A comprehensive guide to TypeScript basics",
          "createdAt": "2026-08-10T10:30:00.000Z"
        }
      ],
      "meta": { "date": "2026-08-10", "total": 1 }
    }
    ```
- **Example:**
  ```bash
  curl "http://localhost:4000/content/today"
  ```

### Get Paginated Content

- **Route:** `GET /content`
- **Description:** Paginated list of documents
- **Protected:** No
- **Cache:** `LIST_CACHE_TTL`, default 5 minutes
- **Query Parameters:**
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 100)
- **Response:**
  - `200 OK`
    ```json
    {
      "data": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "id": "507f1f77bcf86cd799439011",
          "title": "Introduction to TypeScript",
          "summary": "A comprehensive guide to TypeScript basics",
          "createdAt": "2026-08-10T10:30:00.000Z"
        }
      ],
      "meta": { "page": 1, "limit": 20, "total": 50 }
    }
    ```
  - `400 Bad Request` - Invalid query parameters

> **Note:** the list projection returns only `title`, `summary` and `createdAt` alongside the identifiers. Fetch a document by ID for its full body.

- **Example:**
  ```bash
  curl "http://localhost:4000/content?page=1&limit=10"
  ```

### Get Document by ID

- **Route:** `GET /content/:id`
- **Description:** Complete document by its ID
- **Protected:** Yes
- **Cache:** `DOC_CACHE_TTL`, default 24 hours
- **URL Parameters:**
  - `id` (string, required) - MongoDB document ID
- **Response:**
  - `200 OK`
    ```json
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Introduction to TypeScript",
      "content": [
        {
          "title": "Introduction",
          "content": [
            { "type": "text", "value": "TypeScript is a typed superset of JavaScript." },
            { "type": "list", "items": ["Static types", "Compiles to JavaScript"] }
          ]
        }
      ],
      "summary": "A comprehensive guide to TypeScript basics",
      "facts": "TypeScript was developed by Microsoft",
      "imageUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/images/507f1f77bcf86cd799439011.png",
      "pdfUrl": [
        {
          "name": "typescript-guide.pdf",
          "url": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/pdfs/introduction-to-typescript.pdf",
          "uploadedAt": "2026-08-10T10:30:00.000Z",
          "size": 1234567
        }
      ],
      "quiz": {
        "q1": {
          "que": "What is TypeScript?",
          "ans": "A typed superset of JavaScript",
          "options": ["A typed superset of JavaScript", "A new programming language"]
        }
      },
      "key_notes": {
        "note1": "TypeScript adds static types to JavaScript",
        "note2": "It compiles down to plain JavaScript"
      },
      "createdAt": "2026-08-10T10:30:00.000Z",
      "updatedAt": "2026-08-10T10:30:00.000Z"
    }
    ```
  - `401 Unauthorized` - Missing or invalid authentication token
  - `404 Not Found` - Document does not exist

> **Note:** `content` is structured, either an array of sections or an object. It is not a plain string. Each block carries a `type` of `text`, `list`, `table`, `formula` or `code`.

- **Example:**
  ```bash
  curl -H "Authorization: Bearer eyJhbGc..." \
       http://localhost:4000/content/507f1f77bcf86cd799439011
  ```

---

## PDF Endpoints

### List All PDFs

- **Route:** `GET /pdfs`
- **Description:** Paginated list of PDFs, flattened to one entry per file rather than grouped by document
- **Protected:** No
- **Query Parameters:**
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 100)
- **Response:**
  - `200 OK`
    ```json
    {
      "data": [
        {
          "documentId": "507f1f77bcf86cd799439011",
          "title": "Introduction to TypeScript",
          "pdfName": "typescript-guide.pdf",
          "pdfUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/pdfs/introduction-to-typescript.pdf",
          "uploadedAt": "2026-08-10T10:30:00.000Z",
          "size": 1234567
        }
      ],
      "meta": { "page": 1, "limit": 20, "total": 25 }
    }
    ```
  - `400 Bad Request` - Invalid query parameters

> **Note:** `total` counts documents that hold at least one PDF, while `data` counts individual PDFs. A document with three PDFs contributes one to `total` and three to `data`.

- **Example:**
  ```bash
  curl "http://localhost:4000/pdfs?page=1&limit=10"
  ```

---

## Notification Endpoints

### Register Device

- **Route:** `POST /notifications/register`
- **Description:** Register the caller's device for push notifications, or attach another device token to an existing registration
- **Protected:** Yes
- **Rate Limit:** 10 requests per minute
- **Request Body:**
  ```json
  {
    "email": "learner@example.com",
    "expoToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }
  ```
  - `email` (string, required) - Must be a valid email address
  - `expoToken` (string, required) - Must start with `ExponentPushToken[`
- **Response:**
  - `200 OK`
    ```json
    {
      "message": "Device registered successfully",
      "data": {
        "id": "clx1234567890",
        "email": "learner@example.com",
        "devices": 2
      }
    }
    ```
  - `400 Bad Request` - Validation error
  - `401 Unauthorized` - Missing or invalid authentication token
  - `429 Too Many Requests` - Rate limit exceeded

> **Note:** the Clerk identity comes from the bearer token, never from the body, so a caller cannot register a device against somebody else's account. Tokens are deduplicated, so re-registering the same device does not create a second entry. `devices` reports how many tokens the user now holds.

- **Example:**
  ```bash
  curl -X POST http://localhost:4000/notifications/register \
       -H "Authorization: Bearer eyJhbGc..." \
       -H "Content-Type: application/json" \
       -d '{"email":"learner@example.com","expoToken":"ExponentPushToken[xxx]"}'
  ```

---

## Webhook Endpoints

### Clerk Webhook

- **Route:** `POST /webhooks/clerk`
- **Description:** Receives Clerk events. Only `user.created` is acted on, which sends the welcome email. Every other event type is acknowledged and ignored.
- **Protected:** Public route, authenticated by svix signature
- **Required Headers:** `svix-id`, `svix-timestamp`, `svix-signature`, all supplied by Clerk
- **Response:**
  - `200 OK` - Signature verified and the event processed
    ```json
    { "message": "Webhook processed", "emailSent": true }
    ```
  - `200 OK` - Event type not handled
    ```json
    { "message": "Ignored event: session.created" }
    ```
  - `400 Bad Request` - Missing svix headers, or signature verification failed
  - `500 Internal Server Error` - `CLERK_WEBHOOK_SIGNING_SECRET` is not configured, or a body parser ran before the handler

> **Note:** the router mounts `express.raw` ahead of the global JSON parser, so the signature is verified against the exact bytes Clerk signed. Verifying a re-serialized body is unsound, because `JSON.stringify` does not reproduce the original key order, whitespace or unicode escaping.

> **Note:** the endpoint answers 2xx once the signature verifies, even when the welcome email fails. A non 2xx would make Clerk redeliver the event, which resends the email rather than fixing the mail transport.

---

## Admin Endpoints

Every route below requires authentication and the admin role.

**Required headers:**

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

Common failures on all admin routes:

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but not an admin
- `429 Too Many Requests` - Per route rate limit exceeded

### Documents

#### Create Document

- **Route:** `POST /admin/documents`
- **Request Body:**
  ```json
  {
    "title": "New Tutorial",
    "content": [
      {
        "title": "Introduction",
        "content": [
          { "type": "text", "value": "Opening paragraph." },
          { "type": "list", "items": ["First point", "Second point"] }
        ]
      }
    ],
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
  - **Required:**
    - `title` (string, min 3 chars)
    - `content` (array or object, structured, not a string)
    - `quiz` (object keyed by question ID, each with `que`, `ans` and at least two `options`)
  - **Optional:** `summary`, `facts`, `key_notes`, `imageUrl`, `pdfUrl`
- **Response:**
  - `201 Created`
    ```json
    {
      "message": "Document created successfully",
      "doc": {
        "_id": "507f1f77bcf86cd799439013",
        "title": "New Tutorial",
        "createdAt": "2026-08-10T09:15:00.000Z",
        "updatedAt": "2026-08-10T09:15:00.000Z"
      }
    }
    ```
  - `400 Bad Request` - Invalid document data

#### Update Document

- **Route:** `PUT /admin/documents/:id`
- **URL Parameters:** `id` (string, required) - MongoDB document ID
- **Request Body:** A partial document. Every field is optional, validated against the same schema as create, and at least one field is required.
  ```json
  {
    "title": "Updated Tutorial Title",
    "summary": "Updated summary text"
  }
  ```
- **Response:**
  - `200 OK` - The updated document
  - `400 Bad Request` - Invalid update data
  - `404 Not Found` - Document does not exist

#### Delete Document

- **Route:** `DELETE /admin/documents/:id`
- **URL Parameters:** `id` (string, required)
- **Response:**
  - `204 No Content` - Deleted, empty body
  - `404 Not Found` - Document does not exist

#### Upload Document Image

- **Route:** `POST /admin/documents/:id/upload-image`
- **Description:** Uploads the cover image, replacing any existing one. The old object is deleted from S3.
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (required) - JPG, PNG or WebP, max 10MB
- **Response:**
  - `200 OK`
    ```json
    {
      "message": "Image uploaded successfully",
      "imageUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/images/507f1f77bcf86cd799439011.png",
      "documentId": "507f1f77bcf86cd799439011"
    }
    ```
  - `400 Bad Request` - No file, invalid type, size exceeded, or malformed document ID
  - `404 Not Found` - Document does not exist
  - `500 Internal Server Error` - S3 upload failure
- **Example:**
  ```bash
  curl -X POST http://localhost:4000/admin/documents/507f1f77bcf86cd799439011/upload-image \
       -H "Authorization: Bearer eyJhbGc..." \
       -F "file=@/path/to/image.png"
  ```

#### Upload Document PDF

- **Route:** `POST /admin/documents/:id/upload-pdf`
- **Description:** Appends a PDF. Documents hold an array, so this adds rather than replaces.
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (required) - PDF, max 50MB
- **Response:**
  - `200 OK`
    ```json
    {
      "message": "PDF uploaded successfully",
      "pdf": {
        "name": "document.pdf",
        "url": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/pdfs/introduction-to-typescript.pdf",
        "uploadedAt": "2026-08-10T10:30:00.000Z",
        "size": 1234567
      },
      "documentId": "507f1f77bcf86cd799439011",
      "title": "Introduction to TypeScript"
    }
    ```
  - `400 Bad Request` - No file, invalid type, or size exceeded
  - `404 Not Found` - Document does not exist
  - `500 Internal Server Error` - S3 upload failure

### Notifications

#### Send Push Notification

- **Route:** `POST /admin/notifications/send`
- **Rate Limit:** 20 requests per minute
- **Request Body:**
  ```json
  {
    "title": "New notes published",
    "message": "System Design chapter 4 is now available.",
    "imageUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/images/banner.png",
    "sendToAll": true,
    "emails": ["learner@example.com"]
  }
  ```
  - `title` (string, required)
  - `message` (string, required)
  - `imageUrl` (string, optional) - Must be a valid URL
  - `sendToAll` (boolean, required)
  - `emails` (array of emails) - Required and non empty whenever `sendToAll` is false, ignored otherwise
- **Response:**
  - `200 OK` - Every message accepted
    ```json
    {
      "message": "Notification sent",
      "data": { "targeted": 250, "sent": 250, "failed": 0, "prunedTokens": 0 }
    }
    ```
  - `207 Multi-Status` - Partially delivered
    ```json
    {
      "message": "Notification partially delivered",
      "data": { "targeted": 250, "sent": 247, "failed": 3, "prunedTokens": 2 }
    }
    ```
  - `400 Bad Request` - Validation error
  - `404 Not Found` - No registered devices for the target
    ```json
    { "message": "No registered devices found" }
    ```

> **Note:** messages are chunked to the Expo limit of 100 per request, so a broadcast larger than that is split across several calls and a failing chunk does not abort the rest. Tokens Expo reports as `DeviceNotRegistered` are deleted immediately and counted in `prunedTokens`.

#### List Sent Notifications

- **Route:** `GET /admin/notifications`
- **Rate Limit:** 30 requests per minute
- **Query Parameters:**
  - `page` (number, optional, default 1)
  - `limit` (number, optional, default 20, max 100)
  - `sortBy` (string, optional, default `createdAt`) - One of `createdAt`, `status`, `sentBy`. Anything else falls back to `createdAt`.
  - `order` (string, optional, default `desc`) - `asc` or `desc`
- **Response:**
  - `200 OK`
    ```json
    {
      "notifications": [
        {
          "id": "clx1234567890",
          "title": "New notes published",
          "message": "System Design chapter 4 is now available.",
          "imageUrl": null,
          "sentBy": "user_2abcdef",
          "sentTo": [],
          "sentToAll": true,
          "status": "sent",
          "createdAt": "2026-08-10T10:30:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
    }
    ```

### Email

#### Send Email

- **Route:** `POST /admin/emails/send`
- **Rate Limit:** 10 requests per minute
- **Request Body:**
  ```json
  {
    "emails": ["learner@example.com"],
    "subject": "New notes are available",
    "title": "New notes are available",
    "body": "<p>Chapter 4 of System Design is published.</p>",
    "banner": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/assets/banner.png",
    "footer": "This is an automated email from Studzee.",
    "pdfUrls": ["https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/pdfs/system-design.pdf"]
  }
  ```
  - `emails` (array of emails, required, min 1)
  - `subject`, `title`, `body` (string, required). `body` is an HTML fragment dropped into the shared template.
  - `banner`, `footer` (optional) - Fall back to the configured defaults
  - `pdfUrls` (array of URLs, optional)
- **Response:**
  - `200 OK`
    ```json
    {
      "message": "Email sent",
      "data": { "recipients": 1, "messageId": "<abc@studzee.in>" }
    }
    ```
  - `400 Bad Request` - Validation error
  - `502 Bad Gateway` - The transport rejected the message, or an attachment failed its checks
    ```json
    {
      "message": "Email delivery failed",
      "error": "Attachment host is not allowed: evil.example.com"
    }
    ```

> **Note:** attachments are fetched by the mail transport at send time, so each entry in `pdfUrls` must use https on a host listed in `EMAIL_ATTACHMENT_HOSTS`, with at most 10 per message. Anything else fails before the message is sent.

> **Note:** recipients are sent as bcc, so a broadcast does not disclose the recipient list to everybody on it.

#### List Email Logs

- **Route:** `GET /admin/emails/logs`
- **Rate Limit:** 30 requests per minute
- **Query Parameters:** Same as [List Sent Notifications](#list-sent-notifications)
- **Response:**
  - `200 OK`
    ```json
    {
      "logs": [
        {
          "id": "clx1234567890",
          "subject": "New notes are available",
          "message": "<p>Chapter 4 of System Design is published.</p>",
          "pdfUrls": [],
          "sentBy": "user_2abcdef",
          "sentTo": ["learner@example.com"],
          "status": "sent",
          "createdAt": "2026-08-10T10:30:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
    }
    ```

### Users

#### List Users

- **Route:** `GET /admin/users`
- **Rate Limit:** 30 requests per minute
- **Query Parameters:** `page`, `limit`
- **Response:**
  - `200 OK`
    ```json
    {
      "users": [
        {
          "id": "clx1234567890",
          "clerkId": "user_2abcdef",
          "email": "learner@example.com",
          "expoTokens": ["ExponentPushToken[xxx]"],
          "createdAt": "2026-08-10T10:30:00.000Z",
          "updatedAt": "2026-08-10T10:30:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 320, "totalPages": 16 }
    }
    ```

#### List User Emails

- **Route:** `GET /admin/users/emails`
- **Description:** Every registered email address, for populating a recipient picker
- **Rate Limit:** 30 requests per minute
- **Response:**
  - `200 OK`
    ```json
    {
      "data": ["learner@example.com", "another@example.com"],
      "meta": { "total": 2 }
    }
    ```

---

## Migrated Endpoints

The notification service was merged into this backend. Its endpoints moved as follows and the old paths no longer exist.

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

Response shapes changed alongside the paths. The old service wrapped every response in `{ success, message, data }`. The merged endpoints follow the backend convention instead, returning the payload directly with a `message` only where one is useful.

> **Deployment note:** any client already released against the old paths keeps calling them. Rewrite them at the ingress or ship a client build using the new paths before retiring the old service.

---

## Response Format

### Success Responses

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `204 No Content` - Succeeded with no response body
- `207 Multi-Status` - Partially succeeded, currently only on a push broadcast

### Error Responses

Errors carry a `message`, and validation failures add an `errors` object keyed by field:

```json
{
  "message": "Validation error",
  "errors": {
    "expoToken": ["Not a valid Expo push token"]
  }
}
```

Unhandled errors return a generic message, with a `stack` field added only when `NODE_ENV=development`:

```json
{ "message": "Internal Server Error" }
```

Common status codes:

- `400 Bad Request` - Invalid request data or validation failure
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but lacks the admin role
- `404 Not Found` - Requested resource does not exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server-side error
- `502 Bad Gateway` - An upstream dependency rejected the request, currently only the mail transport
- `503 Service Unavailable` - Service dependencies are unhealthy

## Rate Limiting

A global limiter applies to every request, and the expensive admin endpoints carry tighter per route limits on top of it.

| Scope                            | Limit                |
| -------------------------------- | -------------------- |
| Global, all routes               | 100 per 15 minutes   |
| `POST /notifications/register`   | 10 per minute        |
| `POST /admin/notifications/send` | 20 per minute        |
| `POST /admin/emails/send`        | 10 per minute        |
| Admin listing endpoints          | 30 per minute        |

Exceeding a limit returns `429 Too Many Requests`. Limits are reported in the standard `RateLimit-*` response headers. The service sets `trust proxy`, so limits are applied per client address rather than per proxy.

## Caching

Redis caches read responses using the cache aside pattern.

| Cache          | Key pattern                            | TTL variable      | Default  |
| -------------- | -------------------------------------- | ----------------- | -------- |
| List           | `content:list:page:<page>:limit:<limit>` | `LIST_CACHE_TTL`  | 5 minutes |
| Document       | `content:doc:<id>`                     | `DOC_CACHE_TTL`   | 24 hours |
| Today          | `content:today`                        | `TODAY_CACHE_TTL` | 1 hour   |

Any admin write invalidates every content cache entry. Cache hits and misses are visible in the application log; no cache status is exposed in response headers.
