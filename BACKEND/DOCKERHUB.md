# STUDZEE API

`studzee-api` is the backend for Studzee, an educational content platform. It
owns content and caching, Clerk authentication, Expo push notifications,
transactional email, the Clerk webhook, and the audit logs.

Express 4 on Node 22, written in TypeScript. Built from
[MasterBhuvnesh/studzee](https://github.com/MasterBhuvnesh/studzee).

## QUICK START

```bash
docker run -d --name studzee-api \
  -p 4000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e MONGO_URI="mongodb://..." \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e CLERK_SECRET_KEY="sk_..." \
  -e CLERK_PUBLISHABLE_KEY="pk_..." \
  -e S3_REGION="..." \
  -e S3_ACCESS_KEY_ID="..." \
  -e S3_SECRET_ACCESS_KEY="..." \
  -e S3_BUCKET_IMAGES="images" \
  -e S3_BUCKET_PDFS="pdfs" \
  -e S3_ENDPOINT="https://<ref>.storage.supabase.co/storage/v1/s3" \
  -e S3_PUBLIC_URL="https://<ref>.supabase.co/storage/v1/object/public" \
  -e SMTP_HOST="..." \
  -e SMTP_USER="..." \
  -e SMTP_PASSWORD="..." \
  -e EMAIL_FROM="Studzee <no-reply@example.com>" \
  <namespace>/studzee-backend:latest
```

## THE PORT IS 3000

The image serves on **3000**, not 4000. It declares `EXPOSE 3000` and its
healthcheck probes 3000, so `PORT` must be `3000` inside the container. Publish
it wherever you like on the host, for example `-p 4000:3000`.

Setting `PORT` to anything else produces a container that serves traffic
correctly and reports `unhealthy` forever, because the healthcheck is still
probing 3000.

## TAGS

| Tag            | What it is                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `latest`       | The most recent release. Moved only by a `backend-v*` git tag.                                                                  |
| `4.0.0`        | A specific release. Immutable.                                                                                                  |
| `<7 char sha>` | A manual build from a branch. Never tagged `latest`, because an unreleased branch should not become what a deploy target pulls. |

Pin to a version tag in production. `latest` moves under you.

## ENVIRONMENT

Sixteen variables are required and the process exits at startup without any one
of them. The Zod schema parses at import time and throws on the first problem,
so a missing variable is a named boot failure rather than a runtime surprise.

`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `MONGO_URI`, `DATABASE_URL`,
`REDIS_URL`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
`S3_BUCKET_IMAGES`, `S3_BUCKET_PDFS`, `S3_ENDPOINT`, `S3_PUBLIC_URL`,
`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`.

Also set these, which have defaults that are wrong for a deployment:

- **`NODE_ENV=production`**. Required. The default is `development`.
- **`PORT=3000`**. See above.
- `CLERK_WEBHOOK_SIGNING_SECRET` if Clerk webhooks are enabled. Without it
  `POST /webhooks/clerk` answers 500, because the svix signature is that
  endpoint's only authentication and an unset secret is treated as a hard
  failure rather than a skipped check.

Full reference, including the optional variables and their defaults, is in
[`.docs/DEPLOYMENT.md`](https://github.com/MasterBhuvnesh/studzee/blob/main/.docs/DEPLOYMENT.md).

Two notes on the S3 variables. `S3_ENDPOINT` is the S3 API host and
`S3_PUBLIC_URL` is the public object host. On Supabase these are different
hosts and neither can be derived from the other, which is why both exist.

## HEALTH

| Endpoint            | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `/health/liveness`  | Process is up. This is what the image healthcheck probes. |
| `/health/readiness` | Round trips MongoDB, Postgres and Redis.                  |

```bash
curl http://localhost:4000/health/readiness
# {"status":"ready","checks":{"db":"ok","postgres":"ok","redis":"ok"}}
```

Readiness issues a real query against each store rather than reading driver
connection flags, so it cannot report healthy while a dependency is down. Any
`"error"` names the store that is not answering.

## BEHAVIOUR WORTH KNOWING

- **It migrates on start.** The container runs `prisma migrate deploy` before
  the application. `DATABASE_URL` therefore has to be reachable at boot or the
  container exits 1 with `P1001` before any application code runs. It also
  means every replica attempts the migration, so run migrations separately if
  you scale beyond one instance.
- **Mongoose connects lazily.** A wrong `MONGO_URI` does not fail the
  connection, it fails the first query, so it surfaces as a 500 on a route
  rather than an error at boot.
- **Clerk decodes the publishable key** to find its API host. A malformed
  `CLERK_PUBLISHABLE_KEY` throws at parse time and reaches the error handler as
  a 500, which makes an unauthenticated request look like a server fault
  instead of a 401.
- **Runs as a non-root user** (`appuser`).
- **Admin routes need a role set in Clerk.** Authorisation reads
  `publicMetadata.role === 'admin'`, and no code path sets it. Until at least
  one user has it, the entire `/admin` surface answers 403 to everyone.

## API

Routes are grouped under `/content`, `/pdfs`, `/notifications`, `/admin`,
`/webhooks` and `/health`. Every endpoint is documented in
[`API.md`](https://github.com/MasterBhuvnesh/studzee/blob/main/BACKEND/API.md),
written against what the handlers actually return.

## LICENCE

See the [repository](https://github.com/MasterBhuvnesh/studzee).
