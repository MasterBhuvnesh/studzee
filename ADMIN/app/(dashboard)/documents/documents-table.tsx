'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { useDataTable, Th, FilterPills } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { DocumentListItem } from '@/lib/backend/documents'
import type { TopicEntry } from '@/lib/backend/content'

export function DocumentsTable({
  documents,
  topics,
}: {
  documents: DocumentListItem[]
  topics: TopicEntry[]
}) {
  const t = useDataTable(documents, {
    searchFields: (d) => [d.title, ...(d.tags ?? [])],
    filterField: (d) => d.topic,
    sorters: { title: (d) => d.title, topic: (d) => d.topic },
  })

  const filterOptions = ['All', ...topics.map((topic) => topic.key)]

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="All Documents" />
        <div className="flex items-center gap-2">
          <FilterPills options={filterOptions} value={t.filter} onChange={t.setFilter} />
          <div className="relative hidden md:block">
            <HugeiconsIcon icon={Search01Icon} size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={t.query}
              onChange={(e) => t.setQuery(e.target.value)}
              placeholder="Search documents..."
              className="h-8 w-56 rounded-lg bg-muted/40 pl-8 shadow-none"
            />
          </div>
          <Button asChild size="lg">
            <Link href="/documents/new">
              <HugeiconsIcon icon={PlusSignIcon} size={14} data-icon="inline-start" />
              Add Document
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <Th label="Title" k="title" sort={t} />
              <Th label="Topic" k="topic" sort={t} />
              <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            )}
            {t.rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell className="font-mono">{d.topic}</TableCell>
                <TableCell className="pr-4 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/documents/${d.id}`}>Edit</Link>
                  </Button>
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
