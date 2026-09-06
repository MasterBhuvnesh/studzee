import { auth, clerkClient } from '@clerk/nextjs/server'

export type AdminCheck =
  | { ok: true; user: { id: string; email: string | null } }
  | { ok: false; reason: 'unauthenticated' | 'not-admin' }

/**
 * Mirrors BACKEND's requireAdmin (BACKEND/src/middleware/auth.ts) exactly: a
 * server-side fetch of the full Clerk user, checked against
 * publicMetadata.role === 'admin'. Not a session-claim check, since no Clerk
 * JWT template exists on the dev instance to carry that claim onto the token.
 */
export async function requireAdminUser(): Promise<AdminCheck> {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false, reason: 'unauthenticated' }
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = user.publicMetadata?.role

  if (role !== 'admin') {
    return { ok: false, reason: 'not-admin' }
  }

  // Email comes off the Clerk user's primary address, not publicMetadata,
  // which carries only the role. The Settings page displays it.
  const email =
    user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null

  return { ok: true, user: { id: user.id, email } }
}
