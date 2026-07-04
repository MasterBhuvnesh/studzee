import Link from 'next/link';
import { ArrowRight, ArrowUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib';

const SEGMENTS = 32;

export type ProgressMetric = {
  label: string;
  /** 0–100 */
  value: number;
  /** Tailwind bg class for filled segments, e.g. 'bg-emerald-500' */
  color: string;
  /** Optional trend badge, e.g. +10.2 → "↑ 10.2%". Omit when there's no real trend data. */
  delta?: number;
};

function SegmentBar({ label, value, color, delta }: ProgressMetric) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const filled = Math.round((pct / 100) * SEGMENTS);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {label}
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              delta >= 0
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/15 text-red-600 dark:text-red-400'
            )}
          >
            <ArrowUp className={cn('size-3', delta < 0 && 'rotate-180')} />
            {Math.abs(delta)}%
          </span>
        )}
        <span className="text-lg font-semibold tabular-nums tracking-tight">
          {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex h-7 gap-[3px]"
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            className={cn(
              'min-w-0 flex-1 rounded-[3px]',
              i < filled ? color : 'bg-foreground/10'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ProgressOverview({
  icon: Icon,
  title,
  subtitle,
  metrics,
  footer,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  metrics: ProgressMetric[];
  footer?: { text: string; href?: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-2xl border border-border bg-card p-6',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium tracking-tight">{title}</h3>
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {metrics.map((m) => (
        <SegmentBar key={m.label} {...m} />
      ))}

      {footer &&
        (footer.href ? (
          <Link
            href={footer.href}
            className="group flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-400"
          >
            <span className="flex-1">{footer.text}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {footer.text}
          </div>
        ))}
    </div>
  );
}
