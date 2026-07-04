'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

export function AiSummary({ blogSlug }: { blogSlug: string }) {
  const summarize = useAction(api.ai.summarize);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await summarize({ blogSlug });
      setSummary(res.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate summary');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {summary ? (
        <p className="rounded-lg border border-dashed border-border bg-background/50 p-3 text-sm leading-relaxed">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" />
            AI summary
          </span>
          {summary}
        </p>
      ) : (
        <Button variant="outline" size="sm" onClick={run} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {loading ? 'Summarizing…' : 'AI quick summary'}
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
