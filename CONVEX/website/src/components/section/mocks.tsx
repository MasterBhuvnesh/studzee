import {
  Bot,
  Server,
  Cloud,
  Brain,
  FileText,
  Check,
  Circle,
  Sparkles,
  Monitor,
  Smartphone,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib';

/**
 * Static marketing mock screens, one per marketing feature. Non-interactive;
 * they reuse the real app's tokens and icons. Each fills its `relative` parent.
 */

function Screen({
  url,
  children,
  className,
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col bg-card text-left text-foreground select-none',
        className
      )}
    >
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-border bg-muted/40 px-3">
        <span className="size-2 rounded-full bg-red-400/70" />
        <span className="size-2 rounded-full bg-yellow-400/70" />
        <span className="size-2 rounded-full bg-green-400/70" />
        {url && (
          <span className="mx-auto rounded border border-border bg-background px-2 py-px text-[9px] text-muted-foreground">
            {url}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
    </div>
  );
}

/* ---- Detailsection ---- */

// "Access your content everywhere — web, mobile, and desktop"
export function MockDevices() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card p-5 select-none">
      {/* desktop */}
      <div className="w-[80%] overflow-hidden rounded-lg border border-border bg-background shadow-lg">
        <div className="flex h-5 items-center gap-1 border-b border-border bg-muted/40 px-2">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="ml-1 flex items-center gap-1 text-[9px] text-muted-foreground">
            <Monitor className="size-2.5" /> Web
          </span>
        </div>
        <div className="space-y-1.5 p-3">
          <div className="h-2 w-1/2 rounded bg-muted" />
          <div className="h-1.5 w-full rounded bg-muted/60" />
          <div className="h-1.5 w-4/5 rounded bg-muted/60" />
          <div className="mt-2 flex gap-1.5">
            <div className="h-8 flex-1 rounded bg-muted/50" />
            <div className="h-8 flex-1 rounded bg-muted/50" />
          </div>
        </div>
      </div>
      {/* phone, synced */}
      <div className="absolute right-6 bottom-6 w-16 overflow-hidden rounded-xl border-2 border-border bg-background shadow-xl">
        <div className="flex h-4 items-center justify-center gap-1 border-b border-border bg-muted/40">
          <Smartphone className="size-2.5 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">App</span>
        </div>
        <div className="space-y-1 p-1.5">
          <div className="h-1.5 w-3/4 rounded bg-muted" />
          <div className="h-1.5 w-full rounded bg-muted/60" />
          <div className="h-1.5 w-2/3 rounded bg-muted/60" />
          <div className="h-4 w-full rounded bg-emerald-500/20" />
        </div>
      </div>
    </div>
  );
}

// "Content that arrives structured — not dumped in your lap"
export function MockReading() {
  return (
    <Screen url="studzee.app/system-design/caching">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Server className="size-3" /> System Design <span>/</span> Caching
      </div>
      <h3 className="mt-2 text-sm font-semibold">Caching Strategies</h3>
      <div className="mt-2 space-y-2">
        <div>
          <div className="h-2 w-24 rounded bg-foreground/70" />
          <div className="mt-1 space-y-1">
            <div className="h-1.5 w-full rounded bg-muted" />
            <div className="h-1.5 w-11/12 rounded bg-muted" />
          </div>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
          <p className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-3" /> Auto summary
          </p>
          <div className="mt-1 space-y-1">
            <div className="h-1.5 w-full rounded bg-emerald-500/20" />
            <div className="h-1.5 w-3/4 rounded bg-emerald-500/20" />
          </div>
        </div>
        <div>
          <div className="h-2 w-20 rounded bg-foreground/70" />
          <div className="mt-1 space-y-1">
            <div className="h-1.5 w-full rounded bg-muted" />
            <div className="h-1.5 w-5/6 rounded bg-muted" />
          </div>
        </div>
      </div>
    </Screen>
  );
}

// "Let AI handle the heavy lifting — you just learn"
export function MockChat() {
  return (
    <Screen url="studzee.app/chat">
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <span className="rounded-2xl bg-muted px-2.5 py-1 text-[10px]">
            Explain consistent hashing
          </span>
        </div>
        <div className="flex gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border">
            <Bot className="size-3" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <div className="h-2 w-28 rounded bg-foreground/70" />
            <div className="h-1.5 w-full rounded bg-muted" />
            <div className="h-1.5 w-11/12 rounded bg-muted" />
            <div className="rounded bg-muted/60 p-1.5">
              <div className="h-1.5 w-2/3 rounded bg-muted-foreground/30" />
            </div>
            <div className="h-1.5 w-3/4 rounded bg-muted" />
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ---- Featuressection ---- */

// "Prevent knowledge gaps"
export function MockTopics() {
  const items: [string, boolean][] = [
    ['Load balancing', true],
    ['Caching', true],
    ['Message queues', false],
    ['Database sharding', false],
    ['Rate limiting', true],
  ];
  return (
    <Screen url="studzee.app/system-design">
      <p className="text-[10px] font-medium text-muted-foreground">Your coverage</p>
      <div className="mt-2 space-y-1.5">
        {items.map(([label, done]) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
          >
            {done ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Circle className="size-3.5 text-muted-foreground/50" />
            )}
            <span className={cn('text-[11px]', !done && 'text-muted-foreground')}>
              {label}
            </span>
            {!done && (
              <span className="ml-auto rounded bg-orange-500/15 px-1.5 py-px text-[9px] text-orange-500">
                gap
              </span>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

// "Improve retention"
export function MockQuiz() {
  const opts: [string, 'right' | 'wrong' | 'idle'][] = [
    ['O(1) average lookup', 'right'],
    ['Requires sorting keys', 'wrong'],
    ['Only works in memory', 'idle'],
  ];
  return (
    <Screen url="studzee.app/quiz">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Brain className="size-3" /> Question 3 / 5
        </span>
        <span>Spaced repetition</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-3/5 rounded-full bg-blue-500" />
      </div>
      <p className="mt-2.5 text-[11px] font-medium">
        What is a hash map’s lookup cost?
      </p>
      <div className="mt-2 space-y-1.5">
        {opts.map(([label, state]) => (
          <div
            key={label}
            className={cn(
              'flex items-center gap-2 rounded-md border px-2 py-1.5 text-[11px]',
              state === 'right' &&
                'border-emerald-500/40 bg-emerald-500/10 font-medium',
              state === 'wrong' && 'border-red-500/40 bg-red-500/10',
              state === 'idle' && 'border-border bg-background text-muted-foreground'
            )}
          >
            {state === 'right' ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Circle className="size-3.5 text-muted-foreground/40" />
            )}
            {label}
          </div>
        ))}
      </div>
    </Screen>
  );
}

// "Save time and energy"
export function MockSummary() {
  return (
    <Screen url="studzee.app/summary">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-muted">
          <FileText className="size-3.5" />
        </span>
        <div>
          <p className="text-[11px] font-semibold">Kubernetes — Auto notes</p>
          <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Clock className="size-2.5" /> Generated in 2s
          </p>
        </div>
      </div>
      <div className="mt-2.5 space-y-2">
        {[Cloud, Server, Sparkles].map((Icon: LucideIcon, i) => (
          <div key={i} className="flex items-start gap-2">
            <Icon className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-1.5 w-full rounded bg-muted" />
              <div className="h-1.5 w-4/5 rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        <span className="rounded bg-muted px-1.5 py-px text-[9px] text-muted-foreground">
          5 min read
        </span>
        <span className="rounded bg-muted px-1.5 py-px text-[9px] text-muted-foreground">
          12 key points
        </span>
      </div>
    </Screen>
  );
}
