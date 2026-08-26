import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'

import {
  ApiError,
  createDocument,
  getContent,
  listTopics,
  updateDocument,
  type QuizItem,
  type TopicInfo
} from '@renderer/lib/api'
import { ErrorBanner, Field, PageHeader } from '@renderer/components/admin/controls'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Select } from '@renderer/components/ui/select'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Textarea } from '@renderer/components/ui/textarea'

interface QuestionDraft {
  que: string
  ans: string
  optionsText: string
}

const EMPTY_QUESTION: QuestionDraft = { que: '', ans: '', optionsText: '' }

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function DocumentEditorPage(): React.JSX.Element {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [topics, setTopics] = useState<TopicInfo[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [topic, setTopic] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [unlockPoints, setUnlockPoints] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [facts, setFacts] = useState('')
  const [contentJson, setContentJson] = useState('[]')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])

  useEffect(() => {
    if (!isEdit && !topic) setTopic('machine-learning')
  }, [isEdit, topic])

  useEffect(() => {
    listTopics()
      .then(setTopics)
      .catch(() => setTopics([]))
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    getContent(id)
      .then((doc) => {
        if (cancelled) return
        setTitle(doc.title ?? '')
        setSummary(doc.summary ?? '')
        setTopic(doc.topic ?? '')
        setTagsText((doc.tags ?? []).join(', '))
        setUnlockPoints(doc.unlockPoints === undefined ? '' : String(doc.unlockPoints))
        setImageUrl(doc.imageUrl ?? '')
        setFacts(doc.facts ?? '')
        setContentJson(JSON.stringify(doc.content ?? [], null, 2))
        setQuestions(
          Object.values(doc.quiz ?? {}).map((item: QuizItem) => ({
            que: item.que,
            ans: item.ans,
            optionsText: (item.options ?? []).join('\n')
          }))
        )
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load document')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  function updateQuestion(index: number, patch: Partial<QuestionDraft>): void {
    setQuestions((current) => current.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  async function handleSubmit(): Promise<void> {
    setError(null)

    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(contentJson)
    } catch {
      setError('Content is not valid JSON. Fix the syntax and try again.')
      return
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const quiz: Record<string, QuizItem> = {}
    for (let i = 0; i < questions.length; i++) {
      const draft = questions[i]
      const options = splitLines(draft.optionsText)
      if (!draft.que.trim() || !draft.ans.trim() || options.length < 2) {
        setError(
          `Question ${i + 1} is incomplete: it needs a question, an answer and at least two options.`
        )
        return
      }
      quiz[`q${i + 1}`] = { que: draft.que.trim(), ans: draft.ans.trim(), options }
    }

    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      topic,
      tags,
      content: parsedContent,
      quiz,
      facts: facts.trim() || undefined,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      unlockPoints: unlockPoints.trim() === '' ? undefined : Number.parseInt(unlockPoints, 10)
    }

    if (!payload.title || payload.title.length < 3) {
      setError('Title must be at least 3 characters long.')
      return
    }
    if (tags.length < 2 || tags.length > 5) {
      setError('Provide between two and five tags, comma separated.')
      return
    }
    if (
      payload.unlockPoints !== undefined &&
      (!Number.isInteger(payload.unlockPoints) || payload.unlockPoints < 0)
    ) {
      setError('Unlock points must be a whole number of zero or more.')
      return
    }

    setSaving(true)
    try {
      if (isEdit && id) await updateDocument(id, payload)
      else await createDocument(payload as Parameters<typeof createDocument>[0])
      navigate('/content/documents')
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setError(`${err.message}: ${JSON.stringify(err.details)}`)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to save document')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-2"
        onClick={() => navigate('/content/documents')}
      >
        <ArrowLeft /> Back to documents
      </Button>

      <PageHeader
        title={isEdit ? 'Edit document' : 'New document'}
        description="Changes go live immediately after saving."
      />

      {error && <ErrorBanner message={error} />}

      <div className="space-y-5">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Minimum 3 characters"
          />
        </Field>

        <Field label="Summary">
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Topic">
            <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unlock points" hint="Empty means free to read">
            <Input
              type="number"
              min={0}
              value={unlockPoints}
              onChange={(e) => setUnlockPoints(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Tags" hint="Two to five, comma separated">
          <Input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="fundamentals, tutorial"
          />
        </Field>

        <Field label="Image URL" hint="Optional hero image">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>

        <Field label="Facts" hint="Shown as the daily fact card">
          <Textarea value={facts} onChange={(e) => setFacts(e.target.value)} rows={3} />
        </Field>

        <Field
          label="Content sections (JSON)"
          hint='Array of sections: [{ "title": "INTRODUCTION", "content": [{ "type": "text", "value": "..." }] }]'
        >
          <Textarea
            value={contentJson}
            onChange={(e) => setContentJson(e.target.value)}
            rows={12}
            className="font-mono text-xs"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Quiz questions</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuestions((q) => [...q, { ...EMPTY_QUESTION }])}
            >
              Add question
            </Button>
          </div>
          {questions.length === 0 && (
            <p className="text-muted-foreground text-sm">No questions yet.</p>
          )}
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Question {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-red-500"
                    onClick={() => setQuestions((q) => q.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-3">
                  <Field label="Question">
                    <Input
                      value={question.que}
                      onChange={(e) => updateQuestion(index, { que: e.target.value })}
                    />
                  </Field>
                  <Field label="Options" hint="One option per line, first line does not matter">
                    <Textarea
                      value={question.optionsText}
                      onChange={(e) => updateQuestion(index, { optionsText: e.target.value })}
                      rows={4}
                    />
                  </Field>
                  <Field label="Correct answer" hint="Must match one of the options exactly">
                    <Input
                      value={question.ans}
                      onChange={(e) => updateQuestion(index, { ans: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t pt-4">
          <Button onClick={() => void handleSubmit()} disabled={saving}>
            <Save /> {saving ? 'Saving' : 'Save document'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/content/documents')} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
