'use client';

import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';
import { timeAgo } from '@/utils/time';

export function NotificationBell() {
  const unread = useQuery(api.notifications.unreadCount) ?? 0;
  const items = useQuery(api.notifications.list) ?? [];
  const markAll = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-medium text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 && (
            <button
              onClick={() => markAll()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-auto">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            items.slice(0, 8).map((n) => (
              <Link
                key={n._id}
                href={n.link ?? '/notifications'}
                onClick={() => {
                  if (!n.read) markRead({ id: n._id });
                }}
                className="flex flex-col gap-0.5 px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="size-1.5 shrink-0 rounded-full bg-brand-orange" />
                  )}
                  <span className="text-sm font-medium">{n.title}</span>
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {n.body}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  {timeAgo(n.createdAt)}
                </span>
              </Link>
            ))
          )}
        </div>
        <Separator />
        <Link
          href="/notifications"
          className="block px-3 py-2.5 text-center text-xs text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
