'use client';

import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/utils/time';
import { cn } from '@/lib';

export default function NotificationsPage() {
  const items = useQuery(api.notifications.list);
  const markAll = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);
  const hasUnread = items?.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={() => markAll()}>
            Mark all read
          </Button>
        )}
      </div>

      {items === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
          You&apos;re all caught up.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n._id}>
              <Link
                href={n.link ?? '/notifications'}
                onClick={() => {
                  if (!n.read) markRead({ id: n._id });
                }}
                className={cn(
                  'flex flex-col gap-1 rounded-xl border p-4 transition-colors hover:bg-muted/50',
                  n.read
                    ? 'border-border'
                    : 'border-brand-orange/30 bg-brand-orange/5'
                )}
              >
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="size-1.5 shrink-0 rounded-full bg-brand-orange" />
                  )}
                  <span className="font-medium">{n.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
