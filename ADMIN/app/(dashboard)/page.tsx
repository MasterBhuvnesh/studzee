import { Shell } from '@/components/dashboard/shell'
import { KpiCard } from '@/components/dashboard/cards'
import { listUsers } from '@/lib/backend/users'
import { listQuests } from '@/lib/backend/quests'
import { listDrafts } from '@/lib/backend/ai-drafts'

export default async function OverviewPage() {
  const [usersResult, quests, draftsResult] = await Promise.all([
    listUsers({ page: 1, limit: 1 }),
    listQuests(),
    listDrafts({ status: 'pending', page: 1, limit: 1 }),
  ])

  const activeQuests = quests.filter((q) => new Date(q.endsAt) > new Date()).length

  return (
    <Shell breadcrumb="Overview" active="Overview">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard kpi={{ label: 'Registered Users', value: String(usersResult.pagination.total) }} />
        <KpiCard kpi={{ label: 'Active Quests', value: String(activeQuests) }} />
        <KpiCard kpi={{ label: 'Pending AI Drafts', value: String(draftsResult.pagination.total) }} />
      </div>
    </Shell>
  )
}
