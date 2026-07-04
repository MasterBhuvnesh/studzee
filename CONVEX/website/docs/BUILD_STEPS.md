# Studzee — E-Learning Platform: Build Steps

> System Design + DevOps learning paths, with topic blogs, quizzes, a RAG AI chat
> (saved history), AI quiz + summary, a topic graph, notifications, author pages, and a
> Clerk-billing plan switcher — all built **inside `website/`**. Marketing landing stays at `/`.

## Status — all phases built ✅
Phases 0–8 are code-complete and verified: `tsc --noEmit` clean, `eslint` clean,
`npx convex dev` pushes all functions + the `chunks` vector index, seed inserted
2 authors + 8 topics, and `npm run dev` serves the marketing site and app routes.
What's left is **runtime config** (keys), below — the code is done.

## To run it fully (your steps)
1. **Convex (local) is already configured.** Keep it running: `npx convex dev`.
2. **NVIDIA (AI quiz, summary, chat):**
   - `npx convex env set NVIDIA_API_KEY <your-key>`
   - Embedding dimension is confirmed **4096** and already set in
     `convex/model/embeddings.ts` (`npx convex run rag:probeDim` re-checks it).
   - `npx convex run rag:reindex` → embeds the content so chat retrieval works.
3. **Clerk (auth + billing):** add to `website/.env.local`
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`;
   then `npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-issuer>` (replaces the
   placeholder). In the Clerk dashboard: create a **Convex JWT template** (add `pla`
   + `fea` claims), enable **Billing**, and create plans `explorer`/`learner`/`pro`
   with features `ai_summary`/`ai_quiz`/`ai_chat`.
4. `npm run dev` → open http://localhost:3000. Restart dev after editing `.env.local`.

Until keys are set the app still boots (auth off, AI returns a clear "key not set"
error, billing page shows a setup hint).

## Stack (locked)
| Concern | Choice |
|---|---|
| Frontend | existing Next.js 16 / React 19 / Tailwind 4 / shadcn (radix-mira, hugeicons, dark) |
| Backend | **Convex** |
| Auth | **Clerk** |
| Billing | **Clerk Billing** (`<PricingTable/>`) |
| AI | **NVIDIA NIM** (OpenAI-compatible REST) |
| Chat model | `nvidia/nemotron-3-ultra-550b-a55b` (stream + reasoning) |
| Embeddings | `nvidia/nv-embedcode-7b-v1` (swappable via `EMBED_MODEL`) |
| Vector search | Convex **native** (no Pinecone) |
| Content | **seed files** (no CMS in v1) |

## Interpretations (confirm if wrong)
- **Topic = Blog (1:1).** Each blog is a graph node; its `slug` is the topic id; `linkedSlugs[]`
  are graph edges; path cards count blogs. (Many-blogs-per-topic would split the schema.)
- **Chat = one global RAG chat** over all blog content, saved per user. Opening chat from a blog
  seeds it with that blog as context ("Ask about this topic").
- **`nv-embedcode-7b-v1` is code-oriented** — kept as default, exposed as a knob; swap to a
  text-QA embedding model (e.g. `llama-3.2-nv-embedqa-1b-v2`) for prose-heavy retrieval.
- Progress = **mark-as-read**; quiz status tracked separately (not attempted / passed / failed + score).

---

## Prerequisites (one-time, manual)
- [ ] `website/.env.local`: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
      `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`.
- [ ] `npx convex env set NVIDIA_API_KEY <key>`.
- [ ] Clerk Dashboard → enable **Billing**; create plans `explorer` (free) / `learner` (₹19) /
      `pro` (₹69) with features `ai_chat`, `ai_summary`, `ai_quiz`.
- [ ] Clerk Dashboard → **JWT template** for Convex, adding `pla` (plan) + `fea` (features) claims
      so the backend can gate features.

## Dependencies to add (in `website/`)
- `convex`, `@clerk/nextjs`
- `react-force-graph-2d` (topic graph) — *not React Flow (avoids manual layout)*
- **No AI SDK** — call NVIDIA via `fetch` (OpenAI-compatible wire format) → stays in Convex's
  default runtime, no `"use node"`.
- shadcn: `card badge progress dialog dropdown-menu avatar tabs skeleton sonner separator scroll-area radio-group textarea`.

---

## Convex data model (`convex/schema.ts`)
- **authors** — `slug, name, avatar, role, bio, socials{}` · idx `by_slug`
- **blogs** (topic node) — `path("system-design"|"devops"), slug, title, authorId, tags[],
  shortDescription, facts[], description, bannerImg, summary,
  quiz[{question, options[4], answerIndex}] × 10, linkedSlugs[], order, createdAt` · idx `by_path`, `by_slug`
- **progress** — `userId, blogSlug, read, readAt` · idx `by_user`, `by_user_blog`
- **quizAttempts** — `userId, blogSlug, score, total, passed, attemptedAt` · idx `by_user`, `by_user_blog` (upsert best)
- **notifications** — `userId, title, body, type, link?, read, createdAt` · idx `by_user`
- **chats** — `userId, title, blogSlug?, createdAt, lastMessageAt` · idx `by_user`
- **messages** — `chatId, role("user"|"assistant"), content, reasoning?, done, createdAt` · idx `by_chat`
- **chunks** (RAG) — `blogSlug, text, embedding:number[EMBED_DIM]` ·
  `vectorIndex("by_embedding", { vectorField:"embedding", dimensions:EMBED_DIM, filterFields:["blogSlug"] })`

`userId` = `ctx.auth.getUserIdentity().subject` throughout (no `users` table — Clerk is source of truth).

**Note:** `EMBED_DIM` is fixed by the embedding model (~3584/4096). Capture it from the first
`/embeddings` response and hard-set it before writing the vectorIndex.

---

## NVIDIA NIM helper (`convex/nim.ts`)
Base `https://integrate.api.nvidia.com/v1`, bearer `NVIDIA_API_KEY`.
- **Chat** — `POST /chat/completions`, model `nvidia/nemotron-3-ultra-550b-a55b`, `stream:true`,
  `chat_template_kwargs:{enable_thinking:true}`; parse SSE, split `reasoning_content` vs `content`.
- **Embeddings** — `POST /embeddings`, model `nvidia/nv-embedcode-7b-v1`,
  `extra_body:{input_type:"query"|"passage"}`.
- One `assert`-based self-check on the SSE/JSON parser.

## AI features (`convex/ai.ts`)
- **Chat (RAG, streaming, saved)** — embed user query → `ctx.vectorSearch` top-k `chunks`
  (optional `blogSlug` filter) → grounded prompt → stream Nemotron, patching the assistant
  `messages` row (content + reasoning) as deltas arrive. History persists automatically.
- **generateQuiz({ blogSlug | "random" })** — 5 MCQs, strict JSON + fallback · feature `ai_quiz`.
- **summarize({ blogSlug })** — short AI summary on the blog page · feature `ai_summary`.
- Gate everything via `requireFeature(ctx, ...)` reading `pla`/`fea` from the identity token.

---

## Frontend routes (`src/app`)
Marketing stays at `src/app/page.tsx`. Product lives under an `(app)` route group with a shell
(sidebar: Dashboard / Learn / AI Chat / AI Quiz / Settings; topbar: notification bell + `<UserButton/>`).

- `(app)/dashboard` — two **path cards** (topic count + read progress), **topic graph**
  (`react-force-graph-2d`, `ssr:false`, node → blog), **AI Quiz launcher**, **recent chats**
- `(app)/blog/[slug]` — banner, author byline, tags, short desc, facts, description, authored
  summary, **AI quick-summary** (gated), **linked topics**, **Mark as read**, **10-Q quiz**
  (radio-group → `quizAttempts` + status badge), **"Ask about this topic"** → chat
- `(app)/chat` + `(app)/chat/[chatId]` — saved chat list + streaming conversation (bubbles,
  collapsible reasoning)
- `(app)/author/[slug]` — profile + their blogs
- `(app)/notifications` — full list + mark-all-read; bell shows unread count
- `(app)/settings/billing` — Clerk `<PricingTable/>`
- `sign-in/[[...sign-in]]`, `sign-up/[[...sign-up]]`

Auth wiring: `src/app/providers.tsx` (`ClerkProvider` → `ConvexProviderWithClerk`) in root layout;
`convex/auth.config.ts` (Clerk issuer); `src/middleware.ts` `clerkMiddleware` protecting `(app)`.
Reuse `cn` (`@/lib`), fonts, brand tokens, hugeicons, shadcn `button`; keep the dark radix-mira look.

## Notifications
Emitted from mutations: welcome on first authed load; on quiz **pass**. Bell = `unreadCount` +
recent dropdown; `/notifications` = full list; `markRead` / `markAllRead`.

## Billing
Clerk Billing only. `/settings/billing` = `<PricingTable/>` (handles checkout + subscription).
Gate UI with `<Show when={{ plan }}>` / `has({ feature })` (`<Protect>` is deprecated). Backend
gate via `requireFeature`.

---

## Phases (build order)
0. **Docs** — this file.
1. **Foundation** — deps, `convex dev` init, providers, middleware, sign-in/up, `(app)` shell → app boots authed.
2. **Data + seed** — schema, seed content (`convex/content/*`), indexes; verify rows.
3. **Blog + author** — blog detail, mark-as-read, author page, 10-Q quiz + status badge.
4. **Dashboard** — path cards, graph, quiz status.
5. **AI core** — `nim.ts` + `requireFeature`; `generateQuiz` + `summarize`; AI Quiz launcher + summary button.
6. **RAG chat** — `chunks` vectorIndex + `reindex` action; chat action (embed → vectorSearch →
   stream); `/chat` list + view; "Ask about this topic".
7. **Notifications** — bell + screen + emits.
8. **Billing** — Clerk plans + `<PricingTable/>` + gating.

## Verification
- Per phase: run `npm run dev` + `npx convex dev`; click the new route; confirm rows/logs via the
  Convex MCP (`tables`, `data`, `logs`, `run`).
- **End-to-end smoke:** sign in → dashboard shows 2 cards + graph → open a topic → mark read (bar
  moves) → take the 10-Q quiz (badge → passed, notification appears) → run AI quiz (5 Qs) + AI
  summary → **AI chat** streams a grounded answer citing seeded content; reload `/chat` and the
  conversation is still there → `/settings/billing` switch plan unlocks a gated feature.
- Self-checks: SSE/JSON parser and quiz-JSON parser each ship an `assert` demo.

## Out of scope (v1)
Admin CMS, real push notifications, Clerk webhooks / user-table sync, `@convex-dev/rag` component,
caching AI summaries, multi-model routing.
