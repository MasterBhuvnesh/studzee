'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TDocument, TDocumentInput } from '@/lib/backend/documents'
import type { TopicEntry } from '@/lib/backend/content'

export function DocumentForm({
  topics,
  initial,
  onSubmit,
  submitLabel,
}: {
  topics: TopicEntry[]
  initial?: Partial<TDocument>
  /** Create returns the new document's id to navigate to; update returns nothing. */
  onSubmit: (input: TDocumentInput) => Promise<string | void>
  submitLabel: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [topic, setTopic] = useState<string>(initial?.topic ?? topics[0]?.key ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [facts, setFacts] = useState(initial?.facts ?? '')
  const [unlockPoints, setUnlockPoints] = useState(String(initial?.unlockPoints ?? 0))
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const newId = await onSubmit({
        title,
        topic: topic as TDocumentInput['topic'],
        summary: summary || undefined,
        facts: facts || undefined,
        unlockPoints: Number(unlockPoints) || 0,
        tags: tags
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        content: initial?.content ?? {},
        quiz: initial?.quiz ?? {},
      })
      toast.success('Saved')
      if (typeof newId === 'string') {
        router.push(`/documents/${newId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Title
        </Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required minLength={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Topic
        </Label>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger id="topic" className="w-full bg-muted/40 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="unlockPoints" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Unlock Points
        </Label>
        <Input
          id="unlockPoints"
          type="number"
          min={0}
          value={unlockPoints}
          onChange={(e) => setUnlockPoints(e.target.value)}
          className="bg-muted/40 shadow-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Tags (comma separated, 2 to 5)
        </Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-muted/40 shadow-none" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Summary
        </Label>
        <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="bg-muted/40 shadow-none" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="facts" className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Facts
        </Label>
        <Input id="facts" value={facts} onChange={(e) => setFacts(e.target.value)} className="bg-muted/40 shadow-none" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
