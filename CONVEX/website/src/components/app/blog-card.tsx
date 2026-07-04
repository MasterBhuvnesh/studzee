'use client';

import Link from 'next/link';
import { CheckCircle2, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BlogBanner } from '@/components/app/blog-banner';
import { PATHS, type PathSlug } from '@/constants/paths';

export type BlogSummary = {
  slug: string;
  title: string;
  path: PathSlug;
  shortDescription: string;
  tags: string[];
  bannerImg: string;
  quizCount: number;
};

export function BlogCard({
  blog,
  read,
  quizPassed,
}: {
  blog: BlogSummary;
  read?: boolean;
  quizPassed?: boolean;
}) {
  const path = PATHS[blog.path];
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
    >
      <div className="relative aspect-5/2 w-full">
        <BlogBanner
          title={blog.title}
          path={blog.path}
          seed={blog.slug}
          bannerImg={blog.bannerImg}
          showTitle={false}
          className="h-full w-full"
        />
        <span
          className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
          style={{ backgroundColor: path.accent }}
        >
          {path.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug tracking-tight">
            {blog.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1 pt-0.5">
            {read && (
              <span title="Read" className="inline-flex">
                <CheckCircle2 className="size-4 text-muted-foreground" />
              </span>
            )}
            {quizPassed && (
              <span title="Quiz passed" className="inline-flex">
                <BadgeCheck className="size-4 text-emerald-500" />
              </span>
            )}
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {blog.shortDescription}
        </p>

        <div className="mt-auto flex flex-wrap gap-1 pt-2">
          {blog.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[11px]">
              {t}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
