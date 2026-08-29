# API Documentation

Reference for the Studzee backend. The notification service was merged into this backend on 10-08-2026, so push registration, email, the Clerk webhook and the user admin endpoints are served here rather than behind the old `/noti` prefix. See [Migrated Endpoints](#migrated-endpoints) for the mapping.

Every response body below is what the handler actually returns. Import [postman.collection.json](./postman.collection.json) for ready made requests.

## Contents

- [Authentication](#authentication)
- [File URLs](#file-urls)
- [Health Check Endpoints](#health-check-endpoints)
- [Content Endpoints](#content-endpoints)
- [PDF Endpoints](#pdf-endpoints)
- [Notification Endpoints](#notification-endpoints)
- [Progress Endpoints](#progress-endpoints)
- [Support Endpoints](#support-endpoints)
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

## File URLs

Every `imageUrl`, `pdfUrl` and `banner` in this document is shown with a Supabase host, because that is what a deployed environment returns. The host is not fixed. Uploads are stored over the S3 protocol and the URL written onto the document is built from `S3_PUBLIC_URL`, so it changes with the environment:

| Environment | `S3_PUBLIC_URL`                                                     | Example URL                                                 |
| ----------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| Deployed    | `https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public` | `.../public/pdfs/introduction-to-typescript.pdf`            |
| Local       | `http://localhost:9000`                                             | `http://localhost:9000/pdfs/introduction-to-typescript.pdf` |

Local development runs MinIO with the same three buckets, `images`, `pdfs` and `assets`, all public read. Clients must treat these as opaque absolute URLs and never rebuild them from a hardcoded host.

> **Note:** the URL is persisted at upload time, not generated on read. A document uploaded against one `S3_PUBLIC_URL` keeps that host after the setting changes, so a database that has been through a storage switch can return a mix of hosts from the same endpoint. Existing rows have to be rewritten to move them.

---

## Health Check Endpoints

### Welcome

- **Route:** `GET /`
- **Description:** Root route. Returns the service name and a map of the main endpoints, which is the quickest way to confirm which build is answering on a host.
- **Protected:** No
- **Response:**
  - `200 OK`
    ```json
    {
      "message": "Studzee Backend API",
      "status": "running",
      "endpoints": {
        "health": "/healthcheck",
        "liveness": "/health/liveness",
        "readiness": "/health/readiness",
        "content": "/content",
        "pdfs": "/pdfs",
        "notifications": "/notifications/register",
        "admin": "/admin",
        "webhooks": "/webhooks/clerk"
      }
    }
    ```

> **Note:** the map is written by hand in `src/index.ts` rather than derived from the router, so it lists the main entry points rather than every route. Treat this document as the complete list.

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

### List Topics

- **Route:** `GET /content/topics`
- **Description:** The fixed topic registry in display order
- **Protected:** No
- **Response:**
  - `200 OK`
    ```json
    {
      "data": [
        { "key": "machine-learning", "label": "Machine Learning" },
        { "key": "system-design", "label": "System Design" },
        { "key": "devops", "label": "DevOps" },
        { "key": "aws", "label": "AWS" },
        { "key": "data", "label": "Data" },
        { "key": "deep-learning", "label": "Deep Learning" }
      ]
    }
    ```
- **Note:** the registry is a code level constant, not stored data. Documents may only carry one of these keys, and unknown keys are rejected wherever a topic is accepted.

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
  - `topic` (string, optional) - a registry key from `GET /content/topics`; unknown keys answer `400`
  - `tag` (string, optional) - freeform tag matched whole against document tags; composes with `topic`; an unknown tag simply matches nothing rather than answering `400`
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
          "createdAt": "2026-08-10T10:30:00.000Z",
          "topic": "machine-learning",
          "tags": ["fundamentals", "tutorial"]
        }
      ],
      "meta": { "page": 1, "limit": 20, "total": 50 }
    }
    ```
  - `400 Bad Request` - Invalid query parameters
  - `400 Bad Request` - Unknown topic key; `errors.topic` names every allowed key

> **Note:** the list projection returns only `title`, `summary`, `createdAt`, `topic` and `tags` alongside the identifiers. Fetch a document by ID for its full body.

- **Example:**
  ```bash
  curl "http://localhost:4000/content?page=1&limit=10&topic=devops"
  curl "http://localhost:4000/content?tag=architecture"
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
            {
              "type": "text",
              "value": "TypeScript is a typed superset of JavaScript."
            },
            {
              "type": "list",
              "items": ["Static types", "Compiles to JavaScript"]
            }
          ]
        }
      ],
      "summary": "A comprehensive guide to TypeScript basics",
      "facts": "TypeScript was developed by Microsoft",
      "imageUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/images/507f1f77bcf86cd799439011.png",
      "pdfUrl": [
        {
          "name": "typescript-guide.pdf",
          "url": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/pdfs/introduction-to-typescript.pdf",
          "uploadedAt": "2026-08-10T10:30:00.000Z",
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
      "createdAt": "2026-08-10T10:30:00.000Z",
      "updatedAt": "2026-08-10T10:30:00.000Z"
    }
    ```
  - `401 Unauthorized` - Missing or invalid authentication token
  - `403 Forbidden` - Document carries an `unlockPoints` cost the caller has not met yet
  - `404 Not Found` - Document does not exist

> **Note:** `content` is structured, either an array of sections or an object. It is not a plain string. Each block carries a `type` of `text`, `list`, `table`, `formula` or `code`.

> **Unlock gate:** documents may carry an optional `unlockPoints` number. When it is greater than zero and the authenticated caller's total points from `GET /progress/me` are below that cost, the request answers `403` before any content is returned. The check runs after the cache lookup, so caching behaviour is unchanged, and the response carries a machine readable code:

```json
{
  "message": "This content needs 50 points to unlock. You have 10 points. Earn more by completing quizzes.",
  "code": "CONTENT_LOCKED"
}
```

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
          "pdfUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/pdfs/introduction-to-typescript.pdf",
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

## Progress Endpoints

The gamified user tracker lives in Postgres. Points come from server graded quiz attempts: each correct answer is worth 10 points, and an attempt only pays the difference over the caller's previous best score on the same content, so replaying a quiz earns nothing. A streak counts consecutive UTC days with at least one recorded attempt; today or yesterday anchors the current streak. Badges and levels are derived from config thresholds.

### Submit Quiz Attempt

- **Route:** `POST /progress/attempts`
- **Description:** Grade a quiz submission, record the attempt, update points, streak and badges
- **Protected:** Yes
- **Rate limit:** 30 per minute
- **Body:**
  ```json
  {
    "contentId": "507f1f77bcf86cd799439011",
    "responses": { "q1": 0, "q2": 2 }
  }
  ```
- **Field notes:** `contentId` must be a 24 character hex MongoDB ID. `responses` maps each stored quiz question key to the index of the chosen option; unknown keys are ignored rather than penalised.
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "contentId": "507f1f77bcf86cd799439011",
        "score": 3,
        "total": 4,
        "pointsAwarded": 30,
        "totalPoints": 130,
        "streak": { "current": 2, "longest": 5 },
        "newBadges": [
          {
            "key": "century",
            "label": "Century",
            "description": "Earn 100 points"
          }
        ]
      }
    }
    ```
  - `400 Bad Request` - Validation error
  - `401 Unauthorized`
  - `404 Not Found` - Content does not exist or carries no quiz

### Get My Progress

- **Route:** `GET /progress/me`
- **Description:** Everything the profile screen renders for the caller
- **Protected:** Yes
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "points": 130,
        "level": {
          "key": "apprentice",
          "label": "Apprentice",
          "minPoints": 100,
          "imageUrl": "https://.../images/levels/apprentice.png"
        },
        "nextLevel": {
          "key": "scholar",
          "label": "Scholar",
          "minPoints": 250,
          "imageUrl": "https://.../images/levels/scholar.png"
        },
        "streak": { "current": 2, "longest": 5 },
        "activeDays": 4,
        "badges": [
          {
            "key": "first-steps",
            "label": "First Steps",
            "description": "Complete your first quiz",
            "awardedAt": "2026-08-25T10:00:00.000Z"
          }
        ],
        "allBadges": [
          {
            "key": "first-steps",
            "label": "First Steps",
            "description": "Complete your first quiz",
            "threshold": 1,
            "awarded": true,
            "imageUrl": null
          }
        ],
        "allLevels": [
          {
            "key": "novice",
            "label": "Novice",
            "minPoints": 0,
            "imageUrl": "https://.../images/levels/novice.png"
          }
        ],
        "recentAttempts": [
          {
            "contentId": "507f1f77bcf86cd799439011",
            "title": "Introduction to TypeScript",
            "score": 3,
            "total": 4,
            "createdAt": "2026-08-25T10:00:00.000Z"
          }
        ]
      }
    }
    ```
  - `401 Unauthorized`

> **Note:** `level` is null only before the first point arrives; the novice level starts at 0. `nextLevel` is null once the caller holds the highest level. The ladder is novice (0), apprentice (100), scholar (250), expert (500), master (1000), grandmaster (2000) and legend (5000).
>
> `allLevels` carries the whole ladder so a client renders it without mirroring the catalog, and `level` is the authority on which rung is current: deriving it client side from thresholds alone marks every rung at or below the caller's points as current. `imageUrl` is served from the public images bucket under `levels/`, so new artwork ships without a client release; it is absent on every badge until badge art exists, and clients fall back to a bundled placeholder.

---

## Support Endpoints

The in app support assistant. It answers from a knowledge base built out of the
help material, the level and badge registries, and the study material
catalogue. It has no access to the caller's account: it cannot read progress,
history, downloads or email, and it is instructed to say so rather than guess.

Every route requires an authenticated Clerk user. The whole section returns
`503 AI_DISABLED` while `AI_ENABLED` is false.

### Ask Support

Answers one question. The reply is not streamed, so the request blocks for as
long as the model takes; clients should allow a much longer timeout than for
any other endpoint.

- **Method:** `POST`
- **Path:** `/support/ask`
- **Auth:** Clerk user
- **Rate limit:** 10 per minute, on top of a per account daily allowance

**Request body**

| Field      | Type   | Required | Notes                                                 |
| ---------- | ------ | -------- | ----------------------------------------------------- |
| `question` | string | yes      | 1 to 1000 characters                                  |
| `history`  | array  | no       | Up to 12 prior turns. Only the last 6 reach the model |

Each history entry is `{ "role": "user" | "assistant", "content": string }`.
History is held by the client. No transcript is stored on the server.

```json
{
  "question": "why did my streak reset",
  "history": [{ "role": "user", "content": "how do streaks work" }]
}
```

**Response `200 OK`**

```json
{
  "data": {
    "answer": "A streak resets when a day passes with no recorded activity...",
    "sources": [
      { "heading": "STREAKS", "contentId": null },
      {
        "heading": "Load Balancers Explained",
        "contentId": "507f1f77bcf86cd799439011"
      }
    ],
    "remaining": 27
  }
}
```

`sources` carries the passages the answer drew on. `contentId` is set only when
the passage came from study material, which is what makes a source linkable;
help text passages have nowhere to navigate to.

`remaining` is how many questions the caller has left today.

**Errors**

| Status | Code                   | Meaning                                                        |
| ------ | ---------------------- | -------------------------------------------------------------- |
| `429`  | `AI_QUOTA_EXCEEDED`    | The caller used their `AI_SUPPORT_DAILY_LIMIT` for the UTC day |
| `503`  | `AI_QUOTA_UNAVAILABLE` | Redis is unreachable, so the spend ceiling cannot be enforced  |
| `503`  | `AI_DISABLED`          | `AI_ENABLED` is false                                          |
| `502`  | `AI_UPSTREAM`          | The model endpoint returned an error                           |
| `504`  | `AI_TIMEOUT`           | The model did not answer within `AI_TIMEOUT_MS`                |

When nothing in the knowledge base matches, the endpoint still returns `200`
with an answer referring the caller to email and an empty `sources` array. No
model call is made in that case.

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
- **Description:** Uploads the cover image, replacing any existing one. The old object is deleted from storage.
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (required) - JPG, PNG or WebP, max 10MB

> **The form field must be named `file`.** Three mistakes produce a 400, each with its own message: sending a JSON body rather than `multipart/form-data`, naming the field something other than `file`, and sending multipart with no file attached. In Postman, a `file` row in the form-data tab is not enough on its own, you also have to pick a file with the Select Files button, otherwise nothing is sent.

- **Response:**
  - `200 OK`
    ```json
    {
      "message": "Image uploaded successfully",
      "imageUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/images/507f1f77bcf86cd799439011.png",
      "documentId": "507f1f77bcf86cd799439011"
    }
    ```
  - `400 Bad Request` - Wrong content type, wrong field name, no file, invalid file type, size exceeded, or malformed document ID
    ```json
    {
      "message": "Uploads must be sent as multipart/form-data",
      "details": "Received Content-Type: application/json. Attach the file as a form field named \"file\" rather than sending a JSON body."
    }
    ```
    ```json
    {
      "message": "Unexpected form field \"image\"",
      "details": "The file must be sent in a form field named \"file\"."
    }
    ```
    ```json
    {
      "message": "No file uploaded",
      "details": "Please include a file in the request with field name \"file\""
    }
    ```
  - `404 Not Found` - Document does not exist
  - `500 Internal Server Error` - Storage upload failure
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
        "url": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/pdfs/introduction-to-typescript.pdf",
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
    "imageUrl": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/images/banner.png",
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
    "banner": "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/assets/banner.png",
    "footer": "This is an automated email from Studzee.",
    "pdfUrls": [
      "https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/pdfs/system-design.pdf"
    ]
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

### AI Generation and Drafts

Generation turns existing material into a **pending draft**. Nothing in this
section publishes: a draft becomes visible to students only when it is
approved, and approving a notification draft is what sends the push. That is
the house rule that no outreach leaves the service without review, and it is
also the only off switch there is, since the service holds no per user
notification preferences.

Every route below is admin only and returns `503 AI_DISABLED` while
`AI_ENABLED` is false.

#### Generate a Document

Writes a whole study document from a title, a brief, or both. This is the only
generator with no `contentId`: nothing existing is being derived from, so the
reviewer is the only accuracy check there is.

Three model calls deep, the body first and then the quiz and the notes against
that body, so it is slow even by the standards of this section. Budget on the
order of a minute.

- **Method:** `POST`
- **Path:** `/admin/ai/generate/content`
- **Rate limit:** 10 per minute

| Field       | Type   | Required | Notes                                                              |
| ----------- | ------ | -------- | ------------------------------------------------------------------ |
| `title`     | string | no       | 3 to 200 characters. The model writes one if absent                |
| `topic`     | string | no       | One of the six fixed topic keys. The model picks if absent         |
| `brief`     | string | no       | Up to 12000 characters. A short steer or a whole article pasted in |
| `sections`  | number | no       | 2 to 10, defaults to 5                                             |
| `quizCount` | number | no       | 1 to 15, defaults to 5                                             |

At least one of `title` and `brief` is required. With neither there is nothing
to write about, and it is rejected before a model call is paid for.

Supply `title` or `topic` and they are honoured exactly. Leave them out and the
model chooses both, which is the case this endpoint exists for: paste material
in and let it be named and filed. Topic is safe to delegate because it is a
fixed six key registry rather than a free field, so the worst case is the wrong
key, which an approval override corrects.

The model writes the section prose, the facts paragraph, the tags, the quiz and
the key notes either way.

```json
{
  "brief": "Fault tolerance is a system's capacity to keep working through hardware or software failure. Cover redundancy, the four replication strategies, fault detection and recovery, and how it differs from high availability load balancing.",
  "sections": 6,
  "quizCount": 6
}
```

That request returns a draft titled "Fault Tolerance", filed under
`system-design`, tagged `redundancy`, `replication`, `failover` and
`distributed systems`, with six sections, six quiz questions and seven key
notes. Nothing in it was supplied by the caller except the brief.

Returns `201` with a draft whose payload is a complete document: `title`,
`topic`, `content`, `facts`, `tags`, `quiz`, `summary` and `key_notes`.
Approving it creates the document through `POST /admin/documents`.

Expect this to take around a minute. Content blocks are validated against the
five types the client renders, which are `text`, `list`, `table`, `formula` and
`code`. `DocumentSchema` types
`content` as `any`, which is fine for material an operator can preview before
shipping, but an invented block type from a model would validate and then
render as a gap on the screen, so it is rejected here with `AI_INVALID_OUTPUT`.

#### Generate a Quiz

- **Method:** `POST`
- **Path:** `/admin/ai/generate/quiz`
- **Rate limit:** 10 per minute

| Field       | Type   | Required | Notes                          |
| ----------- | ------ | -------- | ------------------------------ |
| `contentId` | string | yes      | 24 character Mongo document id |
| `count`     | number | no       | 1 to 15, defaults to 5         |

Returns `201` with the created draft. The generated quiz is validated against
the same `QuizItemSchema` the document schema uses, so every item already has
at least two options and an `ans` matching one of them.

#### Generate a Summary and Key Notes

- **Method:** `POST`
- **Path:** `/admin/ai/generate/notes`
- **Rate limit:** 10 per minute

| Field       | Type   | Required | Notes                          |
| ----------- | ------ | -------- | ------------------------------ |
| `contentId` | string | yes      | 24 character Mongo document id |

#### Generate a Quest

- **Method:** `POST`
- **Path:** `/admin/ai/generate/quest`
- **Rate limit:** 10 per minute

| Field           | Type   | Required | Notes                                               |
| --------------- | ------ | -------- | --------------------------------------------------- |
| `contentId`     | string | yes      | 24 character Mongo document id                      |
| `type`          | string | yes      | `mcq`, `scq`, `fill_blank` or `read_blog`           |
| `gems`          | number | yes      | Positive integer                                    |
| `questionCount` | number | no       | 1 to 10, defaults to 3. Ignored for `read_blog`     |
| `passScore`     | number | no       | Defaults to 60 percent of the questions, rounded up |
| `startsAt`      | date   | yes      | ISO 8601                                            |
| `endsAt`        | date   | yes      | ISO 8601, after `startsAt`                          |

The model writes the title, description and questions only. The type, gems,
window and pass mark come from this request, and the assembled quest is parsed
by `CreateQuestSchema` before the draft is stored, so approval cannot fail on
shape. `passScore` is clamped to the number of questions the model actually
returned.

#### Generate Notification Copy

- **Method:** `POST`
- **Path:** `/admin/ai/generate/notification`
- **Rate limit:** 10 per minute

| Field  | Type   | Required | Notes                              |
| ------ | ------ | -------- | ---------------------------------- |
| `kind` | string | yes      | `content` or `quest`               |
| `id`   | string | yes      | Mongo document id, or a quest cuid |

A nightly job at 01:00 UTC drafts these automatically for material published
and quests opened in the previous day, skipping any subject that already has a
notification draft in any state.

#### List Drafts

- **Method:** `GET`
- **Path:** `/admin/ai/drafts`
- **Rate limit:** 30 per minute

| Query    | Type   | Notes                                                      |
| -------- | ------ | ---------------------------------------------------------- |
| `page`   | number | Defaults to 1                                              |
| `limit`  | number | 1 to 100, defaults to 20                                   |
| `status` | string | `pending`, `approved` or `rejected`                        |
| `kind`   | string | `document`, `quiz`, `key_notes`, `quest` or `notification` |

```json
{
  "drafts": [
    {
      "id": "clx...",
      "kind": "quiz",
      "status": "pending",
      "sourceId": "507f1f77bcf86cd799439011",
      "payload": {
        "quiz": {
          "q1": { "que": "...", "ans": "...", "options": ["...", "..."] }
        }
      },
      "model": "nvidia/nemotron-3-ultra-550b-a55b",
      "createdBy": "user_...",
      "reviewedBy": null,
      "reviewedAt": null,
      "appliedId": null,
      "error": null,
      "createdAt": "2026-08-29T01:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

#### Get One Draft

- **Method:** `GET`
- **Path:** `/admin/ai/drafts/:id`
- **Rate limit:** 30 per minute

#### Approve a Draft

- **Method:** `POST`
- **Path:** `/admin/ai/drafts/:id/approve`
- **Rate limit:** 20 per minute

| Field       | Type   | Required | Notes                                     |
| ----------- | ------ | -------- | ----------------------------------------- |
| `overrides` | object | no       | Merged over the payload before it applies |

Overrides are how a title or a bad question is fixed without a separate edit
endpoint. The merged payload is re-validated against the schema the draft was
generated under, so an override cannot introduce a shape the generator would
have rejected.

What approval does, by kind:

| Kind           | Applied through                                                         |
| -------------- | ----------------------------------------------------------------------- |
| `document`     | `POST /admin/documents`, creating a new document                        |
| `quiz`         | `PUT /admin/documents/:id`, appending under fresh keys                  |
| `key_notes`    | `PUT /admin/documents/:id`, replacing the summary and merging the notes |
| `quest`        | The same service `POST /admin/quests` uses                              |
| `notification` | The same send and audit pair `POST /admin/notifications/send` uses      |

**Errors**

| Status | Code                | Meaning                                                     |
| ------ | ------------------- | ----------------------------------------------------------- |
| `409`  | `DRAFT_NOT_PENDING` | The draft was already approved or rejected                  |
| `409`  | `QUEST_TITLE_TAKEN` | A quest with that title exists. Re-approve with an override |
| `400`  | `DRAFT_INVALID`     | The payload failed validation after overrides were merged   |
| `404`  |                     | The draft, or the document it came from, is gone            |

A failed apply leaves the draft **pending** with the reason in `error`, so it
can be retried once the cause is fixed rather than lost.

#### Reject a Draft

- **Method:** `POST`
- **Path:** `/admin/ai/drafts/:id/reject`
- **Rate limit:** 20 per minute

| Field    | Type   | Required | Notes                |
| -------- | ------ | -------- | -------------------- |
| `reason` | string | no       | Up to 500 characters |

#### Reindex the Knowledge Base

- **Method:** `POST`
- **Path:** `/admin/ai/kb/reindex`
- **Rate limit:** 2 per minute

Rebuilds every knowledge base chunk and re-embeds it. Run after editing
`src/services/ai/kb/support.md`, after changing a level or badge, and after a
content import. Nothing reindexes on its own.

```json
{
  "message": "Knowledge base reindexed",
  "data": {
    "chunks": 34,
    "bySource": { "support-md": 12, "registry": 3, "content": 19 }
  }
}
```

The command line equivalent is `npm run ai:reindex`.

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

Application errors may also carry a machine readable `code`, such as `CONTENT_LOCKED` on a gated document, so clients can branch on failure mode without parsing messages.

A request to a path that matches no route returns 404 with the path echoed back:

```json
{ "message": "Not Found - /unknown" }
```

Unhandled errors return a generic message, with a `stack` field added only when `NODE_ENV=development`:

```json
{ "message": "Internal Server Error" }
```

> **Note:** the message is only replaced with the generic text on a 500. Errors carrying an explicit status code, such as the 404 above, return their real message. The `stack` field is attached to every error response in development, so do not rely on its absence to detect a particular status.

`GET /favicon.ico` is answered with `204 No Content` before the not found handler runs, so a browser hitting the API root does not fill the log with 404s.

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

| Scope                            | Limit              |
| -------------------------------- | ------------------ |
| Global, all routes               | 100 per 15 minutes |
| `POST /notifications/register`   | 10 per minute      |
| `POST /progress/attempts`        | 30 per minute      |
| `POST /admin/notifications/send` | 20 per minute      |
| `POST /admin/emails/send`        | 10 per minute      |
| `POST /support/ask`              | 10 per minute      |
| `POST /admin/ai/generate/*`      | 10 per minute      |
| `POST /admin/ai/drafts/*`        | 20 per minute      |
| `POST /admin/ai/kb/reindex`      | 2 per minute       |
| Admin listing endpoints          | 30 per minute      |

`POST /support/ask` carries a second ceiling the table cannot express: a per
account daily allowance of `AI_SUPPORT_DAILY_LIMIT` questions, counted in Redis
against the UTC day. The HTTP limiter is per address and resets in a minute, so
it is not a spend limit.

Exceeding a limit returns `429 Too Many Requests`. Limits are reported in the standard `RateLimit-*` response headers. The service sets `trust proxy`, so limits are applied per client address rather than per proxy.

## Caching

Redis caches read responses using the cache aside pattern.

| Cache    | Key pattern                                            | TTL variable      | Default   |
| -------- | ------------------------------------------------------ | ----------------- | --------- |
| List     | `content:list:page:<page>:limit:<limit>[:topic:<key>]` | `LIST_CACHE_TTL`  | 5 minutes |
| Document | `content:doc:<id>`                                     | `DOC_CACHE_TTL`   | 24 hours  |
| Today    | `content:today`                                        | `TODAY_CACHE_TTL` | 1 hour    |

The list entry gains the `:topic:<key>` suffix only when a topic filter is present, so unfiltered pages keep their original cache key and existing entries stay warm.

Any admin write invalidates every content cache entry. Cache hits and misses are visible in the application log; no cache status is exposed in response headers.
