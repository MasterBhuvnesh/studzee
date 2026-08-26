import { useEffect, useState } from 'react'

import { ApiError, listUsers, type RegisteredUser } from '@renderer/lib/api'
import { ErrorBanner, PageHeader, TagBadge } from '@renderer/components/admin/controls'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'

const PAGE_SIZE = 50

export default function UsersPage(): React.JSX.Element {
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listUsers({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setUsers(result.data ?? [])
        setTotal(result.meta?.total ?? 0)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Failed to load users')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader
        title="Registered users"
        description="Everyone who registered for notifications, newest last."
      />
      {error && <ErrorBanner message={error} />}

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-sm">No registered users.</p>
        ) : (
          <ul className="divide-y">
            {users.map((user, index) => (
              <li key={user.id ?? index} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.email}</p>
                  {user.registeredAt && (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      registered {new Date(String(user.registeredAt)).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <TagBadge>
                  {Array.isArray(user.expoTokens)
                    ? `${user.expoTokens.length} device${user.expoTokens.length === 1 ? '' : 's'}`
                    : `${Number(user.expoTokens ?? 0)} devices`}
                </TagBadge>
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
