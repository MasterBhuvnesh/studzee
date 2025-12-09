| FOLDER       | VERSION | BRANCH     | TECH STACK |
| ------------ | ------- | ---------- | ---------- |
| NOTIFICATION | tags    | production | -          |
| BACKEND      | tags    | production | -          |
| MOBILE       | eas     | production | -          |
| WEBSITE      | tags    | production | -          |
| DESKTOP      | release | production | -          |

> **⚠️ CRITICAL:**  
> The `VERSION` and `BRANCH` columns trigger automated workflows for deployment of their respective folders.

> **⚠️ IMPORTANT for developers:**  
> Production deployments automatically redeploy all listed folders. Ensure code is tested before pushing.

> **Infrastructure Stack:**
>
> - **Production:** AWS
> - **Development:** Render, MongoDB Atlas, Redis Upstash
