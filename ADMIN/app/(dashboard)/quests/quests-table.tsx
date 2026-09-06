'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { useDataTable, Th } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { TQuest } from '@/lib/backend/quests'

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
                  <TableCell className="font-medium">{q.title}</TableCell>
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
    </Card>
  )
}
