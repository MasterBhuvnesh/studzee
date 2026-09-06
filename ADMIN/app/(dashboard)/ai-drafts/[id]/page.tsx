import { notFound } from 'next/navigation'
import { Shell } from '@/components/dashboard/shell'
import { Card } from '@/components/ui/card'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { DraftReviewSection } from '@/components/ai-drafts/draft-review-section'
import { getDraft } from '@/lib/backend/ai-drafts'
import { approveDraftAction, rejectDraftAction } from '../actions'

function statusLabel(status: string) {
  return status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : 'Rejected'
}

export default async function AiDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let draft
  try {
    draft = await getDraft(id)
  } catch {
    notFound()
  }

  const meta: [string, string][] = [
    ['Kind', draft.kind],
    ['Model', draft.model],
    ['Created by', draft.createdBy],
    ['Created', new Date(draft.createdAt).toLocaleString()],
    ['Source', draft.sourceId ?? 'None'],
    ['Reviewed by', draft.reviewedBy ?? 'Not reviewed yet'],
    ['Applied id', draft.appliedId ?? 'None'],
  ]

  return (
    <Shell breadcrumb={`AI Drafts / ${draft.kind}`} active="AI Drafts">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Draft review</h1>
        <StatusBadge status={statusLabel(draft.status)} />
      </div>

      {draft.error && (
        <Card className="gap-0 border-red-200 bg-red-50 p-4 text-sm text-red-700 ring-0 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {draft.error}
        </Card>
      )}

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="px-3 py-2">
          <PanelTitle title="Details" />
        </div>
        <dl className="grid gap-x-8 gap-y-2 rounded-xl bg-card p-4 sm:grid-cols-2">
          {meta.map(([term, value]) => (
            <div key={term} className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{term}</dt>
              <dd className="truncate font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <DraftReviewSection draft={draft} onApprove={approveDraftAction} onReject={rejectDraftAction} />
    </Shell>
  )
}
