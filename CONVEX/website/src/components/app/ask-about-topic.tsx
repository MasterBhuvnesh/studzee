'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export function AskAboutTopic({ blogSlug }: { blogSlug: string }) {
  const create = useMutation(api.chat.create);
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={async () => {
        const id = await create({ blogSlug });
        router.push(`/chat/${id}`);
      }}
    >
      <Bot className="size-4" />
      Ask about this topic
    </Button>
  );
}
