import { Shell } from '@/components/dashboard/shell'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { ModelForm } from '@/components/settings/model-form'
import { getAiConfig } from '@/lib/backend/ai-config'
import { requireAdminUser } from '@/lib/require-admin'
import { updateChatModelAction } from './actions'

export default async function SettingsPage() {
  const check = await requireAdminUser()
  const backendUrl = process.env.BACKEND_API_URL ?? 'Not set'
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

  // A down backend must not take the whole Settings screen with it. The
  // session and environment cards below render regardless.
  const aiConfig = await getAiConfig().catch(() => null)

  const sessionRows: [string, string][] =
    check.ok === true
      ? [
          ['Email', check.user.email ?? 'None'],
          ['User id', check.user.id],
          ['Role', 'admin'],
        ]
      : [['Status', 'Unknown']]

  const envRows: [string, string][] = [
    ['Backend API', backendUrl],
    ['Clerk publishable key', clerkConfigured ? 'Configured' : 'Missing'],
  ]

  return (
    <Shell breadcrumb="Settings" active="Settings">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
      </div>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="px-3 py-2">
          <PanelTitle title="Session" />
        </div>
        <dl className="grid gap-x-8 gap-y-2 rounded-xl bg-card p-4 sm:grid-cols-2">
          {sessionRows.map(([term, value]) => (
            <div key={term} className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{term}</dt>
              <dd className="truncate font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {aiConfig ? (
        <ModelForm config={aiConfig} onUpdate={updateChatModelAction} />
      ) : (
        <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
          <div className="px-3 py-2">
            <PanelTitle title="AI Model" />
            <p className="mt-1 text-sm text-muted-foreground">
              The backend did not answer, so the model selector is unavailable.
            </p>
          </div>
        </Card>
      )}

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="px-3 py-2">
          <PanelTitle title="Environment" />
        </div>
        <dl className="grid gap-x-8 gap-y-2 rounded-xl bg-card p-4 sm:grid-cols-2">
          {envRows.map(([term, value]) => (
            <div key={term} className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{term}</dt>
              <dd className="truncate font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </Shell>
  )
}
