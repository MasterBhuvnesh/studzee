'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { toast } from 'sonner';
import { ChatComposer } from '@/components/app/chat-composer';
import { Bot } from 'lucide-react';

export default function NewChatPage() {
  const create = useMutation(api.chat.create);
  const send = useAction(api.chat.send);
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function start(text: string) {
    setStarting(true);
    try {
      const id = await create({});
      // Fire the reply; the conversation page picks it up via the reactive query.
      send({ chatId: id, content: text }).catch((e) => {
        console.error(e);
        toast.error('Failed to send message');
      });
      router.push(`/chat/${id}`);
    } catch (e) {
      console.error(e);
      toast.error('Could not start a new chat');
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
          <Bot className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            What can I help you learn?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask about System Design or DevOps answers are grounded in the
            content.
          </p>
        </div>
      </div>

      <div className="w-full">
        <ChatComposer
          onSend={start}
          sending={starting}
          autoFocus
          placeholder="Ask anything…"
        />
      </div>
    </div>
  );
}
