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

- `BACKEND` is the core API (`studzee-api`). It owns business logic, content lifecycle, caching, and Clerk authentication.
- `NOTIFICATION` is a Bun service (`studzee-notification-api`) for Expo push and transactional email, using Prisma over Postgres. It owns no business logic or content data.
- `MOBILE` is the Expo client.
- `DESKTOP` is the Electron admin console.
- `.github` holds the README, workflows, CODEOWNERS, and community docs.
- `.docs` holds the process documentation for people and agents.
- `code.sh` drives the per module version bump and release flow.
- `WORKLOG.md` is the running record of work.

Removed on 10-08-2026 and recoverable from git history before commit `9ba738d6`: `AGENTS`, `CONVEX`, `K8S`, `PACKAGES`, `SERVICES`, `TERRAFORM`, `WEBSITE`, `.vscode`, and the stray root `package.json`. Convex is out of scope permanently and must not appear in the v2 architecture or implementation.

Gitignored local files from the removed folders were copied to `D:\Projects\Studzee-archive-2026-08-10` outside the repository before deletion. That archive holds the Terraform state for the backend infrastructure and three local env files. It is not tracked and will not survive a machine change.

## DATA AND INFRASTRUCTURE

- Persistence uses MongoDB and PostgreSQL. Redis is used for caching. Object storage holds uploaded assets.
- Authentication is centralized through Clerk and reaches the clients through the backend.
- There are two deployment panels. Panel 1 is free or community grade (Render, MongoDB Atlas, Neon Postgres, managed Redis, Docker). Panel 2 is production grade on AWS with Terraform, load balancing, auto scaling, and Route 53.
- Production pushes trigger redeployment of the listed services. Validate changes locally before pushing to production branches.

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

1. **Merge NOTIFICATION into BACKEND and keep BACKEND only.** NOTIFICATION stops existing as a separate service. Everything it owns moves into BACKEND: Expo push delivery, transactional email, the Clerk webhook, user and Expo token registration, and the notification and email logs.
2. **Then work on the data storage layer.** A separate phase that starts only after the merge is complete.
2a. **Backend first, frontend second.** Confirmed on 10-08-2026. Finish the backend before touching MOBILE or DESKTOP. Client work follows once the API it consumes is settled, so the clients are written against a stable contract rather than a moving one.
3. **Keep both databases.** MongoDB stays for content, Postgres stays for the notification data. The user has explicitly confirmed this split is acceptable, so do not propose consolidating them onto one engine.
4. **Update the docker compose file as part of the merge.** `BACKEND/docker-compose.yml` runs mongo, redis, minio and mongo-express today. It must gain the Postgres service currently defined in `NOTIFICATION/docker-compose.yml`, which is removed along with the folder.

**Runtime decided on 10-08-2026: keep what BACKEND already has.** Node 22 with the `tsc` plus `tsc-alias` build, `ts-node-dev` in development, Vitest for tests, and the existing Node Dockerfile. Bun is dropped, along with `bun.lock` and the Bun based Dockerfile. Prisma runs on Node without change, so the Postgres layer moves across as is.

## NOTES

- The current working branch is `feat/v2-architecture`. The entire codebase is being rewritten.
- Convex is being removed from the project entirely. Do not consider it in any design or implementation.
- The state of the existing modules is documented in [`V2-ARCHITECTURE-REVIEW.md`](V2-ARCHITECTURE-REVIEW.md). Read it before proposing v2 work.
- The v1 CI pattern is preserved in [`WORKFLOW-SAMPLE.md`](WORKFLOW-SAMPLE.md) for reference when `.github/workflows` is rewritten.
- Add things the user wants Claude to remember here as the project progresses.
