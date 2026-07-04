'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function MarkReadButton({ blogSlug }: { blogSlug: string }) {
  const state = useQuery(api.progress.forBlog, { blogSlug });
  const markRead = useMutation(api.progress.markRead);

  if (state?.read) {
    return (
      <Button variant="secondary" size="lg" disabled>
        <CheckCircle2 className="size-4" />
        Completed
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      disabled={state === undefined}
      onClick={async () => {
        await markRead({ blogSlug });
        toast.success('Marked as read');
      }}
    >
      Mark as read
    </Button>
  );
}
