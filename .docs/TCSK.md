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
- Authentication is centralized through **Clerk** and reaches the clients through the backend.
- Terraform and Kubernetes were removed with the strip, so the deployed topology is being redecided as part of v2. Validate changes locally before pushing to production branches.

### CREDENTIALS

- Live credentials belong only in the gitignored `BACKEND/.env`. Never commit them, and never print a value into a transcript or a log. Print key names and lengths instead.
- If a secret is exposed by accident, say so plainly and tell the owner to rotate it.

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

- **The Vitest suite cannot run here.** Windows Defender quarantines `node_modules/@esbuild/win32-x64/esbuild.exe` as a false positive, and Vitest cannot load its config without it. Verify logic by running the same assertions under `ts-node`, which does not use esbuild, and say plainly that the suite was not run.
- **`make` is not installed.** Use the `docker-compose` commands directly.
- **Do not use the PowerShell `Get-Content -Raw` plus `Set-Content` pattern on files containing non-ASCII characters.** PowerShell 5.1 reads them as ANSI and writes UTF-8, which corrupts box drawing characters in the readme directory trees. Use the Edit tool, or `[System.IO.File]::ReadAllText` with an explicit UTF8 encoding.

### OPEN WORK

- Repoint the ingress so devices running the released MOBILE 1.1.4 keep registering. They still call `POST /noti/api/register`, which no longer exists.
- Update everything under `.github`. The website workflow builds a deleted directory and will fail on a `website-v*` tag.
- `hooks/useNotificationPermissions.ts` in MOBILE reads `registerToken` from a context that does not declare it, so `tsc` fails there. Predates the merge.
- **Build out the backend test setup.** Asked for by the user on 11-08-2026. Vitest is configured but has never been run on this machine because Defender quarantines `esbuild.exe`, so there is no evidence any test passes. Decide whether to unblock Vitest or move to a runner that does not depend on esbuild, then write real coverage for the merged notification surface, the storage layer, and the cache invalidation paths.
- **Test the backend once it is deployed.** Asked for by the user on 11-08-2026. Everything so far has been verified against localhost. After the next deploy, exercise the same routes against the deployed URL: readiness against the real Mongo, Postgres and Redis, an upload round trip against the real Supabase buckets, and push registration. The renamed and new environment variables have to be set in the deployed environment first or the service will not boot.

- Add things the user wants Claude to remember here as the project progresses.
