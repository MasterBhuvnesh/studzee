'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SquarePen, Trash2 } from 'lucide-react';
import { cn } from '@/lib';

export function ChatHistory({ onNavigate }: { onNavigate?: () => void }) {
  const chats = useQuery(api.chat.list);
  const remove = useMutation(api.chat.remove);
  const router = useRouter();
  const { chatId } = useParams<{ chatId?: string }>();

  async function onDelete(id: Id<'chats'>) {
    try {
      await remove({ chatId: id });
      if (id === chatId) router.push('/chat');
    } catch (e) {
      console.error(e);
      toast.error('Could not delete chat');
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <Button asChild variant="outline" className="justify-start rounded-xl">
        <Link href="/chat" onClick={onNavigate}>
          <SquarePen className="size-4" />
          New chat
        </Link>
      </Button>

      <ScrollArea className="-mx-1 flex-1">
        <div className="space-y-0.5 px-1">
          {chats === undefined ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))
          ) : chats.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No conversations yet.
            </p>
          ) : (
            chats.map((c) => (
              <div
                key={c._id}
                className={cn(
                  'group flex items-center rounded-lg transition-colors hover:bg-muted',
                  c._id === chatId && 'bg-muted'
                )}
              >
                <Link
                  href={`/chat/${c._id}`}
                  onClick={onNavigate}
                  className={cn(
                    'min-w-0 flex-1 truncate px-3 py-2 text-sm',
                    c._id === chatId
                      ? 'font-medium'
                      : 'text-muted-foreground'
                  )}
                  title={c.title}
                >
                  {c.title.length > 15 ? `${c.title.slice(0, 15)}...` : c.title}
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${c.title}`}
                  onClick={() => onDelete(c._id)}
                  className="mr-1 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
