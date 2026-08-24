# Worklog

Running record of work done on this repository. Newest entry first.
One entry per unit of work, with the branch, what changed, and why.

## 25-08-2026

- **Branch:** current working branch
- **Changed:** Added `ignoreDeprecations: "6.0"` to the backend TypeScript configuration and upgraded the backend TypeScript dev dependency to 6.0.3.
- **Why:** The editor reported that `baseUrl` will stop functioning in TypeScript 7. The project typecheck now accepts the suppression value and passes.

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
  environment.** The full checklist is now [`.docs/DEPLOYMENT.md`](.docs/DEPLOYMENT.md),
  generated from the config schema on 14-08-2026: 16 required variables, the
  defaults that must be overridden anyway, and the two steps that are not
  variables at all. Setting them in the deploy platform is the remaining work
  and needs access this repository does not have.
- **Extend the BACKEND test coverage.** Done on 14-08-2026, 49 to 91 percent of
  statements, with no file left at 0. The 43 statements still uncovered are
  transport, retry and timeout branches in `email.service.ts`,
  `content.service.ts`, `expo.service.ts` and `health.route.ts`, which need a
  fake SMTP or Expo endpoint to reach. Treat as finished unless a bug points at
  one of them.
- **Stop calling Clerk on every admin request.** `requireAdmin` does an uncached
  `users.getUser` round trip per request, which is latency on every admin action
  and exposure to Clerk rate limits. A JWT Template carrying the role on the
  session token would remove it. Deferred by the owner on 14-08-2026.
- **Provision an admin in the deployed Clerk instance.** The role comes from
  `publicMetadata.role`, set by hand in the dashboard. No code path grants it,
  so without this step the deployed admin surface is unreachable by anyone.
- **Revisit `.github/README.md` once the v2 architecture is settled.** It was
  corrected on 14-08-2026 rather than rewritten: the factually wrong present
  tense claims are fixed and the aspirational sections are marked as roadmap,
  but the architecture description still reflects the pre-merge design. A
  rewrite now would mean inventing decisions that have not been taken, so it
  waits on the data storage layer being specified.

## Conventions

- Language: TypeScript for all new code.
- Commits: Conventional Commits, with a detailed body explaining what changed and why.
- Branching: all work happens on a feature branch, never directly on `main`.
- Delivery: every branch ends in a pull request. The repository owner merges.
- Style: no em dashes, no emoji, in code, comments, commits, and documentation.
- Comments: specific and professional, explaining intent rather than restating the code.

## 2026-08-25

**Branch:** `fix/mobile-notification-token-registration`, stacked on the open mobile PR

### Phase 1 of the content and gamification plan, topics and user tracker

The owner ordered workstreams 1 and 2 built now, which partially reopened the
storage design hold for the tracker schema specifically. Phase 0 decisions
taken by the owner: progress lives in Postgres, topics are a fixed registry,
content stays Mongo JSON blocks, markdown stays deferred, DESKTOP deferred
with a noted backlog in TCSK.

Three agents worked in parallel, one per track: topic tagging backend,
tracker backend, mobile client. Integration findings below are mine.

**Topics (backend).** New `src/models/topics.ts` registry of six keys,
validated by zod at every entry point so documents cannot carry arbitrary
topic strings. `GET /content/topics` serves the registry; `GET /content`
accepts `?topic=` with its own cache key suffix. Four sample documents seeded
across system design, DevOps and deep learning, one carrying `unlockPoints:
50`. `sample-topics.seed.ts` is additive by title and never deletes, because
the full seed script truncates and `.env` currently points MONGO_URI at the
Atlas database holding real content. Ran it once: 4 inserted, existing docs
untouched.

**Tracker (backend).** Postgres owns it per the owner's call: `QuizAttempt`,
`DailyActivity`, `AwardedBadge`, `UserProgress` under Prisma, migration
applied to the Neon dev database. Grading is server side against the stored
quiz (`ans` is answer text, compared via the chosen option's text). Points
pay ten per correct answer as a delta over prior best for that content, so
replays farm nothing. Streaks derive from distinct UTC activity days. Badges
and levels are pure config predicates in `src/models/gamification.ts`.
`POST /progress/attempts` and `GET /progress/me` sit behind Clerk auth.
Documents with `unlockPoints` now gate on `GET /content/:id` with a 403
whose body carries a machine readable `code`; that required teaching
`errorHandler` to serialize `AppError.code`.

**Live verification caught what mocked tests could not.** The tracker
transaction failed against real Neon with `Transaction API error: Transaction
not found`: seven sequential queries inside an interactive transaction spent
its default five second budget on pooler latency alone. Restructured to reads
first and four writes inside, with an explicit timeout. Recorded in FIXES.
Also proved the gate end to end: locked at 0 points, still locked at 40,
opens at 90. The full check list runs from
`src/cli/tools/verify-phase1.ts` against the live stores, 11 of 11 passing.

**Mobile.** Profile swaps the static planning list for a gamification card
(level, points, progress to next level, streak, badge chips), pull to refresh
now really refetches, quiz completion submits responses and surfaces earned
points and new badges without blocking navigation, and the API base URL
finally reads `EXPO_PUBLIC_BACKEND_API_URL` with the Render URL as fallback.

**Verification state.** Backend: fmt, lint, tsc clean; 285 unit and mocked
tests pass; the integration tier could not run because local Docker refuses
to start containers on this machine today, the supertest based live pass
against Atlas, Neon and Upstash stands in for it. Mobile: tsc clean, prettier
clean on touched files. One pre-existing controller test block was rewritten
because query validation moved to route middleware where the guarantee is
already pinned.

### Flip the content detail screen back to real content

- `SAMPLE_MODE` in `MOBILE/app/screens/[id].tsx` went back to `false`, so the
  screen fetches the real document by ID and renders the typed JSON blocks
  again instead of the hardcoded Gradient Descent markdown sample. The sample
  block stays in place uncommitted-to-git until now: deleting it outright
  would have destroyed the only copy of the markdown preview that workstream
  3 still needs, so the flag flip keeps it available while making it dead code.

### Close the three recorded mobile gaps

The gaps are the ones listed in `MOBILE/.docs/studzee.design.mobile.expo.md`
under known gaps: no downloaded state on content detail, alert/skeleton/
download logic duplicated per screen, and a dormant notification permissions
hook.

- New `hooks/useCustomAlert.ts` owns the alert config object and its show and
  hide helpers that `pdfs.tsx` and `resources.tsx` each declared by hand.
- New `hooks/usePdfDownloads.ts` owns the whole local PDF library: the
  downloaded list with document ID and source URL views, in-flight downloads,
  the re-download confirmation, remote viewing in the browser, and the bottom
  sheet actions for a downloaded file. This is the near-200 lines that
  `pdfs.tsx` and `resources.tsx` previously maintained as two diverging
  copies, and it is what `[id].tsx` was missing when it rendered Resources
  rows with no knowledge of download state.
- `screens/[id].tsx` consumes both hooks. Each PDF row now shows a green
  check and a Downloaded label when that file's URL is in the local library,
  and pressing Download on an already downloaded document asks the same
  re-download confirmation the other screens use. Matching is per source URL,
  because storage is keyed by document ID while one document can hold several
  files. Its remote view path moved to the hook as well, gaining a failure
  alert it never had.
- `screens/pdfs.tsx` and `app/(tabs)/resources.tsx` shrank onto the hooks with
  behaviour preserved. resources.tsx also folds its two near-identical inline
  skeleton cards into one local `SectionCardSkeleton`, and drops a dead
  `selectedPdf` state that nothing read. Skeletons elsewhere stay hand rolled:
  home and content detail skeletons differ enough that merging them would
  mean inventing a configuration layer for no gain.
- `hooks/useNotificationPermissions.ts` is rewritten and wired into
  `settings.tsx` after sitting unimported. It now exposes the tri-state
  permission status, asks the native prompt when the permission is
  undetermined, opens system settings once decided, and watches `AppState`:
  returning to the foreground re-reads permission and completes backend
  registration when the permission became granted while no push token exists.
  That closes the real hole the dormant hook was written for, where a user who
  denied at first prompt and granted later in settings stayed unregistered
  until the next login. The Settings switch now reflects OS permission while
  the Bell icon keeps showing token registration.

### Verification and a pre-existing lint breakage

- `npx tsc --noEmit` passes in MOBILE, and every touched file passes
  `prettier --check`.
- `npm run lint` fails with `TypeError: Plugin "" not found` raised while
  evaluating `eslint.config.js` itself, before any file is scanned, so it
  fails identically on untouched files. This predates the change and looks
  like an ESLint 9.39 flat-config resolution problem in that config's
  `extends` block. Not fixed here; it needs its own investigation.
- A prettier sweep reformatted four unrelated files carrying older 4-space
  formatting drift (`onboarding.tsx`, both layout files, `types/index.ts`).
  They were restored so this diff stays scoped; those four still fail a
  module-wide `format:check` exactly as they did before this work.

## 2026-08-21

**Branch:** `fix/mobile-notification-token-registration`

### Remove the /noti/api compat mount, same day it was added

- The owner has updated the MOBILE builds that were still calling
  `/noti/api/register` to call `/notifications/register` directly, so the
  compat mount added earlier today has nothing left to serve. Removed the
  `app.use('/noti/api', notificationRoutes)` line in `BACKEND/src/index.ts`
  and the test that pinned it in `notification.route.test.ts`, back to 6
  tests in that file. `tsc --noEmit` and `fmt:check` clean.
- Updated `.docs/TCSK.md` and `.docs/RECORDS.md` to record that this was
  resolved by updating the clients, not by a backend repoint, since the two
  entries added earlier today described a fix that no longer exists.

### Compatibility mount for old MOBILE builds calling /noti/api

- Confirmed the "repoint the ingress" OPEN WORK item was not actually fixed
  when asked. `POST /noti/api/register` was only ever documented as a
  migration mapping in `README.md`, `API.md` and the Postman collection,
  nothing in `index.ts` served that path, so devices still running the
  released MOBILE 1.1.4 build have been getting a 404 on every registration
  attempt since the merge.
- Fixed by mounting `notificationRoutes` a second time at `/noti/api` in
  `BACKEND/src/index.ts`. Same router as `/notifications`, so the old path
  gets identical auth, rate limiting and validation, no duplicated logic.
  Stopgap by design, an ALB listener rule is the cleaner long term home for
  this rewrite once the AWS deployment exists.
- Added one test in `notification.route.test.ts` pinning the compat mount
  itself, so a future refactor of `index.ts`'s route list that drops it
  fails in CI rather than in production. `tsc --noEmit`, `fmt:check`, and
  `lint` all clean, the notification route test file passes 7 of 7.
- Updated `.docs/TCSK.md` (both the AWS section's mention of this item and
  the OPEN WORK bullet) and `.docs/RECORDS.md` to reflect the fix.

### Redesign the Resources PDF card, record the content and gamification plan

- Restyled the PDF list in `MOBILE/app/screens/[id].tsx` to match the pill
  button language already used in `DownloadedPdfInfo.tsx`: icon tile, size as
  a badge, view/download as full-width labeled pills. Visual only, no change
  to `handleViewPdf`, `handleDownloadPdf`, or `downloadingPdfIndex`. This
  screen still does not check `isPdfDownloaded`, that gap stays tracked in
  `studzee.design.mobile.expo.md`, out of scope for this change by the
  owner's choice.
- Recorded a four part content and gamification plan in `.docs/TCSK.md`
  under a new "PLANNED CONTENT AND GAMIFICATION FEATURES" section: the
  gamified user tracker (points, streaks, badges, unlockable content,
  confirmed 21-08-2026, no leaderboard), a generic topic tag content model
  replacing the hardcoded "Machine Learning" home screen title and the
  hardcoded "System Design" locked card, a blog or journal section riding on
  the same topic tagging, JSON toward Markdown content authoring for future
  diagram support (explicitly provisional, the owner is not settled on it),
  and a gamified replacement for the static "Upcoming" section in
  `profile.tsx`. All four are direction only, nothing designed or built. The
  gamified tracker specifically still waits on the data storage layer, which
  stays on hold per V2 PLAN step 2.

## 2026-08-20

**Branch:** `fix/mobile-notification-token-registration`

### Fix the mobile notification registration bug and loop

- `NotificationContext` never exposed `registerToken`, even though
  `types/notification.ts` documented that shape. That type was dead code,
  never imported anywhere. `useNotificationPermissions.ts` had been patched
  around it with an optional cast, `registerToken?.()`, which silenced the
  type error but made manual re-registration after a permission grant a
  permanent no-op.
- Extracted the provider's registration flow into a `registerToken` callback
  and exposed it on the context for real, then removed the cast in the hook.
- That surfaced a second, live bug. The auto-register effect depended on
  `[user, getToken]`. Clerk's `getToken` is not referentially stable across
  renders, and `setIsLoading`/`setExpoPushToken` inside `registerToken`
  itself trigger a re-render, so the effect kept recreating `registerToken`
  and refiring itself. Confirmed in device logs: dozens of duplicate
  `POST /notifications/register` calls in a single session, ending in the
  backend responding 429. Fixed by keying the effect on the signed-in email,
  a stable string, and reading `getToken` through a ref instead of the
  dependency array.
- Removed the unused `NotificationContextType` interface from
  `types/notification.ts`. It described a larger shape, permission state
  merged into the context, that was never built and had drifted from the
  real implementation.
- `MOBILE/utils/config.ts` now points at the deployed backend,
  `https://studzee-api-latest.onrender.com`, replacing the placeholder
  `api.studzee.in` host.
- Wrote `MOBILE/studzee.design.mobile.expo.md`, covering navigation and the
  provider tree, the notification pipeline, the custom alert, the bottom
  sheet, how a downloaded PDF is tracked in `expo-secure-store`, the two
  separate code paths for viewing a PDF on device versus streaming one from
  its remote URL, share, the skeleton loading pattern, and a package
  reference table. Also records gaps found while writing it: alert and
  skeleton logic duplicated per screen rather than shared, and
  `screens/[id].tsx` never checks download state for its own PDF list.

## 2026-08-18

**Branch:** `docs/record-aws-terraform-plan`

### Record the planned AWS and Terraform deployment

The owner stated the intended deployment direction: infrastructure as code
with Terraform, the backend on ECS with the image in ECR, behind a load
balancer, with autoscaling and Route 53. Direction only. Nothing is designed
or built, and no timeline is set.

Recorded in [`.docs/TCSK.md`](.docs/TCSK.md) under planned infrastructure,
with the constraints the service already imposes so they are not rediscovered
later. The ones that will shape the design most:

- The container listens on 3000, so that is the target group port.
- `/health/liveness` is the health check to poll. `/health/readiness` round
  trips three stores and is a deployment gate, not something to hit every few
  seconds from every task.
- Migrations run at container start, so every task attempts them on every
  deploy and every scale out. Already logged as deferred work, this stops
  being deferrable the moment the service runs more than one task.
- Several of the sixteen required variables are credentials and belong in
  Secrets Manager or Parameter Store rather than plain task definition
  environment entries.
- `DEV_TOKEN` must not exist in the task definition at all.

One thing worth connecting: the outstanding ingress repoint, where MOBILE
1.1.4 devices still call `POST /noti/api/register`, is a path rewrite that a
load balancer listener rule can carry. That item can close as part of this
work rather than separately.

The owner settled three of the open questions the same day. Capacity is
Fargate. The image publishes to both ECR and Docker Hub, from a separate
workflow file rather than by extending the existing one. And the managed
stores are chosen per deployment target rather than once: on the AWS path
Postgres is RDS, MongoDB is DocumentDB and object storage is S3, while any
host that simply pulls the Docker Hub image keeps the free tiers in use today,
MongoDB Atlas and Supabase.

That last point was first written here as a wholesale migration into AWS,
which was wrong, and the owner corrected it the same day. The AWS services are
what one target uses, not a replacement for the free ones.

The correction matters more than a wording fix, because it makes portability a
requirement rather than a property that happens to hold. The service has to
keep running against both sets, so the code has to stay inside the
intersection of real MongoDB and DocumentDB rather than merely inside
DocumentDB, and DocumentDB becomes the limiting factor on what may be written
against MongoDB anywhere. Every store is already reached through an
environment variable and a standard driver, so nothing needs changing today.

Moving the engines does not unblock the data storage design. That is a schema
question and it stays on hold.

Three things are recorded to check before any of it is built. DocumentDB
emulates a MongoDB wire protocol version rather than being the same engine, so
the aggregation and index usage needs checking against the target version
first, and with Atlas staying in use elsewhere that check binds every
deployment and not only the AWS one. The S3 move is nearly free because
storage already speaks the S3
protocol, a side effect of adopting Supabase over that protocol on 11-08-2026,
though `forcePathStyle` is not wanted against real S3. The buckets are public
today, which on S3 has to be chosen deliberately rather than inherited.

Still open: how the pipeline authenticates to AWS, where OIDC role assumption
avoids long lived keys in repository secrets, and the TLS shape.

**No code for any of this.** The owner was explicit that this is direction to
record, not work to start.

## 2026-08-18

**Branch:** `chore/rename-image-to-studzee-api`

### Rename the published image to studzee-api

The image was published as `studzee-backend` while the package, the container
and the OCI title were all already `studzee-api`. The owner asked for the
published name to match.

Changed in the workflow, in `DOCKERHUB.md`, in the compose local build tag and
in the readme. `.docs/WORKFLOW-SAMPLE.md` is deliberately left alone. It is a
snapshot of the workflow as it stood before the rewrite, so editing it would
falsify the record it exists to keep.

`BACKEND/postman.collection.json` keeps its `_postman_id`. That value is
Postman's import deduplication key rather than a display name, so changing it
would create a duplicate collection for anyone who has already imported it.

**Docker Hub has no rename.** Pushing under the new name creates a second
repository rather than moving the first, so this needs a release to populate
`studzee-api`, and `studzee-backend` remains until it is deleted by hand. Its
tags, its pull count and the description pushed to it on 4.0.1 all stay with
the old name. Delete it only after a release has populated the new repository,
so that there is never a window with no published image.

## 2026-08-18

**Branch:** `docs/dockerhub-overview`

### Give the published image a Docker Hub page

`backend-v4.0.0` was released and the image carried no description, no
categories and no OCI metadata, so the Hub page was blank and `docker inspect`
on a pulled image said nothing about what it was.

`BACKEND/DOCKERHUB.md` is a new file rather than a reuse of the readme. The
readme is 1696 lines and almost all of it is local development, compose
profiles, Mailpit, MinIO and Prisma Studio, none of which applies to somebody
who has the image and not the repository. The new file is written for that
reader instead: the run command, the port, the required variables, the health
endpoints, and the behaviour that costs people time.

Every claim in it was checked against the Dockerfile, the config schema and
`src/index.ts` rather than written from memory. That caught one error before it
shipped: the route group list was missing `/pdfs`.

Two things were added to the release workflow.

- OCI labels on the image, so title, version, revision and source travel with
  it. `github.repositoryUrl` is deliberately not used for the source label
  because it yields a `git://` URL rather than a browsable one.
- A step that pushes the description to Docker Hub. The page text is a
  property of the repository and not of the image, so it cannot be set by a
  label and needs the Hub REST API. It runs only on a version tag, because a
  commit SHA build is not what the page should describe.

Categories are deliberately not automated. They are chosen once from a fixed
list of sixteen and then never change, so automating them would mean shipping
an API call whose payload shape cannot be verified from here in exchange for
saving one click. They are set in the Docker Hub repository settings.

The category slug list was fetched from `https://hub.docker.com/v2/categories/`
rather than assumed. `application-frameworks` is not among the sixteen valid
slugs, so a call using it would have failed.

**Note for whoever deploys next.** The `backend-v4.0.0` images were pushed
under the previous Docker Hub credentials and are not in the current account.
The workflow needs re-running on that tag to publish them where they belong.

## 2026-08-18

**Branch:** `feat/v2-architecture`

### Put the data storage design on hold

The owner decided that the data storage layer, step 2 of the v2 plan, waits
until MOBILE and DESKTOP are done rather than being specified now.

The reason is that the feature set that determines the schema does not exist
yet. The owner is planning a user tracker that records a user's quiz results
and per user responses, and surprise or scheduled quizzes built on that
history, and is explicit that the shape of those is not settled. Designing the
database now would fix a schema before the requirements that decide it are
known, and would then have to be redesigned once they are. So the order in the
plan changes: clients first, storage design after, with the feature set in
hand.

Nothing in the code changed. This entry, the `BLOCKED` status in
[`.docs/RECORDS.md`](.docs/RECORDS.md), and the revised steps 2 and 2a in
[`.docs/TCSK.md`](.docs/TCSK.md) exist so that the hold reads as a decision
with a reason rather than as unfinished work, and so it is not proposed again.
The planned features are recorded under open work in TCSK, because whoever
eventually designs the storage layer needs to know it has to carry per user
quiz attempts over time and not only the content documents it holds today.

The backend is otherwise complete: 235 tests across 26 files at 91 percent
statement coverage, all four CI gates green, and the Clerk auth path verified
live against a running instance.

## 2026-08-14

**Branch:** `feat/v2-architecture`

- Normalised line endings and made `fmt:check` a CI gate. The two are the same
  job: the check could not be enabled before because it failed on several
  thousand CRLF differences. The index already stored LF; what produced them was
  the checkout, since `core.autocrlf=true` rewrites the working tree to CRLF
  while Prettier defaults to `endOfLine: "lf"`. A `.gitattributes` with
  `* text=auto eol=lf` overrides that per repository, so the working tree matches
  the index on every platform. That matters because CI checks out on Linux and
  the maintainer works on Windows, so without it the two disagree by definition.
  - Fixed at the source rather than suppressed in the Prettier config, which
    would have hidden the difference instead of removing it.
  - `prettier --write` then rewrote 68 files, and ESLint went from **4012
    problems to 1**. The survivor was a genuine `no-explicit-any` in
    `config/mongo.ts`, now narrowed to the `{ code, message }` shape the driver
    actually provides. `API.md` needed a second Prettier pass; it is not
    idempotent on that file.
  - `make check` now runs four gates rather than three, matching CI.
- Dropped `@clerk/clerk-sdk-node`, which is end of life. It was providing
  `clerkClient` for the admin role lookup while `@clerk/express` provided the
  middleware, so the project carried two Clerk SDKs and two copies of
  `@clerk/backend`, an old 0.38 hoisted to the top level and a 2.x nested under
  express. `@clerk/express` re-exports an equivalent `clerkClient`, so this
  removed a dependency rather than swapping one, and `@clerk/backend` is now an
  explicit 2.33 direct dependency for its types.
  - `src/types/express.d.ts` is still required. `@clerk/express` declares
    `Request.auth` in its own module scope and that does not reach the global
    Express namespace; removing the file produced eight compile errors.
  - The type had to become `SessionAuthObject`, not `AuthObject`. In v2 the
    latter widened to include machine tokens, which carry no `userId`, so every
    `req.auth().userId` in the codebase failed against it.
  - Verified live, not just by the suite. The tests mock Clerk, so they would
    have passed even if the real client were broken. Re-ran the real token probe
    against a restarted server: 401 without a token and on a garbage bearer, 200
    with a real JWT, 200 on `/admin/*` for an admin and 403 for a throwaway user
    with no role. `/admin/users` returning 200 is the specific proof, since that
    is the `clerkClient.users.getUser` call that changed.
- Added [`.docs/DEPLOYMENT.md`](.docs/DEPLOYMENT.md), the environment checklist
  for a deploy. Generated from the Zod schema rather than transcribed, so it
  matches what the service validates: 16 required variables, the defaults that
  must be overridden anyway, and the steps that are not variables.
  - The most dangerous default is `NODE_ENV`, which is `development`. The
    `DEV_TOKEN` bypass is active whenever that holds and `DEV_TOKEN` is set, and
    it grants admin, so an unset `NODE_ENV` alongside a present `DEV_TOKEN` is an
    open admin surface.
- Wrote the missing 2026-08-12 entry below, reconstructed from that day's three
  commits and the matching fix and record rows, and marked as such.

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
- Took backend coverage from 49 to 91 percent of statements, 422 of 465, and the
  suite from 90 tests across 11 files to 235 across 26. No file is left at 0 and
  twenty are at 100.
  - First pass, seven files to 100 percent: the auth, error handling, validation
    and rate limit middleware, the upload and user services, and the Clerk
    webhook controller.
  - Second pass, at the owner's instruction after I had recommended stopping:
    the email, PDF and user controllers, `models/notification.validation.ts`,
    and the four uncovered route files. The route tests turned out to be worth
    more than expected, because they pin ordering rather than lines. The
    registration route proves auth runs before validation, so an unauthenticated
    caller gets 401 and is never handed a description of the schema, and the
    webhook route proves `express.raw` delivers the exact signed bytes, spacing
    and unicode escapes included, which is the whole basis of the signature
    check.
  - The auth tests mock both Clerk entry points rather than using a real token.
    A session JWT expires about a minute after minting, so a suite built on one
    would rot within the hour and would need network access to run.
  - `auth.ts` reads `config.NODE_ENV` once at module load into
    `isDevelopmentMode`, so exercising production behaviour needs
    `vi.resetModules()` with `vi.doMock` and a dynamic import. Reassigning the
    config after import does nothing.
  - Mutation checked rather than assumed. Six defects introduced one at a time,
    including requireAdmin accepting any role, validateBody no longer replacing
    `req.body`, the error handler leaking the real message on a 500, and the
    webhook accepting an already parsed body. All six were caught by the suite.
  - The typecheck gate earned itself again: all 172 tests were green while `tsc`
    reported 16 errors in the new files, from `beforeEach(() => vi.clearAllMocks())`
    returning a value the hook type rejects.
- Verified the Clerk auth path end to end against a real RS256 session token
  from the local `clerk-auth-demo` probe, separately from the suite.
  `BACKEND/.env` already holds keys for the same Clerk instance, so the host
  process verified those tokens with no reconfiguration. 401 with no token and
  with a garbage bearer, 200 with a real JWT, 200 on the admin surface for an
  admin and 403 for a user with no role. The deny case needed a throwaway
  non-admin user, created and deleted for the purpose, because the probe user
  carries the admin role and could only ever prove the allow case.
  - Four production relevant findings recorded in TCSK: the container cannot
    verify any token while `.env.container` holds placeholder keys, admin is
    granted by hand in the Clerk dashboard with no code path for it,
    `requireAdmin` calls Clerk uncached on every admin request, and the project
    depends on two Clerk SDKs of which one is end of life.
  - Test data cleaned up: the throwaway Clerk user was deleted and the
    `probe@studzee.test` row the registration check wrote to Postgres removed.
- Brought `.github` up to date with the v2 tree, the last item outstanding from
  the 10-08-2026 strip.
  - Deleted `docker-website.testing.yml` and `docker-notification.testing.yml`.
    Both built directories removed on 10-08-2026, so both were guaranteed to
    fail on their tag triggers. Two workflows remain, the gated backend build
    and the bug reproduction helper, which is independent of the module layout.
  - `SECURITY.md` no longer lists NOTIFICATION and WEBSITE as supported
    services, and says where to report anything affecting the notification
    surface now that BACKEND owns it.
  - `CONTRIBUTING.md`: dropped `notification` and `website` as commit scopes,
    replaced the dead NOTIFICATION readme link with DESKTOP, corrected the
    prerequisites to Node 22 and Compose v2, noted Bun is a script runner only,
    and pointed the test step at `make check` with a note that the typecheck is
    separate because Vitest does not typecheck.
  - `.github/README.md` was corrected rather than rewritten. It is largely
    roadmap and much of it is still the intended direction, but it described
    NOTIFICATION as a separate service, listed a web client, and presented
    Terraform and Kubernetes in the present tense after both were removed. It
    now carries a status header separating intent from what exists, and those
    claims are fixed. A full rewrite waits on the v2 architecture being settled,
    since doing it now would mean inventing decisions.
  - Removed the two emoji, per the house style rule.
  - `CODEOWNERS` needed no change, and the four asset files are all referenced
    or unused rather than broken.
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

## 2026-08-12

**Branch:** `feat/v2-architecture`

> Written on 14-08-2026, reconstructed from the three commits of that day
> (`1ac80b60`, `91dcfca6`, `28590ea2`) and the matching rows in
> [`.docs/FIXES.md`](.docs/FIXES.md) and [`.docs/RECORDS.md`](.docs/RECORDS.md).
> The entry was missed on the day. It is accurate to the record but thinner than
> a contemporaneous one would have been, and any reasoning not captured in a
> commit message or a fix row is lost.

- Built the Docker image and ran the API in a container for the first time,
  which immediately exposed that no existing env file could work inside one.
  `.env` and `.env.docker` both address every dependency as `localhost`, which
  is correct for a host process because the containers publish their ports, and
  wrong for a process on the compose network. Added `BACKEND/.env.container`,
  which addresses them by compose service name.
  - The failure mode is worth remembering: it presents as `P1001` from
    `prisma migrate deploy` at boot, before any application code runs, so it
    looks like a database problem rather than a configuration one.
- Set `PORT=3000` in `.env.container`, unlike the other two files. The Dockerfile
  declares `EXPOSE 3000` and probes port 3000 in its `HEALTHCHECK`, so with
  `PORT=4000` the container serves traffic correctly and reports `unhealthy`
  forever. It is published as `-p 4000:3000`.
- In `.env.container` only, `S3_ENDPOINT` and `S3_PUBLIC_URL` deliberately point
  at different hosts. Uploads go to `http://minio:9000`, while the URL stored on
  the document stays `http://localhost:9000`, because a client outside Docker
  fetches it later and cannot resolve `minio`.
- Found that `make seed`, `make logs` and `make refresh-cache` all fail, since
  they shell into an `api` compose service that did not exist. Documented as
  broken rather than fixed at the time. Both the service and the targets were
  fixed on 14-08-2026.
- Corrected the readme claims that no longer matched the stack, and documented
  the root route and the environment dependent file URLs in `API.md`.
- Rewrote the storage troubleshooting around the failures that actually occur,
  `NoSuchBucket`, `SignatureDoesNotMatch` and an unreachable endpoint, rather
  than generic advice.

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

