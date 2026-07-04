import { ActionCtx, QueryCtx, MutationCtx } from '../_generated/server';

// All three ctx types expose `.auth`, so these helpers work everywhere.
type AnyCtx = QueryCtx | MutationCtx | ActionCtx;

/** Clerk identity.subject is our stable per-user key across all tables. */
export async function getUserId(ctx: AnyCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

export async function requireUserId(ctx: AnyCtx): Promise<string> {
  const id = await getUserId(ctx);
  if (!id) throw new Error('Not authenticated');
  return id;
}
