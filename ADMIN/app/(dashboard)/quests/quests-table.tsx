'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { useDataTable, Th } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { TQuest } from '@/lib/backend/quests'

interface QuestQuestion {
  key: string
  que: string
  options?: string[]
  ans?: string
  answer?: string
}

function questQuestions(q: TQuest): QuestQuestion[] {
  const payload = q.payload as { questions?: QuestQuestion[] } | undefined
  return Array.isArray(payload?.questions) ? payload.questions : []
}

function questPassScore(q: TQuest): number | null {
  const payload = q.payload as { passScore?: unknown } | undefined
  return typeof payload?.passScore === 'number' ? payload.passScore : null
}

export function QuestsTable({
  quests,
  onToggleActive,
}: {
  quests: TQuest[]
  onToggleActive: (id: string, active: boolean) => Promise<void>
}) {
  const t = useDataTable(quests, {
    searchFields: (q) => [q.title, q.type],
    sorters: { title: (q) => q.title, endsAt: (q) => q.endsAt },
  })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<TQuest | null>(null)

  async function handleToggle(q: TQuest) {
    setBusyId(q.id as string)
    try {
      await onToggleActive(q.id as string, q.active === false)
      toast.success(q.active === false ? 'Quest activated' : 'Quest withdrawn')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="All Quests" />
        <Button asChild size="lg">
          <Link href="/quests/new">
            <HugeiconsIcon icon={PlusSignIcon} size={14} data-icon="inline-start" />
            Add Quest
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <Th label="Title" k="title" sort={t} />
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Type</TableHead>
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Gems</TableHead>
              <Th label="Ends" k="endsAt" sort={t} />
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
              <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            )}
            {t.rows.map((q) => {
              const ended = new Date(q.endsAt) <= new Date()
              return (
                <TableRow key={q.id} className={ended ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="cursor-pointer text-left hover:underline"
                      onClick={() => setSelected(q)}
                    >
                      {q.title}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono">{q.type}</TableCell>
                  <TableCell className="font-mono">{q.gems}</TableCell>
                  <TableCell className="font-mono">{new Date(q.endsAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={ended ? 'Ended' : q.active === false ? 'Withdrawn' : 'Active'} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === q.id}
                      onClick={() => handleToggle(q)}
                    >
                      {q.active === false ? 'Activate' : 'Deactivate'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} />

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription className="font-mono">
                  {selected.type} - {selected.gems} gems
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {(
                  [
                    ['Starts', new Date(selected.startsAt).toLocaleString()],
                    ['Ends', new Date(selected.endsAt).toLocaleString()],
                    ['Content', selected.contentId ?? 'None'],
                    ['Pass score', questPassScore(selected)?.toString() ?? 'None'],
                  ] as [string, string][]
                ).map(([term, value]) => (
                  <div key={term} className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{term}</dt>
                    <dd className="truncate font-mono text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
              {questQuestions(selected).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Questions</p>
                  <ol className="list-decimal space-y-2 pl-5 text-sm">
                    {questQuestions(selected).map((question) => (
                      <li key={question.key} className="space-y-1">
                        <p>{question.que}</p>
                        {question.options && (
                          <p className="font-mono text-xs text-muted-foreground">
                            {question.options.join(' / ')}
                          </p>
                        )}
                        {(question.ans ?? question.answer) && (
                          <p className="font-mono text-xs">
                            Answer: {question.ans ?? question.answer}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
