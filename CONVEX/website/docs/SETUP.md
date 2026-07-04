# Studzee — Setup Checklist

Everything **you** need to do to make the app fully live. The code is done; these
are config/keys only. Do them in order. Estimated time: ~15–20 min.

> The app already **boots without any of this** (auth off, AI shows a "key not set"
> error, billing page shows a hint). Each step below turns on one capability.

---

## Step 1 — NVIDIA (AI quiz, AI summary, AI chat)

Powers the AI quiz, the blog "AI quick summary", and the RAG chat.

- [ ] **Get a key:** go to <https://build.nvidia.com>, sign in, and create an API
      key (it starts with `nvapi-`).
- [ ] **Give it to Convex** (run in `website/`):
      ```bash
      npx convex env set NVIDIA_API_KEY nvapi-xxxxxxxx
      ```
- [x] **Embedding size is 4096** — already confirmed and set (`nv-embedcode-7b-v1`
      is Mistral-7B-based). Nothing to do. (`npx convex run rag:probeDim` re-checks
      it if you're curious.)
- [ ] **Embed the content** so chat can cite it:
      ```bash
      npx convex run rag:reindex
      ```

✅ After this: AI quiz, AI summary, and AI chat all work.

---

## Step 2 — Clerk (sign-in / accounts)

Powers login, the user menu, and per-user progress/notifications.

- [ ] **Create a Clerk app:** <https://dashboard.clerk.com> → create application.
- [ ] **Copy keys:** in the Clerk dashboard → **API keys**. You need the
      Publishable key (`pk_...`) and Secret key (`sk_...`).
- [ ] **Add them to `website/.env.local`** (the Convex lines are already there —
      just add the Clerk ones):
      ```env
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
      CLERK_SECRET_KEY=sk_test_xxxxxxxx
      CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
      ```
- [ ] **Make the Convex JWT template:** Clerk dashboard → **JWT Templates** →
      **New template** → choose the **Convex** preset. Save it. It must be named
      exactly `convex` (it is by default). The **Issuer** shown on that page is your
      `CLERK_JWT_ISSUER_DOMAIN` value above.
- [ ] **Tell Convex the issuer** (replaces the placeholder I set earlier):
      ```bash
      npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
      ```
- [ ] **Restart** `npm run dev` (Next only reads `.env.local` at startup).

✅ After this: sign-in works, the user menu appears, and progress/quiz/notifications
save per user. Sign-in page is at `/sign-in`.

---

## Step 3 — Clerk Billing (the plan switcher)

Powers `/settings/billing`, where users switch between Explorer / Learner / Pro.
Clerk handles checkout — no Stripe code needed.

- [ ] **Enable Billing:** Clerk dashboard → **Billing** → turn it on (Clerk will
      walk you through connecting a payment gateway for test mode).
- [ ] **Create Features** (Billing → Features). Use these exact slugs — the app
      gates on them:
      - `ai_summary`
      - `ai_quiz`
      - `ai_chat`
- [ ] **Create Plans** (Billing → Plans) and attach features to each:

      | Plan slug  | Price     | Features attached                      |
      |------------|-----------|----------------------------------------|
      | `explorer` | Free      | (none — free tier)                     |
      | `learner`  | ₹19/mo    | `ai_summary`, `ai_quiz`                 |
      | `pro`      | ₹69/mo    | `ai_summary`, `ai_quiz`, `ai_chat`     |

      (Attach however you like — this mirrors the marketing pricing. Prices are set
      in the Clerk dashboard, not in code.)

- [ ] **Done.** The `/settings/billing` page already renders Clerk's `<PricingTable/>`,
      so it will now show these plans and let users subscribe/switch.

### Optional — enforce plans on the backend
Right now the server **fail-opens**: AI works for everyone until Clerk sends plan
info. To actually lock AI features to paid plans server-side, add the billing claims
to the **Convex JWT template** (Step 2): add claims named `fea` (features) and `pla`
(plan) using Clerk's billing shortcodes, per Clerk's billing docs. Once those claims
arrive, `convex/model/billing.ts` (`requireFeature`) enforces them automatically —
no code change needed. Until then, gating is effectively client-side via the plans.

✅ After this: users can switch plans on the billing page.

---

## Step 4 — Run it

Two terminals in `website/`:

```bash
npx convex dev        # backend (keep running)
npm run dev           # frontend → http://localhost:3000
```

- Marketing site: `/`
- App: `/dashboard` (sign in first once Clerk is on)

---

## Quick "is it working?" checklist

| You did… | Now this works |
|----------|----------------|
| Nothing | Marketing site, dashboard shell, browsing topics (read-only) |
| Step 1 (NVIDIA) | AI quiz, AI summary, AI chat |
| Step 2 (Clerk) | Login, saved progress, quizzes, notifications |
| Step 3 (Billing) | Plan switcher on `/settings/billing` |

## Troubleshooting

- **"NVIDIA_API_KEY is not set"** on an AI action → do Step 1, and make sure
  `npx convex dev` is running.
- **AI chat replies but cites nothing / says "no specific context"** → you didn't
  run `npx convex run rag:reindex` (Step 1).
- **Sign-in does nothing / errors** → keys missing or dev server not restarted
  after editing `.env.local` (Step 2).
- **Billing page shows the setup hint** → Clerk keys aren't set yet (Step 2), or
  Billing isn't enabled (Step 3).
- **Edited `.env.local` and nothing changed** → restart `npm run dev`.
