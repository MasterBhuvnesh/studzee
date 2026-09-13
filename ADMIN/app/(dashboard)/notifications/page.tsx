import { Shell } from '@/components/dashboard/shell'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PanelTitle, StatusBadge } from '@/components/dashboard/cards'
import { listNotifications } from '@/lib/backend/notifications'
import { listUserEmails } from '@/lib/backend/users'
import { NotificationForm } from '@/components/notifications/notification-form'
import { sendNotificationAction } from './actions'

export default async function NotificationsPage() {
  const [{ notifications }, emails] = await Promise.all([
    listNotifications({ limit: 20 }),
    listUserEmails(),
  ])

  return (
    <Shell breadcrumb="Notifications" active="Notifications">
      <h1 className="text-2xl font-medium tracking-tight">Notifications</h1>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="p-4">
          <PanelTitle title="Send Notification" />
          <div className="mt-3">
            <NotificationForm emails={emails} onSubmit={sendNotificationAction} />
          </div>
        </div>
      </Card>

      <Card className="gap-0 bg-muted/50 p-1 ring-0 shadow-sm dark:bg-muted">
        <div className="flex items-center justify-between px-3 py-2">
          <PanelTitle title="History" />
        </div>
        <div className="overflow-hidden rounded-xl bg-card py-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Title</TableHead>
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Image</TableHead>
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Recipients</TableHead>
                <TableHead className="pr-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No notifications sent yet
                  </TableCell>
                </TableRow>
              )}
              {notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.title}</TableCell>
                  <TableCell>
                    {n.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.imageUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{n.sentToAll ? 'All users' : `${n.sentTo.length} users`}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusBadge status={n.status === 'sent' ? 'Sent' : n.status === 'failed' ? 'Failed' : 'Partial'} />
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
