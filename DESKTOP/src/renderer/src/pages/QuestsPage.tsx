import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import {
  ApiError,
  createQuest,
  listAdminQuests,
  listContent,
  type AdminQuest,
  type QuestQuestionChoice,
  type QuestQuestionFill
} from '@renderer/lib/api'
import { ErrorBanner, Field, PageHeader, TagBadge } from '@renderer/components/admin/controls'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Select } from '@renderer/components/ui/select'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Textarea } from '@renderer/components/ui/textarea'

interface ChoiceDraft {
  que: string
  ans: string
  optionsText: string
}

const QUEST_TYPES = ['mcq', 'scq', 'fill_blank', 'read_blog'] as const

function toLocalInputValue(iso: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${iso.getFullYear()}-${pad(iso.getMonth() + 1)}-${pad(iso.getDate())}T${pad(iso.getHours())}:${pad(iso.getMinutes())}`
}

export default function QuestsPage(): React.JSX.Element {
  const [quests, setQuests] = useState<AdminQuest[]>([])
  const [documents, setDocuments] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<(typeof QUEST_TYPES)[number]>('mcq')
  const [gems, setGems] = useState('10')
  const [passScore, setPassScore] = useState('1')
  const [contentId, setContentId] = useState('')
  const [startsAt, setStartsAt] = useState(() => toLocalInputValue(new Date()))
  const [endsAt, setEndsAt] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  )
  const [choiceQuestions, setChoiceQuestions] = useState<ChoiceDraft[]>([
    { que: '', ans: '', optionsText: '' }
  ])
  const [fillQuestions, setFillQuestions] = useState<{ que: string; answer: string }[]>([
    { que: '', answer: '' }
  ])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([listAdminQuests(), listContent({ page: 1, limit: 100 })])
      .then(([questList, docs]) => {
        setQuests(questList)
        setDocuments((docs.data ?? []).map((d) => ({ id: d.id, title: d.title })))
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load quests')
      })
      .finally(() => setLoading(false))
  }, [])

  const needsPayload = type === 'mcq' || type === 'scq' || type === 'fill_blank'
  const needsContent = type === 'read_blog'

  const payloadValid = useMemo(() => {
    if (!needsPayload) return true
    if (!Number.isInteger(Number(passScore)) || Number(passScore) < 1) return false
    if (type === 'fill_blank') {
      return fillQuestions.every((q) => q.que.trim() && q.answer.trim())
    }
    return choiceQuestions.every((q) => {
      const options = q.optionsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      return q.que.trim() && q.ans.trim() && options.length >= 2
    })
  }, [needsPayload, passScore, type, choiceQuestions, fillQuestions])

  async function handleCreate(): Promise<void> {
    setCreateError(null)

    if (!title.trim() || !description.trim()) {
      setCreateError('Title and description are required.')
      return
    }
    if (endsAt <= startsAt) {
      setCreateError('The window must end after it starts.')
      return
    }

    let payload:
      | { passScore: number; questions: (QuestQuestionChoice | QuestQuestionFill)[] }
      | undefined

    if (needsPayload) {
      if (!payloadValid) {
        setCreateError(
          'Every question needs its text filled in, and choice questions need at least two options plus an exact answer.'
        )
        return
      }
      const questions =
        type === 'fill_blank'
          ? fillQuestions.map((q, i) => ({
              key: `q${i + 1}`,
              que: q.que.trim(),
              answer: q.answer.trim()
            }))
          : choiceQuestions.map((q, i) => ({
              key: `q${i + 1}`,
              que: q.que.trim(),
              ans: q.ans.trim(),
              options: q.optionsText
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
            }))
      payload = { passScore: Number.parseInt(passScore, 10), questions }
    }

    setCreating(true)
    try {
      await createQuest({
        title: title.trim(),
        description: description.trim(),
        type,
        gems: Number.parseInt(gems, 10),
        contentId: needsContent ? contentId : undefined,
        active: true,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        payload
      })
      const refreshed = await listAdminQuests()
      setQuests(refreshed)
      setTitle('')
      setDescription('')
      setChoiceQuestions([{ que: '', ans: '', optionsText: '' }])
      setFillQuestions([{ que: '', answer: '' }])
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create quest')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <PageHeader title="Quests" description="Limited time quests and their gem rewards." />
      {error && <ErrorBanner message={error} />}

      <div className="mb-8 overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-sm">No quests yet.</p>
        ) : (
          <ul className="divide-y">
            {quests.map((quest, index) => (
              <li
                key={quest.id ?? quest._id ?? index}
                className="flex items-center gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{quest.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <TagBadge tone="accent">{quest.type}</TagBadge>
                    <TagBadge>{quest.gems} gems</TagBadge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(quest.startsAt).toLocaleDateString()} to{' '}
                      {new Date(quest.endsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="max-w-3xl rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Create a quest</h2>
        {createError && <ErrorBanner message={createError} />}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                {QUEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Gem reward">
              <Input type="number" min={1} value={gems} onChange={(e) => setGems(e.target.value)} />
            </Field>
          </div>

          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts at">
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </Field>
            <Field label="Ends at">
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </Field>
          </div>

          {needsContent && (
            <Field label="Linked content" hint="read_blog quests open this document">
              <Select value={contentId} onChange={(e) => setContentId(e.target.value)}>
                <option value="">Pick a document</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {needsPayload && (
            <>
              <Field label="Pass score" hint="Correct answers needed for the full reward">
                <Input
                  type="number"
                  min={1}
                  value={passScore}
                  onChange={(e) => setPassScore(e.target.value)}
                  className="w-32"
                />
              </Field>

              {type === 'fill_blank' ? (
                <div className="space-y-3">
                  {fillQuestions.map((question, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500">
                          Fill {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-red-500"
                          onClick={() => setFillQuestions((q) => q.filter((_, i) => i !== index))}
                        >
                          <Trash2 /> Remove
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Sentence with ______"
                          value={question.que}
                          onChange={(e) =>
                            setFillQuestions((q) =>
                              q.map((item, i) =>
                                i === index ? { ...item, que: e.target.value } : item
                              )
                            )
                          }
                        />
                        <Input
                          placeholder="answer"
                          value={question.answer}
                          onChange={(e) =>
                            setFillQuestions((q) =>
                              q.map((item, i) =>
                                i === index ? { ...item, answer: e.target.value } : item
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFillQuestions((q) => [...q, { que: '', answer: '' }])}
                  >
                    <Plus /> Add fill question
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {choiceQuestions.map((question, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500">
                          Question {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-red-500"
                          onClick={() => setChoiceQuestions((q) => q.filter((_, i) => i !== index))}
                        >
                          <Trash2 /> Remove
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Question text"
                          value={question.que}
                          onChange={(e) =>
                            setChoiceQuestions((q) =>
                              q.map((item, i) =>
                                i === index ? { ...item, que: e.target.value } : item
                              )
                            )
                          }
                        />
                        <Textarea
                          placeholder={'Option per line\nSecond option\nThird option'}
                          rows={3}
                          value={question.optionsText}
                          onChange={(e) =>
                            setChoiceQuestions((q) =>
                              q.map((item, i) =>
                                i === index ? { ...item, optionsText: e.target.value } : item
                              )
                            )
                          }
                        />
                        <Input
                          placeholder="Correct answer, must match an option exactly"
                          value={question.ans}
                          onChange={(e) =>
                            setChoiceQuestions((q) =>
                              q.map((item, i) =>
                                i === index ? { ...item, ans: e.target.value } : item
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setChoiceQuestions((q) => [...q, { que: '', ans: '', optionsText: '' }])
                    }
                  >
                    <Plus /> Add question
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="border-t pt-4">
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? 'Creating' : 'Create quest'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
