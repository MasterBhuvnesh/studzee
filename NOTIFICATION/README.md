# Notification Service

This is a production-ready notification service.

## Development Workflow

```bash
# 1. Clone repo and install dependencies
bun install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Start PostgreSQL (Docker)
docker-compose up postgres -d

# 4. Run Prisma migrations
bun run prisma:migrate

# 5.  Seed database (optional)
bun run prisma:seed

# 6. Start development server
bun run dev

# 7. Access Prisma Studio (optional)
bun run prisma:studio
```

---

## API Documentation

### Health Check

-   **Route:** `GET /healthcheck`
-   **Description:** Basic health check endpoint to verify the service is running.
-   **Protected:** No
-   **Request:**
    -   Body: None
-   **Response:**
    -   `200 OK`
        ```json
        {
          "status": "ok",
          "timestamp": "2025-12-26T12:00:00.000Z",
          "service": "notification-service"
        }
        ```

### User Registration

-   **Route:** `POST /api/register`
-   **Description:** Register a new user or add an Expo push token for an existing user.
-   **Protected:** Yes (Requires Clerk authentication)
-   **Request:**
    -   Body:
        ```json
        {
          "email": "user@example.com",
          "expoToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
        }
        ```
-   **Response:**
    -   `200 OK`
        ```json
        {
          "success": true,
          "message": "User registered/updated successfully",
          "data": {
            "id": "cuid",
            "clerkId": "clerk_user_id",
            "email": "user@example.com",
            "expoTokens": ["ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"],
            "createdAt": "2025-12-26T12:00:00.000Z",
            "updatedAt": "2025-12-26T12:00:00.000Z"
          }
        }
        ```
    -   `400 Bad Request` if validation fails.
    -   `401 Unauthorized` if not authenticated.
    -   `500 Internal Server Error` for server errors.

### Admin: Send Push Notification

-   **Route:** `POST /api/admin/notification/send`
-   **Description:** Send a push notification to all users or a specific list of users.
-   **Protected:** Yes (Requires Clerk Admin authentication)
-   **Request:**
    -   Body:
        ```json
        {
          "title": "Hello!",
          "message": "This is a test notification.",
          "imageUrl": "https://example.com/image.png",
          "sendToAll": false,
          "emails": ["user1@example.com", "user2@example.com"]
        }
        ```
-   **Response:**
    -   `200 OK`
        ```json
        {
          "success": true,
          "message": "Notification sent successfully",
          "data": {}
        }
        ```
    -   `400 Bad Request` if validation fails.
    -   `401 Unauthorized` / `403 Forbidden` if not an admin.
    -   `404 Not Found` if no valid tokens are found.
    -   `500 Internal Server Error` for server errors.

### Admin: Get All Notifications

-   **Route:** `GET /api/admin/notifications`
-   **Description:** Retrieve a paginated list of all sent notifications.
-   **Protected:** Yes (Requires Clerk Admin authentication)
-   **Request:**
    -   Query Params:
        -   `page` (number, optional, default: 1)
        -   `limit` (number, optional, default: 20)
        -   `sortBy` (string, optional, default: 'createdAt')
        -   `order` ('asc' | 'desc', optional, default: 'desc')
-   **Response:**
    -   `200 OK`
        ```json
        {
          "success": true,
          "data": {
            "notifications": [],
            "pagination": {}
          }
        }
        ```
    -   `401 Unauthorized` / `403 Forbidden` if not an admin.
    -   `500 Internal Server Error` for server errors.

### Admin: Get All Users

-   **Route:** `GET /api/admin/users`
-   **Description:** Retrieve a paginated list of all users.
-   **Protected:** Yes (Requires Clerk Admin authentication)
-   **Request:**
    -   Query Params:
        -   `page` (number, optional, default: 1)
        -   `limit` (number, optional, default: 20)
-   **Response:**
    -   `200 OK`
        ```json
        {
          "success": true,
          "data": {
            "users": [],
            "pagination": {}
          }
        }
        ```
    -   `401 Unauthorized` / `403 Forbidden` if not an admin.
    -   `500 Internal Server Error` for server errors.

### Admin: Get All User Emails

-   **Route:** `GET /api/admin/emails`
-   **Description:** Retrieve a list of all user emails.
-   **Protected:** Yes (Requires Clerk Admin authentication)
-   **Request:**
    -   Body: None
-   **Response:**
    -   `200 OK`
        ```json
        {
          "success": true,
          "data": ["user1@example.com", "user2@example.com"]
        }
        ```
    -   `401 Unauthorized` / `403 Forbidden` if not an admin.
    -   `500 Internal Server Error` for server errors.

### Admin: Send Email

-   **Route:** `POST /api/admin/email/send`
-   **Description:** Send an email to a list of recipients, with optional PDF attachments.
-   **Protected:** Yes (Requires Clerk Admin authentication)
-   **Request:**
    -   Body:
        ```json
        {
          "emails": ["user1@example.com", "user2@example.com"],
          "subject": "Important Update",
          "message": "<p>Here is an important update.</p>",
          "pdfUrls": ["https://example.com/document.pdf"]
        }
        ```
-   **Response:**
    -   `200 OK`
        ```json
        {
          "success": true,
          "message": "Email sent successfully",
          "data": { "messageId": "..." }
        }
        ```
    -   `400 Bad Request` if validation fails.
    -   `401 Unauthorized` / `403 Forbidden` if not an admin.
    -   `500 Internal Server Error` for server errors.

### Admin: Get Email Logs

-   **Route:** `GET /api/admin/email/logs`
-   **Description:** Retrieve a paginated list of all email logs.
-   **Protected:** Yes (Requires Clerk Admin authentication)
-   **Request:**
    -   Query Params:
        -   `page` (number, optional, default: 1)
        -   `limit` (number, optional, default: 20)
        -   `sortBy` (string, optional, default: 'createdAt')
        -   `order` ('asc' | 'desc', optional, default: 'desc')
-   **Response:**
    -   `200 OK`
        ```json
        {
          "success": true,
          "data": {
            "logs": [],
            "pagination": {}
          }
        }
        ```
    -   `401 Unauthorized` / `403 Forbidden` if not an admin.
    -   `500 Internal Server Error` for server errors.
