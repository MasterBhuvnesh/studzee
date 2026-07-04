import { MutationCtx } from '../_generated/server';

/** Insert an unread in-app notification for a user. */
export async function notify(
  ctx: MutationCtx,
  args: { userId: string; type: string; title: string; body: string; link?: string }
) {
  await ctx.db.insert('notifications', {
    ...args,
    read: false,
    createdAt: Date.now(),
  });
}
