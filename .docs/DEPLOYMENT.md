# DEPLOYMENT

Environment checklist for deploying `studzee-api`. The variable lists below were
generated from the Zod schema in `BACKEND/src/config/index.ts` on 14-08-2026, not
transcribed by hand, so they match what the service actually validates.

The schema parses at import time and throws on the first problem, so a missing
variable is a boot failure with a named field rather than a runtime surprise.
That is deliberate: the service fails fast instead of misbehaving.

## REQUIRED, 16

Without any one of these the process exits at startup.

| Variable | Notes |
| -------- | ----- |
| `CLERK_SECRET_KEY` | Must begin `sk_`. Use the live key, not `sk_test_`. |
| `CLERK_PUBLISHABLE_KEY` | Must begin `pk_`. Clerk base64 decodes it to find its API host, so a malformed value throws at parse time and surfaces as a 500 on every authenticated request rather than a 401. |
| `MONGO_URI` | Include credentials and `authSource` if the server requires auth. Mongoose connects lazily, so a wrong value fails on the first query, not at boot. |
| `DATABASE_URL` | Must be a valid URL. Reachable **at boot**, because the container runs `prisma migrate deploy` before the app and exits 1 with `P1001` otherwise. |
| `REDIS_URL` | Must be a valid URL. |
| `S3_REGION` | |
| `S3_ACCESS_KEY_ID` | |
| `S3_SECRET_ACCESS_KEY` | |
| `S3_BUCKET_IMAGES` | |
| `S3_BUCKET_PDFS` | |
| `S3_ENDPOINT` | The S3 API host. On Supabase: `https://<project-ref>.storage.supabase.co/storage/v1/s3` |
| `S3_PUBLIC_URL` | The **public object** host, which on Supabase is a different host to the S3 endpoint. It cannot be derived from `S3_ENDPOINT`, which is why it is a separate variable. |
| `SMTP_HOST` | |
| `SMTP_USER` | |
| `SMTP_PASSWORD` | |
| `EMAIL_FROM` | For example `Studzee <no-reply@studzee.in>` |

These replaced the old `AWS_*` names on 11-08-2026: `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_S3_BUCKET_NAME` became the
`S3_*` set above, and `S3_ENDPOINT` and `S3_PUBLIC_URL` are new. A deploy
environment still carrying the `AWS_*` names will fail to boot.

`DATABASE_URL`, the `SMTP_*` block and `EMAIL_FROM` are new since the
notification service was merged in on 10-08-2026.

## SET THESE TOO, even though they have defaults

| Variable | Default | Why to set it anyway |
| -------- | ------- | -------------------- |
| **`NODE_ENV`** | `development` | **Set to `production`.** This is the most dangerous default in the file. The `DEV_TOKEN` bearer bypass in `src/middleware/auth.ts` is active whenever `NODE_ENV` is `development` and `DEV_TOKEN` is set, and it grants admin. Leaving `NODE_ENV` unset while `DEV_TOKEN` is present is an open admin surface. |
| **`PORT`** | `4000` | **Set to `3000` when running the container.** The image declares `EXPOSE 3000` and its healthcheck probes 3000. With any other value the container serves traffic correctly and reports `unhealthy` forever. Publish it as `4000:3000` if the external port matters. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | unset | Optional in the schema, but `POST /webhooks/clerk` answers 500 without it, because the svix signature is the endpoint's only authentication and an unset secret is treated as a hard failure rather than a skipped check. Required if Clerk webhooks are enabled. |
| `EMAIL_ATTACHMENT_HOSTS` | the Supabase project host | Comma separated allowlist of hosts an email attachment may be fetched from. It stops an admin making the mailer pull an arbitrary URL. Update it if storage ever moves. |
| `EMAIL_BANNER_URL` | the Supabase `assets` bucket | Verified serving a valid PNG on 14-08-2026. Update if the brand asset moves. |
| `LOG_LEVEL` | `info` | |
| `HEALTHCHECK_URL` | unset | Render keepalive ping. The job is skipped when unset, which is correct anywhere else. |

## DO NOT SET IN PRODUCTION

- **`DEV_TOKEN`.** It is inert unless `NODE_ENV` is `development`, but the safe
  configuration is for the variable not to exist in a production environment at
  all, rather than to rely on a second variable being correct.

## OTHER DEFAULTS, safe to leave

`DB_NAME`, `SMTP_PORT`, `LIST_CACHE_TTL`, `DOC_CACHE_TTL`, `TODAY_CACHE_TTL`,
`JOB_CRON`, `SITE_URL`.

## WHERE THE VALUES GO

**Not into `BACKEND/.env.container`.** That file is tracked in git and holds
placeholder Clerk keys on purpose. Real credentials belong in the deploy
platform's own environment configuration. `BACKEND/.env` is the gitignored file
for local credentials and is never deployed.

## STEPS THAT ARE NOT ENVIRONMENT VARIABLES

Two things the service needs that no variable covers:

1. **Provision an admin user in Clerk.** `requireAdmin` reads
   `publicMetadata.role === 'admin'`. No code path sets it, so it is set by hand
   in the Clerk dashboard. Until at least one user has it, the entire `/admin`
   surface answers 403 to everyone.
2. **Repoint the ingress for the released mobile app.** Devices running MOBILE
   1.1.4 call `POST /noti/api/register`, which no longer exists after the merge.
   Either the ingress rewrites that path to `/notifications/register`, or those
   installs cannot register for push.

## AFTER DEPLOYING

Exercise the same checks that were run locally, against the deployed URL:

```bash
curl https://<host>/health/readiness
# {"status":"ready","checks":{"db":"ok","postgres":"ok","redis":"ok"}}
```

Readiness round trips all three stores rather than reading driver connection
flags, so it cannot report healthy while a dependency is down. Any `"error"`
names the store that is not answering.

Then confirm, in this order:

1. An unauthenticated request to an authenticated route returns **401**, not 500.
   A 500 here means `CLERK_PUBLISHABLE_KEY` is malformed.
2. A real Clerk session token returns **200**.
3. A token for a user without the admin role returns **403** on `/admin/*`, and
   one with it returns **200**. Test both directions; a single privileged
   identity only proves half the check.
4. An upload round trip against the real buckets, then fetch the returned public
   URL and expect 200.
5. `POST /notifications/register` with a real token.
