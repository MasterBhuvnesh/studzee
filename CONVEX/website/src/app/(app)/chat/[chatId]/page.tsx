'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { toast } from 'sonner';
import { Markdown } from '@/components/app/markdown';
import { ChatComposer } from '@/components/app/chat-composer';

type Message = {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  done: boolean;
};

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const id = chatId as Id<'chats'>;
  const chat = useQuery(api.chat.get, { chatId: id });
  const messages = useQuery(api.chat.messages, { chatId: id });
  const send = useAction(api.chat.send);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function onSend(text: string) {
    setSending(true);
    try {
      await send({ chatId: id, content: text });
    } catch (e) {
      console.error(e);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (chat === null) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Chat not found</p>
        <Link href="/chat" className="text-sm text-muted-foreground underline">
          Start a new chat
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-2 py-4">
          {messages === undefined || messages.length === 0 ? null : (
            messages.map((m) => (
              <MessageRow key={m._id} message={m as Message} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-2 pt-2">
        <ChatComposer onSend={onSend} sending={sending} autoFocus />
        <p className="py-2 text-center text-xs text-muted-foreground">
          Studzee can make mistakes. Verify important details.
        </p>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="min-w-0 flex-1 space-y-2">
        {message.reasoning && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">Reasoning</summary>
            <p className="mt-1 leading-relaxed whitespace-pre-wrap">
              {message.reasoning}
            </p>
          </details>
        )}
        {message.content ? (
          <Markdown>{message.content}</Markdown>
        ) : !message.done ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-current" />
            Thinking…
          </p>
        ) : null}
      </div>
    </div>
  );
}
