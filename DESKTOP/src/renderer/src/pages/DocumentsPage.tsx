import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import {
  ApiError,
  deleteDocument,
  listContent,
  listTopics,
  type DocumentSummary,
  type TopicInfo
} from '@renderer/lib/api'
import { ErrorBanner, PageHeader, TagBadge } from '@renderer/components/admin/controls'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Select } from '@renderer/components/ui/select'
import { Skeleton } from '@renderer/components/ui/skeleton'

const PAGE_SIZE = 20

export default function DocumentsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [topic, setTopic] = useState('')
  const [tag, setTag] = useState('')
  const [topics, setTopics] = useState<TopicInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    listTopics()
      .then(setTopics)
      .catch(() => setTopics([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listContent({ page, limit: PAGE_SIZE, topic: topic || undefined, tag: tag || undefined })
      .then((result) => {
        if (cancelled) return
        setDocuments(result.data ?? [])
        setTotal(result.meta?.total ?? 0)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Failed to load documents')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, topic, tag])

  async function handleDelete(doc: DocumentSummary): Promise<void> {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    try {
      await deleteDocument(doc.id)
      setDocuments((current) => current.filter((d) => d.id !== doc.id))
      setTotal((t) => Math.max(0, t - 1))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Every piece of learning content served by the API."
        actions={
          <Button onClick={() => navigate('/content/documents/new')}>
            <Plus /> New document
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          className="w-56"
          value={topic}
          onChange={(e) => {
            setPage(1)
            setTopic(e.target.value)
          }}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input
          className="w-56"
          placeholder="Filter by tag"
          value={tag}
          onChange={(e) => {
            setPage(1)
            setTag(e.target.value)
          }}
        />
        <span className="text-muted-foreground ml-auto text-sm">{total} documents</span>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-sm">
            No documents match these filters.
          </p>
        ) : (
          <ul className="divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{doc.summary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <TagBadge tone="accent">{doc.topic}</TagBadge>
                    {(doc.tags ?? []).map((t) => (
                      <TagBadge key={t}>{t}</TagBadge>
                    ))}
                  </div>
                </div>
                <span className="text-muted-foreground hidden text-xs sm:block">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigate(`/content/documents/${doc.id}/edit`)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={deletingId === doc.id}
                    onClick={() => void handleDelete(doc)}
                  >
                    <Trash2 className="text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-muted-foreground text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
