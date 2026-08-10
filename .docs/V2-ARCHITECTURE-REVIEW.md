# V2 ARCHITECTURE REVIEW

Review of the existing BACKEND, NOTIFICATION, MOBILE, and DESKTOP modules, carried out on 10-08-2026 before the v2 rewrite. Convex is excluded by decision of the repository owner and is not considered anywhere in this document or in the v2 design.

This document describes what exists today, what it depends on, and what is broken or structurally wrong. It does not propose the v2 design. That comes after the owner defines the v2 scope.

## SCOPE OF THE REVIEW

| MODULE | PACKAGE | VERSION | RUNTIME | ROLE |
| ------ | ------- | ------- | ------- | ---- |
| BACKEND | studzee-api | 3.0.0 | Node 22, Express 4 | Core content API |
| NOTIFICATION | studzee-notification-api | 1.5.1 | Bun 1.1, Express 4 | Push and email delivery |
| MOBILE | studzee | 1.1.4 | Expo SDK 54, RN 0.81.5 | Learner client |
| DESKTOP | studzee | 1.0.0 | Electron 39, electron-vite 5 | Admin console |

## SYSTEM MAP AS BUILT

Both clients talk to two independent HTTP services. There is no gateway, no queue, and no service to service call.

```
MOBILE  --> https://api.studzee.in            (BACKEND: content, pdfs, health)
MOBILE  --> https://api.studzee.in/noti/api   (NOTIFICATION: token registration)
DESKTOP --> /api  proxied to api.studzee.in   (dev server only, see DESKTOP defects)
CLERK   --> NOTIFICATION /api/webhooks/clerk  (user.created, welcome email)

BACKEND      --> MongoDB (content), Redis (cache), AWS S3 (images, pdfs), Clerk (auth)
NOTIFICATION --> PostgreSQL via Prisma (users, logs), SMTP, Expo push API, Clerk (auth)
```

Two databases with no relationship between them. Content lives in MongoDB, users live in PostgreSQL and in Clerk. Nothing links a user to content, so per-user state such as progress, bookmarks, quiz results, or history is not representable in the current schema.

## BACKEND

### ARCHITECTURE

Layered Express application with the path alias `@/` resolving to `src`. Build is `tsc` plus `tsc-alias`, development runs on `ts-node-dev`, tests run on Vitest.

Layout is `api/routes` to `api/controllers` to `services` to `models`, with `config`, `middleware`, `jobs`, `utils`, `types`, and `cli` alongside. Environment is parsed and validated by Zod at import time in `src/config/index.ts` and the process throws on invalid configuration, which is correct behavior.

### DATA MODEL

One Mongoose model, `Document`, stored in the `content` collection.

```
title       string, indexed, text index with summary
content     Schema.Types.Mixed, required
quiz        Map of { que, ans, options[] }
facts       string
summary     string
key_notes   Map of string
imageUrl    string
pdfUrl      array of { name, url, uploadedAt, size }
timestamps
```

`content` is an untyped blob. The MOBILE client independently declares it as `ContentSection[]` where each section holds `ContentBlock` values of type text, list, table, formula, or code. The real content contract is enforced only on the client.

### ROUTES

| METHOD | PATH | ACCESS |
| ------ | ---- | ------ |
| GET | `/` | Public, welcome payload |
| GET | `/content` | Public, paginated list, Redis cached |
| GET | `/content/today` | Public, IST day window, Redis cached |
| GET | `/content/:id` | Authenticated, Redis cached |
| POST | `/admin/documents` | Admin |
| PUT | `/admin/documents/:id` | Admin |
| DELETE | `/admin/documents/:id` | Admin |
| POST | `/admin/documents/:id/upload-image` | Admin, multer memory, 10MB |
| POST | `/admin/documents/:id/upload-pdf` | Admin, multer memory, 50MB |
| GET | `/pdfs` | Public, flattened PDF list |
| GET | `/health/liveness` | Public |
| GET | `/health/readiness` | Public, checks Mongo and Redis |
| GET | `/healthcheck` | Public, Render probe |
| any | `/auth` | Mounted but empty |

### CACHING

Cache aside on Redis with keys `content:list:page:N:limit:M`, `content:doc:<id>`, and `content:today`. Every admin write calls `invalidateAllCache`, which uses `redisClient.keys()` with glob patterns and deletes everything matched. A nightly cron re-warms document caches and drops the first list page.

### DEFECTS AND STRUCTURAL PROBLEMS

1. `updateDocument` is broken. `src/services/admin.service.ts` validates updates with a local `documentUpdateSchema` requiring `title`, a string `content`, and optional `tags`. The real document has `content` as an object or array and has no `tags` field. Any genuine update payload fails validation, so `PUT /admin/documents/:id` cannot succeed against real data.
2. The heartbeat job is inverted. `src/jobs/heartbeat.ts` returns early unless `NODE_ENV === 'test'`, and its own log line says the opposite. The Render keepalive therefore never runs in production, which is the only environment that needs it.
3. Helmet CSP reads `process.env.AWS_S3_BUCKET_URL`, a variable that is not part of the validated config and is not defined anywhere. The image source directive resolves to the literal string `undefined`.
4. No `trust proxy` is set, yet the service runs behind Render and an ingress. `express-rate-limit` and any IP based logic see the proxy address, so the 100 requests per 15 minutes limit is effectively global rather than per client.
5. CORS is wide open through a bare `cors()` call.
6. The `DEV_TOKEN` bypass in `src/middleware/auth.ts` grants a synthetic `dev-user-id` and full admin rights whenever `NODE_ENV` is `development` and the token matches. Correct today, but it is one environment variable away from being a production authentication bypass.
7. `redisClient.keys()` is an O(N) blocking scan across the whole keyspace. Acceptable at the current data size, wrong at any scale. `SCAN` or tagged keys are the correct mechanism.
8. Cache invalidation is repo wide. Editing one document drops every cached list, document, and today payload.
9. The IST day window in `getTodayContent` shifts a date forward by the offset, calls `setUTCHours` on the shifted value, then subtracts the offset again. It happens to work but is unreadable and will break on any timezone change.
10. `src/api/routes/auth.route.ts` is an empty router that exists only to keep an import alive, and it is still mounted at `/auth`.
11. Service style is inconsistent. `admin`, `pdf`, and `upload` are classes exported as singletons. `content` is a module of plain functions.
12. Two overlapping health surfaces, `/health/*` and `/healthcheck`, plus the welcome route.
13. `console.log` of the requesting user id sits in `content.controller.ts`.
14. Seed fixtures are committed inside `src`: `today.png` at 1.8MB, `today.pdf` at 110KB, `data.json` at 36KB. They enter the Docker build context and the published image layer.
15. `@types/axios` is a deprecated stub. Axios ships its own types.
16. Test coverage is real but narrow. It covers the content route, content service, content controller, and cache utility. Admin, upload, PDF, S3, and the jobs have no tests.

## NOTIFICATION

### ARCHITECTURE

Bun process running Express 4 with the same `@/` alias convention. Prisma 6 against PostgreSQL. No build step, Bun executes TypeScript directly. Docker image runs `prisma migrate deploy` then starts the server.

### DATA MODEL

```
User          id, clerkId unique, email unique, expoTokens[], timestamps
Notification  id, title, message, imageUrl, sentBy, sentTo[], sentToAll, status, createdAt
EmailLog      id, subject, message, pdfUrls[], sentBy, sentTo[], status, createdAt
SystemLog     id, event, description, metadata json, createdAt
```

`sentBy` and `sentTo` are loose strings and string arrays rather than relations. `SystemLog` is declared and never written to.

### ROUTES

| METHOD | PATH | ACCESS |
| ------ | ---- | ------ |
| GET | `/healthcheck` | Public |
| GET | `/` | Public, welcome payload |
| POST | `/api/register` | Authenticated, registers or updates an Expo token |
| POST | `/api/admin/notification/send` | Admin, 20 per minute |
| GET | `/api/admin/notifications` | Admin, 30 per minute |
| GET | `/api/admin/users` | Admin, 30 per minute |
| GET | `/api/admin/emails` | Admin, 30 per minute |
| POST | `/api/admin/email/send` | Admin, 10 per minute |
| GET | `/api/admin/email/logs` | Admin, 30 per minute |
| POST | `/api/webhooks/clerk` | Public, verified by svix signature |

### DEFECTS AND STRUCTURAL PROBLEMS

1. Webhook signature verification is unsound. `express.json()` runs globally, and `handleClerkWebhook` verifies `JSON.stringify(req.body)`. Svix signs the raw request bytes. Re-serialization changes key order, whitespace, and unicode escaping, so verification depends on the payload happening to round trip identically. This is a security control that can fail open on a shaped payload and can equally reject valid deliveries. The raw body must be captured before JSON parsing.
2. The heartbeat job carries the same inversion as BACKEND. It only schedules when `NODE_ENV === 'test'`.
3. Expo push has no batching. `sendExpoNotification` posts every message in one array to `exp.host`. The Expo API caps a request at 100 messages, so any broadcast beyond 100 registered tokens fails as a whole.
4. Push receipts are never checked. `checkExpoReceipts` exists and is never called, so delivery failures and unregistered devices are invisible.
5. Token cleanup only filters on the `ExponentPushToken[` prefix. Structurally valid but dead tokens are never removed, so the token table grows monotonically.
6. Prisma logs `query` in every environment including production, which writes every SQL statement and its parameters to the application log.
7. `src/routes/index.ts` composes a combined router that nothing imports. `src/index.ts` mounts each router individually. Dead file.
8. Email attachments are passed to nodemailer as `{ path: url }`, so nodemailer fetches arbitrary remote URLs at send time with no size cap, no content type check, and no allowlist. Attachment filenames are generic `attachment-N.pdf`.
9. Both email templates are large hardcoded HTML strings in `utils/mail.ts`, including a hardcoded S3 banner URL and hardcoded marketing copy naming System Design, Machine Learning, and Deep Learning. Content changes require a code deploy.
10. `GenericResponse` uses `any` for both `data` and `error`.
11. `@types/express` is version 5 while the runtime is Express 4, and `@types/node` is version 25. The type surface does not match what executes.
12. Auth middleware, logger, rate limiting, validation, and error handling are near copies of the BACKEND equivalents that have already drifted. Clerk SDK is v5 here and v4 in BACKEND, helmet is v8 here and v7 there.
13. No tests of any kind.

## MOBILE

### ARCHITECTURE

Expo SDK 54 with expo-router 6 file based routing, React 19.1, React Native 0.81.5, NativeWind 4 over Tailwind 3.4, Clerk via `@clerk/clerk-expo`.

Route groups are `(auth)` for onboarding, sign in, sign up, forgot and reset password, `(tabs)` for home, resources, profile, and settings, and `screens` for content, content detail, quiz, PDFs, profile editing, support, feedback, privacy, and terms. Supporting folders are `components`, `contexts`, `hooks`, `lib`, `types`, and `utils`.

### DATA FLOW

`lib/api.ts` exposes four functions built on bare axios calls: `getPdfs`, `getContent`, `getContentById`, and `getTodayContent`. Only `getContentById` sends a bearer token, which the calling screen fetches from Clerk and passes in as an argument. `lib/notifications.ts` registers the Expo push token against the notification service. `lib/storage.ts` and `lib/download.ts` manage downloaded PDFs.

### DEFECTS AND STRUCTURAL PROBLEMS

1. API base URLs are hardcoded to production in `utils/config.ts`. There is no environment switching, so pointing the app at a local or staging backend requires editing tracked source.
2. There is no axios instance and no auth interceptor. Each function repeats its own base URL, its own 10 second timeout, and its own near identical error mapping block. Auth is threaded manually from screens.
3. There is no caching, deduplication, or revalidation layer. Every screen refetches on mount and manages loading, error, and refresh state by hand.
4. Screens are very large and mix fetching, business logic, and presentation: `resources.tsx` at 21KB, `screens/[id].tsx` at 19.8KB, `screens/pdfs.tsx` at 19.4KB, `screens/quiz.tsx` at 13.1KB, `(tabs)/index.tsx` at 12.4KB.
5. The root navigation guard in `app/_layout.tsx` drives redirects from a `useEffect` with a `navigationAttempted` ref, a 100ms `setTimeout` to defer past render, and a second 1000ms timeout to reset the flag. This is a race condition management scheme standing in for declarative route protection.
6. Downloaded PDF metadata is stored in `expo-secure-store` as a single JSON array under one key. SecureStore is backed by the Android Keystore and iOS Keychain and is intended for small secrets. On Android it warns beyond roughly 2KB per entry. This list will silently fail to persist as the user downloads more files. It is also not secret data.
7. The API contract is hand duplicated in `types/api.ts`, with a stale header comment still naming the old Render URL. Any backend change silently desynchronizes the client.
8. `react-native-enriched-markdown` is pinned to a nightly build, `0.4.0-nightly-20260304-a3635dadd`, in a shipping application.
9. `components/content/contentmd.backup.tsx` is a committed backup file.
10. `lib/download.ts` mixes the new `expo-file-system` `File` API with `expo-file-system/legacy` in the same module.
11. Push registration failures are caught and logged only. The user is never told that notifications will not arrive, and there is no retry.
12. The registration effect in `NotificationContext` depends on `getToken`, which is not a stable reference, so registration can re-run more often than intended.
13. `services/google-services.json` is committed. It is build configuration rather than a secret, but it belongs in the build pipeline, not the source tree.
14. No tests and no error boundary.

## DESKTOP

### ARCHITECTURE

electron-vite 5 with three build targets. `src/main` is the Electron main process, `src/preload` bridges to the renderer, `src/renderer` is a React 19 single page app using HashRouter, Tailwind 4, Radix primitives, and shadcn style components under `components/ui`.

The main process creates a frameless 900 by 670 window, drives minimize, maximize, and close over IPC from a custom `TitleBar`, registers the `studzee://` deep link protocol, and enforces a single instance lock.

### CURRENT STATE

This module is a scaffold. Of nine routed pages, eight are placeholder components of about 200 bytes each: Applications, Email, Email Templates, Email Logs, Upload PDF, Upload Image, Images, and Home. Only `PDFsPage` is implemented, and it renders a searchable grid from `usePdfs`.

### DEFECTS AND STRUCTURAL PROBLEMS

1. Data fetching only works in the dev server. `usePdfs` fetches the relative path `/api/pdfs`, which resolves through a Vite dev proxy configured in `electron.vite.config.ts`. In a packaged build the renderer loads from `file://`, the proxy does not exist, and every request fails. The one implemented page is non functional in a real build.
2. The admin console has no authentication. `@clerk/react` is installed and `.env.local` defines `VITE_CLERK_PUBLISHABLE_KEY`, but Clerk is never imported anywhere in `src`. The application is intended to drive admin only endpoints that require a Clerk admin token it cannot produce.
3. Deep linking is half wired. The main process shows a modal dialog with the incoming URL and emits a `deep-link` event to the renderer. No renderer listener exists. The macOS and Linux path uses `dialog.showErrorBox` for a success case.
4. Auto update is not wired. `electron-updater` is a dependency and `Updates.tsx` is gated behind a hardcoded `const update = false`.
5. `sandbox: false` is set in `webPreferences`, and the preload exposes the entire `@electron-toolkit/preload` surface to the renderer, which needs three window control channels.
6. IPC channel names are untyped string literals duplicated on both sides.
7. `GoogleSans.ttf` at 4.7MB is committed into renderer assets.
8. `electron-builder.yml` publishes to the public `MasterBhuvnesh/studzee` repository, which is the wrong distribution channel for an internal admin tool.
9. No state management, no API layer, no error boundary, no tests.

## CROSS CUTTING FINDINGS

1. **Auth is implemented twice and has already drifted.** BACKEND uses Clerk SDK v4, NOTIFICATION uses v5. The middleware files are otherwise near identical copies, including the `DEV_TOKEN` admin bypass. Any fix must be applied twice, and the desktop admin console implements none of it.
2. **The API contract exists in three hand maintained copies.** Mongoose schema plus Zod in BACKEND, TypeScript interfaces in `MOBILE/types/api.ts`, and a local interface inside `DESKTOP/src/renderer/src/hooks/usePdfs.ts`. There is no shared package and no generated client.
3. **Two databases, no user to content relationship.** Users exist in Clerk and are mirrored into PostgreSQL. Content lives in MongoDB. There is no join point, so progress tracking, bookmarks, quiz history, and personalization are impossible without a schema change.
4. **Cron jobs run in process in both services.** Every deployed replica runs every schedule. Any horizontal scaling duplicates the work.
5. **The system is not event driven despite the README.** NOTIFICATION is invoked directly over HTTP. There is no queue in the running system.
6. **`SERVICES/` and `PACKAGES/shared/` contain a previous v2 attempt, committed as build output only.** 54 tracked files, all of them compiled `dist` JavaScript, source maps, and declarations. No source, no `package.json`, so nothing can be built or run. Reading the output shows the intended direction: Fastify with `@fastify/redis`, a Prisma plugin, an AMQP plugin, a Swagger plugin, a shared `@studzee/shared` package providing `loggerOptions` and `registerClerk`, and configuration for RabbitMQ, a Groq hosted LLM, S3, and a RevenueCat webhook secret. This is dead weight in the tree today but it is the clearest existing statement of the v2 target.
7. **Committed environment files.** `BACKEND/.env.docker`, `BACKEND/.env.test.local`, and `K8S/secrets/.env` are tracked. The values read as local Docker and cluster placeholders, and the Clerk keys are too short to be real, but committing env files is against the rules in `RULES.md` and the owner should confirm nothing live ever landed in them or in git history.
8. **Logging is inconsistent.** Both services use pino. BACKEND switches to plain JSON in production. NOTIFICATION always loads the `pino-pretty` transport, which is a development formatter, in every environment.
9. **CI covers containers only.** The workflows build Docker images for backend, notification, and website. No workflow runs the BACKEND test suite, and no lint or typecheck gate exists for any module.
10. **Release flow is a shell script.** `code.sh` drives per module `do-release` scripts that bump versions and push. MOBILE, DESKTOP, and WEBSITE versions are independent and unrelated.

## WHAT IS WORTH KEEPING

- The Zod validated boot configuration in BACKEND. Fail fast on bad environment is correct and should be standard in v2.
- The cache aside pattern and its key naming. The mechanism is right, the invalidation strategy is not.
- The Expo push token registration flow, in shape if not in implementation.
- The DESKTOP renderer component library. Radix and the shadcn style `components/ui` set are reusable regardless of what the console eventually does.
- The MOBILE `ContentBlock` and `ContentSection` model. It is the only real definition of what structured content is, and it belongs in a shared package rather than in the client.
- The layered route, controller, service split in BACKEND. The boundaries are sound even though the contents are inconsistent.

## OPEN QUESTIONS FOR THE OWNER

These change the v2 design materially and cannot be assumed.

1. One database or two. Consolidating content and users into PostgreSQL removes the split brain, but MongoDB currently holds all content and the content shape is genuinely document oriented.
2. One service or several. The compiled `SERVICES` output implies a Fastify plus RabbitMQ split. The live system is two Express services. The traffic today does not require a queue.
3. Whether the desktop admin console stays a desktop application or becomes part of the website. It duplicates what a web admin panel would do, and it currently has no auth and no working data layer.
4. Whether the RevenueCat and LLM configuration found in the old `SERVICES` build is in scope for v2 or was abandoned.
5. Whether v1 data must be migrated, and whether the API must stay backward compatible for already shipped MOBILE builds. Version 1.1.4 is in users' hands and will keep calling the current endpoints.
