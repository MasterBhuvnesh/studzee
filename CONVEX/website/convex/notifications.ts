import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getUserId, requireUserId } from './model/users';
import { notify } from './model/notifications';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(50);
  },
});

export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return 0;
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.filter((r) => !r.read).length;
  },
});

export const markRead = mutation({
  args: { id: v.id('notifications') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const n = await ctx.db.get(id);
    if (!n || n.userId !== userId) throw new Error('Notification not found');
    if (!n.read) await ctx.db.patch(id, { read: true });
    return null;
  },
});

export const markAllRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const r of rows) {
      if (!r.read) await ctx.db.patch(r._id, { read: true });
    }
    return null;
  },
});

/** Insert a welcome notice once, for brand-new users only. */
export const ensureWelcome = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (existing) return null;
    await notify(ctx, {
      userId,
      type: 'welcome',
      title: 'Welcome to Studzee 👋',
      body: 'Start with a fundamentals topic, mark it read, and test yourself with a quiz.',
      link: '/dashboard',
    });
    return null;
  },
});
