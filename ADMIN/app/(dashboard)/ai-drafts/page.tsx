import { Shell } from '@/components/dashboard/shell'
import { DraftsTable } from '@/components/ai-drafts/drafts-table'
import { GeneratePanel } from '@/components/ai-drafts/generate-panel'
import { listDrafts } from '@/lib/backend/ai-drafts'
import { listDocuments } from '@/lib/backend/documents'
import {
  generateContentAction,
  generateNotesAction,
  generateNotificationAction,
  generateQuestAction,
  generateQuizAction,
} from './actions'

export default async function AiDraftsPage() {
  const [{ drafts }, { data: documents }] = await Promise.all([
    listDrafts({ page: 1, limit: 100 }),
    listDocuments({ limit: 100 }),
  ])

  return (
    <Shell breadcrumb="AI Drafts" active="AI Drafts">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">AI Drafts</h1>
      </div>
      <GeneratePanel
        documents={documents}
        onGenerateContent={generateContentAction}
        onGenerateQuiz={generateQuizAction}
        onGenerateNotes={generateNotesAction}
        onGenerateQuest={generateQuestAction}
        onGenerateNotification={generateNotificationAction}
      />
      <DraftsTable drafts={drafts} />
    </Shell>
  )
}
