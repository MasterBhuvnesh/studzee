# TCSK

Things Claude Should Know. This is what the user wants Claude to know about the project. Read it before starting work and treat it as memory. Add to it when the user shares something durable.

## PROJECT

- Studzee is a full-stack SaaS educational platform for creating, structuring, delivering, and consuming educational content across mobile, web, and desktop.
- Stakeholders are students and learners, educators and content creators, administrators, and contributing developers.
- The architecture is distributed and service oriented. Each service is independently deployable for fault isolation, horizontal scaling, and controlled rollouts.
- Content was uploaded and structured manually by administrators until 29-08-2026, when the agentic AI layer landed. It generates documents, quizzes, summaries, quests and push copy, all into an owner reviewed draft queue. It lives in `BACKEND/src/services/ai/`, **not** in an `AGENTS` folder as this line previously said. See [AI LAYER SHIPPED 29-08-2026](#ai-layer-shipped-29-08-2026-on-featai-layer).
- Official website is `https://studzee.in`, with DNS handled through AWS Route 53 for production.

## REPOSITORY LAYOUT

The repository was stripped to the v2 working set on 10-08-2026. Only the following remain.

- `BACKEND` is the only service (`studzee-api`). Since the merge on 10-08-2026 it owns content, caching, Clerk authentication, Expo push delivery, transactional email, the Clerk webhook, and the notification and email audit logs.
- `MOBILE` is the Expo client.
- `DESKTOP` is the Electron admin console.
- `.github` holds the README, workflows, CODEOWNERS, and community docs.
- `.docs` holds the process documentation for people and agents.
- `release.sh` drives the per module version bump and release flow. Renamed from `code.sh` on 14-08-2026. Releasable modules are `backend`, `mobile` and `desktop`, listed in `VALID_SERVICES` at the top of the script; add `website` there when that module returns. It bumps, stages and prints the git commands, and deliberately does not commit, tag or push, because pushing the tag is what triggers the build and publish pipeline.
- `WORKLOG.md` is the running record of work.

Removed on 10-08-2026 and recoverable from git history before commit `9ba738d6`: `AGENTS`, `CONVEX`, `K8S`, `PACKAGES`, `SERVICES`, `TERRAFORM`, `WEBSITE`, `.vscode`, and the stray root `package.json`. Convex is out of scope permanently and must not appear in the v2 architecture or implementation.

Gitignored local files from the removed folders were copied to `D:\Projects\Studzee-archive-2026-08-10` outside the repository before deletion. That archive holds the Terraform state for the backend infrastructure and three local env files. It is not tracked and will not survive a machine change.

## DATA AND INFRASTRUCTURE

- **MongoDB** holds content, through Mongoose. **PostgreSQL** holds users, Expo push tokens, and the notification and email audit logs, through Prisma. Both are kept, by the owner's decision. Do not propose consolidating them.
- **Redis** is the read cache, using the cache aside pattern with `SCAN` based invalidation.
- **Supabase Storage** holds uploaded files, spoken to over the S3 protocol with the AWS SDK. Project ref `lammfakgegmrkxdkwukd`, region `ap-northeast-2`. Three public buckets: `images` and `pdfs` for uploads, and `assets` for the email banner, which the application never writes to. The S3 endpoint and the public URL are different hosts, and `forcePathStyle` is required.
- **MinIO** stands in for Supabase locally, and **Mailpit** stands in for the mail provider. A `minio-init` container creates the same three buckets and marks them public, so local behaviour matches the real project.
- **`docker-compose.yml` has an `api` service, behind the `api` profile.** Added 14-08-2026, replacing the hand-written `docker run` invocation. `docker compose up -d` still starts infrastructure only, so the host `npm run dev` workflow is unchanged and keeps port 4000. `docker compose --profile api up -d` runs the API as a container instead. The two are mutually exclusive because both bind 4000; set `API_PORT` to run them side by side.
- **The API container cannot run the seed or job scripts.** They go through `ts-node`, a devDependency, and the image installs with `--omit=dev`. Run `npm run seed` and `npm run job:refresh-cache` on the host. `make seed` and `make refresh-cache` were repaired on 14-08-2026 and now do exactly that instead of shelling into the container.

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

The suite is Vitest. It stands at **235 passing across 26 files** as of 14-08-2026.

- **Run it from `BACKEND`, never from the repository root.** The root has no `package.json` and no Vitest config, so `npx vitest` there installs an unrelated Vitest from the registry, resolves no `@/*` aliases and never runs `globalSetup`. Every suite fails with `Cannot find package '@/...'`, which looks like a code fault and is not one.
- **Start the compose stack first.** The integration tests in `content.route.test.ts` use a real Mongo and Redis. The unit tests do not.
- `src/tests/setup/globalSetup.ts` supplies a default for every variable the config schema requires, so the suite runs on a checkout with no `.env`. A real `.env` still wins where set.
- The Mongo default carries credentials and `authSource=admin`, matching the compose defaults. Without them Mongoose still connects, because it connects lazily, and the failure appears only on the first query as `Command aggregate requires authentication`.
- `CLERK_PUBLISHABLE_KEY` in that file must stay structurally valid, meaning `pk_test_` followed by the base64 of a domain. Clerk decodes it to find its API host and throws `Publishable key not valid` on anything else, which surfaces as a 500 and makes an unauthenticated request look like a server fault instead of a 401.
- **Vitest transpiles without typechecking**, so a test file can pass at runtime and still not compile. Run `npx tsc --noEmit -p tsconfig.json` as well. `tsconfig.build.json` excludes `src/tests`, the base config does not, and that is deliberate.
- **Measured coverage is 91 percent of statements**, 422 of 465, taken 14-08-2026. It was 49 percent that morning. **No file sits at 0 percent.** Twenty files are at 100, including every middleware, every controller except `content.controller.ts` at 95, every route file, `models/notification.validation.ts` and the notification, upload and user services.
- **The four files still short of 100** are all partially covered already and were never at zero: `services/email.service.ts` at 59 percent, `services/content.service.ts` at 71, `services/expo.service.ts` at 84, `api/routes/health.route.ts` at 93. Together they account for 43 uncovered statements, mostly transport and retry branches that need a fake SMTP or Expo endpoint to reach.
- **The auth tests mock Clerk and must keep doing so.** A real session JWT would make the suite network dependent and expires about a minute after minting. `auth.ts` reads `config.NODE_ENV` once at module load into `isDevelopmentMode`, so testing production behaviour needs `vi.resetModules()` plus `vi.doMock` and a dynamic import, not a reassignment. The live token path is checked by hand instead, see the note under CLERK below.
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
2. **Then work on the data storage layer.** **ON HOLD, decided by the owner on 18-08-2026.** Object storage moved to Supabase on 11-08-2026, but the database design itself is deliberately not specified yet, and it is not to be proposed until the owner reopens it. The reason is that new features are coming that would change the schema: a user tracker that records quiz results and per user responses, and surprise or scheduled quizzes built on top of that history. The shape of those features is not settled yet either. Designing the schema now would mean fixing a shape before the requirements that determine it exist, so the design waits until MOBILE and DESKTOP are done and the feature set is known. **Do not raise this or offer a schema until then.**
   2a. **Backend first, frontend second.** Confirmed on 10-08-2026, **and revised on 18-08-2026** by the hold on step 2. The backend is otherwise finished, so MOBILE and DESKTOP now come next, and the data storage design follows them rather than preceding them. Everything the clients consume today is a stable contract; the quiz and tracking surface is the part still to be designed, and it will be designed with the clients in hand.
3. **Keep both databases.** MongoDB stays for content, Postgres stays for the notification data. The user has explicitly confirmed this split is acceptable, so do not propose consolidating them onto one engine.
4. **Update the docker compose file as part of the merge.** **DONE.** `BACKEND/docker-compose.yml` now runs mongo, postgres, redis, minio, minio-init, mailpit and mongo-express. `NOTIFICATION/docker-compose.yml` is gone.

**Runtime decided on 10-08-2026: keep what BACKEND already has.** Node 22 with the `tsc` plus `tsc-alias` build, `ts-node-dev` in development, Vitest for tests, and the existing Node Dockerfile. Bun is dropped, along with `bun.lock` and the Bun based Dockerfile. Prisma runs on Node without change, so the Postgres layer moves across as is.

**Decision taken 14-08-2026: the `Co-Authored-By` trailers already in history stay.** Commits `1ac80b60`, `f6963af2`, `1a20d945` and `d19adbb5`, plus some earlier ones, carry a `Co-Authored-By: Claude ...` trailer that [`RULES.md`](RULES.md) forbids. They were pushed to `origin/feat/v2-architecture` on 14-08-2026. Removing them would need a history rewrite and a force push, and the owner decided it is not worth it. **Do not raise this again and do not offer to rewrite it.** The rule still applies to every new commit: `a935812a` onwards are clean and it stays that way.

**Decisions taken 10-08-2026 and 11-08-2026, do not re-litigate:**

- Notification routes were renamespaced to backend conventions rather than keeping the `/noti/api` prefix. `/notifications/register`, `/admin/notifications`, `/admin/emails`, `/admin/users`, `/webhooks/clerk`.
- Every defect found in the architecture review was fixed during the move rather than carried forward. See [`FIXES.md`](FIXES.md).
- Storage is Supabase, with uploads split across an `images` and a `pdfs` bucket rather than one bucket with key prefixes, because that is how the project is laid out.
- Buckets are public. The application stores a plain public URL on the document and the clients fetch it directly. Signed URLs were considered and rejected.
- MinIO stays for local development. It is not replaced by pointing local work at Supabase.

## PLANNED INFRASTRUCTURE, TERRAFORM ON AWS

Stated by the owner on 18-08-2026. Direction only, nothing is designed or
built yet, and no timeline is set. Recorded so the constraints that already
exist are not rediscovered when the work starts.

The intent is infrastructure as code with Terraform, deploying the backend to
AWS on ECS with the image in ECR, behind a load balancer, with autoscaling and
Route 53 in front.

### WHAT THE BACKEND ALREADY IMPLIES FOR THIS

These are facts about the service today, not decisions about the design.

- **The container listens on 3000.** The image declares `EXPOSE 3000` and its
  healthcheck probes 3000. The target group port is 3000 whatever the listener
  does in front of it.
- **`/health/liveness` is the health check to point a target group at.**
  `/health/readiness` round trips MongoDB, Postgres and Redis on every call,
  which is right for a deployment gate and wrong for something polled every
  few seconds across every task.
- **Migrations on container start block autoscaling.** The image runs
  `prisma migrate deploy` before the application. With more than one task,
  every task attempts the migration on every deploy and on every scale out.
  This is already logged as deferred work, and it stops being deferrable the
  moment a service runs more than one task. It wants to become a one off task
  run before the service updates.
- **Sixteen required variables, several of them secrets.** `CLERK_SECRET_KEY`,
  `SMTP_PASSWORD` and `S3_SECRET_ACCESS_KEY` are credentials and belong in
  Secrets Manager or SSM Parameter Store referenced by the task definition,
  not in plain task definition environment entries where anyone with console
  read can see them.
- **`NODE_ENV` must be `production` and `DEV_TOKEN` must not exist in the task
  definition at all.** The bypass grants admin whenever `NODE_ENV` is
  `development` and `DEV_TOKEN` is set. See [`DEPLOYMENT.md`](DEPLOYMENT.md).
- **The ingress repoint is moot.** A same-day `/noti/api` compat mount in
  `index.ts` was added and then removed on 21-08-2026: the owner updated the
  MOBILE 1.1.4 devices in question to call `/notifications/register`
  directly, so no client still calls the old path and there is nothing left
  to rewrite. If a future MOBILE build regresses this, the fix is the same
  one line, mount `notificationRoutes` a second time at the old prefix.

### DECIDED, 18-08-2026

- **The managed stores are chosen per deployment target, not once.** Clarified
  by the owner on 18-08-2026. **On the AWS path** Postgres is RDS, MongoDB is
  DocumentDB and object storage is S3. **Anywhere else**, meaning any host that
  simply pulls the Docker Hub image, the free tiers stay: MongoDB Atlas,
  Supabase Postgres and Supabase Storage as they are used today. The AWS
  choices are not a migration away from the free services, they are what that
  one target uses.

  **This makes portability a requirement rather than a nice property.** The
  service has to keep running against both sets, so nothing may depend on an
  AWS specific feature, and the code has to stay inside the intersection of
  real MongoDB and DocumentDB rather than merely inside DocumentDB. Every store
  is already reached through an environment variable and a standard driver, so
  this holds today. It is a constraint on future work, not a change to make.

  This is an engine and hosting decision either way. It does not unblock the
  data storage design, which is a schema question and stays on hold.

- **Fargate**, not EC2 backed capacity, on the AWS path.
- **The image publishes to both ECR and Docker Hub**, from a separate workflow
  file rather than by extending
  `.github/workflows/docker-backend.testing.yml`.

**No code for any of this yet.** The owner was explicit on 18-08-2026 that this
is recorded as direction and is not to be started.

### THINGS TO CHECK BEFORE BUILDING ANY OF IT

Not objections. Each is cheap to check now and expensive to discover half way
through a migration.

- **DocumentDB is not MongoDB, and this now binds all deployments.** It
  emulates a wire protocol version rather than being the same engine, and the
  gaps are real: some aggregation stages, some `$lookup` forms, change streams
  and transaction support all vary by version.

  Because Atlas stays in use on the non AWS path, the code cannot simply be
  ported to DocumentDB. It has to stay inside **the intersection** of the two
  for as long as both are targets. The practical effect is that DocumentDB
  becomes the limiting factor on what may be written against MongoDB anywhere,
  including features added later that have nothing to do with AWS. The content
  models should be checked against the target DocumentDB version before this is
  committed to, because a query that looks compatible and then fails on one
  aggregation stage in production is the bad outcome here.

- **The S3 move is nearly free, and that is not an accident.** Storage already
  speaks the S3 protocol through the AWS SDK, because Supabase was adopted over
  that protocol on 11-08-2026. Moving to real S3 is mostly endpoint and
  credential configuration. `forcePathStyle`, currently required for Supabase,
  is not wanted against real S3, and `S3_PUBLIC_URL` stops needing to be a
  separate host from `S3_ENDPOINT`.
- **The buckets are public today** and the application stores a plain public
  URL on the document which the clients fetch directly. On S3 that means either
  deliberately relaxing block public access or putting CloudFront in front. It
  has to be decided rather than inherited, because S3 blocks it by default and
  Supabase did not.
- **Two publish workflows means two copies of the tag logic.** The version and
  tag derivation is the part worth sharing or keeping deliberately identical,
  since drift between them would publish different tags to the two registries.
  The Docker Hub description step has no ECR equivalent and should not be
  duplicated.

### STILL OPEN

- **How the pipeline authenticates to AWS.** GitHub Actions supports OIDC role
  assumption, which avoids storing long lived access keys as repository
  secrets. Worth preferring over an access key pair.
- **TLS.** Route 53 plus an ACM certificate terminating at the load balancer is
  the usual shape, but nothing is chosen.

## PLANNED CONTENT AND GAMIFICATION FEATURES

Stated by the owner on 21-08-2026, elaborating the user tracker item already
recorded under OPEN WORK. Direction only, nothing is designed or built, no
timeline. Four workstreams, recorded so the shape is not lost before the data
storage design reopens.

> ## STATUS UPDATE, 25-08-2026
>
> The owner ordered phase 1 of workstreams 1 and 2 built on this date, which
> partially reopens V2 PLAN step 2 for the tracker schema specifically.
> Shipped: the fixed topic registry with filtering and sample content, and
> the Postgres tracker (quiz attempts, points via best-score delta, streaks
> from daily activity, config driven badges and levels, unlock gate) with
> migration `20260824202549_user_tracker` applied to Neon. MOBILE got the
> profile gamification card and server graded quiz submission. Still open
> below: home screen sections still hardcode "Machine Learning" and "System
> Design" instead of rendering real topics, the blog is unbuilt, DESKTOP
> admin screens are noted for later. Markdown authoring was dropped on this
> date, see workstream 3.

### 1. GAMIFIED USER TRACKER

Elaborates the existing on-hold item: a user tracker that saves quiz results
and derives a gamified result from them.

- Store a per-user, per-content quiz attempt, score and timestamp.
- Track play-day history, so a streak can be derived from it.
- Points: a scoring rule mapping a quiz result to points.
- Streak counter, derived from play-day history.
- Badges or levels at point thresholds.
- Unlockable content, gated by points.
- Confirmed 21-08-2026: rewards take the form of streaks, badges/levels, and
  unlockable content. A leaderboard was considered and not chosen.

**Still blocked on the standing decision in V2 PLAN step 2:** the schema and
storage design wait until MOBILE and DESKTOP are done. This list adds detail
to what that schema needs to carry, it does not unblock designing it. Do not
raise a schema for this until the owner reopens step 2.

### 2. GENERIC TOPIC TAG CONTENT MODEL, PLUS A BLOG SECTION

Today nothing tags what subject a piece of content belongs to. Confirmed
21-08-2026 against `MOBILE/app/(tabs)/index.tsx`: the home screen hardcodes
the section title `"Machine Learning"` for all fetched content, and renders a
separate hardcoded `LockedContentSection title="System Design"` card. The app
is effectively single subject today despite looking topic based.

- Add a `topic` field to the content model.
- Home screen renders sections from the distinct topics actually present in
  the data, replacing both hardcoded strings above.
- Taxonomy not decided: a fixed list, for example Machine Learning, System
  Design, DevOps, AWS, Data, Deep Learning, versus freeform tags.
- Admin or content creation flow needs a topic selector. Not built, this is
  DESKTOP work.
- A blog or journal section, daily posts or news, becomes possible once
  content carries a topic or content type, either as a new content type or as
  another topic value.

### 3. CONTENT AUTHORING, JSON BLOCKS TOWARD MARKDOWN

DROPPED 25-08-2026 by owner decision. Recorded so the shape is not lost:
the motivation was diagram support in content, which the typed JSON block
structure does not carry. Text blocks already render markdown syntax
through `react-native-enriched-markdown`, so most rendering exists; what
was proposed was moving authoring from typed JSON blocks to markdown
strings or files, and migrating existing content. Content direction has
since moved to AI generation instead, see the AI agentic track below.

### 4. PROFILE SECTION GAMIFICATION

- Replace the static "Upcoming" section in `MOBILE/app/(tabs)/profile.tsx`
  with a points, streak and badges display.
- Depends on workstream 1 existing on the backend first. This is a client for
  that data, not an independent piece of work.

## MOBILE GAME FEEL AND GROWTH BACKLOG, RECORDED 25-08-2026

Stated by the owner in one pass. Direction only, nothing designed or built.
The owner intends to start working through this list; each item notes what
already exists and what it needs so tomorrow's work can start anywhere.

### 1. ACHIEVEMENTS SCREEN

- New pushed screen (`app/screens/achievements.tsx`), deliberately not a tab.
- Two in screen tabs: Badges and Levels.
- Badges: name and image per badge, locked versus unlocked state.
- Levels: current level highlighted, points needed for the next one.
- Tapping a badge or a level opens a bottom sheet with the image and the
  details for it.
- Data already sufficient for v1: `GET /progress/me` returns `level`,
  `nextLevel`, `badges` and `allBadges` with awarded flags.

### 2. BADGE AND LEVEL ARTWORK, SERVED BY URL

- Decision: images are never bundled, because assets added later cannot ship
  through EAS Update. Badge and level images live at URLs on the S3
  compatible store, Supabase in production and MinIO locally.
- A bundled placeholder renders when an image is missing or fails to load.
  `MOBILE/assets/images/sample_badge_level.png` is the placeholder until the
  owner supplies per badge and level art.
- The badge catalog will grow `imageUrl` fields; the client falls back to the
  placeholder for any entry without one.
- Done for levels on 26-08-2026. Seven rungs of art sit in the public `images`
  bucket at `levels/<key>.png`, uploaded at 512px on the longest side from the
  1244px originals the owner supplied. `GET /progress/me` now also returns
  `allLevels`, the whole ladder, so the client stopped mirroring the catalog in
  its own constant. Badge art is still outstanding; `allBadges` already carries
  the `imageUrl` field so dropping the objects in and filling the catalog needs
  no client release.
- The ladder became seven rungs the same day: novice (0), apprentice (100),
  scholar (250), expert (500), master (1000), grandmaster (2000), legend
  (5000). The first four thresholds are unchanged, so nobody dropped a rung.
  Master moved from 500 to 1000 to make room for expert.
- Perfectionist becomes tiered, decided 25-08-2026: x1 at one full score
  attempt, x2 at ten, x3 at twenty five, x4 at one hundred. Each tier carries
  its own image. Cleanest shape is one catalog entry per tier
  (`perfectionist`, `perfectionist-x2`, `perfectionist-x3`, `perfectionist-x4`)
  so the existing unique badge storage holds with no migration, and the
  badge context gains a full score attempt count for the predicates.

### 3. POINTS AS GEMS

- Points are presented as a gem everywhere. The asset is committed at
  `MOBILE/assets/images/gem.png` and is considered permanent, unlike badge
  art, so bundling it is fine.
- Used on the profile card, quiz results, the achievements screen and the
  locked content message.

### 4. CELEBRATION MOMENTS

- Two distinct moments, deliberately:
  - Badge or level unlock: a modal in the style of the owner's reference
    screenshots, a centred card on a dimmed, transparent background, showing
    the badge image, its name and a short line.
  - Full marks on a quiz: a Lottie celebration overlay. This one fires only
    for a perfect score, not for every completion.
- Package: `lottie-react-native`; the animation file is committed at
  `MOBILE/assets/lottie/celebrate.json`.
- Trigger data already flows today: `submitQuizAttempt` returns `newBadges`
  and the score, so both moments hang off the existing result.

### 5. QUESTS

- A quests screen ships early so pushing a quest later has a home, even
  before the backend exists.
- Admin can create quests and set the point value of each.
- Quest types: MCQ, single choice, fill in the blank, and read a blog,
  where completion is the read itself and there are no questions.
- Quests are limited time: each carries a start and end window, and quests
  outside their window are hidden or shown as ended rather than attemptable.
- Storage lives in Postgres alongside the tracker, decided 25-08-2026. Draft
  shape, to be finalised during the build: a `Quest` table carrying type,
  gem value, the window, an optional link to the Mongo content it tests or
  asks to read, and the question payload for MCQ and single choice; a
  `QuestCompletion` table unique per user and quest. The existing
  `DailyActivity` and points flow absorb the awards.
- Two or three seeded samples ship with the schema, at least one read a blog
  quest and one MCQ quest, so both client paths are testable immediately.
- Needs backend design: quest definitions, scheduling (node-cron is already a
  dependency), assignment and completion tracking, award integration with the
  existing points service, and an admin creation surface.
- Extends the tracker schema, so picking this up reopens a slice of the
  storage design with the owner.

### 7. BLOG TAGS, PROMOTED 25-08-2026

- Promoted out of future plans. Documents gain a `tags` string array in
  Mongo, two to five tags validated by the document schema, sitting beside
  the existing topic field.
- Filtering follows the topic pattern: a `tag` query parameter on
  `GET /content` with its own cache key suffix.
- Sample content ships with tags so the client has something real to render.

### 6. STREAK HEATMAP

- DONE 25-08-2026 on `feat/streak-heatmap`. The endpoint is
  `GET /progress/activity?year=` (note: `/activity` directly under
  `/progress`, not under `/me` as sketched here earlier) and the client
  renders it as a GitHub style grid on the achievements screen below both
  tabs. Requires a backend release to reach production.

### 7. CONTENT READING POLISH

- DONE 25-08-2026, widened in scope: the owner asked for the fade on the
  four tab pages rather than only while reading. A shared `BottomFade`
  component, transparent zinc into the page background, sits above the tab
  bar on home, resources, profile and settings. Gradient only, no blur
  dependency by owner choice.

### 8. IN APP NOTIFICATIONS

- Surface quizzes and events inside the app itself, separate from Expo push.

### 9. BLOG TAGS

- DONE 25-08-2026 on `feat/streak-heatmap`: the list endpoint now projects
  `tags`, the client fetches them and renders chips on content cards, and
  `getContent` accepts a freeform `tag` filter. This section duplicated
  entry 7 above; entry 7 is the authoritative one.

### 10. SUPPORT AGENT

- A small model powered get support assistant inside the app.

### 11. NEWSLETTER AGENT

- Automated newsletter sending. Standing house rule applies in full: no email
  leaves without explicit owner approval, so the design must include a draft
  and approval gate rather than an unattended sender.

### 12. AI AGENT WITH MONETIZATION

- An AI agent paid for by subscription, or driven by a user's own API key
  from a listed provider set.
- Open questions before design: which providers make the list, where keys
  live (device SecureStore versus server side), usage limits, and how
  subscription payment is processed.

### 13. AGENT QUEST RECURRENCE

- Quests today are one shot: each has a `startsAt` and `endsAt` window and a
  `QuestCompletion` row per user, so once the current batch is finished
  nothing new appears until an admin creates more by hand.
- Give quests a recurrence schedule, for example daily or weekly, so the
  same template resets completions per period and hands out gems again each
  cycle without admin work.
- Open questions before design: daily versus weekly versus both, whether a
  period's completion history stays visible to the user, gem caps per cycle,
  and how a reset is computed (lazy on read, or a scheduled job).

## AI AGENTIC TRACK, GROUPED 25-08-2026

The owner grouped the agent work into one track on this date. Everything
below is one program, not four separate features. Application content will
be AI generated rather than only admin authored, which replaces the dropped
markdown authoring workstream as the content direction. The quests screen
and the future AI agent screen are part of this track's client surface.

| Piece | Section | State |
| ----- | ------- | ----- |
| Quest recurrence, daily and weekly templates that reset | 13 above | planned |
| In app support agent, small model | 10 above | planned |
| Newsletter agent with draft and approval gate | 11 above | planned |
| AI agent with subscription or bring your own key | 12 above | planned |
| AI generated application content | this table | planned |
| Quest and AI agent screens as the track's app surface | this table | planned |

### AI LAYER SHIPPED 29-08-2026, ON `feat/ai-layer`

Most of this track is no longer planned. What landed, and the three decisions
that contradict what is written elsewhere in this file:

- **It does not live in an `AGENTS` folder.** The line in PROJECT above says
  the agentic layer will, and it does not. It is
  `BACKEND/src/services/ai/`, seven files, decided by the owner on
  29-08-2026. A top level module would have needed its own build, its own
  lockfile and its own deployment for code whose whole job is calling the
  services that already sit in `BACKEND`. `AGENTS` is not coming back.
- **The storage hold was partially reopened, narrowly.** Two Prisma models
  were added, `AiDraft` and `KbChunk`. Neither touches the user, quiz or
  tracker shapes that the hold exists to protect: `AiDraft` is a review queue
  keyed by nothing, and `KbChunk` is a rebuildable index that
  `npm run ai:reindex` recreates from scratch. The hold still stands for
  everything else, and conversation transcripts were deliberately left out
  because storing them would be a real schema decision.
- **Postgres now requires the `vector` extension.** `docker-compose.yml` runs
  `pgvector/pgvector:pg16` instead of `postgres:16-alpine`, and the migration
  runs `CREATE EXTENSION IF NOT EXISTS vector` before its tables. Upgrading an
  existing local stack may need the `studzee-postgres-data` volume recreated.
  RDS, Neon and Supabase all offer pgvector, so the portability rule in
  PLANNED INFRASTRUCTURE still holds. Atlas vector search would have broken
  it, which is why retrieval is in Postgres rather than Mongo.

Two smaller things worth not rediscovering:

- **The embeddings are 2048 dimensions**, from `nvidia/nemotron-3-embed-1b`,
  established by calling the endpoint rather than reading a datasheet. pgvector
  caps an HNSW index at 2000 dimensions, so there is no vector index at all;
  an exact scan over a few dozen chunks is sub millisecond. If the corpus grows
  into the thousands, move the column to `halfvec(2048)` and index that.
- **`AI_ENABLED` defaults to false and is the only off switch.** Nothing in the
  layer runs without it: no routes, no nightly job. Enabling it without
  `AI_API_KEY` fails at boot rather than on the first call.

| Piece | State after this branch |
| ----- | ----------------------- |
| AI generated application content | done, from a title and a brief, into a review queue |
| In app support agent, small model | done, retrieval only, no account access |
| Newsletter agent with draft and approval gate | done as push copy drafting, not email |
| Quest generation | done, from an existing document |
| Quest recurrence, daily and weekly templates | still planned |
| AI agent with subscription or bring your own key | still planned |
| Notification deep links | still planned, no client tap handler exists yet |

The draft queue has no admin UI. Approving a draft is a `POST` to
`/admin/ai/drafts/:id/approve` today, which belongs on the DESKTOP console
list below.

### FUTURE PLANS, DEMOTED 25-08-2026

The owner moved these out of the near term list. Recorded so the shape is not
lost; none are designed or built.

- In app notifications for quizzes and events.
- In app support agent (small model).
- Newsletter agent. The standing house rule holds: it ships with a draft and
  approval gate, never an unattended sender.
- AI agent monetized by subscription or bring your own key; open questions on
  provider list, key storage, usage limits and payments.

### DESKTOP WORK NOTED FOR LATER, 25-08-2026

Owner deferred all DESKTOP work for now. When the console rewrite starts it
needs, at minimum:

- A topic selector on the admin document create and update forms, driven by
  `GET /content/topics` so the registry stays the single source of truth.
- An unlockPoints field on the same forms, since documents can now be gated.
- A badge and level catalog screen reading `src/models/gamification.ts`
  thresholds, read only until thresholds become editable config.
- A progress browser over `GET /progress/me` shaped data per user, once an
  admin scoped variant of that endpoint exists.

## NOTES

- The current working branch is `feat/v2-architecture`. The entire codebase is being rewritten.
- Convex is being removed from the project entirely. Do not consider it in any design or implementation.
- The starting state of the modules is documented in [`V2-ARCHITECTURE-REVIEW.md`](V2-ARCHITECTURE-REVIEW.md). It is a point in time record, so read its status header before treating any finding as still open.
- The v1 CI pattern is preserved in [`WORKFLOW-SAMPLE.md`](WORKFLOW-SAMPLE.md) for reference when `.github/workflows` is rewritten.

### KNOWN ENVIRONMENT ISSUES ON THIS MACHINE

- **The Vitest suite runs here now.** Resolved 13-08-2026. Defender no longer quarantines `node_modules/@esbuild/win32-x64/esbuild.exe`, so the ts-node workaround is retired.
- **`make` is installed.** GNU Make 4.4.1, added 14-08-2026 with `winget install ezwinports.make`. It lands in the WinGet Packages directory and is added to the user PATH, so an already open shell needs restarting before it resolves. Every target in `BACKEND/Makefile` was repaired the same day, including the three that shelled into a container that did not exist. `make check` runs the three CI gates.
- **Compose v2 only.** The `docker-compose` v1 binary is not installed. Every command is `docker compose`, the plugin subcommand. Older docs and Makefile targets calling `docker-compose` failed for this reason.
- **Do not use the PowerShell `Get-Content -Raw` plus `Set-Content` pattern on files containing non-ASCII characters.** PowerShell 5.1 reads them as ANSI and writes UTF-8, which corrupts box drawing characters in the readme directory trees. Use the Edit tool, or `[System.IO.File]::ReadAllText` with an explicit UTF8 encoding.

### OPEN WORK

- **Integration suite `content.route.test.ts` times out, open as of 25-08-2026.** Its `beforeAll` calls `setupTestDatabases()` under the default 10 second hook timeout while its own `afterAll` declares 20 seconds, and on this machine the Mongo and Redis connect exceeds 10 seconds even with both containers healthy. Confirmed pre-existing: it fails the same way with the service layer reverted to the merge base. Not caused by any heatmap or tags work; every other suite passes. Fix direction: raise the hook timeout to match `afterAll`, or make `setupTestDatabases` faster, then confirm in CI where Linux timings differ.

- **Features the owner is planning, stated 18-08-2026, elaborated 21-08-2026.** A user tracker that saves a user's quiz results, and surprise or scheduled quizzes derived from that response history. See [PLANNED CONTENT AND GAMIFICATION FEATURES](#planned-content-and-gamification-features) above for the full breakdown: the gamified tracker, a generic topic tag content model plus a blog section, JSON toward Markdown content authoring, and profile section gamification. Do not build or design them yet, the data storage layer this depends on is still on hold.

- **Resolved 21-08-2026, not by a backend change.** Devices running the released MOBILE 1.1.4 were calling `POST /noti/api/register`, which nothing served. A `/noti/api` compat mount was added in `index.ts` the same day, then removed once the owner confirmed those devices are now updated to call `/notifications/register` directly. Nothing calls the old path any more, so there is nothing to repoint.
- **`.github` was brought up to date on 14-08-2026.** The website and notification workflows were deleted, both having built directories removed on 10-08-2026. `SECURITY.md` and `CONTRIBUTING.md` no longer list them as supported services or valid commit scopes. `.github/README.md` keeps its roadmap content but now carries a status header separating intent from what exists, and the sections describing NOTIFICATION as a separate service, a web client, and Terraform and Kubernetes as present tense are corrected. Two workflows remain: `docker-backend.testing.yml` and `bug-reproduction-instructions.yml`.
- **`.github/README.md` is deliberately not a full rewrite.** The v2 architecture is not settled, so rewriting the architecture sections would mean inventing decisions that have not been taken. It is marked as roadmap instead. Revisit once the data storage layer is specified.
- **Backend workflow items left open on 14-08-2026, deliberately not changed:**
  - There is no Postgres service container. Nothing in the suite opens a Postgres connection today because the readiness and notification tests mock Prisma, but `globalSetup.ts` still hands out a `DATABASE_URL` pointing at `localhost:5432`. The first test that touches Prisma unmocked will fail in CI with a connection error rather than a useful message.
  - CI runs `redis:7-alpine` while compose runs `redis/redis-stack:latest`. Harmless while `cache.ts` uses only `SCAN` and `DEL`, which is the case today. Any RediSearch or RedisJSON use would pass locally and fail in CI.
  - `npm run fmt:check` became a gate on 14-08-2026, once `.gitattributes` forced LF in the working tree. `make check` now runs four gates, not three.
  - Action versions are floating major tags rather than commit SHAs.
  - Docker Hub login uses `DOCKER_PASSWORD` rather than a scoped access token.
- **Fixed 20-08-2026.** `hooks/useNotificationPermissions.ts` in MOBILE used to read `registerToken` from a context that did not declare it. `NotificationContext` now exposes it for real. That fix also caught a live bug: the auto-register effect depended on `[user, getToken]`, and Clerk's `getToken` is not referentially stable, so the effect refired on every render the registration flow caused itself, sending dozens of duplicate `POST /notifications/register` calls in one session until the backend answered 429. Fixed by keying the effect on the signed-in email and reading `getToken` through a ref. See `MOBILE/studzee.design.mobile.expo.md` for the full notification flow.
- **Extend the backend test coverage.** Done on 14-08-2026, 49 to 91 percent, no file at 0. What remains is 43 statements across `email.service.ts`, `content.service.ts`, `expo.service.ts` and `health.route.ts`, which are transport, retry and timeout branches needing a fake SMTP or Expo endpoint to reach. Treat this as finished unless a specific bug points at one of them. See the `coverage.exclude` list in `vitest.config.ts` for what is exempt.

### CLERK

- **Auth was verified end to end against a real Clerk token on 14-08-2026** using the local `clerk-auth-demo` probe at `D:\Projects\clerk-auth-demo`, which vends a real RS256 session JWT on `http://127.0.0.1:9889/token`. `BACKEND/.env` already holds real keys for the same instance, `ultimate-redfish-38.clerk.accounts.dev`, so the host process verifies those tokens without any reconfiguration. Results: 401 without a token and on a garbage bearer, 200 with a real JWT, 403 on the admin surface for a token whose user has no role, 200 for one with `publicMetadata.role = "admin"`.
- **The test suite does not need the compose stack.** Only
  `src/tests/integration/content.route.test.ts` touches a real database; the
  other 39 files mock everything. Export `MONGO_URI_TEST` and `REDIS_URL_TEST`
  from `.env` and the whole suite runs against the deployed Atlas, Upstash and
  Neon instances. `globalSetup` forces `DB_NAME=Studzee_Database_Test`, so the
  reads land on an empty database inside the real cluster and write nothing;
  the assertions are already guarded for an empty result. Redis is the one
  real side effect: the cached content keys the suite writes are the same keys
  the live API writes, with the same TTLs. Against the compose Redis the
  suite's `beforeAll` exceeds the default 10s `hookTimeout`; against Upstash
  it connects in well under a second.
- **The container cannot verify any real token today.** `.env.container` carries 18 character placeholder Clerk keys, so every authenticated request against the containerized API fails. That file is tracked in git, so real keys must come from the deploy environment and must never be written into it.
- **Admin is granted by hand in the Clerk dashboard.** `requireAdmin` reads `publicMetadata.role === 'admin'` and no code path sets it. Provisioning an admin is a deploy runbook step that does not exist yet.
- **`requireAdmin` calls `clerkClient.users.getUser` on every admin request**, uncached. That is a network round trip per request, adding latency and exposure to Clerk rate limits in production. Carrying the role on the session token through a Clerk JWT Template would remove it; the dev instance has zero templates configured.
- **One Clerk SDK as of 14-08-2026.** `@clerk/clerk-sdk-node` is gone. `clerkClient` and `clerkMiddleware` both come from `@clerk/express`, and `@clerk/backend` 2.x is a direct dependency for its types. Two things to know if this is touched again: `src/types/express.d.ts` is required, because `@clerk/express` declares `Request.auth` in module scope and that does not reach the global Express namespace; and the type must be `SessionAuthObject`, not `AuthObject`, because in v2 the latter widened to include machine tokens that carry no `userId`.
- **Line endings are LF everywhere, enforced by `.gitattributes`.** Do not remove `* text=auto eol=lf`. Without it, `core.autocrlf=true` on Windows rewrites the working tree to CRLF, Prettier flags every line, and the `fmt:check` CI gate fails while CI itself, checking out on Linux, passes.
- **Reduce the Prisma weight in the production image.** The image is 692MB after the 13-08-2026 slimming, and roughly 105MB of what remains is the `prisma` CLI plus `effect` and `typescript` pulled in behind it. They ship only because the container runs `prisma migrate deploy` on start, which forces the CLI to be a runtime dependency. Moving migrations to a separate one-off job would recover it, but that changes how the service deploys and is the owner's call.
- **Test the backend once it is deployed.** Asked for by the user on 11-08-2026. Everything so far has been verified against localhost. After the next deploy, exercise the same routes against the deployed URL: readiness against the real Mongo, Postgres and Redis, an upload round trip against the real Supabase buckets, and push registration. The renamed and new environment variables have to be set in the deployed environment first or the service will not boot.

- Add things the user wants Claude to remember here as the project progresses.
