'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { BlogCard } from '@/components/app/blog-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PATHS, isPathSlug } from '@/constants/paths';

export default function PathPage() {
  const { path } = useParams<{ path: string }>();
  const valid = isPathSlug(path);

  const blogs = useQuery(api.blogs.byPath, valid ? { path } : 'skip');
  const readSlugs = useQuery(api.progress.readSlugs);
  const quizStatus = useQuery(api.quiz.statusForUser);

  if (!valid) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Unknown path</p>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const meta = PATHS[path];
  const Icon = meta.icon;
  const readSet = new Set(readSlugs ?? []);
  const passedSet = new Set(
    (quizStatus ?? []).filter((s) => s.passed).map((s) => s.blogSlug)
  );

  const total = blogs?.length ?? 0;
  const readCount = blogs?.filter((b) => readSet.has(b.slug)).length ?? 0;
  const passedCount = blogs?.filter((b) => passedSet.has(b.slug)).length ?? 0;
  const pct = total ? Math.round((readCount / total) * 100) : 0;
  const nextBlog = blogs?.find((b) => !readSet.has(b.slug)) ?? blogs?.[0];

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 p-6 sm:border-r sm:border-border">
            <p className="text-sm text-muted-foreground">{meta.blurb}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-5xl font-semibold tracking-tight">
                {pct}%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-medium">
                <Icon className="size-3.5" />
                {meta.label}
              </span>
            </div>
          </div>
          {nextBlog && (
            <div className="flex items-center p-6">
              <Link
                href={`/blog/${nextBlog.slug}`}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: meta.accent }}
              >
                Continue learning
              </Link>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-border bg-muted/20 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Topics
            </p>
            <p className="mt-1 font-medium">{total}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Read
            </p>
            <p className="mt-1 font-medium">{readCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Quizzes passed
            </p>
            <p className="mt-1 font-medium">{passedCount}</p>
          </div>
        </div>
      </header>

      {blogs === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((b) => (
            <BlogCard
              key={b.slug}
              blog={b}
              read={readSet.has(b.slug)}
              quizPassed={passedSet.has(b.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
