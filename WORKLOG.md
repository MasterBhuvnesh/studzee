# Worklog

Running record of work done on this repository. Newest entry first.
One entry per unit of work, with the branch, what changed, and why.

## PENDING

Open items carried forward. Move each into a dated entry once it is done.

- **Merge NOTIFICATION into BACKEND, keeping BACKEND only.** Agreed with the
  user on 10-08-2026. See the V2 PLAN section of [`.docs/TCSK.md`](.docs/TCSK.md).
  Scope of the move: Expo push delivery, transactional email and its templates,
  the Clerk webhook, user and Expo token registration, and the notification and
  email logs. Both databases stay, MongoDB for content and Postgres for the
  notification data. `NOTIFICATION/docker-compose.yml` is folded into
  `BACKEND/docker-compose.yml`, which must gain the Postgres service alongside
  the existing mongo, redis, minio and mongo-express services. Blocked on one
  decision: BACKEND runs Node 22 with a `tsc` build and NOTIFICATION runs Bun
  with no build step, so one runtime has to win.
- **Data storage layer.** Starts only after the merge is complete. Not yet
  specified.
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

## 2026-08-10

**Branch:** `feat/v2-architecture`

- Created the `feat/v2-architecture` working branch off `main`.
- Added this worklog to track all subsequent v2 architecture work.
- Added the `.docs` documentation set: `RULES.md` (agent rules), `RECORDS.md`
  (feature implementation table), `FIXES.md` (problem and fix log), and
  `TCSK.md` (things Claude should know about the project).
- Reviewed BACKEND, NOTIFICATION, MOBILE, and DESKTOP ahead of the v2 rewrite
  and recorded the findings in `.docs/V2-ARCHITECTURE-REVIEW.md`. Convex is out
  of scope by decision of the repository owner and is excluded from v2.
- Stripped the repository to the v2 working set. Removed AGENTS, CONVEX, K8S,
  PACKAGES, SERVICES, TERRAFORM, WEBSITE, and `.vscode`, along with the stray
  root `package.json` and `package-lock.json`. Kept BACKEND, NOTIFICATION,
  MOBILE, DESKTOP, `.github`, `code.sh`, `.docs`, and this worklog.

