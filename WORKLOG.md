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
- **Run the BACKEND test suite.** It could not be run on this machine, see the
  10-08-2026 entry below.
- **Update everything under `.github` for the v2 tree.** The strip on 10-08-2026
  left it describing modules that no longer exist. Known stale points:
  - `README.md` documents the full old architecture, including the website,
    the agentic AI folder, the Terraform and Kubernetes topology, and the
    two deployment panels. It needs rewriting once the v2 design is settled.
  - `workflows/docker-website.testing.yml` builds `./WEBSITE`, which is gone.
    The workflow will fail on its `website-v*` tag trigger.
  - `workflows/docker-backend.testing.yml` and
    `workflows/docker-notification.testing.yml` still reflect the v1 services.
  - `SECURITY.md` lists WEBSITE in the supported versions table.
  - `CONTRIBUTING.md` lists `website` as a valid commit scope.
  - `CODEOWNERS`, `CODE_OF_CONDUCT.md` and `assets` need a check for the same.
  - `code.sh` at the repository root validates `website` as a service name and
    should be narrowed to the four remaining modules.

## Conventions

- Language: TypeScript for all new code.
- Commits: Conventional Commits, with a detailed body explaining what changed and why.
- Branching: all work happens on a feature branch, never directly on `main`.
- Delivery: every branch ends in a pull request. The repository owner merges.
- Style: no em dashes, no emoji, in code, comments, commits, and documentation.
- Comments: specific and professional, explaining intent rather than restating the code.

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

