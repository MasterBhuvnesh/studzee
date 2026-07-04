import {
  LayoutDashboard,
  Bot,
  Brain,
  Server,
  Cloud,
  Activity,
  ArrowRight,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib';

/**
 * Marketing hero mock: a static Studzee dashboard window built from the same
 * nav, cards, and tokens the real app uses. Non-interactive by design.
 */
export function MockApp({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card text-left shadow-2xl shadow-black/10 select-none',
        className
      )}
    >
      {/* window bar */}
      <div className="flex h-9 items-center gap-2 border-b border-border bg-muted/40 px-3">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-yellow-400/70" />
          <span className="size-2.5 rounded-full bg-green-400/70" />
        </span>
        <span className="mx-auto rounded-md border border-border bg-background px-3 py-0.5 text-[11px] text-muted-foreground">
          studzee.app/dashboard
        </span>
      </div>

      <div className="flex h-100 text-[13px]">
        <MockSidebar />

        <div className="min-w-0 flex-1 space-y-5 overflow-hidden p-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Dashboard</h2>
            <p className="text-xs text-muted-foreground">
              Track your progress across learning paths.
            </p>
          </div>

          {/* progress card */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <Activity className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium">Learning Progress</p>
                <p className="text-[11px] text-muted-foreground">
                  Overall completion across all paths.
                </p>
              </div>
            </div>
            <Meter label="Topics Read" value={72} color="bg-emerald-500 dark:bg-emerald-400" />
            <Meter label="Quizzes Passed" value={54} color="bg-blue-500 dark:bg-blue-400" />
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500" />4 topics to go —
              keep the momentum!
            </p>
          </div>

          {/* path cards */}
          <div className="grid grid-cols-2 gap-3">
            <PathCard icon={Server} label="System Design" accent="var(--brand-purple)" read={9} total={12} />
            <PathCard icon={Cloud} label="DevOps" accent="var(--brand-orange)" read={6} total={11} />
          </div>

          {/* AI shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <AiCard icon={Brain} title="AI Quiz" body="Generate a fresh 5-question quiz." />
            <AiCard icon={Bot} title="AI Chat" body="Ask about any topic, grounded." />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockSidebar() {
  return (
    <aside className="hidden w-48 shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
      <div className="flex h-12 items-center gap-2 border-b border-border px-3">
        <Image
          src="/images/icon.png"
          alt="Studzee"
          width={24}
          height={24}
          className="size-6 rounded-md object-contain"
        />
        <span className="text-sm font-semibold tracking-tight">Studzee</span>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 text-xs text-muted-foreground">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
        <SidebarItem icon={Bot} label="AI Chat" />
        <SidebarItem icon={Brain} label="AI Quiz" />
        <p className="mt-3 mb-1 px-2 text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          Learn
        </p>
        <SidebarItem icon={Server} label="System Design" />
        <SidebarItem icon={Cloud} label="DevOps" />
      </nav>
    </aside>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        'flex h-8 items-center gap-2 rounded-md px-2',
        active && 'bg-accent font-medium text-foreground'
      )}
    >
      <Icon className="size-4" />
      {label}
    </span>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PathCard({
  icon: Icon,
  label,
  accent,
  read,
  total,
}: {
  icon: LucideIcon;
  label: string;
  accent: string;
  read: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-md"
          style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)` }}
        >
          <Icon className="size-3.5" style={{ color: accent }} />
        </span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${(read / total) * 100}%`, background: accent }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {read}/{total} topics read
      </p>
    </div>
  );
}

function AiCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-background p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-xs font-medium">
          {title}
          <ArrowRight className="size-3 text-muted-foreground" />
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
