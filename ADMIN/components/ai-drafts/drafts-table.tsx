'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { FilterPills, Th, useDataTable } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { AiDraft } from '@/lib/backend/ai-drafts'

function statusLabel(status: AiDraft['status']) {
  return status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : 'Rejected'
}

export function DraftsTable({ drafts }: { drafts: AiDraft[] }) {
  const t = useDataTable(drafts, {
    searchFields: (d) => [d.id, d.kind, d.model],
    filterField: (d) => d.status,
    sorters: { createdAt: (d) => d.createdAt },
  })

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="All Drafts" />
        <FilterPills
          options={['All', 'pending', 'approved', 'rejected']}
          value={t.filter}
          onChange={t.setFilter}
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Kind</TableHead>
              <Th label="Created" k="createdAt" sort={t} />
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Model</TableHead>
              <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No drafts found
                </TableCell>
              </TableRow>
            )}
            {t.rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  <Link href={`/ai-drafts/${d.id}`} className="underline-offset-4 hover:underline">
                    {d.kind}
                  </Link>
                </TableCell>
                <TableCell className="font-mono">{new Date(d.createdAt).toLocaleString()}</TableCell>
                <TableCell className="font-mono">{d.model}</TableCell>
                <TableCell className="pr-4 text-right">
                  <StatusBadge status={statusLabel(d.status)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} />
    </Card>
  )
}
