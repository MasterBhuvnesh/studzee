## API Documentation

### Health Check

- **Route:** `GET /healthcheck`
- **Description:** Basic health check endpoint to verify the service is running.
- **Protected:** No
- **Request:**
  - Body: None
- **Response:**
  - `200 OK`
    ```json
    {
      "status": "ok",
      "timestamp": "2025-12-26T12:00:00.000Z",
      "service": "notification-service"
    }
    ```

### User Registration

- **Route:** `POST /api/register`
- **Description:** Register a new user or add an Expo push token for an existing user.
- **Protected:** Yes (Requires Clerk authentication)
- **Request:**
  - Body:
    ```json
    {
      "email": "user@example.com",
      "expoToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
    }
    ```
- **Response:**
  - `200 OK`
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
  - `400 Bad Request` if validation fails.
  - `401 Unauthorized` if not authenticated.
  - `500 Internal Server Error` for server errors.

### Admin: Send Push Notification

- **Route:** `POST /api/admin/notification/send`
- **Description:** Send a push notification to all users or a specific list of users.
- **Protected:** Yes (Requires Clerk Admin authentication)
- **Request:**
  - Body:
    ```json
    {
      "title": "Hello!",
      "message": "This is a test notification.",
      "imageUrl": "https://example.com/image.png",
      "sendToAll": false,
      "emails": ["user1@example.com", "user2@example.com"]
    }
    ```
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "message": "Notification sent successfully",
      "data": {}
    }
    ```
  - `400 Bad Request` if validation fails.
  - `401 Unauthorized` / `403 Forbidden` if not an admin.
  - `404 Not Found` if no valid tokens are found.
  - `500 Internal Server Error` for server errors.

### Admin: Get All Notifications

- **Route:** `GET /api/admin/notifications`
- **Description:** Retrieve a paginated list of all sent notifications.
- **Protected:** Yes (Requires Clerk Admin authentication)
- **Request:**
  - Query Params:
    - `page` (number, optional, default: 1)
    - `limit` (number, optional, default: 20)
    - `sortBy` (string, optional, default: 'createdAt')
    - `order` ('asc' | 'desc', optional, default: 'desc')
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "notifications": [],
        "pagination": {}
      }
    }
    ```
  - `401 Unauthorized` / `403 Forbidden` if not an admin.
  - `500 Internal Server Error` for server errors.

### Admin: Get All Users

- **Route:** `GET /api/admin/users`
- **Description:** Retrieve a paginated list of all users.
- **Protected:** Yes (Requires Clerk Admin authentication)
- **Request:**
  - Query Params:
    - `page` (number, optional, default: 1)
    - `limit` (number, optional, default: 20)
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "users": [],
        "pagination": {}
      }
    }
    ```
  - `401 Unauthorized` / `403 Forbidden` if not an admin.
  - `500 Internal Server Error` for server errors.

### Admin: Get All User Emails

- **Route:** `GET /api/admin/emails`
- **Description:** Retrieve a list of all user emails.
- **Protected:** Yes (Requires Clerk Admin authentication)
- **Request:**
  - Body: None
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "data": ["user1@example.com", "user2@example.com"]
    }
    ```
  - `401 Unauthorized` / `403 Forbidden` if not an admin.
  - `500 Internal Server Error` for server errors.

### Admin: Send Email

- **Route:** `POST /api/admin/email/send`
- **Description:** Send a styled HTML email to a list of recipients, with optional PDF attachments. The email uses a professional template with customizable title, body content, and footer.
- **Protected:** Yes (Requires Clerk Admin authentication)
- **Request:**
  - Body:
    ```json
    {
      "emails": ["user1@example.com", "user2@example.com"],
      "subject": "Important Update",
      "title": "Email Title - Shown in Browser/Client",
      "body": "<p><strong>Hello,</strong></p><p>Here is an important update.</p>",
      "banner": "https://images2.imgbox.com/4b/ee/zfP80V2d_o.jpg",
      "footer": "Optional custom footer text",
      "pdfUrls": ["https://example.com/document.pdf"]
    }
    ```
  - **Required Fields:**
    - `emails` - Array of recipient email addresses (minimum 1)
    - `subject` - Email subject line
    - `title` - Email title (displayed in email client/browser tab)
    - `body` - HTML content for the email body
  - **Optional Fields:**
    - `banner` - Custom banner image URL
    - `footer` - Custom footer text (defaults to: "This is an automated email. Please do not reply.")
    - `pdfUrls` - Array of PDF URLs to attach
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "message": "Email sent successfully",
      "data": { "messageId": "..." }
    }
    ```
  - `400 Bad Request` if validation fails.
  - `401 Unauthorized` / `403 Forbidden` if not an admin.
  - `500 Internal Server Error` for server errors.

### Admin: Get Email Logs

- **Route:** `GET /api/admin/email/logs`
- **Description:** Retrieve a paginated list of all email logs.
- **Protected:** Yes (Requires Clerk Admin authentication)
- **Request:**
  - Query Params:
    - `page` (number, optional, default: 1)
    - `limit` (number, optional, default: 20)
    - `sortBy` (string, optional, default: 'createdAt')
    - `order` ('asc' | 'desc', optional, default: 'desc')
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "logs": [],
        "pagination": {}
      }
    }
    ```
  - `401 Unauthorized` / `403 Forbidden` if not an admin.
  - `500 Internal Server Error` for server errors.

---

### Webhook: Clerk User Created

- **Route:** `POST /api/webhooks/clerk`
- **Description:** Handle Clerk webhook events. When a new user is created in Clerk (`user.created` event), this endpoint automatically sends a welcome email to the user.
- **Protected:** No (Public endpoint, verified via SVIX signature)
- **Request:**
  - Headers (required):
    - `svix-id` - Webhook event ID
    - `svix-timestamp` - Webhook timestamp
    - `svix-signature` - Webhook signature for verification
  - Body (sent by Clerk):
    ```json
    {
      "type": "user.created",
      "data": {
        "id": "user_xxx",
        "email_addresses": [
          {
            "email_address": "user@example.com",
            "id": "idn_xxx"
          }
        ],
        "first_name": "John",
        "last_name": "Doe",
        "username": "johndoe",
        "created_at": 1234567890,
        "updated_at": 1234567890
      }
    }
    ```
- **Response:**
  - `200 OK`
    ```json
    {
      "success": true,
      "message": "Welcome email processed",
      "emailSent": true
    }
    ```
  - `400 Bad Request` if webhook verification fails or headers are missing.
  - `500 Internal Server Error` if webhook secret is not configured.
- **Setup:**
  1. Add `CLERK_WEBHOOK_SIGNING_SECRET` to your `.env` file
  2. In Clerk Dashboard → Webhooks → Add Endpoint
  3. Set URL to `https://your-domain/api/webhooks/clerk`
  4. Subscribe to `user.created` event
  5. Copy the Signing Secret to your `.env`
