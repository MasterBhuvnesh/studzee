'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PanelTitle } from '@/components/dashboard/cards'
import { useDataTable, Th } from '@/components/dashboard/use-table'
import { TablePagination } from '@/components/dashboard/table-pagination'
import type { UserRecord } from '@/lib/backend/users'

export function UsersTable({ users }: { users: UserRecord[] }) {
  const t = useDataTable(users, {
    searchFields: (u) => [u.email],
    sorters: { email: (u) => u.email, createdAt: (u) => u.createdAt },
  })

  return (
    <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <PanelTitle title="Registered Users" />
        <div className="relative hidden md:block">
          <HugeiconsIcon icon={Search01Icon} size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={t.query}
            onChange={(e) => t.setQuery(e.target.value)}
            placeholder="Search users..."
            className="h-8 w-56 rounded-lg bg-muted/40 pl-8 shadow-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card py-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <Th label="Email" k="email" sort={t} />
              <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Devices</TableHead>
              <Th label="Joined" k="createdAt" sort={t} />
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
            {t.rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell className="font-mono">{u.expoTokens.length}</TableCell>
                <TableCell className="font-mono">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} />
    </Card>
  )
}
