| FOLDER       | VERSION | BRANCH     | TECH STACK                                                                       |
| ------------ | ------- | ---------- | -------------------------------------------------------------------------------- |
| NOTIFICATION | tags    | production | -                                                                                |
| BACKEND      | tags    | production | TypeScript, Express.js, MongoDB, Redis, AWS S3, Docker, Clerk, Zod, vitest, pino |
| MOBILE       | eas     | production | -                                                                                |
| WEBSITE      | tags    | production | -                                                                                |
| DESKTOP      | release | production | -                                                                                |

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
