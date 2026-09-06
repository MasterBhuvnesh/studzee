import { Shell } from '@/components/dashboard/shell'
import { listDocuments } from '@/lib/backend/documents'
import { QuestForm } from '@/components/quests/quest-form'
import { createQuestAction } from '../actions'

export default async function NewQuestPage() {
  const { data: documents } = await listDocuments({ limit: 100 })

  return (
    <Shell breadcrumb="Quests / New" active="Quests">
      <h1 className="text-2xl font-medium tracking-tight">New Quest</h1>
      <QuestForm documents={documents} onSubmit={createQuestAction} />
    </Shell>
  )
}
