# TCSK

Things Claude Should Know. This is what the user wants Claude to know about the project. Read it before starting work and treat it as memory. Add to it when the user shares something durable.

## PROJECT

- Studzee is a full-stack SaaS educational platform for creating, structuring, delivering, and consuming educational content across mobile, web, and desktop.
- Stakeholders are students and learners, educators and content creators, administrators, and contributing developers.
- The architecture is distributed and service oriented. Each service is independently deployable for fault isolation, horizontal scaling, and controlled rollouts.
- Content is currently uploaded and structured manually by administrators. An agentic AI layer for validation, structuring, quiz generation, and summaries is on the roadmap and will live in the `AGENTS` folder.
- Official website is `https://studzee.in`, with DNS handled through AWS Route 53 for production.

## REPOSITORY LAYOUT

The repository was stripped to the v2 working set on 10-08-2026. Only the following remain.

- `BACKEND` is the only service (`studzee-api`). Since the merge on 10-08-2026 it owns content, caching, Clerk authentication, Expo push delivery, transactional email, the Clerk webhook, and the notification and email audit logs.
- `MOBILE` is the Expo client.
- `DESKTOP` is the Electron admin console.
- `.github` holds the README, workflows, CODEOWNERS, and community docs.
- `.docs` holds the process documentation for people and agents.
- `code.sh` drives the per module version bump and release flow.
- `WORKLOG.md` is the running record of work.

Removed on 10-08-2026 and recoverable from git history before commit `9ba738d6`: `AGENTS`, `CONVEX`, `K8S`, `PACKAGES`, `SERVICES`, `TERRAFORM`, `WEBSITE`, `.vscode`, and the stray root `package.json`. Convex is out of scope permanently and must not appear in the v2 architecture or implementation.

Gitignored local files from the removed folders were copied to `D:\Projects\Studzee-archive-2026-08-10` outside the repository before deletion. That archive holds the Terraform state for the backend infrastructure and three local env files. It is not tracked and will not survive a machine change.

## DATA AND INFRASTRUCTURE

- **MongoDB** holds content, through Mongoose. **PostgreSQL** holds users, Expo push tokens, and the notification and email audit logs, through Prisma. Both are kept, by the owner's decision. Do not propose consolidating them.
- **Redis** is the read cache, using the cache aside pattern with `SCAN` based invalidation.
- **Supabase Storage** holds uploaded files, spoken to over the S3 protocol with the AWS SDK. Project ref `lammfakgegmrkxdkwukd`, region `ap-northeast-2`. Three public buckets: `images` and `pdfs` for uploads, and `assets` for the email banner, which the application never writes to. The S3 endpoint and the public URL are different hosts, and `forcePathStyle` is required.
- **MinIO** stands in for Supabase locally, and **Mailpit** stands in for the mail provider. A `minio-init` container creates the same three buckets and marks them public, so local behaviour matches the real project.
- **`docker-compose.yml` has an `api` service, behind the `api` profile.** Added 14-08-2026, replacing the hand-written `docker run` invocation. `docker compose up -d` still starts infrastructure only, so the host `npm run dev` workflow is unchanged and keeps port 4000. `docker compose --profile api up -d` runs the API as a container instead. The two are mutually exclusive because both bind 4000; set `API_PORT` to run them side by side.
- **The API container cannot run the seed or job scripts.** They go through `ts-node`, a devDependency, and the image installs with `--omit=dev`. Run `npm run seed` and `npm run job:refresh-cache` on the host. The `make seed`, `make logs` and `make refresh-cache` targets shell into the container and fail for the same reason.

### ENVIRONMENT FILES

Three of them, and the distinction is where the API process runs, not what storage it uses. Getting this wrong fails at boot with `P1001` from `prisma migrate deploy`, before any application code runs.

- `.env` and `.env.docker` address every dependency as `localhost`. Correct for a host process, because the containers publish their ports to the host. `.env.docker` is also what `make env-up` feeds to compose for variable substitution. Despite the name, it is not for running inside Docker.
- `.env.container` addresses them by compose service name, `mongo`, `postgres`, `redis`, `minio` and `mailpit`. It is the only file that works for a containerized API. Added 12-08-2026.
- `.env.container` sets `PORT=3000`, unlike the other two, because the Dockerfile declares `EXPOSE 3000` and probes port 3000 in its `HEALTHCHECK`. Publish it as `-p 4000:3000`. With `PORT=4000` the container serves traffic correctly and still reports `unhealthy` forever.
- In `.env.container` only, `S3_ENDPOINT` and `S3_PUBLIC_URL` point at different hosts on purpose: uploads go to `http://minio:9000`, while the URL stored on the document stays `http://localhost:9000` because a client outside Docker fetches it later and cannot resolve `minio`.
- Authentication is centralized through **Clerk** and reaches the clients through the backend.
- Terraform and Kubernetes were removed with the strip, so the deployed topology is being redecided as part of v2. Validate changes locally before pushing to production branches.

### CREDENTIALS

- Live credentials belong only in the gitignored `BACKEND/.env`. Never commit them, and never print a value into a transcript or a log. Print key names and lengths instead.
- If a secret is exposed by accident, say so plainly and tell the owner to rotate it.

## TESTING

The suite is Vitest. It stands at 90 passing across 11 files as of 13-08-2026.

- **Run it from `BACKEND`, never from the repository root.** The root has no `package.json` and no Vitest config, so `npx vitest` there installs an unrelated Vitest from the registry, resolves no `@/*` aliases and never runs `globalSetup`. Every suite fails with `Cannot find package '@/...'`, which looks like a code fault and is not one.
- **Start the compose stack first.** The integration tests in `content.route.test.ts` use a real Mongo and Redis. The unit tests do not.
- `src/tests/setup/globalSetup.ts` supplies a default for every variable the config schema requires, so the suite runs on a checkout with no `.env`. A real `.env` still wins where set.
- The Mongo default carries credentials and `authSource=admin`, matching the compose defaults. Without them Mongoose still connects, because it connects lazily, and the failure appears only on the first query as `Command aggregate requires authentication`.
- `CLERK_PUBLISHABLE_KEY` in that file must stay structurally valid, meaning `pk_test_` followed by the base64 of a domain. Clerk decodes it to find its API host and throws `Publishable key not valid` on anything else, which surfaces as a 500 and makes an unauthenticated request look like a server fault instead of a 401.
- **Vitest transpiles without typechecking**, so a test file can pass at runtime and still not compile. Run `npx tsc --noEmit -p tsconfig.json` as well. `tsconfig.build.json` excludes `src/tests`, the base config does not, and that is deliberate.
- **Measured coverage is 49 percent of statements**, taken 14-08-2026, and that is after `vitest.config.ts` already excludes a long list of files. Fully uncovered at 0 percent: `middleware/errorHandler.ts`, `middleware/validation.ts`, `middleware/rateLimit.ts`, `services/upload.service.ts`, `api/controllers/webhook.controller.ts`, `api/controllers/user.controller.ts`, `api/controllers/email.controller.ts`, `api/controllers/pdf.controller.ts`. Barely covered: `middleware/auth.ts` at 24 percent and `services/user.service.ts` at 18 percent. The green suite says the covered half works, not that the service does.
- `globalSetup.ts` is wired as `setupFiles`, not `globalSetup`, so it runs once per test file rather than once per run. Its header comment says otherwise. It is idempotent, so this is a documentation defect and not a behavioural one, and `[TEST]: Global test setup complete` printing eleven times is the visible symptom.

## PEOPLE

- Developers: BHUVNESH (Bhuvnesh Verma), ABHAY (Abhay Mishra).
- GitHub: @MasterBhuvnesh, @AbhayMishra1371.
- CODEOWNERS assigns the whole repository to @MasterBhuvnesh.
- Repository remote is `https://github.com/MasterBhuvnesh/studzee.git`.

## CONVENTIONS

- All new code is TypeScript.
- Documentation for agents and process lives in `.docs`. See [`RULES.md`](RULES.md), [`RECORDS.md`](RECORDS.md), and [`FIXES.md`](FIXES.md).
- The running work record is [`WORKLOG.md`](../WORKLOG.md) at the repository root.
- Work happens on feature branches and is delivered through pull requests. The user merges, not the agent.
- No em dashes, no emoji, ALL CAPS headings in markdown.

## V2 PLAN

Stated by the user on 10-08-2026. This is the agreed direction. Follow it in order and do not re-litigate the decisions in it.

1. **Merge NOTIFICATION into BACKEND and keep BACKEND only.** **DONE 10-08-2026.** Expo push delivery, transactional email, the Clerk webhook, user and token registration, and the audit logs all moved into BACKEND. The folder is deleted.
2. **Then work on the data storage layer.** **IN PROGRESS.** Storage moved to Supabase on 11-08-2026. The database layer itself is not yet specified.
2a. **Backend first, frontend second.** Confirmed on 10-08-2026. Finish the backend before touching MOBILE or DESKTOP. Client work follows once the API it consumes is settled, so the clients are written against a stable contract rather than a moving one.
3. **Keep both databases.** MongoDB stays for content, Postgres stays for the notification data. The user has explicitly confirmed this split is acceptable, so do not propose consolidating them onto one engine.
4. **Update the docker compose file as part of the merge.** **DONE.** `BACKEND/docker-compose.yml` now runs mongo, postgres, redis, minio, minio-init, mailpit and mongo-express. `NOTIFICATION/docker-compose.yml` is gone.

**Runtime decided on 10-08-2026: keep what BACKEND already has.** Node 22 with the `tsc` plus `tsc-alias` build, `ts-node-dev` in development, Vitest for tests, and the existing Node Dockerfile. Bun is dropped, along with `bun.lock` and the Bun based Dockerfile. Prisma runs on Node without change, so the Postgres layer moves across as is.

**Decisions taken 10-08-2026 and 11-08-2026, do not re-litigate:**

- Notification routes were renamespaced to backend conventions rather than keeping the `/noti/api` prefix. `/notifications/register`, `/admin/notifications`, `/admin/emails`, `/admin/users`, `/webhooks/clerk`.
- Every defect found in the architecture review was fixed during the move rather than carried forward. See [`FIXES.md`](FIXES.md).
- Storage is Supabase, with uploads split across an `images` and a `pdfs` bucket rather than one bucket with key prefixes, because that is how the project is laid out.
- Buckets are public. The application stores a plain public URL on the document and the clients fetch it directly. Signed URLs were considered and rejected.
- MinIO stays for local development. It is not replaced by pointing local work at Supabase.

## NOTES

- The current working branch is `feat/v2-architecture`. The entire codebase is being rewritten.
- Convex is being removed from the project entirely. Do not consider it in any design or implementation.
- The starting state of the modules is documented in [`V2-ARCHITECTURE-REVIEW.md`](V2-ARCHITECTURE-REVIEW.md). It is a point in time record, so read its status header before treating any finding as still open.
- The v1 CI pattern is preserved in [`WORKFLOW-SAMPLE.md`](WORKFLOW-SAMPLE.md) for reference when `.github/workflows` is rewritten.

### KNOWN ENVIRONMENT ISSUES ON THIS MACHINE

- **The Vitest suite runs here now.** Resolved 13-08-2026. Defender no longer quarantines `node_modules/@esbuild/win32-x64/esbuild.exe`, so the ts-node workaround is retired.
- **`make` is not installed.** Use the `docker-compose` commands directly.
- **Do not use the PowerShell `Get-Content -Raw` plus `Set-Content` pattern on files containing non-ASCII characters.** PowerShell 5.1 reads them as ANSI and writes UTF-8, which corrupts box drawing characters in the readme directory trees. Use the Edit tool, or `[System.IO.File]::ReadAllText` with an explicit UTF8 encoding.

### OPEN WORK

- Repoint the ingress so devices running the released MOBILE 1.1.4 keep registering. They still call `POST /noti/api/register`, which no longer exists.
- Update the rest of `.github`. `docker-backend.testing.yml` was rewritten on 13-08-2026, gated on lint, typecheck and the suite, and hardened on 14-08-2026. Still outstanding: the website workflow builds a deleted directory and will fail on a `website-v*` tag, and `docker-notification.testing.yml` builds a folder that no longer exists.
- **Backend workflow items left open on 14-08-2026, deliberately not changed:**
  - There is no Postgres service container. Nothing in the suite opens a Postgres connection today because the readiness and notification tests mock Prisma, but `globalSetup.ts` still hands out a `DATABASE_URL` pointing at `localhost:5432`. The first test that touches Prisma unmocked will fail in CI with a connection error rather than a useful message.
  - CI runs `redis:7-alpine` while compose runs `redis/redis-stack:latest`. Harmless while `cache.ts` uses only `SCAN` and `DEL`, which is the case today. Any RediSearch or RedisJSON use would pass locally and fail in CI.
  - `npm run fmt:check` is not a gate, so formatting drifts. Adding it would fail immediately on the CRLF line endings, so it needs `.gitattributes` or a Prettier `endOfLine` setting first.
  - Action versions are floating major tags rather than commit SHAs.
  - Docker Hub login uses `DOCKER_PASSWORD` rather than a scoped access token.
- `hooks/useNotificationPermissions.ts` in MOBILE reads `registerToken` from a context that does not declare it, so `tsc` fails there. Predates the merge.
- **Extend the backend test coverage.** Asked for by the user on 11-08-2026. Vitest now runs and the suite is green, and the notification service and controller were covered on 13-08-2026. Still uncovered: the storage layer, the cache invalidation paths, the upload and admin controllers, and the Clerk webhook. See the `coverage.exclude` list in `vitest.config.ts` for what is currently exempt.
- **Reduce the Prisma weight in the production image.** The image is 692MB after the 13-08-2026 slimming, and roughly 105MB of what remains is the `prisma` CLI plus `effect` and `typescript` pulled in behind it. They ship only because the container runs `prisma migrate deploy` on start, which forces the CLI to be a runtime dependency. Moving migrations to a separate one-off job would recover it, but that changes how the service deploys and is the owner's call.
- **Test the backend once it is deployed.** Asked for by the user on 11-08-2026. Everything so far has been verified against localhost. After the next deploy, exercise the same routes against the deployed URL: readiness against the real Mongo, Postgres and Redis, an upload round trip against the real Supabase buckets, and push registration. The renamed and new environment variables have to be set in the deployed environment first or the service will not boot.

- Add things the user wants Claude to remember here as the project progresses.
