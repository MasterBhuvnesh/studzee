import { Shell } from '@/components/dashboard/shell'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { listEmailLogs } from '@/lib/backend/email'
import { listUserEmails } from '@/lib/backend/users'
import { EmailForm } from '@/components/email/email-form'
import { sendEmailAction } from './actions'

export default async function EmailPage() {
  const [{ logs }, emails] = await Promise.all([
    listEmailLogs({ limit: 20 }),
    listUserEmails(),
  ])

  return (
    <Shell breadcrumb="Email" active="Email">
      <h1 className="text-2xl font-medium tracking-tight">Email</h1>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="p-4">
          <PanelTitle title="Send Email" />
          <div className="mt-3">
            <EmailForm emails={emails} onSubmit={sendEmailAction} />
          </div>
        </div>
      </Card>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="flex items-center justify-between px-3 py-2">
          <PanelTitle title="Logs" />
        </div>
        <div className="overflow-hidden rounded-xl bg-card py-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Subject</TableHead>
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Recipients</TableHead>
                <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No emails sent yet
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.subject}</TableCell>
                  <TableCell className="font-mono">{log.sentTo.length} recipients</TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusBadge status={log.status === 'sent' ? 'Sent' : 'Failed'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Shell>
  )
}
