# Studzee ADMIN Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ADMIN`, a Next.js web admin console for Studzee, replacing the
paused `DESKTOP` Electron console, covering every route `BACKEND`'s
`/admin` router exposes today.

**Architecture:** Next.js 15 App Router, Clerk auth via `@clerk/nextjs`
middleware, server-side data fetching straight from `BACKEND` (no separate
database), the design system from `D:\Projects\dashboard\style-docs` ported
verbatim with domain data swapped, deployed to Vercel.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind v4, shadcn/radix-ui
primitives, `@hugeicons/react`, Recharts, `@clerk/nextjs`, Zod, Vitest +
React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-02-admin-panel-design.md`

## Global Constraints

- New module lives at `D:\Projects\Studzee\ADMIN`, sibling to `BACKEND`,
  `MOBILE`, `DESKTOP`.
- No em dashes, no emoji, anywhere: code, comments, commits, docs.
- TypeScript for all new code.
- Conventional Commits with a real body, scoped `feat(admin):`. **Never add a
  `Co-Authored-By` line, a `Claude-Session` line, or any other model or vendor
  trailer to a commit message**, and never mention Claude, Anthropic or any
  model in one. This is a house rule from `CLAUDE.md`, reconfirmed by the
  owner on 02-09-2026, and it overrides any default attribution behavior.
- Never commit to `main`. All work happens on the `feat/admin-panel` branch,
  which already exists and already carries the spec and this plan.
- Icons: `@hugeicons/react` only, never `lucide-react` in app code (it stays
  a transitive dependency of the shadcn primitives, same as the sample).
- Numbers, IDs, codes: `font-mono`. Sentences: `font-sans`. No hex colors, no
  new color tokens; every color is a token from the ported `globals.css`.
- Every write to `BACKEND` goes through `lib/backend/*`, never a raw `fetch`
  scattered in a page or component.
- `BACKEND`'s Zod schemas (read from `BACKEND/src/models/*.validation.ts`
  during this plan's research) are the source of truth for every shape in
  `lib/schemas.ts` and every type in `lib/backend/*`. If a shape here and a
  shape in `BACKEND` ever disagree, `BACKEND` wins.
- Uploads (`upload-image`, `upload-pdf`) proxy through Next.js Route
  Handlers; the Clerk session token never reaches the browser.
- Admin role check: `publicMetadata.role === 'admin'` on the Clerk user,
  fetched server-side, mirroring `BACKEND`'s `requireAdmin` exactly (see
  `BACKEND/src/middleware/auth.ts:73-77`). Not a session-claim check, since no
  Clerk JWT template exists on the dev instance to carry that claim.

---

## File Structure

```
ADMIN/
  app/
    (auth)/sign-in/[[...sign-in]]/page.tsx
    (dashboard)/
      layout.tsx
      page.tsx                        Overview
      documents/page.tsx
      documents/new/page.tsx
      documents/[id]/page.tsx
      quests/page.tsx
      quests/new/page.tsx
      notifications/page.tsx
      email/page.tsx
      users/page.tsx
      ai-drafts/page.tsx
      ai-drafts/[id]/page.tsx
      settings/page.tsx
    api/
      documents/[id]/upload-image/route.ts
      documents/[id]/upload-pdf/route.ts
    layout.tsx
    globals.css
  components/
    dashboard/            (ported: shell, sidebar, mobile-nav, cards,
                            charts, use-table, table-pagination,
                            theme-toggle)
    ui/                    (ported shadcn primitives)
    documents/document-form.tsx
    quests/quest-form.tsx
    notifications/notification-form.tsx
    email/email-form.tsx
    ai-drafts/draft-review.tsx
  lib/
    backend/
      client.ts            core fetch wrapper
      documents.ts
      quests.ts
      notifications.ts
      email.ts
      users.ts
      ai-drafts.ts
      content.ts            GET /content/topics
    schemas.ts
    utils.ts               (ported cn())
  middleware.ts
  .env.example
  README.md
  package.json
  components.json
  postcss.config.mjs
  next.config.ts
  tsconfig.json
  vitest.config.ts
```

---

### Task 1: Scaffold the ADMIN Next.js project

**Files:**
- Create: `ADMIN/package.json`, `ADMIN/tsconfig.json`, `ADMIN/next.config.ts`,
  `ADMIN/postcss.config.mjs`, `ADMIN/eslint.config.mjs`,
  `ADMIN/components.json`, `ADMIN/app/globals.css`, `ADMIN/app/layout.tsx`,
  `ADMIN/lib/utils.ts`, `ADMIN/.gitignore`, `ADMIN/.env.example`

**Interfaces:**
- Produces: the working Next.js project every later task builds inside;
  `cn()` from `lib/utils.ts`, used by every ported and new component.

- [ ] **Step 1: Confirm the branch**

The `feat/admin-panel` branch already exists and is checked out, carrying the
spec and this plan. Confirm before starting:

```bash
cd /d/Projects/Studzee
git branch --show-current   # expect: feat/admin-panel
git status --short          # expect: clean
```

- [ ] **Step 2: Copy the base config files from the sample project verbatim**

These carry no Studzee-specific content, so they are copied unmodified:

```bash
mkdir -p ADMIN
cp /d/Projects/dashboard/postcss.config.mjs ADMIN/postcss.config.mjs
cp /d/Projects/dashboard/eslint.config.mjs ADMIN/eslint.config.mjs
cp /d/Projects/dashboard/tsconfig.json ADMIN/tsconfig.json
cp /d/Projects/dashboard/lib/utils.ts ADMIN/lib/utils.ts
mkdir -p ADMIN/app
cp /d/Projects/dashboard/app/globals.css ADMIN/app/globals.css
```

- [ ] **Step 3: Write `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

- [ ] **Step 4: Write `components.json`**

Same as the sample's, since the same shadcn primitives are reused:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

- [ ] **Step 5: Write `app/layout.tsx`, adapted for Clerk and Studzee's title**

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Studzee Admin',
  description: 'Studzee content, quest and notification admin console',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="flex min-h-full flex-col">
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.theme==="dark"||(!localStorage.theme&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
            }}
          />
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 6: Write `package.json`**

Same runtime dependencies as the sample plus `@clerk/nextjs`, `zod` and
`sonner`, plus the test toolchain:

```json
{
  "name": "admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.0.0",
    "@hugeicons/core-free-icons": "^4.2.2",
    "@hugeicons/react": "^1.1.9",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "next": "16.2.10",
    "radix-ui": "^1.6.1",
    "react": "19.2.4",
    "react-day-picker": "^10.0.1",
    "react-dom": "19.2.4",
    "recharts": "^3.8.0",
    "shadcn": "^4.13.0",
    "sonner": "^1.7.0",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 7: Install**

```bash
cd ADMIN
npm install
```

- [ ] **Step 8: Write `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Add `@vitejs/plugin-react` as a devDependency (`npm install -D
@vitejs/plugin-react`), since `vite.config`-driven Vitest needs it even
though the app itself builds through Next's own compiler.

- [ ] **Step 9: Write `.gitignore`**

```
node_modules
.next
out
.env
.env*.local
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 10: Write `.env.example`**

Variable names carried over from `BACKEND/.env.example`
(`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) and `MOBILE/.env.example`
(`EXPO_PUBLIC_BACKEND_API_URL`), per the spec's Environment section:

```
# Same Clerk instance BACKEND and MOBILE already use. Next's NEXT_PUBLIC_
# prefix is what reaches the browser bundle; the secret key stays server-only.
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Server-only: every ADMIN call to BACKEND happens server-side, so this never
# needs the NEXT_PUBLIC_ prefix. Same value MOBILE points at today.
BACKEND_API_URL=https://studzee-api-latest.onrender.com
```

- [ ] **Step 11: Verify the scaffold builds**

```bash
cd ADMIN
npm run build
```

Expected: succeeds (the default Next.js `app/page.tsx` is still the
create-next-app placeholder at this point; it is replaced in Task 11). If
`ClerkProvider` throws for missing keys at build time, add placeholder values
to `ADMIN/.env.local` for the build step only, never committed.

- [ ] **Step 12: Commit**

```bash
git add ADMIN
git commit -m "feat(admin): scaffold the ADMIN Next.js project

Base Next.js 15 + TypeScript project for the ADMIN console, config
files and globals.css ported from D:\\Projects\\dashboard's style
sample, Clerk and the sonner toaster wired into the root layout."
```

---

### Task 2: Port shadcn UI primitives

**Files:**
- Create: `ADMIN/components/ui/avatar.tsx`, `badge.tsx`, `button.tsx`,
  `calendar.tsx`, `card.tsx`, `chart.tsx`, `checkbox.tsx`, `dialog.tsx`,
  `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `select.tsx`,
  `table.tsx`

**Interfaces:**
- Consumes: `cn()` from `lib/utils.ts` (Task 1).
- Produces: `Button`, `buttonVariants`, `Badge`, `Card`, `CardHeader` etc.,
  `Input`, `Label`, `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableBody`/
  `TableCell`, `Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/
  `DialogTitle`/`DialogFooter`, `Select`/`SelectTrigger`/`SelectValue`/
  `SelectContent`/`SelectItem`, `Popover`/`PopoverTrigger`/`PopoverContent`,
  `Checkbox`, `Calendar`, `Avatar`/`AvatarImage`/`AvatarFallback`,
  `DropdownMenu` family, `ChartContainer`/`ChartTooltip`/`ChartTooltipContent`
  and `ChartConfig` type from `chart.tsx` — all used unchanged by later
  ported and new components.

These are generic shadcn/radix primitives with no Studzee-specific content;
none of the sample's domain pages changed them from the shadcn defaults.

- [ ] **Step 1: Copy every file verbatim**

```bash
mkdir -p ADMIN/components/ui
for f in avatar badge button calendar card chart checkbox dialog \
         dropdown-menu input label popover select table; do
  cp "/d/Projects/dashboard/components/ui/$f.tsx" "ADMIN/components/ui/$f.tsx"
done
```

- [ ] **Step 2: Install their runtime dependencies**

`radix-ui` and `class-variance-authority` are already in `package.json`
(Task 1). Check `chart.tsx` and `calendar.tsx` imports for anything not yet
installed:

```bash
cd ADMIN
grep -h '^import' components/ui/chart.tsx components/ui/calendar.tsx
```

Expected imports resolve to `recharts` (installed), `react-day-picker`
(installed), and local `@/lib/utils`, `@/components/ui/*` — nothing new to
add.

- [ ] **Step 3: Verify the build**

```bash
npm run build
```

Expected: succeeds. These files are not imported anywhere yet, so an unused
import is the only class of error possible here; fix any that TypeScript
flags before continuing.

- [ ] **Step 4: Commit**

```bash
git add ADMIN/components/ui
git commit -m "feat(admin): port shadcn UI primitives from the design sample

Generic radix-based primitives (button, card, table, dialog, select,
popover, checkbox, calendar, avatar, dropdown-menu, chart), copied
unchanged from D:\\Projects\\dashboard since they carry no
domain-specific content."
```

---

### Task 3: Port dashboard shell and table components, adapted for Studzee

**Files:**
- Create: `ADMIN/components/dashboard/mobile-nav.tsx`,
  `ADMIN/components/dashboard/theme-toggle.tsx`,
  `ADMIN/components/dashboard/use-table.tsx`,
  `ADMIN/components/dashboard/table-pagination.tsx`,
  `ADMIN/components/dashboard/cards.tsx`
- Create, adapted: `ADMIN/components/dashboard/shell.tsx`,
  `ADMIN/components/dashboard/sidebar.tsx`

**Interfaces:**
- Consumes: UI primitives from Task 2, `cn()` from `lib/utils.ts`.
- Produces: `<Shell breadcrumb active>`, `<Sidebar active className?>`,
  `<MobileNav>`, `<ThemeToggle>`, `useDataTable<T>(rows, opts)`, `<Th>`,
  `<FilterPills>`, `<TablePagination>`, `<PanelTitle>`, `<MoreButton>`,
  `<StatusBadge status>`, `<KpiCard kpi>` and the `Kpi` type — the exact
  names every later page imports.

`mobile-nav.tsx`, `theme-toggle.tsx`, `use-table.tsx` and
`table-pagination.tsx` carry no domain-specific content and are copied
unchanged. `shell.tsx`, `sidebar.tsx` and `cards.tsx` reference the sample's
fake user (`data/dashboard.json`, `/meow.png`) and e-commerce statuses, and
are adapted below.

- [ ] **Step 1: Copy the unchanged files**

```bash
mkdir -p ADMIN/components/dashboard
for f in mobile-nav theme-toggle use-table table-pagination; do
  cp "/d/Projects/dashboard/components/dashboard/$f.tsx" \
     "ADMIN/components/dashboard/$f.tsx"
done
```

- [ ] **Step 2: Write `components/dashboard/sidebar.tsx`, nav swapped to Studzee's sections**

```tsx
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Home01Icon,
  File01Icon,
  Award01Icon,
  Notification01Icon,
  Mail01Icon,
  UserGroupIcon,
  SparklesIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { UserButton, useUser } from "@clerk/nextjs";

type NavItem = { label: string; icon: IconSvgElement; href?: string };

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Content",
    items: [
      { label: "Overview", icon: Home01Icon, href: "/" },
      { label: "Documents", icon: File01Icon, href: "/documents" },
      { label: "Quests", icon: Award01Icon, href: "/quests" },
    ],
  },
  {
    title: "Outreach",
    items: [
      { label: "Notifications", icon: Notification01Icon, href: "/notifications" },
      { label: "Email", icon: Mail01Icon, href: "/email" },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Users", icon: UserGroupIcon, href: "/users" },
      { label: "AI Drafts", icon: SparklesIcon, href: "/ai-drafts" },
      { label: "Settings", icon: Settings02Icon, href: "/settings" },
    ],
  },
];

export function Sidebar({
  active = "Overview",
  className = "hidden lg:flex",
}: {
  active?: string;
  className?: string;
}) {
  return (
    <aside className={`${className} w-64 shrink-0 flex-col border-r bg-sidebar`}>
      <div className="p-4">
        <div className="flex w-full items-center gap-2.5 rounded-lg border bg-card p-2.5 shadow-xs">
          <span className="flex-1 text-left">
            <span className="block text-[11px] text-muted-foreground">Platform</span>
            <span className="block text-sm font-medium">Studzee</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        {sections.map((section, i) => (
          <div key={section.title} className={i > 0 ? "mt-4 border-t pt-4" : ""}>
            <p className="px-2 pb-2 text-xs text-foreground">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href ?? "#"}
                    className={
                      item.label === active
                        ? "flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 text-sm font-medium shadow-xs"
                        : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    }
                  >
                    <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative p-4 pt-0">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-t from-sidebar to-transparent" />
        <SidebarProfile />
      </div>
    </aside>
  );
}

/** Client boundary for Clerk's useUser(), kept small so Sidebar itself can
 * stay a plain function shared by the desktop and mobile nav renders. */
function SidebarProfile() {
  "use client";
  const { user } = useUser();
  return (
    <div className="flex w-full items-center gap-2.5 rounded-lg border bg-card p-2.5 shadow-xs">
      <UserButton afterSignOutUrl="/sign-in" />
      <span className="flex-1 text-left">
        <span className="block truncate text-sm font-semibold">
          {user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Admin"}
        </span>
        <span className="block text-[11px] text-muted-foreground">Administrator</span>
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Write `components/dashboard/shell.tsx`, header actions trimmed to what's real**

The sample's header has a notification bell and inbox icon that do nothing
(no click handler). Studzee's own notification and email history already
have real pages, so the header keeps only the search field (still inert
visually, matches the sample's own unwired `⌘K` field) and the theme toggle,
and drops the fake bell/inbox/avatar in favor of the sidebar's real
`UserButton`:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export function Shell({
  breadcrumb,
  active,
  children,
}: {
  breadcrumb: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={active} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b-2 border-comp-border px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav>
              <Sidebar active={active} className="flex h-full" />
            </MobileNav>
            <nav className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span className="hidden text-muted-foreground sm:inline">Studzee Admin</span>
              <span className="hidden text-muted-foreground sm:inline">\u203a</span>
              <span className="truncate font-medium">{breadcrumb}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search..."
                className="h-9 w-72 rounded-lg border-transparent bg-muted/60 pr-12 pl-9 shadow-none"
              />
              <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                \u2318 K
              </kbd>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

Replace the two `\u203a`/`\u2318` escapes above with the literal `›` and `⌘`
characters when writing the file (spelled out here only so this plan file
stays plain ASCII).

- [ ] **Step 4: Write `components/dashboard/cards.tsx`, statuses swapped to Studzee's domains**

Same `PanelTitle`, `MoreButton`, `KpiCard` and `StatusBadge` shape as the
sample; the `statusStyles` map is rewritten for the statuses ADMIN actually
renders (quest active/ended, notification/email sent/failed, AI draft
pending/approved/rejected) instead of the sample's order/product statuses:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/dashboard/charts";

export function PanelTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <h2 className="font-mono text-sm font-medium tracking-wide uppercase text-foreground/50">{title}</h2>
      <HugeiconsIcon icon={InformationCircleIcon} size={14} className="text-muted-foreground" />
    </div>
  );
}

export function MoreButton() {
  return (
    <Button variant="outline" size="icon-sm" aria-label="More options" className="rounded-full border-2 border-comp-border">
      <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
    </Button>
  );
}

const statusStyles: Record<string, { badge: string; dot: string }> = {
  Active: { badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400", dot: "bg-emerald-500" },
  Ended: { badge: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  Withdrawn: { badge: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  Sent: { badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400", dot: "bg-emerald-500" },
  Failed: { badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400", dot: "bg-red-500" },
  Partial: { badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400", dot: "bg-amber-500" },
  Pending: { badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400", dot: "bg-amber-500" },
  Approved: { badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400", dot: "bg-emerald-500" },
  Rejected: { badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? { badge: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
  return (
    <Badge variant="outline" className={`rounded-full ${s.badge}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {status}
    </Badge>
  );
}

export type Kpi = {
  label: string;
  value: string;
  suffix?: string;
  spark?: number[];
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-card p-4">
        <div className="space-y-2">
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            {kpi.label}
          </p>
          <p className="font-mono text-[28px] leading-none font-medium tracking-tight">
            {kpi.value}
            {kpi.suffix && (
              <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                {kpi.suffix}
              </span>
            )}
          </p>
        </div>
        {kpi.spark && <Sparkline data={kpi.spark} />}
      </div>
    </Card>
  );
}
```

`Kpi.delta`/`deltaLabel` and the trailing delta strip are dropped: ADMIN's
KPIs (Task 11) are point-in-time counts with no prior-period comparison
available from `BACKEND` today, unlike the sample's sales deltas. `spark` is
optional since not every KPI has a series to show.

- [ ] **Step 5: Copy `charts.tsx` for `Sparkline`, unchanged**

```bash
cp /d/Projects/dashboard/components/dashboard/charts.tsx \
   ADMIN/components/dashboard/charts.tsx
```

`KpiCard` only uses `Sparkline` from this file; the pixel-chart and Recharts
exports come along unused until a page needs them; this is a straight port,
not new surface.

- [ ] **Step 6: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: fails with "Cannot find module '/meow.png'" or similar if any
sample-only asset reference survived the rewrite. There should be none left
after Steps 2-4; if the build fails on anything else, fix it before
continuing.

- [ ] **Step 7: Commit**

```bash
git add ADMIN/components/dashboard
git commit -m "feat(admin): port the dashboard shell, adapted for Studzee

Sidebar nav swapped to Studzee's sections (Documents, Quests,
Notifications, Email, Users, AI Drafts, Settings), the sample's fake
user card replaced with a real Clerk UserButton, and cards.tsx's
status map rewritten for quest/notification/draft states instead of
order/product statuses."
```

---

### Task 4: Clerk authentication

**Files:**
- Create: `ADMIN/middleware.ts`,
  `ADMIN/app/(auth)/sign-in/[[...sign-in]]/page.tsx`,
  `ADMIN/app/(dashboard)/layout.tsx`,
  `ADMIN/lib/require-admin.ts`
- Test: `ADMIN/lib/require-admin.test.ts`

**Interfaces:**
- Consumes: `ClerkProvider` already wrapping `app/layout.tsx` (Task 1).
- Produces: `requireAdminUser()` from `lib/require-admin.ts`, called by
  `app/(dashboard)/layout.tsx` and reusable by any Server Action that needs
  the same check without going through a page render.

- [ ] **Step 1: Write `middleware.ts`**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

This is Clerk's own recommended `matcher`, copied from `@clerk/nextjs`'s
scaffold output; it excludes static assets and always runs for API routes.

- [ ] **Step 2: Write `app/(auth)/sign-in/[[...sign-in]]/page.tsx`**

```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn />
    </div>
  )
}
```

- [ ] **Step 3: Write the failing test for `requireAdminUser`**

```typescript
// ADMIN/lib/require-admin.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
const mockClerkClient = { users: { getUser: vi.fn() } }

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: () => Promise.resolve(mockClerkClient),
}))

import { requireAdminUser } from './require-admin'

describe('requireAdminUser', () => {
  beforeEach(() => {
    mockAuth.mockReset()
    mockClerkClient.users.getUser.mockReset()
  })

  it('returns the user when publicMetadata.role is admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_1' })
    mockClerkClient.users.getUser.mockResolvedValue({
      id: 'user_1',
      publicMetadata: { role: 'admin' },
    })

    const result = await requireAdminUser()

    expect(result).toEqual({
      ok: true,
      user: { id: 'user_1', publicMetadata: { role: 'admin' } },
    })
  })

  it('returns not-admin when publicMetadata.role is not admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_2' })
    mockClerkClient.users.getUser.mockResolvedValue({
      id: 'user_2',
      publicMetadata: {},
    })

    const result = await requireAdminUser()

    expect(result).toEqual({ ok: false, reason: 'not-admin' })
  })

  it('returns unauthenticated when there is no signed-in user', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await requireAdminUser()

    expect(result).toEqual({ ok: false, reason: 'unauthenticated' })
    expect(mockClerkClient.users.getUser).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run it to verify it fails**

```bash
cd ADMIN
npm test -- require-admin
```

Expected: FAIL with "Cannot find module './require-admin'".

- [ ] **Step 5: Write `lib/require-admin.ts`**

```typescript
import { auth, clerkClient } from '@clerk/nextjs/server'

export type AdminCheck =
  | { ok: true; user: { id: string; publicMetadata: Record<string, unknown> } }
  | { ok: false; reason: 'unauthenticated' | 'not-admin' }

/**
 * Mirrors BACKEND's requireAdmin (BACKEND/src/middleware/auth.ts) exactly: a
 * server-side fetch of the full Clerk user, checked against
 * publicMetadata.role === 'admin'. Not a session-claim check, since no Clerk
 * JWT template exists on the dev instance to carry that claim onto the token.
 */
export async function requireAdminUser(): Promise<AdminCheck> {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false, reason: 'unauthenticated' }
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = user.publicMetadata?.role

  if (role !== 'admin') {
    return { ok: false, reason: 'not-admin' }
  }

  return { ok: true, user: { id: user.id, publicMetadata: user.publicMetadata } }
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npm test -- require-admin
```

Expected: PASS, 3 tests.

- [ ] **Step 7: Write `app/(dashboard)/layout.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { requireAdminUser } from '@/lib/require-admin'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const check = await requireAdminUser()

  if (check.ok === false && check.reason === 'unauthenticated') {
    redirect('/sign-in')
  }

  if (check.ok === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account does not have admin access to Studzee.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

Every page's own `<Shell>` wrapper (Tasks 11 onward) renders inside this
layout, so the auth gate runs once per navigation rather than per page.

- [ ] **Step 8: Verify the build**

```bash
npm run build
```

Expected: succeeds. `(dashboard)` route group has no page of its own yet
(Task 11 adds `app/(dashboard)/page.tsx`), so Next.js reports it has no
routes under that group until then; that is expected at this point in the
plan.

- [ ] **Step 9: Commit**

```bash
git add ADMIN/middleware.ts "ADMIN/app/(auth)" "ADMIN/app/(dashboard)/layout.tsx" ADMIN/lib/require-admin.ts ADMIN/lib/require-admin.test.ts
git commit -m "feat(admin): Clerk auth and the admin-role gate

middleware.ts protects everything outside /sign-in. requireAdminUser()
fetches the full Clerk user server-side and checks
publicMetadata.role === 'admin', mirroring BACKEND's requireAdmin
exactly. The (dashboard) layout redirects an unauthenticated visitor
to sign-in and renders a not-authorized screen for a signed-in
non-admin, without letting either reach a real page."
```

---

### Task 5: Backend API client core

**Files:**
- Create: `ADMIN/lib/backend/client.ts`
- Test: `ADMIN/lib/backend/client.test.ts`

**Interfaces:**
- Consumes: `auth()` from `@clerk/nextjs/server`, `process.env.BACKEND_API_URL`.
- Produces: `backendFetch<T>(path, init?)`, `BackendError` class — every
  function in Tasks 6-9 is built on this.

- [ ] **Step 1: Write the failing test**

```typescript
// ADMIN/lib/backend/client.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({ auth: () => mockAuth() }))

import { backendFetch, BackendError } from './client'

describe('backendFetch', () => {
  beforeEach(() => {
    mockAuth.mockReset()
    mockAuth.mockResolvedValue({ getToken: async () => 'test-token' })
    vi.stubGlobal('fetch', vi.fn())
    process.env.BACKEND_API_URL = 'https://api.test'
  })

  it('attaches the bearer token and base URL', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )

    const result = await backendFetch<{ ok: boolean }>('/admin/users')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.test/admin/users',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
    expect(result).toEqual({ ok: true })
  })

  it('throws BackendError with the response body on a non-2xx status', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })
    )

    await expect(backendFetch('/admin/users/x')).rejects.toThrow(BackendError)
    await expect(backendFetch('/admin/users/x')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    })
  })

  it('sends a JSON body and content-type for a POST with a body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await backendFetch('/admin/quests', {
      method: 'POST',
      body: { title: 'x' },
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.test/admin/quests',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'x' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd ADMIN
npm test -- backend/client
```

Expected: FAIL with "Cannot find module './client'".

- [ ] **Step 3: Write `lib/backend/client.ts`**

```typescript
import { auth } from '@clerk/nextjs/server'

export class BackendError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = 'BackendError'
    this.status = status
    this.body = body
  }
}

type BackendFetchInit = Omit<RequestInit, 'body'> & { body?: unknown }

/**
 * Server-only fetch wrapper for every call to BACKEND. Attaches the current
 * Clerk session's bearer token, so it must run in a Server Component, a
 * Server Action, or a Route Handler, never in client code.
 */
export async function backendFetch<T>(
  path: string,
  init: BackendFetchInit = {}
): Promise<T> {
  const baseUrl = process.env.BACKEND_API_URL
  if (!baseUrl) {
    throw new Error('BACKEND_API_URL is not set')
  }

  const { getToken } = await auth()
  const token = await getToken()

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : undefined) ?? `Request to ${path} failed with status ${response.status}`
    throw new BackendError(response.status, message, data)
  }

  return data as T
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- backend/client
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add ADMIN/lib/backend/client.ts ADMIN/lib/backend/client.test.ts
git commit -m "feat(admin): backend fetch client with Clerk token attach

backendFetch<T>() is the one place a request leaves ADMIN for
BACKEND: attaches the session bearer token, serializes a JSON body
when one is given, and throws BackendError carrying BACKEND's own
status and message on a non-2xx response."
```

---

### Task 6: Backend API client — documents and content

**Files:**
- Create: `ADMIN/lib/backend/documents.ts`, `ADMIN/lib/backend/content.ts`
- Test: `ADMIN/lib/backend/documents.test.ts`

**Interfaces:**
- Consumes: `backendFetch` (Task 5).
- Produces: `TDocument`, `TQuizItem`, `TPdfFile` types; `listDocumentsAdmin`
  is not exposed by `BACKEND` (only `GET /content` exists, public, cached,
  paginated) so document listing reuses that; `createDocument(input)`,
  `updateDocument(id, input)`, `deleteDocument(id)`, `getDocument(id)`,
  `listTopics()` — the exact functions `documents/page.tsx`,
  `documents/new/page.tsx` and `documents/[id]/page.tsx` (Task 12) call.

- [ ] **Step 1: Write the failing test**

```typescript
// ADMIN/lib/backend/documents.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { createDocument, updateDocument, deleteDocument, getDocument } from './documents'

describe('documents backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('createDocument posts to /admin/documents', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', doc: { title: 'x' } })

    await createDocument({ title: 'x', content: {}, quiz: {} })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/documents', {
      method: 'POST',
      body: { title: 'x', content: {}, quiz: {} },
    })
  })

  it('updateDocument puts to /admin/documents/:id', async () => {
    mockBackendFetch.mockResolvedValue({ title: 'x' })

    await updateDocument('doc1', { title: 'y' })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/documents/doc1', {
      method: 'PUT',
      body: { title: 'y' },
    })
  })

  it('deleteDocument deletes /admin/documents/:id', async () => {
    mockBackendFetch.mockResolvedValue(null)

    await deleteDocument('doc1')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/documents/doc1', {
      method: 'DELETE',
    })
  })

  it('getDocument reads /content/:id', async () => {
    mockBackendFetch.mockResolvedValue({ title: 'x' })

    await getDocument('doc1')

    expect(mockBackendFetch).toHaveBeenCalledWith('/content/doc1')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd ADMIN
npm test -- backend/documents
```

Expected: FAIL with "Cannot find module './documents'".

- [ ] **Step 3: Write `lib/backend/documents.ts`**

Types mirror `BACKEND/src/models/document.validation.ts` and
`BACKEND/src/types/document.ts`:

```typescript
import { backendFetch } from './client'

export type TopicKey =
  | 'machine-learning'
  | 'system-design'
  | 'devops'
  | 'aws'
  | 'data'
  | 'deep-learning'

export interface TQuizItem {
  que: string
  ans: string
  options: string[]
}

export interface TPdfFile {
  name: string
  url: string
  uploadedAt: string
  size: number
}

export interface TDocument {
  id?: string
  title: string
  content: Record<string, unknown> | unknown[]
  quiz: Record<string, TQuizItem>
  facts?: string
  summary?: string
  key_notes?: Record<string, string>
  imageUrl?: string | null
  tags?: string[]
  pdfUrl?: TPdfFile[]
  topic: TopicKey
  unlockPoints?: number
  createdAt?: string
  updatedAt?: string
}

export type TDocumentInput = Omit<TDocument, 'id' | 'createdAt' | 'updatedAt'>

export async function createDocument(input: TDocumentInput) {
  return backendFetch<{ message: string; doc: TDocument }>('/admin/documents', {
    method: 'POST',
    body: input,
  })
}

export async function updateDocument(id: string, input: Partial<TDocumentInput>) {
  return backendFetch<TDocument>(`/admin/documents/${id}`, {
    method: 'PUT',
    body: input,
  })
}

export async function deleteDocument(id: string) {
  return backendFetch<null>(`/admin/documents/${id}`, { method: 'DELETE' })
}

export async function getDocument(id: string) {
  return backendFetch<TDocument>(`/content/${id}`)
}

export interface DocumentListResult {
  data: (TDocument & { id: string })[]
  meta: { page: number; limit: number; total: number }
}

/**
 * BACKEND has no admin-only document listing route; GET /content is the
 * same public, cached, paginated listing the mobile app reads, and is what
 * the documents list page (Task 12) is built on. limit defaults high (100)
 * so useDataTable (ported in Task 3) can do search/sort/pagination over one
 * fetched page in memory, the same pattern the sample project uses.
 */
export async function listDocuments(params: {
  page?: number
  limit?: number
  topic?: TopicKey
  tag?: string
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 100))
  if (params.topic) query.set('topic', params.topic)
  if (params.tag) query.set('tag', params.tag)

  return backendFetch<DocumentListResult>(`/content?${query.toString()}`)
}
```

- [ ] **Step 4: Write `lib/backend/content.ts` for the topic registry**

```typescript
import { backendFetch } from './client'
import type { TopicKey } from './documents'

export interface TopicEntry {
  key: TopicKey
  label: string
}

export async function listTopics() {
  const result = await backendFetch<{ data: TopicEntry[] }>('/content/topics')
  return result.data
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm test -- backend/documents
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add ADMIN/lib/backend/documents.ts ADMIN/lib/backend/content.ts ADMIN/lib/backend/documents.test.ts
git commit -m "feat(admin): backend client for documents and topics

TDocument and TQuizItem mirror BACKEND's DocumentSchema exactly.
Listing reuses the public, cached GET /content route since BACKEND
has no separate admin document listing; create, update, delete and
single-document read go through their matching /admin/documents and
/content/:id routes. listTopics() backs the topic selector the TCSK
notes call for on document forms."
```

---

### Task 7: Backend API client — quests

**Files:**
- Create: `ADMIN/lib/backend/quests.ts`
- Test: `ADMIN/lib/backend/quests.test.ts`

**Interfaces:**
- Consumes: `backendFetch` (Task 5).
- Produces: `TQuest`, `TCreateQuestInput`, `QUEST_TYPES`; `createQuest(input)`,
  `listQuests()`.

- [ ] **Step 1: Write the failing test**

```typescript
// ADMIN/lib/backend/quests.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { createQuest, listQuests } from './quests'

describe('quests backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('createQuest posts to /admin/quests', async () => {
    mockBackendFetch.mockResolvedValue({ success: true, data: { id: 'q1' } })

    await createQuest({
      title: 'x',
      description: 'y',
      type: 'mcq',
      gems: 10,
      startsAt: '2026-09-02T00:00:00.000Z',
      endsAt: '2026-09-09T00:00:00.000Z',
      payload: { passScore: 1, questions: [] },
    })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/quests',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('listQuests reads /admin/quests and unwraps data', async () => {
    mockBackendFetch.mockResolvedValue({ success: true, data: [{ id: 'q1' }] })

    const result = await listQuests()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/quests')
    expect(result).toEqual([{ id: 'q1' }])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd ADMIN
npm test -- backend/quests
```

Expected: FAIL with "Cannot find module './quests'".

- [ ] **Step 3: Write `lib/backend/quests.ts`**

Types mirror `BACKEND/src/models/quest.validation.ts`'s `CreateQuestSchema`
and the `Quest` Prisma model:

```typescript
import { backendFetch } from './client'

export const QUEST_TYPES = ['mcq', 'scq', 'fill_blank', 'read_blog'] as const
export type QuestType = (typeof QUEST_TYPES)[number]

export interface ChoiceQuestion {
  key: string
  que: string
  options: string[]
  ans: string
}

export interface FillBlankQuestion {
  key: string
  que: string
  answer: string
}

export interface TCreateQuestInput {
  title: string
  description: string
  type: QuestType
  gems: number
  contentId?: string
  payload?:
    | { passScore: number; questions: ChoiceQuestion[] }
    | { passScore: number; questions: FillBlankQuestion[] }
  active?: boolean
  startsAt: string
  endsAt: string
}

export interface TQuest extends TCreateQuestInput {
  id: string
  createdAt: string
}

export async function createQuest(input: TCreateQuestInput) {
  return backendFetch<{ success: boolean; data: TQuest }>('/admin/quests', {
    method: 'POST',
    body: input,
  })
}

export async function listQuests() {
  const result = await backendFetch<{ success: boolean; data: TQuest[] }>(
    '/admin/quests'
  )
  return result.data
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- backend/quests
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add ADMIN/lib/backend/quests.ts ADMIN/lib/backend/quests.test.ts
git commit -m "feat(admin): backend client for quests

TCreateQuestInput mirrors CreateQuestSchema's shape: payload required
for graded types, contentId for read_blog, the client leaves the
endsAt-after-startsAt and passScore-within-questions checks to
BACKEND's own superRefine rather than duplicating them, matching the
spec's rule that BACKEND stays the source of truth for validation."
```

---

### Task 8: Backend API client — notifications and email

**Files:**
- Create: `ADMIN/lib/backend/notifications.ts`, `ADMIN/lib/backend/email.ts`
- Test: `ADMIN/lib/backend/notifications.test.ts`,
  `ADMIN/lib/backend/email.test.ts`

**Interfaces:**
- Consumes: `backendFetch` (Task 5).
- Produces: `sendNotification(input)`, `listNotifications(params)`,
  `sendEmail(input)`, `listEmailLogs(params)`.

- [ ] **Step 1: Write the failing tests**

```typescript
// ADMIN/lib/backend/notifications.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { sendNotification, listNotifications } from './notifications'

describe('notifications backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('sendNotification posts to /admin/notifications/send', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok' })

    await sendNotification({ title: 'x', message: 'y', sendToAll: true })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/notifications/send', {
      method: 'POST',
      body: { title: 'x', message: 'y', sendToAll: true },
    })
  })

  it('listNotifications reads /admin/notifications with paging', async () => {
    mockBackendFetch.mockResolvedValue({
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listNotifications({ page: 2, limit: 10 })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/notifications?page=2&limit=10&order=desc'
    )
  })
})
```

```typescript
// ADMIN/lib/backend/email.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { sendEmail, listEmailLogs } from './email'

describe('email backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('sendEmail posts to /admin/emails/send', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok' })

    await sendEmail({
      emails: ['a@b.com'],
      subject: 's',
      title: 't',
      body: 'b',
    })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/emails/send', {
      method: 'POST',
      body: { emails: ['a@b.com'], subject: 's', title: 't', body: 'b' },
    })
  })

  it('listEmailLogs reads /admin/emails/logs with paging', async () => {
    mockBackendFetch.mockResolvedValue({
      logs: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listEmailLogs({ page: 1, limit: 20 })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/emails/logs?page=1&limit=20&order=desc'
    )
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

```bash
cd ADMIN
npm test -- backend/notifications backend/email
```

Expected: both FAIL, "Cannot find module".

- [ ] **Step 3: Write `lib/backend/notifications.ts`**

Types mirror `BACKEND/src/models/notification.validation.ts` and the
`Notification` Prisma model:

```typescript
import { backendFetch } from './client'

export interface SendNotificationInput {
  title: string
  message: string
  imageUrl?: string
  sendToAll: boolean
  emails?: string[]
}

export interface NotificationRecord {
  id: string
  title: string
  message: string
  imageUrl?: string
  sentBy: string
  sentTo: string[]
  sentToAll: boolean
  status: string
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export async function sendNotification(input: SendNotificationInput) {
  return backendFetch<{ message: string }>('/admin/notifications/send', {
    method: 'POST',
    body: input,
  })
}

export async function listNotifications(params: {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  query.set('order', params.order ?? 'desc')

  return backendFetch<{
    notifications: NotificationRecord[]
    pagination: Pagination
  }>(`/admin/notifications?${query.toString()}`)
}
```

- [ ] **Step 4: Write `lib/backend/email.ts`**

Types mirror `SendEmailSchema` and the `EmailLog` Prisma model:

```typescript
import { backendFetch } from './client'
import type { Pagination } from './notifications'

export interface SendEmailInput {
  emails: string[]
  subject: string
  title: string
  body: string
  banner?: string
  footer?: string
  pdfUrls?: string[]
}

export interface EmailLogRecord {
  id: string
  subject: string
  message: string
  pdfUrls: string[]
  sentBy: string
  sentTo: string[]
  status: string
  createdAt: string
}

export async function sendEmail(input: SendEmailInput) {
  return backendFetch<{ message: string }>('/admin/emails/send', {
    method: 'POST',
    body: input,
  })
}

export async function listEmailLogs(params: {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  query.set('order', params.order ?? 'desc')

  return backendFetch<{ logs: EmailLogRecord[]; pagination: Pagination }>(
    `/admin/emails/logs?${query.toString()}`
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm test -- backend/notifications backend/email
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add ADMIN/lib/backend/notifications.ts ADMIN/lib/backend/email.ts ADMIN/lib/backend/notifications.test.ts ADMIN/lib/backend/email.test.ts
git commit -m "feat(admin): backend client for notifications and email

SendNotificationInput and SendEmailInput mirror
notification.validation.ts. Pagination shared between both list
functions matches the {page, limit, total, totalPages} shape every
BACKEND admin listing returns."
```

---

### Task 9: Backend API client — users and AI drafts

**Files:**
- Create: `ADMIN/lib/backend/users.ts`, `ADMIN/lib/backend/ai-drafts.ts`
- Test: `ADMIN/lib/backend/users.test.ts`, `ADMIN/lib/backend/ai-drafts.test.ts`

**Interfaces:**
- Consumes: `backendFetch` (Task 5), `Pagination` (Task 8).
- Produces: `listUsers(params)`, `listUserEmails()`; `AiDraft`, `DraftKind`,
  `DraftStatus`, `listDrafts(params)`, `getDraft(id)`, `approveDraft(id,
  overrides?)`, `rejectDraft(id, reason?)`, `generateQuiz(input)`,
  `generateNotes(input)`, `generateQuest(input)`,
  `generateNotification(input)`, `reindexKb()`.

- [ ] **Step 1: Write the failing tests**

```typescript
// ADMIN/lib/backend/users.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { listUsers, listUserEmails } from './users'

describe('users backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('listUsers reads /admin/users with paging', async () => {
    mockBackendFetch.mockResolvedValue({
      users: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listUsers({ page: 1, limit: 20 })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/users?page=1&limit=20')
  })

  it('listUserEmails reads /admin/users/emails', async () => {
    mockBackendFetch.mockResolvedValue(['a@b.com'])

    const result = await listUserEmails()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/users/emails')
    expect(result).toEqual(['a@b.com'])
  })
})
```

```typescript
// ADMIN/lib/backend/ai-drafts.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { listDrafts, getDraft, approveDraft, rejectDraft, reindexKb } from './ai-drafts'

describe('ai-drafts backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('listDrafts reads /admin/ai/drafts with filters', async () => {
    mockBackendFetch.mockResolvedValue({
      drafts: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listDrafts({ status: 'pending', kind: 'quiz' })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/ai/drafts?page=1&limit=20&status=pending&kind=quiz'
    )
  })

  it('getDraft unwraps the data envelope', async () => {
    mockBackendFetch.mockResolvedValue({ data: { id: 'd1' } })

    const result = await getDraft('d1')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/drafts/d1')
    expect(result).toEqual({ id: 'd1' })
  })

  it('approveDraft posts overrides', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await approveDraft('d1', { title: 'fixed' })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/drafts/d1/approve', {
      method: 'POST',
      body: { overrides: { title: 'fixed' } },
    })
  })

  it('rejectDraft posts a reason', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await rejectDraft('d1', 'not good enough')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/drafts/d1/reject', {
      method: 'POST',
      body: { reason: 'not good enough' },
    })
  })

  it('reindexKb posts to /admin/ai/kb/reindex with no body', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await reindexKb()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/kb/reindex', {
      method: 'POST',
    })
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

```bash
cd ADMIN
npm test -- backend/users backend/ai-drafts
```

Expected: both FAIL, "Cannot find module".

- [ ] **Step 3: Write `lib/backend/users.ts`**

```typescript
import { backendFetch } from './client'
import type { Pagination } from './notifications'

export interface UserRecord {
  id: string
  clerkId: string
  email: string
  expoTokens: string[]
  createdAt: string
}

export async function listUsers(params: { page?: number; limit?: number }) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))

  return backendFetch<{ users: UserRecord[]; pagination: Pagination }>(
    `/admin/users?${query.toString()}`
  )
}

export async function listUserEmails() {
  return backendFetch<string[]>('/admin/users/emails')
}
```

- [ ] **Step 4: Write `lib/backend/ai-drafts.ts`**

`kind`/`status` values mirror `DRAFT_KINDS`/`DRAFT_STATUSES` in
`BACKEND/src/models/ai.validation.ts`; the five generate functions mirror
`Generate*Schema` in the same file:

```typescript
import { backendFetch } from './client'
import type { Pagination } from './notifications'
import type { QuestType } from './quests'
import type { TopicKey } from './documents'

export const DRAFT_KINDS = ['document', 'quiz', 'key_notes', 'quest', 'notification'] as const
export type DraftKind = (typeof DRAFT_KINDS)[number]

export const DRAFT_STATUSES = ['pending', 'approved', 'rejected'] as const
export type DraftStatus = (typeof DRAFT_STATUSES)[number]

export interface AiDraft {
  id: string
  kind: DraftKind
  status: DraftStatus
  sourceId: string | null
  payload: unknown
  model: string
  createdBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  appliedId: string | null
  error: string | null
  createdAt: string
}

export async function listDrafts(params: {
  page?: number
  limit?: number
  status?: DraftStatus
  kind?: DraftKind
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.status) query.set('status', params.status)
  if (params.kind) query.set('kind', params.kind)

  return backendFetch<{ drafts: AiDraft[]; pagination: Pagination }>(
    `/admin/ai/drafts?${query.toString()}`
  )
}

export async function getDraft(id: string) {
  const result = await backendFetch<{ data: AiDraft }>(`/admin/ai/drafts/${id}`)
  return result.data
}

export async function approveDraft(id: string, overrides?: Record<string, unknown>) {
  return backendFetch<{ message: string; data: { draft: AiDraft; appliedId: string } }>(
    `/admin/ai/drafts/${id}/approve`,
    { method: 'POST', body: { overrides } }
  )
}

export async function rejectDraft(id: string, reason?: string) {
  return backendFetch<{ message: string; data: AiDraft }>(
    `/admin/ai/drafts/${id}/reject`,
    { method: 'POST', body: { reason } }
  )
}

export async function generateQuiz(input: { contentId: string; count?: number }) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/quiz', {
    method: 'POST',
    body: input,
  })
}

export async function generateNotes(input: { contentId: string }) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/notes', {
    method: 'POST',
    body: input,
  })
}

export async function generateQuest(input: {
  contentId: string
  type: QuestType
  gems: number
  questionCount?: number
  passScore?: number
  startsAt: string
  endsAt: string
}) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/quest', {
    method: 'POST',
    body: input,
  })
}

export async function generateNotification(input: {
  kind: 'content' | 'quest'
  id: string
}) {
  return backendFetch<{ message: string; data: AiDraft }>(
    '/admin/ai/generate/notification',
    { method: 'POST', body: input }
  )
}

export async function generateContent(input: {
  title?: string
  topic?: TopicKey
  brief?: string
  sections?: number
  quizCount?: number
}) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/content', {
    method: 'POST',
    body: input,
  })
}

export async function reindexKb() {
  return backendFetch<{ message: string; data: unknown }>('/admin/ai/kb/reindex', {
    method: 'POST',
  })
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm test -- backend/users backend/ai-drafts
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add ADMIN/lib/backend/users.ts ADMIN/lib/backend/ai-drafts.ts ADMIN/lib/backend/users.test.ts ADMIN/lib/backend/ai-drafts.test.ts
git commit -m "feat(admin): backend client for users and the AI draft queue

DraftKind and DraftStatus mirror ai.validation.ts's DRAFT_KINDS and
DRAFT_STATUSES. The five generate* functions and the four draft
review functions (list, get, approve with overrides, reject with a
reason) round out lib/backend, completing every /admin route
BACKEND exposes."
```

---

### Task 10: Zod form schemas

**Files:**
- Create: `ADMIN/lib/schemas.ts`
- Test: `ADMIN/lib/schemas.test.ts`

**Interfaces:**
- Consumes: `QuestType`, `QUEST_TYPES` (Task 7), `TopicKey` (Task 6).
- Produces: `documentFormSchema`, `questFormSchema`, `notificationFormSchema`,
  `emailFormSchema` — used by the form components in Tasks 12-15 for
  client-side validation before a Server Action call.

- [ ] **Step 1: Write the failing test**

```typescript
// ADMIN/lib/schemas.test.ts
import { describe, expect, it } from 'vitest'
import { documentFormSchema, questFormSchema } from './schemas'

describe('documentFormSchema', () => {
  it('rejects a title shorter than 3 characters', () => {
    const result = documentFormSchema.safeParse({
      title: 'ab',
      content: {},
      quiz: {},
      topic: 'aws',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a quiz item with fewer than two options', () => {
    const result = documentFormSchema.safeParse({
      title: 'A valid title',
      content: {},
      quiz: { q1: { que: 'Q', ans: 'A', options: ['A'] } },
      topic: 'aws',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a minimal valid document', () => {
    const result = documentFormSchema.safeParse({
      title: 'A valid title',
      content: {},
      quiz: {},
      topic: 'aws',
    })
    expect(result.success).toBe(true)
  })
})

describe('questFormSchema', () => {
  it('rejects endsAt before startsAt', () => {
    const result = questFormSchema.safeParse({
      title: 'Quest',
      description: 'Do the thing',
      type: 'mcq',
      gems: 10,
      startsAt: '2026-09-10T00:00:00.000Z',
      endsAt: '2026-09-01T00:00:00.000Z',
      payload: { passScore: 1, questions: [{ key: 'q1', que: 'Q', options: ['A', 'B'], ans: 'A' }] },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a passScore above the question count', () => {
    const result = questFormSchema.safeParse({
      title: 'Quest',
      description: 'Do the thing',
      type: 'mcq',
      gems: 10,
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-09-10T00:00:00.000Z',
      payload: { passScore: 2, questions: [{ key: 'q1', que: 'Q', options: ['A', 'B'], ans: 'A' }] },
    })
    expect(result.success).toBe(false)
  })

  it('requires contentId for read_blog', () => {
    const result = questFormSchema.safeParse({
      title: 'Quest',
      description: 'Do the thing',
      type: 'read_blog',
      gems: 10,
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-09-10T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd ADMIN
npm test -- schemas
```

Expected: FAIL with "Cannot find module './schemas'".

- [ ] **Step 3: Write `lib/schemas.ts`**

Ported from `BACKEND/src/models/document.validation.ts`,
`quest.validation.ts` and `notification.validation.ts`, kept in lockstep
with those since a mismatch would let ADMIN accept a shape `BACKEND`
rejects, per the Global Constraints:

```typescript
import { z } from 'zod'

const TOPIC_KEYS = [
  'machine-learning',
  'system-design',
  'devops',
  'aws',
  'data',
  'deep-learning',
] as const

const quizItemSchema = z.object({
  que: z.string().min(1, 'Question is required'),
  ans: z.string().min(1, 'Answer is required'),
  options: z.array(z.string()).min(2, 'At least two options are required'),
})

export const documentFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  content: z.union([z.record(z.string(), z.any()), z.array(z.any())]),
  quiz: z.record(z.string(), quizItemSchema),
  facts: z.string().optional(),
  summary: z.string().optional(),
  key_notes: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().nullable().optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .min(2, 'At least two tags are required')
    .max(5, 'At most five tags are allowed')
    .optional(),
  topic: z.enum(TOPIC_KEYS),
  unlockPoints: z.number().int().min(0).optional(),
})

const QUEST_TYPES = ['mcq', 'scq', 'fill_blank', 'read_blog'] as const

const choiceQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  ans: z.string().min(1),
})

const fillBlankQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  answer: z.string().min(1),
})

const choicePayloadSchema = z.object({
  passScore: z.number().int().min(1),
  questions: z.array(choiceQuestionSchema).min(1),
})

const fillBlankPayloadSchema = z.object({
  passScore: z.number().int().min(1),
  questions: z.array(fillBlankQuestionSchema).min(1),
})

export const questFormSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    type: z.enum(QUEST_TYPES),
    gems: z.number().int().min(1),
    contentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'contentId must be a 24 character hex string')
      .optional(),
    payload: choicePayloadSchema.or(fillBlankPayloadSchema).optional(),
    active: z.boolean().optional().default(true),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt.getTime() <= data.startsAt.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'endsAt must be after startsAt',
      })
    }
    const graded = data.type !== 'read_blog'
    if (graded && !data.payload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload'],
        message: `payload with questions is required for ${data.type} quests`,
      })
    }
    if (graded && data.payload && data.payload.passScore > data.payload.questions.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'passScore'],
        message: 'passScore cannot exceed the number of questions',
      })
    }
    if (data.type === 'read_blog' && !data.contentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contentId'],
        message: 'contentId is required for read_blog quests',
      })
    }
  })

export const notificationFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    imageUrl: z.string().url('Invalid image URL').optional(),
    sendToAll: z.boolean(),
    emails: z.array(z.string().email()).optional(),
  })
  .refine(
    (data) => data.sendToAll || (data.emails !== undefined && data.emails.length > 0),
    { message: 'At least one email is required when sendToAll is false', path: ['emails'] }
  )

export const emailFormSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
  subject: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  banner: z.string().url().optional(),
  footer: z.string().optional(),
  pdfUrls: z.array(z.string().url()).optional(),
})
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- schemas
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add ADMIN/lib/schemas.ts ADMIN/lib/schemas.test.ts
git commit -m "feat(admin): client-side form schemas mirroring BACKEND validation

documentFormSchema, questFormSchema, notificationFormSchema and
emailFormSchema are ported from BACKEND's own document.validation.ts,
quest.validation.ts and notification.validation.ts, kept in lockstep
with those. They give fast client-side feedback; BACKEND's own
validation is still the actual source of truth on every write."
```

---

### Task 11: Overview page

**Files:**
- Create: `ADMIN/app/(dashboard)/page.tsx`

**Interfaces:**
- Consumes: `listUsers`, `listQuests`, `listDrafts` (Tasks 7-9), `Shell`,
  `KpiCard` (Task 3).

- [ ] **Step 1: Write `app/(dashboard)/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { KpiCard } from '@/components/dashboard/cards'
import { listUsers } from '@/lib/backend/users'
import { listQuests } from '@/lib/backend/quests'
import { listDrafts } from '@/lib/backend/ai-drafts'

export default async function OverviewPage() {
  const [usersResult, quests, draftsResult] = await Promise.all([
    listUsers({ page: 1, limit: 1 }),
    listQuests(),
    listDrafts({ status: 'pending', page: 1, limit: 1 }),
  ])

  const activeQuests = quests.filter((q) => new Date(q.endsAt) > new Date()).length

  return (
    <Shell breadcrumb="Overview" active="Overview">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard kpi={{ label: 'Registered Users', value: String(usersResult.pagination.total) }} />
        <KpiCard kpi={{ label: 'Active Quests', value: String(activeQuests) }} />
        <KpiCard kpi={{ label: 'Pending AI Drafts', value: String(draftsResult.pagination.total) }} />
      </div>
    </Shell>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds. This is the first real page, so also verify manually:
set `.env.local` from `.env.example` with real Clerk and `BACKEND_API_URL`
values, run `npm run dev`, sign in with an admin account, confirm the three
KPI numbers render without throwing.

- [ ] **Step 3: Commit**

```bash
git add "ADMIN/app/(dashboard)/page.tsx"
git commit -m "feat(admin): overview page with KPI counts

Registered user count, active quest count (endsAt in the future) and
pending AI draft count, pulled from the same list endpoints the
Users, Quests and AI Drafts pages use rather than a new aggregate
BACKEND route."
```

---

### Task 12: Documents pages and upload Route Handlers

**Files:**
- Create: `ADMIN/app/(dashboard)/documents/page.tsx`,
  `ADMIN/app/(dashboard)/documents/documents-table.tsx`,
  `ADMIN/app/(dashboard)/documents/actions.ts`,
  `ADMIN/app/(dashboard)/documents/new/page.tsx`,
  `ADMIN/app/(dashboard)/documents/[id]/page.tsx`,
  `ADMIN/components/documents/document-form.tsx`,
  `ADMIN/components/documents/upload-fields.tsx`,
  `ADMIN/app/api/documents/[id]/upload-image/route.ts`,
  `ADMIN/app/api/documents/[id]/upload-pdf/route.ts`

**Interfaces:**
- Consumes: `listDocuments`, `createDocument`, `updateDocument`,
  `deleteDocument`, `getDocument`, `listTopics` (Task 6), `useDataTable`,
  `Th`, `FilterPills`, `TablePagination` (Task 3), `documentFormSchema`
  (Task 10), `backendFetch`'s underlying `BACKEND_API_URL` and `auth()`
  pattern for the two Route Handlers.
- Produces: nothing consumed by a later task; this is a leaf page set.

- [ ] **Step 1: Write `app/(dashboard)/documents/actions.ts`, the Server Actions**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createDocument, deleteDocument, updateDocument, type TDocumentInput } from '@/lib/backend/documents'
import { documentFormSchema } from '@/lib/schemas'

export async function createDocumentAction(input: TDocumentInput) {
  const parsed = documentFormSchema.parse(input)
  const result = await createDocument(parsed as TDocumentInput)
  revalidatePath('/documents')
  redirect(`/documents/${result.doc.id}`)
}

export async function updateDocumentAction(id: string, input: Partial<TDocumentInput>) {
  const parsed = documentFormSchema.partial().parse(input)
  await updateDocument(id, parsed as Partial<TDocumentInput>)
  revalidatePath('/documents')
  revalidatePath(`/documents/${id}`)
}

export async function deleteDocumentAction(id: string) {
  await deleteDocument(id)
  revalidatePath('/documents')
  redirect('/documents')
}
```

- [ ] **Step 2: Write `components/documents/document-form.tsx`**

A single form used by both `new/page.tsx` and `[id]/page.tsx`, following the
sample's form conventions (mono micro-labels, `bg-muted/40 shadow-none`
wells, `space-y-3` field stack):

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TDocument, TDocumentInput } from '@/lib/backend/documents'
import type { TopicEntry } from '@/lib/backend/content'

export function DocumentForm({
  topics,
  initial,
  onSubmit,
  submitLabel,
}: {
  topics: TopicEntry[]
  initial?: Partial<TDocument>
  onSubmit: (input: TDocumentInput) => Promise<void>
  submitLabel: string
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [topic, setTopic] = useState(initial?.topic ?? topics[0]?.key ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [facts, setFacts] = useState(initial?.facts ?? '')
  const [unlockPoints, setUnlockPoints] = useState(String(initial?.unlockPoints ?? 0))
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title,
        topic: topic as TDocumentInput['topic'],
        summary: summary || undefined,
        facts: facts || undefined,
        unlockPoints: Number(unlockPoints) || 0,
        tags: tags
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        content: initial?.content ?? {},
        quiz: initial?.quiz ?? {},
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Title
        </Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required minLength={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Topic
        </Label>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger id="topic" className="w-full bg-muted/40 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="unlockPoints" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Unlock Points
        </Label>
        <Input
          id="unlockPoints"
          type="number"
          min={0}
          value={unlockPoints}
          onChange={(e) => setUnlockPoints(e.target.value)}
          className="bg-muted/40 shadow-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Tags (comma separated, 2 to 5)
        </Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-muted/40 shadow-none" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Summary
        </Label>
        <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="bg-muted/40 shadow-none" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="facts" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Facts
        </Label>
        <Input id="facts" value={facts} onChange={(e) => setFacts(e.target.value)} className="bg-muted/40 shadow-none" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
```

`content` and `quiz` (the article body and quiz map) are not hand-authored
in this form: they either come from the AI generation flow (Task 17,
`ai-drafts` producing a `document` kind draft that's approved into a real
document) or are carried over unchanged on an edit. A from-scratch rich
content editor is out of scope for this round, matching the sample's own
scope (its `<AddDialog>` never edits nested structures either); `initial`
keeps whatever `content`/`quiz` already exists.

- [ ] **Step 3: Write `components/documents/upload-fields.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function UploadFields({ documentId }: { documentId: string }) {
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  async function handleUpload(
    kind: 'upload-image' | 'upload-pdf',
    file: File,
    setBusy: (v: boolean) => void
  ) {
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append(kind === 'upload-image' ? 'image' : 'pdf', file)
      const response = await fetch(`/api/documents/${documentId}/${kind}`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message ?? 'Upload failed')
      }
      toast.success('Upload complete')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Cover Image
        </Label>
        <Input
          type="file"
          accept="image/*"
          disabled={uploadingImage}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload('upload-image', file, setUploadingImage)
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          PDF Attachment
        </Label>
        <Input
          type="file"
          accept="application/pdf"
          disabled={uploadingPdf}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload('upload-pdf', file, setUploadingPdf)
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write `app/api/documents/[id]/upload-image/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { getToken } = await auth()
  const token = await getToken()

  const formData = await request.formData()
  const response = await fetch(
    `${process.env.BACKEND_API_URL}/admin/documents/${id}/upload-image`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  )

  const body = await response.text()
  return new NextResponse(body, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
  })
}
```

- [ ] **Step 5: Write `app/api/documents/[id]/upload-pdf/route.ts`**

Identical shape, pointed at `/admin/documents/${id}/upload-pdf`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { getToken } = await auth()
  const token = await getToken()

  const formData = await request.formData()
  const response = await fetch(
    `${process.env.BACKEND_API_URL}/admin/documents/${id}/upload-pdf`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  )

  const body = await response.text()
  return new NextResponse(body, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
  })
}
```

- [ ] **Step 6: Write `app/(dashboard)/documents/documents-table.tsx`, the client table**

```tsx
'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { useDataTable, Th, FilterPills } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { TDocument } from '@/lib/backend/documents'
import type { TopicEntry } from '@/lib/backend/content'

export function DocumentsTable({
  documents,
  topics,
}: {
  documents: (TDocument & { id: string })[]
  topics: TopicEntry[]
}) {
  const t = useDataTable(documents, {
    searchFields: (d) => [d.title, ...(d.tags ?? [])],
    filterField: (d) => d.topic,
    sorters: { title: (d) => d.title, topic: (d) => d.topic },
  })

  const filterOptions = ['All', ...topics.map((topic) => topic.key)]

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="All Documents" />
        <div className="flex items-center gap-2">
          <FilterPills options={filterOptions} value={t.filter} onChange={t.setFilter} />
          <div className="relative hidden md:block">
            <HugeiconsIcon icon={Search01Icon} size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={t.query}
              onChange={(e) => t.setQuery(e.target.value)}
              placeholder="Search documents..."
              className="h-8 w-56 rounded-lg bg-muted/40 pl-8 shadow-none"
            />
          </div>
          <Button asChild size="lg">
            <Link href="/documents/new">
              <HugeiconsIcon icon={PlusSignIcon} size={14} data-icon="inline-start" />
              Add Document
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <Th label="Title" k="title" sort={t} />
              <Th label="Topic" k="topic" sort={t} />
              <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            )}
            {t.rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell className="font-mono">{d.topic}</TableCell>
                <TableCell className="pr-4 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/documents/${d.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} />
    </Card>
  )
}
```

- [ ] **Step 7: Write `app/(dashboard)/documents/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { listDocuments } from '@/lib/backend/documents'
import { listTopics } from '@/lib/backend/content'
import { DocumentsTable } from './documents-table'

export default async function DocumentsPage() {
  const [{ data: documents }, topics] = await Promise.all([
    listDocuments({ limit: 100 }),
    listTopics(),
  ])

  return (
    <Shell breadcrumb="Documents" active="Documents">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Documents</h1>
      </div>
      <DocumentsTable documents={documents} topics={topics} />
    </Shell>
  )
}
```

- [ ] **Step 8: Write `app/(dashboard)/documents/new/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { listTopics } from '@/lib/backend/content'
import { DocumentForm } from '@/components/documents/document-form'
import { createDocumentAction } from '../actions'

export default async function NewDocumentPage() {
  const topics = await listTopics()

  return (
    <Shell breadcrumb="Documents / New" active="Documents">
      <h1 className="text-2xl font-medium tracking-tight">New Document</h1>
      <DocumentForm topics={topics} onSubmit={createDocumentAction} submitLabel="Create Document" />
    </Shell>
  )
}
```

- [ ] **Step 9: Write `app/(dashboard)/documents/[id]/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { getDocument } from '@/lib/backend/documents'
import { listTopics } from '@/lib/backend/content'
import { DocumentForm } from '@/components/documents/document-form'
import { UploadFields } from '@/components/documents/upload-fields'
import { updateDocumentAction, deleteDocumentAction } from '../actions'
import { Button } from '@/components/ui/button'

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [document, topics] = await Promise.all([getDocument(id), listTopics()])

  return (
    <Shell breadcrumb="Documents / Edit" active="Documents">
      <h1 className="text-2xl font-medium tracking-tight">Edit Document</h1>
      <DocumentForm
        topics={topics}
        initial={document}
        onSubmit={(input) => updateDocumentAction(id, input)}
        submitLabel="Save Changes"
      />
      <UploadFields documentId={id} />
      <form action={deleteDocumentAction.bind(null, id)}>
        <Button type="submit" variant="destructive">
          Delete Document
        </Button>
      </form>
    </Shell>
  )
}
```

- [ ] **Step 10: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds.

- [ ] **Step 11: Manual verification**

With `npm run dev` running and signed in as an admin: visit `/documents`,
confirm the list renders and search/topic-filter/sort work; click Add
Document, submit a minimal form, confirm redirect to the new document's edit
page; upload a small image and PDF there, confirm the toast reports success;
delete the document, confirm redirect back to the list.

- [ ] **Step 12: Commit**

```bash
git add ADMIN/app/(dashboard)/documents ADMIN/app/api/documents ADMIN/components/documents
git commit -m "feat(admin): documents list, create, edit and upload pages

Documents list reuses useDataTable over GET /content (limit 100),
filtered by topic via FilterPills. New and edit pages share
DocumentForm; uploads go through two Route Handlers that proxy
multipart requests to BACKEND with the Clerk token attached
server-side, so the token never reaches the browser."
```

---

### Task 13: Quests pages

**Files:**
- Create: `ADMIN/app/(dashboard)/quests/page.tsx`,
  `ADMIN/app/(dashboard)/quests/quests-table.tsx`,
  `ADMIN/app/(dashboard)/quests/new/page.tsx`,
  `ADMIN/app/(dashboard)/quests/actions.ts`,
  `ADMIN/components/quests/quest-form.tsx`

**Interfaces:**
- Consumes: `listQuests`, `createQuest`, `QUEST_TYPES` (Task 7),
  `listDocuments` (Task 6, for the `read_blog` content picker),
  `questFormSchema` (Task 10), `useDataTable`, `StatusBadge` (Task 3).

- [ ] **Step 1: Write `app/(dashboard)/quests/actions.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createQuest, type TCreateQuestInput } from '@/lib/backend/quests'
import { questFormSchema } from '@/lib/schemas'

export async function createQuestAction(input: TCreateQuestInput) {
  const parsed = questFormSchema.parse({
    ...input,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
  })
  await createQuest({
    ...parsed,
    startsAt: parsed.startsAt.toISOString(),
    endsAt: parsed.endsAt.toISOString(),
  })
  revalidatePath('/quests')
  redirect('/quests')
}
```

- [ ] **Step 2: Write `components/quests/quest-form.tsx`**

Branches on `type`: graded types (`mcq`, `scq`, `fill_blank`) show a question
builder, `read_blog` shows a content picker:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QUEST_TYPES, type ChoiceQuestion, type QuestType, type TCreateQuestInput } from '@/lib/backend/quests'
import type { TDocument } from '@/lib/backend/documents'

export function QuestForm({
  documents,
  onSubmit,
}: {
  documents: (TDocument & { id: string })[]
  onSubmit: (input: TCreateQuestInput) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<QuestType>('mcq')
  const [gems, setGems] = useState('10')
  const [contentId, setContentId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [passScore, setPassScore] = useState('1')
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([
    { key: 'q1', que: '', options: ['', ''], ans: '' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const graded = type !== 'read_blog'

  function updateQuestion(index: number, patch: Partial<ChoiceQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title,
        description,
        type,
        gems: Number(gems),
        contentId: type === 'read_blog' ? contentId : undefined,
        payload: graded ? { passScore: Number(passScore), questions } : undefined,
        startsAt,
        endsAt,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as QuestType)}>
          <SelectTrigger className="w-full bg-muted/40 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUEST_TYPES.map((qt) => (
              <SelectItem key={qt} value={qt}>
                {qt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Gems</Label>
          <Input type="number" min={1} value={gems} onChange={(e) => setGems(e.target.value)} className="bg-muted/40 shadow-none" />
        </div>
        {graded && (
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Pass Score</Label>
            <Input type="number" min={1} value={passScore} onChange={(e) => setPassScore(e.target.value)} className="bg-muted/40 shadow-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Starts At</Label>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="bg-muted/40 shadow-none" required />
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Ends At</Label>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="bg-muted/40 shadow-none" required />
        </div>
      </div>

      {type === 'read_blog' ? (
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Document</Label>
          <Select value={contentId} onValueChange={setContentId}>
            <SelectTrigger className="w-full bg-muted/40 shadow-none">
              <SelectValue placeholder="Select a document" />
            </SelectTrigger>
            <SelectContent>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Questions</Label>
          {questions.map((q, i) => (
            <div key={q.key} className="space-y-1.5 rounded-lg border border-border p-3">
              <Input
                placeholder="Question"
                value={q.que}
                onChange={(e) => updateQuestion(i, { que: e.target.value })}
                className="bg-muted/40 shadow-none"
              />
              {q.options.map((opt, oi) => (
                <Input
                  key={oi}
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const options = [...q.options]
                    options[oi] = e.target.value
                    updateQuestion(i, { options })
                  }}
                  className="bg-muted/40 shadow-none"
                />
              ))}
              <Input
                placeholder="Correct answer (must match one option exactly)"
                value={q.ans}
                onChange={(e) => updateQuestion(i, { ans: e.target.value })}
                className="bg-muted/40 shadow-none"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setQuestions((qs) => [
                ...qs,
                { key: `q${qs.length + 1}`, que: '', options: ['', ''], ans: '' },
              ])
            }
          >
            Add Question
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Quest'}
        </Button>
      </div>
    </form>
  )
}
```

`fill_blank` reuses the same question builder shape minus the options list
in a later pass; scoping this task to `mcq`/`scq`/`read_blog` keeps the form
shippable, and `fill_blank`'s `FillBlankQuestion` type already exists in
`lib/backend/quests.ts` (Task 7) for when it's added.

- [ ] **Step 3: Write `app/(dashboard)/quests/quests-table.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { useDataTable, Th } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { TQuest } from '@/lib/backend/quests'

export function QuestsTable({ quests }: { quests: TQuest[] }) {
  const t = useDataTable(quests, {
    searchFields: (q) => [q.title, q.type],
    sorters: { title: (q) => q.title, endsAt: (q) => q.endsAt },
  })

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="All Quests" />
        <Button asChild size="lg">
          <Link href="/quests/new">
            <HugeiconsIcon icon={PlusSignIcon} size={14} data-icon="inline-start" />
            Add Quest
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <Th label="Title" k="title" sort={t} />
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Type</TableHead>
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Gems</TableHead>
              <Th label="Ends" k="endsAt" sort={t} />
              <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            )}
            {t.rows.map((q) => {
              const ended = new Date(q.endsAt) <= new Date()
              return (
                <TableRow key={q.id} className={ended ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{q.title}</TableCell>
                  <TableCell className="font-mono">{q.type}</TableCell>
                  <TableCell className="font-mono">{q.gems}</TableCell>
                  <TableCell className="font-mono">{new Date(q.endsAt).toLocaleDateString()}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusBadge status={ended ? 'Ended' : q.active === false ? 'Withdrawn' : 'Active'} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} />
    </Card>
  )
}
```

- [ ] **Step 4: Write `app/(dashboard)/quests/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { listQuests } from '@/lib/backend/quests'
import { QuestsTable } from './quests-table'

export default async function QuestsPage() {
  const quests = await listQuests()

  return (
    <Shell breadcrumb="Quests" active="Quests">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Quests</h1>
      </div>
      <QuestsTable quests={quests} />
    </Shell>
  )
}
```

- [ ] **Step 5: Write `app/(dashboard)/quests/new/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { listDocuments } from '@/lib/backend/documents'
import { QuestForm } from '@/components/quests/quest-form'
import { createQuestAction } from '../actions'

export default async function NewQuestPage() {
  const { data: documents } = await listDocuments({ limit: 100 })

  return (
    <Shell breadcrumb="Quests / New" active="Quests">
      <h1 className="text-2xl font-medium tracking-tight">New Quest</h1>
      <QuestForm documents={documents} onSubmit={createQuestAction} />
    </Shell>
  )
}
```

- [ ] **Step 6: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds.

- [ ] **Step 7: Manual verification**

Visit `/quests`, confirm the list renders with correct Active/Ended status.
Visit `/quests/new`, create an `mcq` quest with one question, confirm
redirect back to `/quests` and the new quest appears.

- [ ] **Step 8: Commit**

```bash
git add ADMIN/app/(dashboard)/quests ADMIN/components/quests
git commit -m "feat(admin): quests list and create pages

QuestForm branches on type: mcq/scq get an inline question builder,
read_blog gets a document picker sourced from listDocuments. Status
badge derives Active/Ended/Withdrawn from endsAt and active rather
than a separate status field, since Quest carries neither."
```

---

### Task 14: Notifications page

**Files:**
- Create: `ADMIN/app/(dashboard)/notifications/page.tsx`,
  `ADMIN/app/(dashboard)/notifications/actions.ts`,
  `ADMIN/components/notifications/notification-form.tsx`

**Interfaces:**
- Consumes: `sendNotification`, `listNotifications` (Task 8),
  `listUserEmails` (Task 9), `notificationFormSchema` (Task 10).

- [ ] **Step 1: Write `app/(dashboard)/notifications/actions.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { sendNotification, type SendNotificationInput } from '@/lib/backend/notifications'
import { notificationFormSchema } from '@/lib/schemas'

export async function sendNotificationAction(input: SendNotificationInput) {
  const parsed = notificationFormSchema.parse(input)
  await sendNotification(parsed)
  revalidatePath('/notifications')
}
```

- [ ] **Step 2: Write `components/notifications/notification-form.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { SendNotificationInput } from '@/lib/backend/notifications'

export function NotificationForm({
  emails,
  onSubmit,
}: {
  emails: string[]
  onSubmit: (input: SendNotificationInput) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sendToAll, setSendToAll] = useState(true)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        title,
        message,
        sendToAll,
        emails: sendToAll ? undefined : selectedEmails,
      })
      toast.success('Notification sent')
      setTitle('')
      setMessage('')
      setSelectedEmails([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Message</Label>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="sendToAll" checked={sendToAll} onCheckedChange={(v) => setSendToAll(v === true)} />
        <Label htmlFor="sendToAll" className="text-sm">Send to all registered users</Label>
      </div>

      {!sendToAll && (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {emails.map((email) => (
            <label key={email} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedEmails.includes(email)}
                onCheckedChange={(v) =>
                  setSelectedEmails((s) => (v === true ? [...s, email] : s.filter((e) => e !== email)))
                }
              />
              {email}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Notification'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Write `app/(dashboard)/notifications/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { listNotifications } from '@/lib/backend/notifications'
import { listUserEmails } from '@/lib/backend/users'
import { NotificationForm } from '@/components/notifications/notification-form'
import { sendNotificationAction } from './actions'

export default async function NotificationsPage() {
  const [{ notifications }, emails] = await Promise.all([
    listNotifications({ limit: 20 }),
    listUserEmails(),
  ])

  return (
    <Shell breadcrumb="Notifications" active="Notifications">
      <h1 className="text-2xl font-medium tracking-tight">Notifications</h1>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="p-4">
          <PanelTitle title="Send Notification" />
          <div className="mt-3">
            <NotificationForm emails={emails} onSubmit={sendNotificationAction} />
          </div>
        </div>
      </Card>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="flex items-center justify-between px-3 py-2">
          <PanelTitle title="History" />
        </div>
        <div className="overflow-hidden rounded-xl bg-card py-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Title</TableHead>
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Recipients</TableHead>
                <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No notifications sent yet
                  </TableCell>
                </TableRow>
              )}
              {notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.title}</TableCell>
                  <TableCell className="font-mono">{n.sentToAll ? 'All users' : `${n.sentTo.length} users`}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusBadge status={n.status === 'sent' ? 'Sent' : n.status === 'failed' ? 'Failed' : 'Partial'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Shell>
  )
}
```

- [ ] **Step 4: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds.

- [ ] **Step 5: Manual verification**

Visit `/notifications`, send a test notification to a real registered email
(not send-to-all, to avoid a real broadcast during verification), confirm
the toast and that it appears in History on refresh.

- [ ] **Step 6: Commit**

```bash
git add ADMIN/app/(dashboard)/notifications ADMIN/components/notifications
git commit -m "feat(admin): notifications send form and history

Send form and history table on one page, per the spec. Recipient
picker sources from listUserEmails; sendToAll skips it entirely,
matching SendNotificationSchema's own refine rule."
```

---

### Task 15: Email page

**Files:**
- Create: `ADMIN/app/(dashboard)/email/page.tsx`,
  `ADMIN/app/(dashboard)/email/actions.ts`,
  `ADMIN/components/email/email-form.tsx`

**Interfaces:**
- Consumes: `sendEmail`, `listEmailLogs` (Task 8), `listUserEmails`
  (Task 9), `emailFormSchema` (Task 10).

- [ ] **Step 1: Write `app/(dashboard)/email/actions.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { sendEmail, type SendEmailInput } from '@/lib/backend/email'
import { emailFormSchema } from '@/lib/schemas'

export async function sendEmailAction(input: SendEmailInput) {
  const parsed = emailFormSchema.parse(input)
  await sendEmail(parsed)
  revalidatePath('/email')
}
```

- [ ] **Step 2: Write `components/email/email-form.tsx`**

Same recipient-picker pattern as `NotificationForm`, but always requires at
least one email (no send-to-all for transactional email):

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { SendEmailInput } from '@/lib/backend/email'

export function EmailForm({
  emails,
  onSubmit,
}: {
  emails: string[]
  onSubmit: (input: SendEmailInput) => Promise<void>
}) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ emails: selectedEmails, subject, title, body })
      toast.success('Email sent')
      setSubject('')
      setTitle('')
      setBody('')
      setSelectedEmails([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {emails.map((email) => (
          <label key={email} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selectedEmails.includes(email)}
              onCheckedChange={(v) =>
                setSelectedEmails((s) => (v === true ? [...s, email] : s.filter((e) => e !== email)))
              }
            />
            {email}
          </label>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Subject</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Body</Label>
        <Input value={body} onChange={(e) => setBody(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={submitting || selectedEmails.length === 0}>
          {submitting ? 'Sending...' : 'Send Email'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Write `app/(dashboard)/email/page.tsx`**

Mirrors `notifications/page.tsx`'s two-panel layout, reading `listEmailLogs`
and rendering `subject`/`sentTo.length`/`status`:

```tsx
import { Shell } from '@/components/dashboard/shell'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { listEmailLogs } from '@/lib/backend/email'
import { listUserEmails } from '@/lib/backend/users'
import { EmailForm } from '@/components/email/email-form'
import { sendEmailAction } from './actions'

export default async function EmailPage() {
  const [{ logs }, emails] = await Promise.all([
    listEmailLogs({ limit: 20 }),
    listUserEmails(),
  ])

  return (
    <Shell breadcrumb="Email" active="Email">
      <h1 className="text-2xl font-medium tracking-tight">Email</h1>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="p-4">
          <PanelTitle title="Send Email" />
          <div className="mt-3">
            <EmailForm emails={emails} onSubmit={sendEmailAction} />
          </div>
        </div>
      </Card>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="flex items-center justify-between px-3 py-2">
          <PanelTitle title="Logs" />
        </div>
        <div className="overflow-hidden rounded-xl bg-card py-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Subject</TableHead>
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Recipients</TableHead>
                <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No emails sent yet
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.subject}</TableCell>
                  <TableCell className="font-mono">{log.sentTo.length} recipients</TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusBadge status={log.status === 'sent' ? 'Sent' : 'Failed'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Shell>
  )
}
```

- [ ] **Step 4: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add ADMIN/app/(dashboard)/email ADMIN/components/email
git commit -m "feat(admin): email send form and logs

Same two-panel pattern as Notifications: send form on top, logs
table below. Requires at least one selected recipient, matching
SendEmailSchema's min(1) rule rather than offering a send-to-all
option email never had."
```

---

### Task 16: Users page

**Files:**
- Create: `ADMIN/app/(dashboard)/users/page.tsx`,
  `ADMIN/app/(dashboard)/users/users-table.tsx`

**Interfaces:**
- Consumes: `listUsers` (Task 9), `useDataTable` (Task 3).

- [ ] **Step 1: Write `app/(dashboard)/users/users-table.tsx`**

```tsx
'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { useDataTable, Th } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { UserRecord } from '@/lib/backend/users'

export function UsersTable({ users }: { users: UserRecord[] }) {
  const t = useDataTable(users, {
    searchFields: (u) => [u.email],
    sorters: { email: (u) => u.email, createdAt: (u) => u.createdAt },
  })

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="Registered Users" />
        <div className="relative hidden md:block">
          <HugeiconsIcon icon={Search01Icon} size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={t.query}
            onChange={(e) => t.setQuery(e.target.value)}
            placeholder="Search users..."
            className="h-8 w-56 rounded-lg bg-muted/40 pl-8 shadow-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <Th label="Email" k="email" sort={t} />
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Devices</TableHead>
              <Th label="Joined" k="createdAt" sort={t} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            )}
            {t.rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell className="font-mono">{u.expoTokens.length}</TableCell>
                <TableCell className="font-mono">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} />
    </Card>
  )
}
```

- [ ] **Step 2: Write `app/(dashboard)/users/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { listUsers } from '@/lib/backend/users'
import { UsersTable } from './users-table'

export default async function UsersPage() {
  const { users } = await listUsers({ limit: 100 })

  return (
    <Shell breadcrumb="Users" active="Users">
      <h1 className="text-2xl font-medium tracking-tight">Users</h1>
      <UsersTable users={users} />
    </Shell>
  )
}
```

- [ ] **Step 3: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add ADMIN/app/(dashboard)/users
git commit -m "feat(admin): read-only users list

listUsers at limit 100, useDataTable over that page for search and
sort by email and join date. No edit or delete: BACKEND exposes no
admin write route for users, so none is offered here."
```

---

### Task 17: AI Drafts pages

**Files:**
- Create: `ADMIN/app/(dashboard)/ai-drafts/page.tsx`,
  `ADMIN/app/(dashboard)/ai-drafts/drafts-table.tsx`,
  `ADMIN/app/(dashboard)/ai-drafts/[id]/page.tsx`,
  `ADMIN/app/(dashboard)/ai-drafts/actions.ts`,
  `ADMIN/components/ai-drafts/draft-review.tsx`

**Interfaces:**
- Consumes: `listDrafts`, `getDraft`, `approveDraft`, `rejectDraft`
  (Task 9), `StatusBadge`, `FilterPills` (Task 3).

- [ ] **Step 1: Write `app/(dashboard)/ai-drafts/actions.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { approveDraft, rejectDraft } from '@/lib/backend/ai-drafts'

export async function approveDraftAction(id: string, overrides?: Record<string, unknown>) {
  await approveDraft(id, overrides)
  revalidatePath('/ai-drafts')
  revalidatePath(`/ai-drafts/${id}`)
}

export async function rejectDraftAction(id: string, reason?: string) {
  await rejectDraft(id, reason)
  revalidatePath('/ai-drafts')
  revalidatePath(`/ai-drafts/${id}`)
}
```

- [ ] **Step 2: Write `components/ai-drafts/draft-review.tsx`**

Renders the payload as formatted JSON with an editable overrides textarea,
rather than a bespoke form per kind: `payload` is `unknown` on the wire
(Task 9's `AiDraft.payload: unknown`), and its five possible shapes (a whole
document, a quiz map, notes, a quest, notification copy) are exactly what
`approveDraft`'s `overrides` merges over before `BACKEND` re-validates, so a
raw JSON editor is both the simplest UI and the one that can never drift
from whatever shape the model actually returned:

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { AiDraft } from '@/lib/backend/ai-drafts'

export function DraftReview({
  draft,
  onApprove,
  onReject,
}: {
  draft: AiDraft
  onApprove: (overrides?: Record<string, unknown>) => Promise<void>
  onReject: (reason?: string) => Promise<void>
}) {
  const [overridesText, setOverridesText] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleApprove() {
    setBusy(true)
    try {
      const overrides = overridesText.trim() ? JSON.parse(overridesText) : undefined
      await onApprove(overrides)
      toast.success('Draft approved and applied')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    setBusy(true)
    try {
      await onReject(reason || undefined)
      toast.success('Draft rejected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <p className="mb-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Payload</p>
        <pre className="max-h-96 overflow-auto font-mono text-xs">
          {JSON.stringify(draft.payload, null, 2)}
        </pre>
      </div>

      {draft.status === 'pending' && (
        <>
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              Overrides (JSON, merged over the payload before approval)
            </p>
            <textarea
              value={overridesText}
              onChange={(e) => setOverridesText(e.target.value)}
              placeholder="{}"
              rows={4}
              className="w-full rounded-lg bg-muted/40 p-2 font-mono text-xs shadow-none outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleApprove} disabled={busy} size="lg">
              Approve
            </Button>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason (optional)"
              className="h-8 flex-1 rounded-lg bg-muted/40 px-2 text-sm shadow-none outline-none"
            />
            <Button onClick={handleReject} disabled={busy} variant="destructive">
              Reject
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `app/(dashboard)/ai-drafts/drafts-table.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { useDataTable, Th, FilterPills } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { AiDraft } from '@/lib/backend/ai-drafts'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function DraftsTable({ drafts }: { drafts: AiDraft[] }) {
  const t = useDataTable(drafts, {
    searchFields: (d) => [d.kind, d.model],
    filterField: (d) => d.kind,
    sorters: { kind: (d) => d.kind, status: (d) => d.status, createdAt: (d) => d.createdAt },
  })

  const kinds = ['All', ...Array.from(new Set(drafts.map((d) => d.kind)))]

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="AI Drafts" />
        <FilterPills options={kinds} value={t.filter} onChange={t.setFilter} />
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <Th label="Kind" k="kind" sort={t} />
              <Th label="Created" k="createdAt" sort={t} />
              <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No drafts found
                </TableCell>
              </TableRow>
            )}
            {t.rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  <Link href={`/ai-drafts/${d.id}`} className="hover:underline">
                    {d.kind}
                  </Link>
                </TableCell>
                <TableCell className="font-mono">{new Date(d.createdAt).toLocaleString()}</TableCell>
                <TableCell className="pr-4 text-right">
                  <StatusBadge status={STATUS_LABEL[d.status] ?? d.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} />
    </Card>
  )
}
```

- [ ] **Step 4: Write `app/(dashboard)/ai-drafts/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { listDrafts } from '@/lib/backend/ai-drafts'
import { DraftsTable } from './drafts-table'

export default async function AiDraftsPage() {
  const { drafts } = await listDrafts({ limit: 100 })

  return (
    <Shell breadcrumb="AI Drafts" active="AI Drafts">
      <h1 className="text-2xl font-medium tracking-tight">AI Drafts</h1>
      <DraftsTable drafts={drafts} />
    </Shell>
  )
}
```

- [ ] **Step 5: Write `app/(dashboard)/ai-drafts/[id]/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { getDraft } from '@/lib/backend/ai-drafts'
import { DraftReview } from '@/components/ai-drafts/draft-review'
import { approveDraftAction, rejectDraftAction } from '../actions'

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const draft = await getDraft(id)

  return (
    <Shell breadcrumb={`AI Drafts / ${draft.kind}`} active="AI Drafts">
      <h1 className="text-2xl font-medium tracking-tight">Review Draft</h1>
      <DraftReview
        draft={draft}
        onApprove={(overrides) => approveDraftAction(id, overrides)}
        onReject={(reason) => rejectDraftAction(id, reason)}
      />
    </Shell>
  )
}
```

- [ ] **Step 6: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds.

- [ ] **Step 7: Manual verification**

Trigger a draft from `BACKEND` directly (e.g. `POST
/admin/ai/generate/notes` against an existing document via curl or Postman,
per `BACKEND/postman.collection.json`), then confirm it appears in
`/ai-drafts`, opens with its payload rendered as JSON, and Approve applies
it (check the source document actually changed) or Reject marks it
rejected.

- [ ] **Step 8: Commit**

```bash
git add ADMIN/app/(dashboard)/ai-drafts ADMIN/components/ai-drafts
git commit -m "feat(admin): AI draft review, approve and reject

List page filters by kind. Review renders the payload as formatted
JSON with an editable overrides textarea rather than a bespoke form
per kind, since payload's shape varies by kind and overrides is
exactly what BACKEND's approve route merges in before re-validating,
so a raw JSON editor cannot drift from what the model actually
returned."
```

---

### Task 18: Settings page

**Files:**
- Create: `ADMIN/app/(dashboard)/settings/page.tsx`,
  `ADMIN/app/(dashboard)/settings/actions.ts`

**Interfaces:**
- Consumes: `reindexKb` (Task 9), `requireAdminUser` (Task 4, for the
  profile display).

- [ ] **Step 1: Write `app/(dashboard)/settings/actions.ts`**

```typescript
'use server'

import { reindexKb } from '@/lib/backend/ai-drafts'

export async function reindexKbAction() {
  return reindexKb()
}
```

- [ ] **Step 2: Write `app/(dashboard)/settings/page.tsx`**

```tsx
import { Shell } from '@/components/dashboard/shell'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { requireAdminUser } from '@/lib/require-admin'
import { ReindexButton } from './reindex-button'

export default async function SettingsPage() {
  const check = await requireAdminUser()
  const email = check.ok
    ? (check.user.publicMetadata as { email?: string }).email ?? check.user.id
    : ''

  return (
    <Shell breadcrumb="Settings" active="Settings">
      <h1 className="text-2xl font-medium tracking-tight">Settings</h1>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="p-4">
          <PanelTitle title="Admin Profile" />
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
      </Card>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="p-4">
          <PanelTitle title="Support Knowledge Base" />
          <p className="mt-2 text-sm text-muted-foreground">
            Rebuilds the embedded chunks the support chat answers from. Run this
            after editing BACKEND/src/services/ai/kb/support.md or after new
            content is published.
          </p>
          <div className="mt-3">
            <ReindexButton />
          </div>
        </div>
      </Card>
    </Shell>
  )
}
```

- [ ] **Step 3: Write `app/(dashboard)/settings/reindex-button.tsx`**

A separate client component so the server component above stays a Server
Component:

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { reindexKbAction } from './actions'

export function ReindexButton() {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      await reindexKbAction()
      toast.success('Knowledge base reindexed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reindex failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={busy} variant="outline">
      {busy ? 'Reindexing...' : 'Reindex Knowledge Base'}
    </Button>
  )
}
```

- [ ] **Step 4: Verify the build**

```bash
cd ADMIN
npm run build
```

Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add ADMIN/app/(dashboard)/settings
git commit -m "feat(admin): settings page with KB reindex

Reindex is a maintenance action against the whole knowledge base
rather than a per-record one, so it lives on Settings instead of
inside AI Drafts, per the spec."
```

---

### Task 19: Documentation and process records

**Files:**
- Modify: `D:\Projects\Studzee\CLAUDE.md`, `D:\Projects\Studzee\.docs\TCSK.md`,
  `D:\Projects\Studzee\.docs\RECORDS.md`, `D:\Projects\Studzee\WORKLOG.md`
- Create: `D:\Projects\Studzee\ADMIN\README.md`

**Interfaces:**
- None; this task only touches documentation.

- [ ] **Step 1: Write `ADMIN/README.md`**

```markdown
# STUDZEE ADMIN

Next.js admin console for Studzee, replacing the paused `DESKTOP` Electron
console. Covers every route under `BACKEND`'s `/admin` router: documents,
quests, notifications, email, users, and the AI draft queue.

## PREREQUISITES

Node 22, and a `BACKEND` instance to point at (local or deployed) with an
admin Clerk account (`publicMetadata.role: "admin"`).

## RUNNING IT

```bash
cd ADMIN
npm install
cp .env.example .env.local   # fill in Clerk keys and BACKEND_API_URL
npm run dev                  # http://localhost:3000
```

## ENVIRONMENT

| Var | Notes |
| --- | ----- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Same Clerk instance as `BACKEND` and `MOBILE` |
| `CLERK_SECRET_KEY` | Server-only |
| `BACKEND_API_URL` | Server-only; the deployed or local `BACKEND` URL |

## DESIGN SYSTEM

Ported from `D:\Projects\dashboard\style-docs`. See that project's
`style-docs/design.md`, `tray-card.md`, `sidebar.md` and `scrollbar.md` for
the token and component reference; nothing here restates it.

## DEPLOYMENT

Vercel. `BACKEND`'s CORS configuration needs the deployed ADMIN domain
allow-listed.

## TESTING

```bash
npm test
```

Vitest + React Testing Library, `vi.spyOn` over `fetch` for
`lib/backend/*`, matching `BACKEND`'s own test house style.
```

- [ ] **Step 2: Update `CLAUDE.md`'s module table**

Add a row for `ADMIN` in the table under `## WHAT THIS IS`:

```
| `ADMIN` | Next.js admin console. Clerk auth, server-side fetch to `BACKEND`, no separate database. Replaces the paused `DESKTOP` console. | Active. |
```

Update the `DESKTOP` row's State column from whatever it currently reads to:

```
Paused. ADMIN is its replacement.
```

- [ ] **Step 3: Update `.docs/TCSK.md`**

Find the `### DESKTOP WORK NOTED FOR LATER, 25-08-2026` section and append a
note above it (do not delete the existing section, since the badge/level
catalog and progress-browser items it lists are still open):

```markdown
### ADMIN PANEL SHIPPED <TODAY'S DATE>

DESKTOP work is paused for good; ADMIN (Next.js) is its replacement,
covering every BACKEND /admin route: documents, quests, notifications,
email, users, and the AI draft queue. Design system ported verbatim from
D:\Projects\dashboard\style-docs. Auth via Clerk Next.js middleware, all
data fetched server-side straight from BACKEND, no separate database.
Deployed to Vercel.

Of the DESKTOP WORK NOTED FOR LATER items below, the topic selector and
unlockPoints field are done (Documents form). The badge/level catalog
screen and the per-user progress browser are still open: the progress
browser is still blocked on an admin-scoped GET /progress endpoint that
does not exist in BACKEND yet.

See docs/superpowers/specs/2026-09-02-admin-panel-design.md and
docs/superpowers/plans/2026-09-02-admin-panel.md for the full design and
implementation record.
```

Replace `<TODAY'S DATE>` with the actual date this task is executed, in the
repo's `DD-MM-YYYY` format.

- [ ] **Step 4: Add a row to `.docs/RECORDS.md`**

Follow that file's existing row format (read the file first to match its
exact columns), adding one row for "ADMIN panel" crediting the developer who
merges the PR, dated the day of the PR.

- [ ] **Step 5: Add a dated entry to `WORKLOG.md`**

Follow that file's existing entry format (read the file first to match its
exact style), summarizing: scaffolded the ADMIN Next.js module, ported the
design system from `D:\Projects\dashboard`, built pages for documents,
quests, notifications, email, users and the AI draft queue, Clerk auth with
an admin-role gate, uploads proxied through Route Handlers.

- [ ] **Step 6: Run the full test suite and build one more time**

```bash
cd ADMIN
npm test
npm run build
cd ..
```

Expected: all tests pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add ADMIN/README.md CLAUDE.md .docs/TCSK.md .docs/RECORDS.md WORKLOG.md
git commit -m "docs(admin): document the ADMIN module and close out TCSK notes

ADMIN/README.md covers setup, env vars and testing. CLAUDE.md's
module table gains an ADMIN row and marks DESKTOP paused. TCSK
records the topic-selector and unlockPoints items as done, leaving
the badge/level catalog and progress-browser items open as before."
```

- [ ] **Step 8: Open the pull request**

```bash
git push -u origin feat/admin-panel
gh pr create --title "feat(admin): add the ADMIN Next.js panel" --body "$(cat <<'EOF'
## Summary

Adds ADMIN, a Next.js admin console replacing the paused DESKTOP
Electron console, covering every route BACKEND's /admin router
exposes: documents (create, update, delete, image and PDF upload),
quests, notifications, email, users, and the AI draft queue (generate,
list, approve with overrides, reject, KB reindex).

## Details

- Design system ported verbatim from D:\Projects\dashboard\style-docs,
  domain data swapped from the sample's e-commerce pages.
- Auth via Clerk Next.js middleware; the admin-role check mirrors
  BACKEND's requireAdmin exactly (a server-side Clerk user fetch
  checked against publicMetadata.role).
- Every read and write goes through lib/backend/*, a typed client
  attaching the Clerk session token server-side. No separate database.
- Uploads proxy through two Next.js Route Handlers so the Clerk token
  never reaches the browser.
- Deployed to Vercel.

## Docs

See docs/superpowers/specs/2026-09-02-admin-panel-design.md and
docs/superpowers/plans/2026-09-02-admin-panel.md for the full design
and implementation record.

## Testing

npm test and npm run build both pass in ADMIN. Manual verification
steps are recorded per task in the implementation plan.
EOF
)"
```

This plan does not push or merge on its own beyond opening the PR; per house
rules the owner merges.

---

## Self-Review

**Spec coverage:** Every section of `docs/superpowers/specs/2026-09-02-admin-panel-design.md`
maps to a task: Architecture and File Structure to Tasks 1-4, Auth to Task 4,
Data flow and Pages-to-routes to Tasks 5-18, Design System to Tasks 1-3,
Testing to the test steps embedded in Tasks 4-10, Environment to Task 1 and
Task 19's README, Documentation and process to Task 19. The spec's Deferred
section (progress browser, editable thresholds, DESKTOP's dropped pages,
Docker/Fargate deployment, a separate database) is deliberately not built
here, and Task 19 records that explicitly in TCSK rather than silently
dropping it.

**Placeholder scan:** No TBD/TODO markers. Every step carries real code, a
real command, or a real file to copy from a path confirmed to exist during
this plan's research.

**Type consistency:** `TDocument`/`TDocumentInput` (Task 6) flow unchanged
into `document-form.tsx` and `documents-table.tsx` (Task 12).
`TCreateQuestInput`/`QuestType`/`ChoiceQuestion` (Task 7) flow unchanged into
`quest-form.tsx` and `quests-table.tsx` (Task 13). `AiDraft`/`DraftKind`/
`DraftStatus` (Task 9) flow unchanged into `drafts-table.tsx` and
`draft-review.tsx` (Task 17). `Pagination` (Task 8) is reused by `users.ts`
and `ai-drafts.ts` (Task 9) rather than redefined. `useDataTable`, `Th`,
`FilterPills`, `TablePagination`, `PanelTitle`, `StatusBadge`, `KpiCard`
(Task 3) are imported by name, unchanged, in every later table-bearing page.
