'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AiConfigView } from '@/lib/backend/ai-config'

const labelClass = 'font-mono text-[11px] tracking-wide text-muted-foreground uppercase'
const inputClass = 'bg-muted/40 shadow-none'

export function ModelForm({
  config,
  onUpdate,
}: {
  config: AiConfigView
  onUpdate: (chatModel: string) => Promise<void>
}) {
  const [model, setModel] = useState(config.chatModel)
  const [busy, setBusy] = useState(false)
  const changed = model !== config.chatModel

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await onUpdate(model)
      toast.success('Chat model updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="px-3 py-2">
        <PanelTitle title="AI Model" />
        <p className="mt-1 text-sm text-muted-foreground">
          Every generation and support answer uses this model. Currently{' '}
          {config.source === 'stored' ? 'set by an admin' : 'the deployment default'}
          {config.updatedBy ? ` (${config.updatedBy})` : ''}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 rounded-xl bg-card p-4">
        <div className="space-y-1.5">
          <Label className={labelClass}>Chat model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.availableModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                  {m === config.defaultModel ? ' (default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={busy || !changed}>
          Save model
        </Button>
      </form>
    </Card>
  )
}
