'use client'

import { DraftReview } from './draft-review'
import type { AiDraft } from '@/lib/backend/ai-drafts'

// Server Components cannot close over the draft id when handing the approve
// and reject actions to the client review form, so this wrapper binds it.
export function DraftReviewSection({
  draft,
  onApprove,
  onReject,
}: {
  draft: AiDraft
  onApprove: (id: string, overrides?: Record<string, unknown>) => Promise<void>
  onReject: (id: string, reason?: string) => Promise<void>
}) {
  return (
    <DraftReview
      draft={draft}
      onApprove={(overrides) => onApprove(draft.id, overrides)}
      onReject={(reason) => onReject(draft.id, reason)}
    />
  )
}
