| FOLDER       | VERSION | BRANCH     | TECH STACK                                                                                       |
| ------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| NOTIFICATION | tags    | production | TypeScript, Bun, Express.js, PostgreSQL, Prisma, Clerk, Expo Push, Nodemailer, Zod, Docker, pino |
| BACKEND      | tags    | production | TypeScript, Express.js, MongoDB, Redis, AWS S3, Docker, Clerk, Zod, vitest, pino                 |
| MOBILE       | eas     | production | -                                                                                                |
| WEBSITE      | tags    | production | -                                                                                                |
| DESKTOP      | release | production | -                                                                                                |

## What is Studzee?

Studzee is a comprehensive **SaaS (Software as a Service) educational platform** designed to revolutionize document management and learning. It seamlessly integrates multiple platforms to provide a unified experience for students and educators.

### Core Ecosystem

The Studzee ecosystem consists of five interconnected components:

- **BACKEND (API)**: The central nervous system built with TypeScript, Express.js, and MongoDB. It handles data persistence, caching (Redis), file storage (AWS S3), and business logic.
- **NOTIFICATION Service**: A dedicated microservice for managing communication flow. It handles push notifications via Expo and transactional emails using Nodemailer.
- **MOBILE App**: A cross-platform mobile experience allowing users to access documents, take quizzes, and receive real-time updates on the go.
- **WEBSITE**: The web interface for browsing content and managing user profiles.
- **DESKTOP App**: A specialized client optimized for productivity and content creation, also serving as the primary interface for the **administrative control panel**.

### Key Features

- **Smart Document Management**: Upload, organize, and retrieve educational resources (PDFs, Images) with ease.
- **Intelligent Caching**: High-performance content delivery powered by Redis multi-tier caching.
- **Real-time Notifications**: Stay updated with instant push notifications for new content and announcements.
- **Secure Authentication**: Enterprise-grade security using Clerk for seamless user management across all platforms.
- **Cross-Platform Sync**: Start working on your phone and continue on your desktop without missing a beat.

### Future Roadmap: Agentic AI

> **Current Status:** Content is manually generated and configured by the administrator.

We are moving towards **completely automated content generation** powered by **Agentic AI**. The code and logic for this system will be housed in the upcoming `Agent` folder, with development starting soon.

> **⚠️ CRITICAL:**  
> The `VERSION` and `BRANCH` columns trigger automated deployment workflows for their respective folders.

> **⚠️ IMPORTANT for developers:**  
> Production deployments automatically redeploy all listed folders. Always test code thoroughly before pushing.

> **Infrastructure Stack:**
>
> - **Production:** AWS, Terraform
> - **Testing:** Render (enable webhook and uncomment in workflow), MongoDB Atlas, Redis Upstash, Neon PostgreSQL
> - **Development:** Docker and Docker Compose

Testing environments use Docker images without platform deployment.
