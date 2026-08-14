# Worklog

Running record of work done on this repository. Newest entry first.
One entry per unit of work, with the branch, what changed, and why.

## PENDING

Open items carried forward. Move each into a dated entry once it is done.

- **Repoint the ingress so already installed apps keep working.** MOBILE source
  now calls `/notifications/register`, but every device running the released
  1.1.4 build still calls `POST /noti/api/register`, which no longer exists.
  Those installs keep failing to register until either the ingress rewrites
  `/noti/api/register` to `/notifications/register`, or every user updates.
  DESKTOP makes no notification calls, so it needs no change.
- **Fix `registerToken` missing from the mobile notification context.**
  `hooks/useNotificationPermissions.ts` reads `registerToken` from the context,
  but `contexts/NotificationContext.tsx` declares its own local interface
  without it, so `tsc --noEmit` fails in MOBILE. This predates the merge and is
  the only type error in the module.
- **Data storage layer, database design.** The storage half is done, object
  storage moved to Supabase on 11-08-2026. The database half is not yet
  specified.
- **Set the renamed and new environment variables in the deployed
  environment.** The config schema throws at boot on anything missing, so a
  deploy fails fast rather than misbehaving. New since the merge:
  `DATABASE_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`.
  Renamed on 11-08-2026: `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY` and `AWS_S3_BUCKET_NAME` became `S3_REGION`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_IMAGES` and
  `S3_BUCKET_PDFS`, and `S3_ENDPOINT` and `S3_PUBLIC_URL` are new and required.
- **Extend the BACKEND test coverage.** The suite runs and is green, but
  coverage measured on 14-08-2026 is **49 percent of statements**, and that is
  after `vitest.config.ts` already excludes a long list of files. At 0 percent:
  `middleware/errorHandler.ts`, `middleware/validation.ts`,
  `middleware/rateLimit.ts`, `services/upload.service.ts`, and the webhook,
  user, email and PDF controllers. `middleware/auth.ts` is at 24 percent and
  `services/user.service.ts` at 18. Highest value first: the error handler and
  the validation middleware sit in front of every route, and `auth.ts` decides
  who reaches the admin surface.
- **Update everything under `.github` for the v2 tree.** The strip on 10-08-2026
  left it describing modules that no longer exist. Known stale points:
  - `README.md` documents the full old architecture, including the website,
    the agentic AI folder, the Terraform and Kubernetes topology, and the
    two deployment panels. It needs rewriting once the v2 design is settled.
  - `workflows/docker-website.testing.yml` builds `./WEBSITE`, which is gone.
    The workflow will fail on its `website-v*` tag trigger.
  - `workflows/docker-backend.testing.yml` was rewritten on 13-08-2026 to gate
    the image on lint, typecheck and the test suite, and hardened on
    14-08-2026 around tagging, permissions, concurrency and timeouts. It is
    the only workflow in a good state.
    `workflows/docker-notification.testing.yml` builds a folder that no longer
    exists and should be deleted.
  - `SECURITY.md` lists WEBSITE in the supported versions table.
  - `CONTRIBUTING.md` lists `website` as a valid commit scope.
  - `CODEOWNERS`, `CODE_OF_CONDUCT.md` and `assets` need a check for the same.
  - Done 14-08-2026. `code.sh` is now `release.sh` and accepts `backend`,
    `mobile` and `desktop`, with `website` noted for when that module returns.

## Conventions

- Language: TypeScript for all new code.
- Commits: Conventional Commits, with a detailed body explaining what changed and why.
- Branching: all work happens on a feature branch, never directly on `main`.
- Delivery: every branch ends in a pull request. The repository owner merges.
- Style: no em dashes, no emoji, in code, comments, commits, and documentation.
- Comments: specific and professional, explaining intent rather than restating the code.

## 2026-08-14

**Branch:** `feat/v2-architecture`

- Reviewed the backend test setup end to end against a running stack. The suite
  is genuinely healthy: 90 tests across 11 files passing, `tsc --noEmit` clean
  against the base config, ESLint 0 errors. The 3769 warnings are almost all
  `Delete ␍` from CRLF line endings and vanish on a Linux checkout.
- Measured coverage rather than assuming it. **49 percent of statements**, and
  that is after `vitest.config.ts` already excludes a long list of files. Fully
  uncovered: the error handler, the request validation middleware, the rate
  limiter, the upload service, and the webhook, user, email and PDF controllers.
  `auth.ts` is at 24 percent and `user.service.ts` at 18. The green suite says
  the covered half works, not that the service does.
- Added an `api` service to `BACKEND/docker-compose.yml`, replacing the
  `docker run` line that only existed in a chat transcript. It sits behind the
  `api` compose profile, so `docker compose up -d` still starts infrastructure
  only and leaves port 4000 to the host `npm run dev`. Both modes bind 4000, so
  the profile makes them mutually exclusive on purpose instead of letting the
  container silently win.
  - Verified: config parses, the default service list is still seven, the
    profile adds the eighth, the container reports healthy, and all six public
    routes return 200 with readiness reporting db, postgres and redis ok.
  - Also confirmed `bun run dev` works on the host. Bun acts only as a script
    runner there; `ts-node-dev` still executes on Node, so this does not
    reintroduce the Bun runtime that was dropped on 10-08-2026.
- Hardened the backend workflow. The `workflow_dispatch` trigger added on
  13-08-2026 had a real defect: the build job tagged every image `latest`
  unconditionally, so a manual run from any branch would overwrite what a deploy
  target pulls. A tag now publishes `latest` plus the version, and a dispatch
  publishes the commit SHA only. Also added `permissions: contents: read`, a
  queued concurrency group so two tags cannot race and publish out of order, and
  timeouts so a wedged run does not hold a runner for the six hour default.
- Rewrote the readme prerequisites, quickstart, testing and compose sections.
  The testing section still claimed the suite had never been run here because
  Defender quarantined the esbuild binary, which stopped being true on
  13-08-2026. It also told the reader to seed through
  `docker-compose exec api npm run seed`, which cannot work: the seed scripts go
  through `ts-node` and the image installs with `--omit=dev`.
- Added a root `CLAUDE.md` covering prerequisites with versions and reasons, the
  startup flow, the three env files and which process each is for, the testing
  gates, releasing, the house rules, and the gotchas that have cost time, so a
  contributor or agent does not have to read 1600 lines of readme first.
- Renamed `code.sh` to `release.sh` and rewrote it. The service list was still
  `notification|backend|mobile|website`: two of those modules no longer exist
  and `desktop`, which does, was not accepted, so the desktop module could not
  be released at all. The list is now a `VALID_SERVICES` string matched by word
  rather than a regex, so adding a module is a one word edit.
  - The version was read with `grep -oP '"version": "\K[^"]+'`, which takes the
    first match in the file and can pick up a dependency entry. It now reads
    through `node -p`.
  - Added a tag collision check before staging, `set -euo pipefail`, an
    absolute `SCRIPT_DIR` so it behaves the same from the root or from a module
    npm script, and a preflight showing the module, current version and bump
    type before the confirmation prompt. Removed a large commented out block of
    dead alternative implementation.
  - It still does not commit, tag or push. That is deliberate: pushing the tag
    triggers the build and publish pipeline.
  - `do-release` scripts repointed in BACKEND and MOBILE, and added to DESKTOP,
    which never had them.
- Installed GNU Make 4.4.1 with `winget install ezwinports.make`, at the owner's
  instruction, and repaired every target in `BACKEND/Makefile`.
  - `seed` and `refresh-cache` ran `docker-compose exec api ...` against a
    container that did not exist, and could not have worked even with one: both
    scripts go through `ts-node`, a devDependency the production image omits.
    They run on the host now.
  - `logs` had the same problem. It is now `api-logs` and passes the profile.
  - Every other target called the retired `docker-compose` v1 binary, which is
    not installed here. All of them use the `docker compose` plugin now.
  - Added `ps`, `coverage`, `typecheck`, the `api-up`, `api-rebuild`,
    `api-logs` and `api-down` profile targets, and `check`, which runs lint,
    typecheck and the suite in one command. Verified: `make check` exits 0 with
    90 tests passing.

## 2026-08-13

**Branch:** `feat/v2-architecture`

- Slimmed the production Docker image from 830MB to 692MB and made the shipping
  layer honour the lockfile. A `production-deps` stage runs `npm ci --omit=dev`
  and production copies `node_modules` from there, with the generated Prisma
  client layered on top from the build stage. The dead `dependencies` stage is
  gone. `prisma` moved to a runtime dependency, because the container runs
  `prisma migrate deploy` on start and would otherwise fail to boot.
  - Roughly 105MB of what remains is the `prisma` CLI and what it pulls in,
    present only because migrations run at container start. Moving them to a
    separate job would recover it and is left as the owner's decision.
- Fixed two defects the fat image had been hiding. The logger requested the
  `pino-pretty` transport whenever `NODE_ENV` is `development`, but that is a
  devDependency, so the slimmed container died at import time before
  registering a route. It now falls back to the JSON logger. Separately, the
  build compiled `src/tests` into `dist`, shipping test code in the image;
  `tsconfig.build.json` now excludes it.
- Covered the notification service and controller, 32 tests. The service tests
  pin the sort allowlist, which guards a query string value interpolated into a
  Prisma `orderBy`, and the paging arithmetic. The controller tests pin the
  broadcast targeting, the 404 on an empty device set, the 207 partial
  delivery, token pruning, and that `sentBy` comes from the token rather than
  the request body. Mutation checked: breaking the skip calculation and the
  allowlist fails 7 of them.
- Took the suite from 84 passing with 7 failing to 90 passing with none.
  Neither failure was in application code. `globalSetup` defaulted `MONGO_URI`
  without credentials while the compose Mongo requires them, and Mongoose
  connects lazily, so the failure appeared as a 500 on the first query rather
  than a connection error. The placeholder `CLERK_PUBLISHABLE_KEY` was not
  structurally valid, so Clerk threw while decoding it and an unauthenticated
  request returned 500 instead of 401. A third test asserted that the content
  controller calls `req.auth()`, which it does not and should not, since the
  route middleware already enforces it; that test was removed rather than
  satisfied.
- Rewrote `.github/workflows/docker-backend.testing.yml` into a `test` job and
  a `build` job with `needs: test`, so a `backend-v*` tag can no longer publish
  an image that fails its own tests. The test job runs ESLint, `tsc --noEmit`
  against the base tsconfig so the tests are typechecked too, and Vitest
  against Mongo and Redis service containers. Added `workflow_dispatch` and
  GitHub Actions layer caching.
- Typechecking the tests immediately caught three faults in the new test files
  that Vitest had been transpiling past. Vitest does not typecheck, so a green
  test file can still be wrong.
- Verified by running the image against the compose stack with
  `.env.container`: healthy, migrations applied, JSON logs, and `/`,
  `/healthcheck`, `/health/liveness`, `/health/readiness`, `/content`, `/pdfs`,
  `/content/:id`, `/admin/users` and `/admin/notifications` all returning 200.

## 2026-08-11

**Branch:** `feat/v2-architecture`

- Moved object storage from AWS S3 to Supabase Storage, which speaks the S3
  protocol, so the AWS SDK client stays and only its configuration changes.
  Reading the Supabase authentication documentation showed the existing client
  could not have worked against it at all: `forcePathStyle` and the custom
  endpoint were applied only in development, and the public URL was hardcoded
  to the AWS virtual-hosted form. Supabase serves its S3 API and its public
  objects from two different hosts, so the public URL is now configured rather
  than derived.
- Renamed the `AWS_*` variables to `S3_*`, because the provider is no longer
  AWS and the old names would mislead every future reader.
- Listing the buckets with the real credentials showed the project uses three
  separate buckets, `images`, `pdfs` and `assets`, not one bucket with key
  prefixes. Uploads now select a bucket rather than prepend a prefix, which
  would otherwise have failed with `NoSuchBucket` on the first upload.
- Added a `minio-init` container so local MinIO creates the same three buckets
  and marks them publicly readable, since MinIO creates none on its own.
- Verified both storage backends end to end rather than assuming: for each
  bucket, upload, fetch the generated public URL expecting 200, round trip the
  object reference, then delete. Passed against the real Supabase project and
  against local MinIO. All check objects were deleted.

## 2026-08-10

**Branch:** `feat/v2-architecture`

- Reformatted all four env files into one documented section layout, grouped by
  concern with every key tagged required, optional or docker only.
- Added Mailpit to the compose stack, so local development and tests have a
  working mail path with no provider account and cannot reach a real inbox.
- Fixed the readiness endpoint. It reported healthy during a Postgres outage,
  because Postgres arrived with the merge and was never added to the check.
  While fixing that, the existing probes turned out to read driver connection
  flags rather than issuing requests, which is the same false healthy signal in
  another form. All three stores are now round tripped in parallel behind a
  two second timeout each.
- Rewrote `BACKEND/API.md` against what the handlers actually return, which
  surfaced six places where it had drifted from the code independently of the
  merge, including documented response shapes that never existed and a claim
  about a cache header that is not set anywhere.
- Rebuilt the Postman collection for the merged surface, and added Prisma
  targets to the Makefile.

- Created the `feat/v2-architecture` working branch off `main`.
- Added this worklog to track all subsequent v2 architecture work.
- Added the `.docs` documentation set: `RULES.md` (agent rules), `RECORDS.md`
  (feature implementation table), `FIXES.md` (problem and fix log), and
  `TCSK.md` (things Claude should know about the project).
- Reviewed BACKEND, NOTIFICATION, MOBILE, and DESKTOP ahead of the v2 rewrite
  and recorded the findings in `.docs/V2-ARCHITECTURE-REVIEW.md`. Convex is out
  of scope by decision of the repository owner and is excluded from v2.
- Merged the NOTIFICATION service into BACKEND and deleted the folder. BACKEND
  now owns content and notifications, on Node 22 with the existing `tsc` build.
  Bun is gone. Postgres joins MongoDB, Redis and S3 as a backing store, wired
  through Prisma and added to `BACKEND/docker-compose.yml`.
  - Notification routes were renamespaced to fit the backend conventions:
    `/notifications/register`, `/admin/notifications`, `/admin/emails`,
    `/admin/users` and `/webhooks/clerk`.
  - Eleven defects from the architecture review were fixed during the move.
    They are listed in [`.docs/FIXES.md`](.docs/FIXES.md).
  - Verification: `tsc --noEmit` exits 0 and ESLint reports 0 errors. The Vitest
    suite could **not** be run on this machine, because Windows Defender
    quarantines `node_modules/@esbuild/win32-x64/esbuild.exe` as a false
    positive and Vitest cannot load its config without it. The new logic was
    instead verified by executing the same assertions under `ts-node`, which
    does not use esbuild, and all eight checks passed. Those assertions are now
    committed as Vitest tests under `src/tests/unit/services`. Run
    `npm test` on a machine without the Defender block to confirm.
- Stripped the repository to the v2 working set. Removed AGENTS, CONVEX, K8S,
  PACKAGES, SERVICES, TERRAFORM, WEBSITE, and `.vscode`, along with the stray
  root `package.json` and `package-lock.json`. Kept BACKEND, NOTIFICATION,
  MOBILE, DESKTOP, `.github`, `code.sh`, `.docs`, and this worklog.

