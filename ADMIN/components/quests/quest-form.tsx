'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ChoiceQuestion, QuestType, TCreateQuestInput } from '@/lib/backend/quests'
import type { DocumentListItem } from '@/lib/backend/documents'
import { QUEST_TYPES } from '@/lib/backend/constants'

export function QuestForm({
  documents,
  onSubmit,
}: {
  documents: DocumentListItem[]
  onSubmit: (input: TCreateQuestInput) => Promise<void>
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<QuestType>('mcq')
  const [gems, setGems] = useState('10')
  const [contentId, setContentId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [passScore, setPassScore] = useState('1')
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([
    { key: 'q1', que: '', options: ['', ''], ans: '' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const graded = type !== 'read_blog'

  function updateQuestion(index: number, patch: Partial<ChoiceQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title,
        description,
        type,
        gems: Number(gems),
        contentId: type === 'read_blog' ? contentId : undefined,
        payload: graded ? { passScore: Number(passScore), questions } : undefined,
        startsAt,
        endsAt,
      })
      toast.success('Quest created')
      router.push('/quests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as QuestType)}>
          <SelectTrigger className="w-full bg-muted/40 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUEST_TYPES.map((qt) => (
              <SelectItem key={qt} value={qt}>
                {qt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Gems</Label>
          <Input type="number" min={1} value={gems} onChange={(e) => setGems(e.target.value)} className="bg-muted/40 shadow-none" />
        </div>
        {graded && (
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Pass Score</Label>
            <Input type="number" min={1} value={passScore} onChange={(e) => setPassScore(e.target.value)} className="bg-muted/40 shadow-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Starts At</Label>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="bg-muted/40 shadow-none" required />
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Ends At</Label>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="bg-muted/40 shadow-none" required />
        </div>
      </div>

      {type === 'read_blog' ? (
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Document</Label>
          <Select value={contentId} onValueChange={setContentId}>
            <SelectTrigger className="w-full bg-muted/40 shadow-none">
              <SelectValue placeholder="Select a document" />
            </SelectTrigger>
            <SelectContent>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Questions</Label>
          {questions.map((q, i) => (
            <div key={q.key} className="space-y-1.5 rounded-lg border border-border p-3">
              <Input
                placeholder="Question"
                value={q.que}
                onChange={(e) => updateQuestion(i, { que: e.target.value })}
                className="bg-muted/40 shadow-none"
              />
              {q.options.map((opt, oi) => (
                <Input
                  key={oi}
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const options = [...q.options]
                    options[oi] = e.target.value
                    updateQuestion(i, { options })
                  }}
                  className="bg-muted/40 shadow-none"
                />
              ))}
              <Input
                placeholder="Correct answer (must match one option exactly)"
                value={q.ans}
                onChange={(e) => updateQuestion(i, { ans: e.target.value })}
                className="bg-muted/40 shadow-none"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setQuestions((qs) => [
                ...qs,
                { key: `q${qs.length + 1}`, que: '', options: ['', ''], ans: '' },
              ])
            }
          >
            Add Question
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Quest'}
        </Button>
      </div>
    </form>
  )
}
