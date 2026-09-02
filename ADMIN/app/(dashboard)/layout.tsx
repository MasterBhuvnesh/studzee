import { redirect } from 'next/navigation'
import { requireAdminUser } from '@/lib/require-admin'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const check = await requireAdminUser()

  if (check.ok === false && check.reason === 'unauthenticated') {
    redirect('/sign-in')
  }

  if (check.ok === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account does not have admin access to Studzee.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
