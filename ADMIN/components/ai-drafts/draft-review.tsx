'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { AiDraft } from '@/lib/backend/ai-drafts'

export function DraftReview({
  draft,
  onApprove,
  onReject,
}: {
  draft: AiDraft
  onApprove: (overrides?: Record<string, unknown>) => Promise<void>
  onReject: (reason?: string) => Promise<void>
}) {
  const [overridesText, setOverridesText] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleApprove() {
    setBusy(true)
    try {
      const overrides = overridesText.trim() ? JSON.parse(overridesText) : undefined
      await onApprove(overrides)
      toast.success('Draft approved and applied')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    setBusy(true)
    try {
      await onReject(reason || undefined)
      toast.success('Draft rejected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <p className="mb-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Payload</p>
        <pre className="max-h-96 overflow-auto font-mono text-xs">
          {JSON.stringify(draft.payload, null, 2)}
        </pre>
      </div>

      {draft.status === 'pending' && (
        <>
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              Overrides (JSON, merged over the payload before approval)
            </p>
            <textarea
              value={overridesText}
              onChange={(e) => setOverridesText(e.target.value)}
              placeholder="{}"
              rows={4}
              className="w-full rounded-lg bg-muted/40 p-2 font-mono text-xs shadow-none outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleApprove} disabled={busy} size="lg">
              Approve
            </Button>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason (optional)"
              className="h-8 flex-1 rounded-lg bg-muted/40 px-2 text-sm shadow-none outline-none"
            />
            <Button onClick={handleReject} disabled={busy} variant="destructive">
              Reject
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
