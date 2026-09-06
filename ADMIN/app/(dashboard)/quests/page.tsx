import { Shell } from '@/components/dashboard/shell'
import { listQuests } from '@/lib/backend/quests'
import { QuestsTable } from './quests-table'
import { setQuestActiveAction } from './actions'

export default async function QuestsPage() {
  const quests = await listQuests()

  return (
    <Shell breadcrumb="Quests" active="Quests">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Quests</h1>
      </div>
      <QuestsTable quests={quests} onToggleActive={setQuestActiveAction} />
    </Shell>
  )
}
