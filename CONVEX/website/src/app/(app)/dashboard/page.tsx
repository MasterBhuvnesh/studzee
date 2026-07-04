'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Brain, Bot, ArrowRight, Activity, type LucideIcon } from 'lucide-react';
import { PathCard } from '@/components/app/path-card';
import { ProgressOverview } from '@/components/app/progress-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { PATH_SLUGS } from '@/constants/paths';

// ponytail: TopicGraph is built but hidden for now — re-add the section to show it.

export default function DashboardPage() {
  const blogs = useQuery(api.blogs.list);
  const readSlugs = useQuery(api.progress.readSlugs);
  const quizStatus = useQuery(api.quiz.statusForUser);

  const readSet = new Set(readSlugs ?? []);
  const passedSet = new Set(
    (quizStatus ?? []).filter((s) => s.passed).map((s) => s.blogSlug)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your progress across learning paths.
        </p>
      </div>

      {/* Overall progress */}
      <section>
        {blogs === undefined || readSlugs === undefined || quizStatus === undefined ? (
          <Skeleton className="h-72 rounded-2xl" />
        ) : (
          (() => {
            const total = blogs.length;
            const readCount = blogs.filter((b) => readSet.has(b.slug)).length;
            const passedCount = blogs.filter((b) => passedSet.has(b.slug)).length;
            const left = total - readCount;
            return (
              <ProgressOverview
                icon={Activity}
                title="Learning Progress"
                subtitle="Overall completion across all paths."
                metrics={[
                  {
                    label: 'Topics Read',
                    value: total ? (readCount / total) * 100 : 0,
                    color: 'bg-emerald-500 dark:bg-emerald-400',
                  },
                  {
                    label: 'Quizzes Passed',
                    value: total ? (passedCount / total) * 100 : 0,
                    color: 'bg-blue-500 dark:bg-blue-400',
                  },
                ]}
                footer={
                  left === 0
                    ? { text: 'All topics read — great work!' }
                    : {
                        text: `${left} ${left === 1 ? 'topic' : 'topics'} to go — keep the momentum!`,
                      }
                }
              />
            );
          })()
        )}
      </section>

      {/* Path cards */}
      <section className="grid gap-4 md:grid-cols-2">
        {blogs === undefined ? (
          <>
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </>
        ) : (
          PATH_SLUGS.map((p) => {
            const inPath = blogs.filter((b) => b.path === p);
            return (
              <PathCard
                key={p}
                path={p}
                total={inPath.length}
                readCount={inPath.filter((b) => readSet.has(b.slug)).length}
                passedCount={inPath.filter((b) => passedSet.has(b.slug)).length}
              />
            );
          })
        )}
      </section>

      {/* AI shortcuts */}
      <section className="grid gap-4 sm:grid-cols-2">
        <AiCard
          href="/quiz"
          icon={Brain}
          title="AI Quiz"
          body="Generate a fresh 5-question quiz on any topic or a random one."
        />
        <AiCard
          href="/chat"
          icon={Bot}
          title="AI Chat"
          body="Ask questions about any topic. Answers are grounded in the content."
        />
      </section>
    </div>
  );
}

function AiCard({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <h3 className="flex items-center gap-1 font-medium tracking-tight">
          {title}
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </Link>
  );
}
