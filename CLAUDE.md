# CLAUDE.md

Orientation for a new contributor or agent. Read this first, then
[`.docs/RULES.md`](.docs/RULES.md) before writing anything, and
[`.docs/TCSK.md`](.docs/TCSK.md) for accumulated project knowledge.

## WHAT THIS IS

Studzee is an educational content platform. The repository holds three modules.

| Directory | What it is | State |
| --------- | ---------- | ----- |
| `BACKEND` | `studzee-api`. Express 4 on Node 22, TypeScript. Owns content, caching, Clerk auth, Expo push, transactional email, the Clerk webhook, and the audit logs. | Active. All current work is here. |
| `MOBILE` | Expo client | Rewrite deferred until the backend settles |
| `DESKTOP` | Electron admin console | Rewrite deferred until the backend settles |

The backend was formed on 10-08-2026 by merging a separate `NOTIFICATION`
service into it. That folder no longer exists. Routes that used to sit behind
`/noti/api` now live under `/notifications`, `/admin` and `/webhooks`.

**Convex is permanently out of scope.** Do not propose or reference it.

## PREREQUISITES

### Required

| Tool | Version | Notes |
| ---- | ------- | ----- |
| Docker Desktop | any current release | Must be running before any `docker compose` command |
| Docker Compose | v2 | Ships with Docker Desktop. Commands are `docker compose`, not `docker-compose`. The `api` profile needs v2. |
| Node.js | 22 | The Dockerfile builds on `node:22-alpine`. Newer works locally but is not what CI or production run. |
| npm | 10, bundled with Node 22 | `package-lock.json` is the lockfile. CI runs `npm ci`. |

### Optional

- **Bun**, as a script runner only. `bun run dev` executes the same
  `package.json` script and the script still runs on Node underneath. The Bun
  **runtime** was dropped on 10-08-2026 by the owner's decision. Do not add
  `bun` to the lockfile, the Dockerfile, or CI.
- **`make`**, a convenience wrapper over everything below. Installed here on
  14-08-2026 with `winget install ezwinports.make`, and every target was
  repaired the same day. `make` with no target lists them. The one worth
  remembering is **`make check`**, which runs the three gates CI blocks the
  image build on.

No external account is needed for local development. The compose stack stands
in for MongoDB Atlas, Postgres, Supabase Storage and the SMTP provider, and
`DEV_TOKEN` stands in for a Clerk session.

## RUNNING IT

Everything below runs from `BACKEND`, never from the repository root. The root
has no `package.json`.

### First time on a machine

```bash
cd BACKEND
npm install
cp .env.example .env        # fill in Clerk keys and storage credentials
docker compose up -d        # databases and buckets are created for you
npm run prisma:generate     # generate the Prisma client into node_modules
npm run prisma:migrate      # create the Postgres tables
npm run seed                # load sample documents
npm run dev                 # http://localhost:4000
```

### Every time after that

```bash
docker compose up -d
npm run dev
```

### Confirm it is actually up

```bash
curl http://localhost:4000/health/readiness
# {"status":"ready","checks":{"db":"ok","postgres":"ok","redis":"ok"}}
```

This round trips all three stores rather than reading driver connection flags,
so it cannot report healthy while a dependency is down. Any `"error"` names the
store that is not answering.

### Two ways to run the API, pick one

Both bind port 4000, so they cannot run at the same time.

| Mode | Command | Use when |
| ---- | ------- | -------- |
| Host | `docker compose up -d` then `npm run dev` | Writing code. Hot reloads, debuggable. |
| Container | `docker compose --profile api up -d --build` | Checking the image that ships. No hot reload. |

The `api` service sits behind the `api` compose profile precisely so that a
plain `docker compose up -d` starts infrastructure only and leaves port 4000
free for the host process.

### Dashboards

| What | Where |
| ---- | ----- |
| API | http://localhost:4000 |
| Mail inbox, Mailpit | http://localhost:8025 |
| Mongo admin, Mongo Express | http://localhost:8081 |
| Object storage, MinIO console | http://localhost:9001 |
| Cache, RedisInsight | http://localhost:8001 |
| Postgres data | `npm run prisma:studio` |

### Authenticating locally

Set `NODE_ENV=development` and `DEV_TOKEN` in `.env`, then send
`Authorization: Bearer <DEV_TOKEN>`. This reaches authenticated and admin
routes without a Clerk session and is ignored in every other environment.

## TESTING

```bash
cd BACKEND
docker compose up -d    # the integration tests need real Mongo and Redis
npm test                # 235 tests across 26 files, all passing as of 14-08-2026
```

Before pushing, run the three gates CI runs. The image build will not start
unless all three pass:

```bash
make check                          # all three in one go

# or individually
npm run lint                        # 0 errors expected
npx tsc --noEmit -p tsconfig.json   # base config, so tests are typechecked too
npm test
```

`npm run lint` reports several thousand warnings on Windows. They are almost
all `Delete ␍` from CRLF line endings and they do not fail the build. Errors do.

The typecheck deliberately uses `tsconfig.json`, not `tsconfig.build.json`.
The build config excludes `src/tests` so test code stays out of `dist`, which
means the build never typechecks the tests. **Vitest transpiles without
typechecking**, so a test file can be green at runtime and still not compile.

## ENVIRONMENT FILES

Three of them. The distinction is **where the API process runs**, not what
storage it uses. Getting it wrong fails at boot with `P1001` from
`prisma migrate deploy`, before any application code runs.

| File | Addresses dependencies as | For |
| ---- | ------------------------- | --- |
| `.env` | `localhost` | The API running on the host. Gitignored, holds real local credentials. |
| `.env.docker` | `localhost` | Variable substitution for `docker compose`. Despite the name, **not** for running inside Docker. |
| `.env.container` | compose service names (`mongo`, `postgres`, ...) | The API running as a container. The only one that works there. |

`.env.container` sets `PORT=3000` while the others use 4000, because the image
declares `EXPOSE 3000` and probes 3000 in its healthcheck. It is published as
`4000:3000`. With `PORT=4000` inside the container it serves traffic correctly
and reports `unhealthy` forever.

## RELEASING

`release.sh` at the repository root bumps a module version, stages the
manifest, and prints the git commands that cut the release. It stops there on
purpose: pushing the tag is what triggers the build and publish pipeline, so
that stays a deliberate step the owner takes after review.

```bash
./release.sh backend patch     # or minor, major
# or from inside the module
npm run do-release             # do-release:minor, do-release:major
```

Releasable modules are `backend`, `mobile` and `desktop`. Add `website` to
`VALID_SERVICES` in the script when that module returns. `notification` is gone
for good, having been merged into the backend.

The tag format is `<service>-v<version>`, for example `backend-v3.0.1`, which is
what `.github/workflows/docker-backend.testing.yml` triggers on. That workflow
runs lint, typecheck and the test suite before it publishes anything, and a
version tag is the only thing that moves the `latest` image tag.

## HOUSE RULES

Full text in [`.docs/RULES.md`](.docs/RULES.md). The ones that bite most often:

- **No em dashes. No emoji.** Anywhere: code, comments, commits, docs.
- **ALL CAPS headings** in markdown.
- **TypeScript** for all new code. Comments explain intent, not the syntax.
- **Conventional Commits with a real body.** A bare subject line is not
  acceptable. Scope to the module, for example `feat(backend):`.
- **Never add `Co-Authored-By` or any model or vendor trailer.** No mention of
  Claude, Anthropic or any model in a commit message.
- **Commit every change.** Nothing is left in the working tree.
- **Never use `git stash`.** If a check needs a comparison against unmodified
  code, commit first and compare against the previous commit.
- **Never commit to `main`.** Branch, then open a pull request. **The owner
  merges, never the agent.** The PR description lists every change on the branch.
- **Ask before destructive Git actions**: `reset --hard`, `push --force`,
  history rewrites.
- **Never print a secret value** into a terminal, log or transcript. Print key
  names and value lengths instead, and edit env files programmatically. If a
  secret is exposed anyway, say so immediately and tell the owner to rotate it.
- **Never send email, push notifications or any outreach automatically.**
  Drafts only, owner approval required.
- Keep [`.docs/RECORDS.md`](.docs/RECORDS.md),
  [`.docs/FIXES.md`](.docs/FIXES.md) and [`WORKLOG.md`](WORKLOG.md) current,
  and commit them with the change they describe.

## GOTCHAS THAT HAVE COST TIME

- **Run Vitest from `BACKEND`.** From the repository root `npx vitest` installs
  an unrelated Vitest from the registry, resolves no `@/*` aliases and never
  loads the setup file. Every suite fails with `Cannot find package '@/...'`,
  which looks like a code fault and is not one.
- **Mongoose connects lazily.** A wrong URI or missing credentials does not
  fail the connection. It fails the first query, so it surfaces as a 500 on a
  route rather than an error at boot.
- **Clerk decodes the publishable key** to find its API host. A malformed key
  throws at parse time and reaches the error handler as a 500, making an
  unauthenticated request look like a server fault instead of a 401.
- **`prisma generate` writes into `node_modules`** and is not committed, so
  `@prisma/client` does not resolve on a fresh checkout until you run it.
- **Do not pipe `Get-Content -Raw` into `Set-Content`** on any file with
  non-ASCII characters. PowerShell 5.1 reads ANSI and writes UTF-8, which
  corrupts the box drawing characters in the README directory trees. It has
  happened twice. Use the Edit tool, or `[System.IO.File]::ReadAllText` and
  `WriteAllText` with explicit UTF8.

## WHERE THINGS ARE DOCUMENTED

| File | Holds |
| ---- | ----- |
| [`BACKEND/README.md`](BACKEND/README.md) | Full backend reference: setup, configuration, compose guide, deployment |
| [`BACKEND/API.md`](BACKEND/API.md) | Every endpoint, written against what the handlers actually return |
| [`BACKEND/src/tests/TESTING.md`](BACKEND/src/tests/TESTING.md) | How to write tests |
| [`.docs/RULES.md`](.docs/RULES.md) | Agent rules, the authority on process |
| [`.docs/TCSK.md`](.docs/TCSK.md) | Things Claude Should Know. Durable project knowledge and open work. |
| [`.docs/RECORDS.md`](.docs/RECORDS.md) | Feature implementation table |
| [`.docs/FIXES.md`](.docs/FIXES.md) | Problem and fix log, so the same bug is not solved twice |
| [`WORKLOG.md`](WORKLOG.md) | Dated running record of work |
