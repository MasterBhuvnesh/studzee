import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getUserId, requireUserId } from './model/users';

export const markRead = mutation({
  args: { blogSlug: v.string() },
  returns: v.null(),
  handler: async (ctx, { blogSlug }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('progress')
      .withIndex('by_user_blog', (q) =>
        q.eq('userId', userId).eq('blogSlug', blogSlug)
      )
      .unique();
    if (existing) {
      if (!existing.read) {
        await ctx.db.patch(existing._id, { read: true, readAt: Date.now() });
      }
    } else {
      await ctx.db.insert('progress', {
        userId,
        blogSlug,
        read: true,
        readAt: Date.now(),
      });
    }
    return null;
  },
});

/** Slugs the current user has marked read (for dashboard progress + blog state). */
export const readSlugs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [] as string[];
    const rows = await ctx.db
      .query('progress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.filter((r) => r.read).map((r) => r.blogSlug);
  },
});

export const forBlog = query({
  args: { blogSlug: v.string() },
  handler: async (ctx, { blogSlug }) => {
    const userId = await getUserId(ctx);
    if (!userId) return { read: false };
    const row = await ctx.db
      .query('progress')
      .withIndex('by_user_blog', (q) =>
        q.eq('userId', userId).eq('blogSlug', blogSlug)
      )
      .unique();
    return { read: !!row?.read };
  },
});
