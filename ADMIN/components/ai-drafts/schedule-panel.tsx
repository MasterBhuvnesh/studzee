'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TopicKey } from '@/lib/backend/documents'
import type { ScheduledDraft } from '@/lib/backend/schedule'

const TOPICS: TopicKey[] = [
  'machine-learning',
  'system-design',
  'devops',
  'aws',
  'data',
  'deep-learning',
]

const labelClass = 'font-mono text-[11px] tracking-wide text-muted-foreground uppercase'
const inputClass = 'bg-muted/40 shadow-none'

function statusLabel(status: ScheduledDraft['status']) {
  return status === 'pending'
    ? 'Pending'
    : status === 'done'
      ? 'Done'
      : status === 'failed'
        ? 'Failed'
        : 'Canceled'
}

export function SchedulePanel({
  schedules,
  onSchedule,
  onCancel,
}: {
  schedules: ScheduledDraft[]
  onSchedule: (input: {
    title?: string
    topic?: TopicKey
    brief?: string
    runAt: string
  }) => Promise<void>
  onCancel: (id: string) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState<TopicKey | ''>('')
  const [brief, setBrief] = useState('')
  const [runAt, setRunAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // The picker reads in the admin's local time. The backend compares absolute
    // instants, so convert before sending rather than letting the server guess.
    const iso = new Date(runAt).toISOString()
    setBusy(true)
    try {
      await onSchedule({
        title: title || undefined,
        topic: topic || undefined,
        brief: brief || undefined,
        runAt: iso,
      })
      toast.success('Draft scheduled')
      setTitle('')
      setTopic('')
      setBrief('')
      setRunAt('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scheduling failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel(id: string) {
    setCancelingId(id)
    try {
      await onCancel(id)
      toast.success('Schedule canceled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed')
    } finally {
      setCancelingId(null)
    }
  }

  const pending = schedules.filter((s) => s.status === 'pending')
  const settled = schedules.filter((s) => s.status !== 'pending')

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="px-3 py-2">
        <PanelTitle title="Schedule" />
        <p className="mt-1 text-sm text-muted-foreground">
          Book a full document draft for later. The per minute job generates it into the
          queue below, and nothing publishes until it is approved.
        </p>
      </div>

      <div className="grid gap-3 p-3 pt-0 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-2 rounded-xl bg-card p-4">
          <p className="text-sm font-medium">New booking</p>
          <div className="space-y-1.5">
            <Label className={labelClass}>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Topic</Label>
            <Select value={topic} onValueChange={(v) => setTopic(v as TopicKey)}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Pick a topic" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Brief</Label>
            <Input value={brief} onChange={(e) => setBrief(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Run at (your time)</Label>
            <Input
              type="datetime-local"
              value={runAt}
              onChange={(e) => setRunAt(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <Button type="submit" disabled={busy || !runAt}>
            Schedule draft
          </Button>
        </form>

        <div className="space-y-2 rounded-xl bg-card p-4">
          <p className="text-sm font-medium">Bookings</p>
          {schedules.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing booked yet.</p>
          )}
          {pending.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {String(s.input.title ?? s.input.brief ?? 'Untitled')}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {new Date(s.runAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={statusLabel(s.status)} />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cancelingId === s.id}
                  onClick={() => handleCancel(s.id)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
          {settled.length > 0 && (
            <div className="space-y-1 pt-2">
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">History</p>
              {settled.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 py-1">
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {String(s.input.title ?? s.input.brief ?? 'Untitled')} -{' '}
                    {new Date(s.runAt).toLocaleString()}
                  </p>
                  <StatusBadge status={statusLabel(s.status)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
