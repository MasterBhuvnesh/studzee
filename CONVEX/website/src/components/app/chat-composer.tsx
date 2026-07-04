'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';

export function ChatComposer({
  onSend,
  sending = false,
  autoFocus = false,
  placeholder = 'Message Studzee…',
}: {
  onSend: (text: string) => void | Promise<void>;
  sending?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function submit() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    onSend(text);
  }

  return (
    <div className="flex items-end gap-2 rounded-3xl border border-border bg-background p-2 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Message"
        className="max-h-52 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-sm"
      />
      <Button
        size="icon"
        onClick={submit}
        disabled={sending || !input.trim()}
        aria-label="Send message"
        className="size-9 shrink-0 rounded-full"
      >
        {sending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowUp className="size-4" />
        )}
      </Button>
    </div>
  );
}
