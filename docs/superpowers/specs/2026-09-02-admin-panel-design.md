# ADMIN PANEL DESIGN

## STATUS

Approved by the owner on 02-09-2026. Next step is an implementation plan via
the writing-plans skill.

## CONTEXT

`DESKTOP` (the Electron admin console) is paused. This spec replaces it with
`ADMIN`, a Next.js web app, added as a fourth module alongside `BACKEND`,
`MOBILE` and `DESKTOP`. `DESKTOP` is not deleted, just no longer the target
for new admin work; its old feature list (`ApplicationsPage`,
`EmailTemplatesPage`, `DocumentEditorPage`, `DocumentsPage`, `EmailLogsPage`,
`EmailPage`, `ImagesPage`, `PDFsPage`, `PushNotificationPage`, `QuestsPage`,
`UploadImagePage`, `UploadPDFPage`, `UsersPage`) is the reference for what an
admin console needs, cross-checked against what `BACKEND` actually serves
today.

`D:\Projects\dashboard` is a separate, already-scaffolded Next.js project: a
generic e-commerce dashboard template (billing, orders, products, customers,
campaigns, channels, reports, roles, team, transactions) with a full design
system documented in `style-docs/design.md`, `style-docs/tray-card.md`,
`style-docs/sidebar.md` and `style-docs/scrollbar.md`. Per the owner, that
project is a **style sample only** — its domain pages are not reused, its
design system (tokens, component patterns, `<Shell>`, tray-card, tables,
forms, charts) is reused verbatim.

`BACKEND`'s actual admin surface, read from `src/api/routes/admin.route.ts`,
is the contract this spec builds against:

| Area | Routes |
| ---- | ------ |
| Documents | `POST/PUT/DELETE /admin/documents[/:id]`, `POST /admin/documents/:id/upload-image`, `POST /admin/documents/:id/upload-pdf` |
| Notifications | `POST /admin/notifications/send`, `GET /admin/notifications` |
| Email | `POST /admin/emails/send`, `GET /admin/emails/logs` |
| Users | `GET /admin/users`, `GET /admin/users/emails` |
| Quests | `POST /admin/quests`, `GET /admin/quests` |
| AI generation | `POST /admin/ai/generate/{content,quiz,notes,quest,notification}` |
| AI drafts | `GET /admin/ai/drafts`, `GET /admin/ai/drafts/:id`, `POST /admin/ai/drafts/:id/approve`, `POST /admin/ai/drafts/:id/reject` |
| AI knowledge base | `POST /admin/ai/kb/reindex` |

All of it sits behind `clerkAuthMiddleware, requireAuth, requireAdmin` —
a Clerk session whose `publicMetadata.role === 'admin'`. `GET /content/topics`
(outside `/admin`, but admin-relevant) backs the topic selector `.docs/TCSK.md`
calls for on document forms. `unlockPoints` on documents and a read-only
badge/level catalog are the same TCSK note; a per-user progress browser is
explicitly deferred there pending an admin-scoped `GET /progress` variant that
does not exist yet, so it is out of scope here.

`ApplicationsPage` and an email-templates screen exist in `DESKTOP` but have
no matching `BACKEND` route today (no `/admin/applications`, no
`/admin/emails/templates`) — dropped from this spec's scope, per owner
decision, rather than built as placeholders against nothing.

## OWNER DECISIONS TAKEN IN THIS SESSION

| Question | Answer |
| -------- | ------ |
| Repo location | `D:\Projects\Studzee\ADMIN`, a new module in this repo |
| Scope | Everything `BACKEND`'s admin API exposes, one design and one plan, not phased |
| Design system | Reused as-is from `D:\Projects\dashboard\style-docs`, domain data swapped |
| Auth and data flow | Clerk Next.js middleware; server-side fetch to `BACKEND`, no separate database |
| Deployment | Vercel |
| Uploads | Next.js Route Handlers proxy the multipart request; the Clerk token never reaches the browser |
| Legacy `DESKTOP` pages with no backend route | Dropped, not stubbed |

## ARCHITECTURE

```
ADMIN/                              sibling to BACKEND, MOBILE, DESKTOP
  app/
    (auth)/sign-in/[[...rest]]/     Clerk hosted sign-in (catch-all route)
    (dashboard)/
      layout.tsx                   <Shell> + Clerk session check + admin-role gate
      page.tsx                     Overview: KPI counts, recent activity
      documents/
        page.tsx                   list (useDataTable: search, topic filter, sort)
        new/page.tsx                create form
        [id]/page.tsx               edit form + image/PDF upload
      quests/
        page.tsx                   list, including expired/withdrawn
        new/page.tsx                create form
      notifications/
        page.tsx                   send form (top) + history table (below)
      email/
        page.tsx                   send form (top) + logs table (below)
      users/
        page.tsx                   read-only list
      ai-drafts/
        page.tsx                   list, filter by kind and status
        [id]/page.tsx               review payload, edit overrides, approve/reject
      settings/
        page.tsx                   KB reindex trigger, signed-in admin profile
    api/
      documents/[id]/upload-image/route.ts   Route Handler, proxies multipart to BACKEND
      documents/[id]/upload-pdf/route.ts     Route Handler, proxies multipart to BACKEND
  lib/
    backend.ts                     server-only fetch client: base URL from env,
                                    attaches the Clerk session token, one typed
                                    function per BACKEND admin route
    schemas.ts                     zod schemas mirroring BACKEND's validation
                                    (document, quest, notification, email, ai
                                    draft) for client-side form validation only;
                                    BACKEND remains the source of truth
  components/dashboard/            ported from D:\Projects\dashboard: shell,
                                    sidebar, mobile-nav, tray-card, cards
                                    (KpiCard, StatusBadge), use-table (the
                                    useDataTable hook), add-dialog, charts,
                                    theme-toggle
  middleware.ts                    clerkMiddleware(), protects everything under
                                    (dashboard), redirects to sign-in
```

Nav sections in the sidebar: Overview, Documents, Quests, Notifications,
Email, Users, AI Drafts, Settings — each `label` matching its page's `active`
prop exactly, per the sample's `<Shell>` contract.

### Auth

`@clerk/nextjs` middleware protects every route under `(dashboard)`. The
layout is a server component; it reads `sessionClaims.publicMetadata.role`
and renders a "not authorized" screen if it is not `'admin'`, mirroring
`BACKEND`'s `requireAdmin`. This is a UI-level gate for a fast, friendly
rejection — `BACKEND` independently re-checks `requireAdmin` on every request
regardless of what the UI decided, so a bypassed client check cannot reach
real data.

Admin role is granted by hand in the Clerk dashboard today (per
`.docs/TCSK.md`), same as it is for `BACKEND` — no provisioning flow exists
and none is added here.

### Data flow

Server Components call `lib/backend.ts` directly: server-side `fetch`, the
Clerk session token from `auth().getToken()`, no client-side API key.
Mutations (create, update, delete, send, approve, reject) are Next.js Server
Actions calling the same client, which keeps the token server-side and gives
`revalidatePath` after a write for free — no client-side cache layer is
added.

Uploads are the one case that genuinely needs a browser round trip, since a
`File` object cannot cross a Server Action boundary the way JSON can. Those
two routes are Route Handlers: the browser posts a normal `<form>` /
`FormData` to `app/api/documents/[id]/upload-image` (or `upload-pdf`), the
handler attaches the Clerk token server-side and re-streams the multipart
body to the matching `BACKEND` route, and returns its response untouched.

### Pages to backend routes

Already tabulated in Context above; repeated here as the page-to-route map
that drives each `lib/backend.ts` function:

- **Documents** — `POST/PUT/DELETE /admin/documents[/:id]`, the two upload
  routes, `GET /content/topics` for the topic selector on create/edit. Forms
  carry `unlockPoints` per the TCSK note.
- **Quests** — `POST /admin/quests`, `GET /admin/quests`. The create form
  branches on quest type: graded types show a question builder (payload),
  `read_blog` shows a document picker (`contentId`) sourced from the
  documents list.
- **Notifications** — `POST /admin/notifications/send`, `GET
  /admin/notifications`.
- **Email** — `POST /admin/emails/send`, `GET /admin/emails/logs`.
- **Users** — `GET /admin/users`, `GET /admin/users/emails` (the latter feeds
  a recipient picker on the notification/email send forms).
- **AI Drafts** — the five `POST /admin/ai/generate/*` routes (triggered from
  context, e.g. a "Generate quiz" action on a document's page, not a
  standalone form), `GET /admin/ai/drafts[/:id]`, approve, reject, and
  `POST /admin/ai/kb/reindex` (surfaced on Settings, since it is a
  maintenance action rather than a per-record one).

AI draft review is the one page with bespoke layout instead of the generic
table/form pattern: a draft's `payload` shape depends on its `kind` (quiz
questions, key notes, quest fields, notification copy, full document), so
`[id]/page.tsx` renders a kind-specific preview component with an inline
"overrides" editor before Approve, matching how `POST
/admin/ai/drafts/:id/approve` accepts an `overrides` body merged over the
payload before re-validation.

### Overview KPIs

Pulled from existing list endpoints rather than a new aggregate route:
registered user count (`GET /admin/users`), active quest count (`GET
/admin/quests`, filtered client-side on `endsAt`), pending AI draft count
(`GET /admin/ai/drafts?status=pending`). No new `BACKEND` endpoint is needed
for this.

### Error handling

`BACKEND`'s `appError` responses (`{ message, code }`) surface as toasts
(`sonner`, already a shadcn-ecosystem dependency, used the same way the
sample project would) on a Server Action failure. Route Handlers pass
`BACKEND`'s status code and body through unchanged rather than wrapping them.
A 401 or 403 from `BACKEND` — a stale or insufficient Clerk session — redirects
to sign-in rather than rendering an error state, since that's not a state the
admin can act on from the page they're on.

## DESIGN SYSTEM

Reused verbatim from `D:\Projects\dashboard\style-docs`: the OKLCH token set
(achromatic, `--chart-*` ramp, semantic status colors), Geist sans/mono
typography rules, the radius ramp, `<Shell>` layout, tray-card pattern,
`useDataTable` + `<Th>` + `FilterPills` + `TablePagination` table
composition, `<AddDialog>` field-array forms, Hugeicons (never `lucide-react`
in app code, despite it being a transitive shadcn dependency), the three
chart flavors, and dark mode via `.dark` + the blocking inline script. Full
detail lives in that project's `style-docs/design.md`,
`style-docs/tray-card.md`, `style-docs/sidebar.md` and
`style-docs/scrollbar.md` — treat those as the authoritative reference during
implementation rather than re-deriving the same tokens here.

Domain swap only: `products` → `documents`, `orders` → `quests`,
`customers` → `users`, `campaigns`/`messages` → `notifications`/`email`, and
a new `ai-drafts` concept the sample has no equivalent for (closest pattern
is its generic list+detail composition, reused rather than invented fresh).

## TESTING

Vitest + React Testing Library, mirroring `BACKEND`'s own house pattern of
`vi.spyOn` over a real HTTP client (see
`src/tests/unit/services/expo.service.test.ts`) rather than an HTTP-mocking
library:

- `lib/backend.ts` — one test per function, `vi.spyOn(global, 'fetch')`,
  confirms the bearer token is attached and the right method/path/body is
  sent.
- `components/dashboard/use-table.tsx` (ported) — search, filter, sort,
  pagination behavior, carried over from the sample if it already has
  coverage, else written fresh.
- Form validation — `lib/schemas.ts` zod schemas tested directly (invalid
  quest `passScore`, an empty quiz option, etc.), same shapes `BACKEND`
  itself rejects.
- No end-to-end tests in this round.

## ENVIRONMENT

Variable names carried over from `BACKEND/.env.example` and
`MOBILE/.env.example` (same Clerk instance every module already shares — the
same admin Clerk account that has `publicMetadata.role = 'admin'` works
across `MOBILE`, `BACKEND` and `ADMIN` without separate provisioning):

| Var | Source convention | Notes |
| --- | ------------------ | ----- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `CLERK_PUBLISHABLE_KEY` in `BACKEND/.env.example`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `MOBILE` | Next's `NEXT_PUBLIC_` prefix is what makes a var reach the browser bundle |
| `CLERK_SECRET_KEY` | `BACKEND/.env.example` | Server-only, used by Clerk's Next.js middleware |
| `BACKEND_API_URL` | `EXPO_PUBLIC_BACKEND_API_URL` in `MOBILE/.env.example` | Server-only in `ADMIN` (no `NEXT_PUBLIC_` prefix) since every call is server-side; example value `https://studzee-api-latest.onrender.com`, matching where `MOBILE` points today |

`ADMIN/.env.example` is added with these three vars and no others — no
database URL, no storage credentials, nothing `BACKEND` already owns.

## DOCUMENTATION AND PROCESS

Per `.docs/RULES.md`, committed with the implementation:

- `.docs/RECORDS.md` — a row for the new `ADMIN` module
- `WORKLOG.md` — a dated entry
- `ADMIN/README.md` — setup, the three env vars, `npm run dev`, deployment note
- `.docs/TCSK.md` — record that `DESKTOP` is paused in favor of `ADMIN`, and
  close out the "DESKTOP WORK NOTED FOR LATER" section's topic-selector and
  `unlockPoints` items as addressed by this module (the badge/level catalog
  and progress-browser items stay open, the latter still blocked on an
  admin-scoped `GET /progress` endpoint that does not exist)
- `CLAUDE.md`'s module table gains an `ADMIN` row

Branch off `main`, Conventional Commits with real bodies scoped
`feat(admin):`, no model or vendor trailer in the body itself (the
attribution trailer required by this session's system instructions is
separate from and additional to that house rule), PR opened for the owner to
merge.

## DEFERRED, AND WHEN TO ADD IT

- **A per-user progress browser.** Blocked on an admin-scoped `GET /progress`
  variant that does not exist in `BACKEND` yet, per `.docs/TCSK.md`. Add once
  that endpoint ships.
- **Editable badge/level thresholds.** They are compile-time constants in
  `src/models/gamification.ts` today; a read-only catalog screen is in scope,
  an editing UI is not until the thresholds themselves become config.
- **`DESKTOP`'s Applications and Email Templates pages.** No backing
  `BACKEND` route exists for either. Add if and when a route is built for
  them.
- **Docker/Fargate deployment.** Vercel is the decided target for this round;
  revisit only if the owner later wants `ADMIN` on the same release pipeline
  as `BACKEND`.
- **A separate `ADMIN` database.** None is needed or added — `BACKEND`
  remains the single source of truth for every read and write.
