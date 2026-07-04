'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PATHS, type PathSlug } from '@/constants/paths';

export function PathCard({
  path,
  total,
  readCount,
  passedCount,
}: {
  path: PathSlug;
  total: number;
  readCount: number;
  passedCount: number;
}) {
  const meta = PATHS[path];
  const pct = total ? Math.round((readCount / total) * 100) : 0;

  return (
    <Link
      href={`/path/${path}`}
      className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="font-medium tracking-tight">{meta.label}</h3>
          <p className="text-xs text-muted-foreground">
            {total} topics · {passedCount} {passedCount === 1 ? 'quiz' : 'quizzes'} passed
          </p>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {readCount}/{total} · {pct}%
          </span>
        </div>
        <Progress value={pct} />
      </div>
    </Link>
  );
}
