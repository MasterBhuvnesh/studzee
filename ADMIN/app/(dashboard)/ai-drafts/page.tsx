import { Shell } from '@/components/dashboard/shell'
import { DraftsTable } from '@/components/ai-drafts/drafts-table'
import { GeneratePanel } from '@/components/ai-drafts/generate-panel'
import { SchedulePanel } from '@/components/ai-drafts/schedule-panel'
import { listDrafts } from '@/lib/backend/ai-drafts'
import { listDocuments } from '@/lib/backend/documents'
import { listSchedules } from '@/lib/backend/schedule'
import {
  cancelScheduleAction,
  generateContentAction,
  generateNotesAction,
  generateNotificationAction,
  generateQuestAction,
  generateQuizAction,
  scheduleContentAction,
} from './actions'

export default async function AiDraftsPage() {
  const [{ drafts }, { data: documents }, { schedules }] = await Promise.all([
    listDrafts({ page: 1, limit: 100 }),
    listDocuments({ limit: 100 }),
    listSchedules({ page: 1, limit: 100 }).catch(() => ({ schedules: [] })),
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
      <SchedulePanel
        schedules={schedules}
        onSchedule={scheduleContentAction}
        onCancel={cancelScheduleAction}
      />
      <DraftsTable drafts={drafts} />
    </Shell>
  )
}
