'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ArrowLeft, Lightbulb, BadgeCheck, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { MarkReadButton } from '@/components/app/mark-read-button';
import { Quiz } from '@/components/app/quiz';
import { AiSummary } from '@/components/app/ai-summary';
import { AskAboutTopic } from '@/components/app/ask-about-topic';
import { BlogBanner } from '@/components/app/blog-banner';
import { PATHS } from '@/constants/paths';

export default function BlogPage() {
  const { slug } = useParams<{ slug: string }>();
  const blog = useQuery(api.blogs.getBySlug, { slug });
  const quizStatus = useQuery(api.quiz.statusForBlog, { blogSlug: slug });

  if (blog === undefined) return <BlogSkeleton />;
  if (blog === null) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-lg font-medium">Topic not found</p>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const path = PATHS[blog.path];
  const paragraphs = blog.description.split('\n\n');

  return (
    <article className="mx-auto max-w-4xl space-y-8 pb-16">
      <Link
        href={`/path/${blog.path}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {path.label}
      </Link>

      {/* Banner (generated gradient by default, image if uploaded) */}
      <div className="relative aspect-12/5 w-full">
        <BlogBanner
          title={blog.title}
          path={blog.path}
          seed={blog.slug}
          bannerImg={blog.bannerImg}
          className="h-full w-full rounded-2xl"
        />
        <span
          className="absolute left-4 top-4 z-10 rounded-md px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: path.accent }}
        >
          {path.label}
        </span>
      </div>

      {/* Lead + author */}
      <header className="space-y-4">
        <p className="text-lg text-muted-foreground">{blog.shortDescription}</p>

        {blog.author && (
          <Link
            href={`/author/${blog.author.slug}`}
            className="inline-flex items-center gap-3 rounded-full border border-border p-1 pr-4 transition-colors hover:bg-muted/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blog.author.avatar}
              alt=""
              className="size-9 rounded-full object-cover"
            />
            <span className="text-sm">
              <span className="font-medium">{blog.author.name}</span>
              <span className="block text-xs text-muted-foreground">
                {blog.author.role}
              </span>
            </span>
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="size-4 text-muted-foreground" />
          {blog.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      </header>

      {/* Facts */}
      {blog.facts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="size-4" />
            Quick facts
          </h2>
          <ul className="space-y-2">
            {blog.facts.map((f, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: path.accent }}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Body */}
      <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Summary
        </h2>
        <p className="text-sm leading-relaxed">{blog.summary}</p>
        <AiSummary blogSlug={blog.slug} />
      </div>

      {/* Linked topics */}
      {blog.linkedSlugs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Connected topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {blog.linkedSlugs.map((s) => (
              <Link
                key={s}
                href={`/blog/${s}`}
                className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted/50"
              >
                {s.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <MarkReadButton blogSlug={blog.slug} />
        <AskAboutTopic blogSlug={blog.slug} />
        {quizStatus?.passed && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-500">
            <BadgeCheck className="size-4" />
            Quiz passed ({quizStatus.score}/{quizStatus.total})
          </span>
        )}
      </div>

      <Separator />

      {/* Quiz */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Test yourself — {blog.quizCount} questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Score 70% or higher to pass this topic.
            {quizStatus && !quizStatus.passed && (
              <> Your best so far: {quizStatus.score}/{quizStatus.total}.</>
            )}
          </p>
        </div>
        <Quiz blogSlug={blog.slug} quiz={blog.quiz} />
      </section>
    </article>
  );
}

function BlogSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="aspect-12/5 w-full rounded-2xl" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
