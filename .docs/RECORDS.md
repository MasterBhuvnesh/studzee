# RECORDS

Implementation record for Studzee. Each row is a feature, so any person or agent can see what is done and what is not. Update this table whenever a feature changes state and commit it with the change.

Developer names are written in capitals (BHUVNESH, ABHAY, or the relevant person).

Status values: PLANNED, IN PROGRESS, DONE, BLOCKED, DROPPED.
Date is the date the status last changed.

## PROCESS AND REPOSITORY

| FEATURE | DEVELOPER | STATUS | DATE |
| ------- | --------- | ------ | ---- |
| Project documentation set under `.docs` (RULES, RECORDS, FIXES, TCSK) | BHUVNESH | DONE | 10-08-2026 |
| Root `WORKLOG.md` running record | BHUVNESH | DONE | 10-08-2026 |
| Architecture review of BACKEND, NOTIFICATION, MOBILE, DESKTOP | BHUVNESH | DONE | 10-08-2026 |
| Workflow sample kept before the `.github` rewrite | BHUVNESH | DONE | 10-08-2026 |
| Repository stripped to the v2 working set | BHUVNESH | DONE | 10-08-2026 |
| Ignore the local `.claude` directory | BHUVNESH | DONE | 10-08-2026 |
| Gate the backend image build on lint, typecheck and the test suite | BHUVNESH | DONE | 13-08-2026 |
| Rename `code.sh` to `release.sh` and correct its module list | BHUVNESH | DONE | 14-08-2026 |
| Install GNU Make and repair every target in `BACKEND/Makefile` | BHUVNESH | DONE | 14-08-2026 |
| Update the rest of `.github` for the v2 tree, website and notification workflows | BHUVNESH | DONE | 14-08-2026 |

## BACKEND

| FEATURE | DEVELOPER | STATUS | DATE |
| ------- | --------- | ------ | ---- |
| Merge NOTIFICATION into BACKEND, keeping BACKEND only | BHUVNESH | DONE | 10-08-2026 |
| Renamespace the notification routes to backend conventions | BHUVNESH | DONE | 10-08-2026 |
| Move the Postgres schema and migrations into BACKEND under Prisma | BHUVNESH | DONE | 10-08-2026 |
| Add Postgres to `BACKEND/docker-compose.yml` for the merged service | BHUVNESH | DONE | 10-08-2026 |
| Fix the eleven defects found in the architecture review | BHUVNESH | DONE | 10-08-2026 |
| Probe Postgres in readiness and round trip every store | BHUVNESH | DONE | 10-08-2026 |
| Add Mailpit for local email, replacing a real SMTP provider | BHUVNESH | DONE | 10-08-2026 |
| Move object storage from AWS S3 to Supabase over the S3 protocol | BHUVNESH | DONE | 11-08-2026 |
| Split uploads across the `images` and `pdfs` buckets | BHUVNESH | DONE | 11-08-2026 |
| Create the MinIO buckets automatically so local matches Supabase | BHUVNESH | DONE | 11-08-2026 |
| Build the Docker image and run the API in a container | BHUVNESH | DONE | 12-08-2026 |
| Add `.env.container` so the API can address the stack from inside Docker | BHUVNESH | DONE | 12-08-2026 |
| Slim the production image and enforce the lockfile in it | BHUVNESH | DONE | 13-08-2026 |
| Exclude test code from the compiled production build | BHUVNESH | DONE | 13-08-2026 |
| Fall back to the JSON logger when `pino-pretty` is absent | BHUVNESH | DONE | 13-08-2026 |
| Run the Vitest suite, previously blocked by Defender quarantining esbuild | BHUVNESH | DONE | 13-08-2026 |
| Cover the notification service and controller with unit tests | BHUVNESH | DONE | 13-08-2026 |
| Green the suite, 90 passing across 11 files | BHUVNESH | DONE | 13-08-2026 |
| Run the API as a compose service behind the `api` profile | BHUVNESH | DONE | 14-08-2026 |
| Cover the auth, error, validation and rate limit middleware | BHUVNESH | DONE | 14-08-2026 |
| Cover the upload and user services and the Clerk webhook controller | BHUVNESH | DONE | 14-08-2026 |
| Verify the Clerk auth path end to end with a real session token | BHUVNESH | DONE | 14-08-2026 |
| Cover the email, PDF and user controllers, the schemas and the route wiring | BHUVNESH | DONE | 14-08-2026 |
| Consolidate onto `@clerk/backend`, dropping the end of life `clerk-sdk-node` | BHUVNESH | PLANNED | 14-08-2026 |
| Cache or tokenise the admin role instead of calling Clerk per request | BHUVNESH | PLANNED | 14-08-2026 |
| Move Prisma migrations out of the container start command | BHUVNESH | PLANNED | 13-08-2026 |
| Data storage layer, database design | BHUVNESH | PLANNED | 10-08-2026 |

## DOCUMENTATION

| FEATURE | DEVELOPER | STATUS | DATE |
| ------- | --------- | ------ | ---- |
| Rewrite `BACKEND/README.md` for the merged service | BHUVNESH | DONE | 10-08-2026 |
| Rewrite `BACKEND/API.md` against what the handlers return | BHUVNESH | DONE | 10-08-2026 |
| Rebuild `BACKEND/postman.collection.json` for the merged surface | BHUVNESH | DONE | 10-08-2026 |
| Add Prisma targets to the `Makefile` | BHUVNESH | DONE | 10-08-2026 |
| Give the env files a documented section layout | BHUVNESH | DONE | 10-08-2026 |
| Correct the readme claims that no longer match the stack | BHUVNESH | DONE | 12-08-2026 |
| Document the root route and the environment dependent file URLs | BHUVNESH | DONE | 12-08-2026 |
| Rewrite the readme prerequisites, quickstart and testing sections | BHUVNESH | DONE | 14-08-2026 |
| Add a root `CLAUDE.md` orientation file for contributors and agents | BHUVNESH | DONE | 14-08-2026 |

## CLIENTS

| FEATURE | DEVELOPER | STATUS | DATE |
| ------- | --------- | ------ | ---- |
| Point MOBILE at `/notifications/register` on the merged backend | BHUVNESH | DONE | 10-08-2026 |
| Fix `registerToken` missing from the mobile notification context | BHUVNESH | PLANNED | 10-08-2026 |
| MOBILE rewrite, after the backend is settled | BHUVNESH | PLANNED | 10-08-2026 |
| DESKTOP rewrite, after the backend is settled | BHUVNESH | PLANNED | 10-08-2026 |

## DEPLOYMENT

| FEATURE | DEVELOPER | STATUS | DATE |
| ------- | --------- | ------ | ---- |
| Point the ingress `/noti` prefix at the merged backend | BHUVNESH | PLANNED | 10-08-2026 |
| Set the renamed and new environment variables in the deployed environment | BHUVNESH | PLANNED | 11-08-2026 |
| V2 architecture, overall | BHUVNESH | IN PROGRESS | 10-08-2026 |
