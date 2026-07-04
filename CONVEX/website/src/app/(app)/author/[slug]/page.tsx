'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { AtSign, Code2, Globe, type LucideIcon } from 'lucide-react';
import { BlogCard } from '@/components/app/blog-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const author = useQuery(api.authors.getBySlug, { slug });

  if (author === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (author === null) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Author not found</p>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const socials: { icon: LucideIcon; href: string; label: string }[] = [];
  if (author.socials.github)
    socials.push({
      icon: Code2,
      href: `https://github.com/${author.socials.github}`,
      label: 'GitHub',
    });
  if (author.socials.twitter)
    socials.push({
      icon: AtSign,
      href: `https://x.com/${author.socials.twitter}`,
      label: 'X',
    });
  if (author.socials.website)
    socials.push({
      icon: Globe,
      href: author.socials.website,
      label: 'Website',
    });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={author.avatar}
          alt=""
          className="size-20 rounded-full object-cover"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{author.name}</h1>
          <p className="text-sm text-muted-foreground">{author.role}</p>
          <div className="flex gap-2">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <Button key={s.label} asChild variant="outline" size="sm">
                  <a href={s.href} target="_blank" rel="noreferrer">
                    <Icon className="size-4" />
                    {s.label}
                  </a>
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      <p className="max-w-2xl leading-relaxed text-foreground/90">{author.bio}</p>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {author.blogs.length} {author.blogs.length === 1 ? 'topic' : 'topics'} by{' '}
          {author.name.split(' ')[0]}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {author.blogs.map((b) => (
            <BlogCard key={b.slug} blog={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
