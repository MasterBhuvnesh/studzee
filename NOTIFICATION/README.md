# Notification Service

A robust Bun-based server for managing Expo push notifications with Firebase Firestore integration. This service provides secure token management, notification delivery, and automatic cleanup of invalid tokens.

## Features

- **Expo Push Notifications**: Send notifications to mobile devices using Expo's push notification service
- **Firebase Integration**: Store and manage push tokens using Firebase Firestore
- **Token Validation**: Comprehensive validation for Expo push tokens
- **Authentication**: Bearer token-based API protection
- **Automatic Cleanup**: Removes invalid/expired tokens automatically
- **Health Monitoring**: Built-in health check and heartbeat functionality
- **Docker Support**: Containerized deployment with Docker and Docker Compose
- **TypeScript**: Fully typed codebase with strict type checking
- **Testing**: Unit tests using Bun's built-in test runner
- **Code Quality**: ESLint and Prettier configuration for consistent code style

## Prerequisites

- [Bun](https://bun.sh/) >= 1.1.13
- Firebase project with Firestore enabled
- Firebase service account credentials

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
   cp .env.sample .env
   ```

   Fill in your Firebase credentials and other configuration values in `.env`

4. **Validate and format code**
   ```bash
   bun run validate:fix
   ```

## Configuration

### Environment Variables

| Variable                  | Description                          | Required |
| ------------------------- | ------------------------------------ | -------- |
| `NODE_ENV`                | Environment (development/production) | Yes      |
| `PORT`                    | Server port (default: 3000)          | No       |
| `AUTH_TOKEN`              | Bearer token for API authentication  | Yes      |
| `HEALTHCHECK_URL`         | URL for heartbeat health checks      | No       |
| `FIREBASE_PROJECT_ID`     | Firebase project ID                  | Yes      |
| `FIREBASE_CLIENT_EMAIL`   | Firebase service account email       | Yes      |
| `FIREBASE_PRIVATE_KEY`    | Firebase private key                 | Yes      |
| `FIREBASE_PRIVATE_KEY_ID` | Firebase private key ID              | Yes      |
| Other Firebase vars       | See `.env.sample` for complete list  | Yes      |

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore database
3. Create a service account and download the credentials
4. Extract the credentials into your `.env` file

## Usage

### Development

```bash
bun run dev
```

### Production

```bash
bun run start
```

### Testing

```bash
# Run tests
bun test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Code Quality

```bash
# Check formatting and linting
bun run validate

# Fix formatting and linting issues
bun run validate:fix

# Format code only
bun run format:fix

# Lint code only
bun run lint:fix
```

## API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer your_auth_token_here
```

### Endpoints

#### Health Check

- **GET** `/healthcheck`
- **Description**: Check service health status
- **Access**: Public
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

#### Register Push Token

- **POST** `/register-token`
- **Description**: Register a new Expo push token
- **Access**: Protected
- **Request Body**:
  ```json
  {
    "token": "ExponentPushToken[ABC123...]"
  }
  ```
- **Responses**:
  - `201 Created`: Token registered successfully
  - `400 Bad Request`: Invalid token format
  - `401 Unauthorized`: Missing/invalid authentication
  - `500 Internal Server Error`: Database error

#### Get All Tokens

- **GET** `/get-tokens`
- **Description**: Retrieve all registered push tokens
- **Access**: Protected
- **Response**:
  ```json
  {
    "success": true,
    "message": "Retrieved X tokens",
    "data": ["token1", "token2", "..."],
    "statusCode": 200
  }
  ```

#### Send Notifications

- **POST** `/send`
- **Description**: Send push notifications to all registered devices
- **Access**: Protected
- **Request Body**:
  ```json
  {
    "title": "Custom Title",
    "body": "Custom Body",
    "imageUrl": "http://example.com/image.png"
  }
  ```
- **Responses**:
  - `200 OK`: Notifications sent successfully
  - `401 Unauthorized`: Missing/invalid authentication
  - `500 Internal Server Error`: Database error

## Docker Deployment

### Using Docker

```bash
# Build the image
docker build -t yup .

# Run the container
docker run -p 3000:3000 --env-file .env yup
```

### Using Docker Compose

```bash
# Build and start services
docker-compose up --build

# Start services (without rebuilding)
docker-compose up

# Stop services
docker-compose down
```

## Architecture

The service follows a clean architecture pattern with clear separation of concerns:

```
src/
├── __tests__/          # Unit tests
├── config/             # Configuration (Firebase, service account)
├── jobs/               # Background jobs (heartbeat)
├── middleware/         # Express middleware (authentication)
├── models/             # Data models and interfaces
├── repositories/       # Data access layer
├── routes/             # API route handlers
├── services/           # Business logic layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── validators/         # Request validation schemas
└── app.ts              # Express app configuration
```

### Key Components

- **TokenService**: Business logic for token management
- **TokenRepository**: Data access layer for Firestore operations
- **Authentication Middleware**: Bearer token validation
- **Error Handling**: Centralized error handling with custom error types
- **Validation**: Input validation using Joi schemas
- **Logging**: Structured logging with environment-based levels

## Testing

The project includes comprehensive unit tests using Bun's built-in test runner:

```bash
# Run all tests
bun test

# Run specific test file
bun test src/__tests__/token.service.test.ts

# Run tests with coverage
bun run test:coverage
```

## Release Management

The project includes automated release scripts:

```bash
# Patch version (1.0.0 -> 1.0.1)
bun run do-release

# Minor version (1.0.0 -> 1.1.0)
bun run do-release:minor

# Major version (1.0.0 -> 2.0.0)
bun run do-release:major
```

> **Note**: Use release commands only when ready to build and deploy to production.

## Development

### Code Style

- **ESLint**: Linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking enabled

### Monitoring

- **Heartbeat Job**: Automatic health checks every 14 minutes (production only)
- **Error Logging**: Comprehensive error tracking and logging
- **Token Cleanup**: Automatic removal of invalid/expired tokens

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run validation: `bun run validate:fix`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please create an issue in the repository or contact the maintainer.

TODO :

- Clerk for Authorization
- Notification logic for single and multiple users
