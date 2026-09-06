'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QUEST_TYPES, type QuestType } from '@/lib/backend/constants'
import type { DocumentListItem, TopicKey } from '@/lib/backend/documents'

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

function useBusy() {
  const [busy, setBusy] = useState(false)
  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}

function DocumentPicker({
  documents,
  value,
  onChange,
}: {
  documents: DocumentListItem[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={inputClass}>
        <SelectValue placeholder="Pick a document" />
      </SelectTrigger>
      <SelectContent>
        {documents.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function GeneratePanel({
  documents,
  onGenerateContent,
  onGenerateQuiz,
  onGenerateNotes,
  onGenerateQuest,
  onGenerateNotification,
}: {
  documents: DocumentListItem[]
  onGenerateContent: (input: { title?: string; topic?: TopicKey; brief?: string }) => Promise<void>
  onGenerateQuiz: (input: { contentId: string; count?: number }) => Promise<void>
  onGenerateNotes: (input: { contentId: string }) => Promise<void>
  onGenerateQuest: (input: {
    contentId: string
    type: QuestType
    gems: number
    startsAt: string
    endsAt: string
  }) => Promise<void>
  onGenerateNotification: (input: { kind: 'content' | 'quest'; id: string }) => Promise<void>
}) {
  const content = useBusy()
  const quiz = useBusy()
  const notes = useBusy()
  const quest = useBusy()
  const notification = useBusy()

  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState<TopicKey | ''>('')
  const [brief, setBrief] = useState('')
  const [quizDoc, setQuizDoc] = useState('')
  const [notesDoc, setNotesDoc] = useState('')
  const [questDoc, setQuestDoc] = useState('')
  const [questType, setQuestType] = useState<QuestType>('mcq')
  const [gems, setGems] = useState('10')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notifKind, setNotifKind] = useState<'content' | 'quest'>('content')
  const [notifId, setNotifId] = useState('')

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="px-3 py-2">
        <PanelTitle title="Generate" />
        <p className="mt-1 text-sm text-muted-foreground">
          Every run lands as a pending draft in the queue below. Nothing publishes until it is approved.
        </p>
      </div>

      <div className="grid gap-3 p-3 pt-0 lg:grid-cols-2">
        <form
          className="space-y-2 rounded-xl bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault()
            void content.run(
              () =>
                onGenerateContent({
                  title: title || undefined,
                  topic: topic || undefined,
                  brief: brief || undefined,
                }),
              'Content draft queued',
            )
          }}
        >
          <p className="text-sm font-medium">Document</p>
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
          <Button type="submit" disabled={content.busy}>
            Generate document
          </Button>
        </form>

        <form
          className="space-y-2 rounded-xl bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault()
            void quiz.run(() => onGenerateQuiz({ contentId: quizDoc }), 'Quiz draft queued')
          }}
        >
          <p className="text-sm font-medium">Quiz</p>
          <div className="space-y-1.5">
            <Label className={labelClass}>Document</Label>
            <DocumentPicker documents={documents} value={quizDoc} onChange={setQuizDoc} />
          </div>
          <Button type="submit" disabled={quiz.busy || !quizDoc}>
            Generate quiz
          </Button>
        </form>

        <form
          className="space-y-2 rounded-xl bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault()
            void notes.run(() => onGenerateNotes({ contentId: notesDoc }), 'Notes draft queued')
          }}
        >
          <p className="text-sm font-medium">Notes</p>
          <div className="space-y-1.5">
            <Label className={labelClass}>Document</Label>
            <DocumentPicker documents={documents} value={notesDoc} onChange={setNotesDoc} />
          </div>
          <Button type="submit" disabled={notes.busy || !notesDoc}>
            Generate notes
          </Button>
        </form>

        <form
          className="space-y-2 rounded-xl bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault()
            void quest.run(
              () =>
                onGenerateQuest({
                  contentId: questDoc,
                  type: questType,
                  gems: Number(gems),
                  startsAt,
                  endsAt,
                }),
              'Quest draft queued',
            )
          }}
        >
          <p className="text-sm font-medium">Quest</p>
          <div className="space-y-1.5">
            <Label className={labelClass}>Document</Label>
            <DocumentPicker documents={documents} value={questDoc} onChange={setQuestDoc} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className={labelClass}>Type</Label>
              <Select value={questType} onValueChange={(v) => setQuestType(v as QuestType)}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Gems</Label>
              <Input value={gems} onChange={(e) => setGems(e.target.value)} className={inputClass} required />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Starts at</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Ends at</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={quest.busy || !questDoc}>
            Generate quest
          </Button>
        </form>

        <form
          className="space-y-2 rounded-xl bg-card p-4 lg:col-span-2"
          onSubmit={(e) => {
            e.preventDefault()
            void notification.run(
              () => onGenerateNotification({ kind: notifKind, id: notifId }),
              'Notification draft queued',
            )
          }}
        >
          <p className="text-sm font-medium">Push copy</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className={labelClass}>About</Label>
              <Select value={notifKind} onValueChange={(v) => setNotifKind(v as 'content' | 'quest')}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Document</SelectItem>
                  <SelectItem value="quest">Quest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Document or quest id</Label>
              <Input value={notifId} onChange={(e) => setNotifId(e.target.value)} className={inputClass} required />
            </div>
          </div>
          <Button type="submit" disabled={notification.busy}>
            Generate notification
          </Button>
        </form>
      </div>
    </Card>
  )
}
