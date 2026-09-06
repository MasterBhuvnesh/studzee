import { Shell } from '@/components/dashboard/shell'
import { listUsers } from '@/lib/backend/users'
import { UsersTable } from './users-table'

export default async function UsersPage() {
  const { users } = await listUsers({ limit: 100 })

  return (
    <Shell breadcrumb="Users" active="Users">
      <h1 className="text-2xl font-medium tracking-tight">Users</h1>
      <UsersTable users={users} />
    </Shell>
  )
}
