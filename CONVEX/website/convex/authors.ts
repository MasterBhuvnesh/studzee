import { query } from './_generated/server';
import { v } from 'convex/values';
import { summarize } from './blogs';

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const author = await ctx.db
      .query('authors')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique();
    if (!author) return null;

    const blogs = await ctx.db.query('blogs').take(500);
    const theirs = blogs
      .filter((b) => b.authorId === author._id)
      .sort((a, b) => a.order - b.order)
      .map(summarize);

    return { ...author, blogs: theirs };
  },
});
