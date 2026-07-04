import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { seedAuthors, seedBlogs } from './content';

/**
 * Seed authors + blogs from convex/content. Idempotent: upserts by slug, so
 * you can edit the content files and re-run `npx convex run seed:run`.
 */
export const run = mutation({
  args: {},
  returns: v.object({
    authors: v.number(),
    blogsInserted: v.number(),
    blogsUpdated: v.number(),
  }),
  handler: async (ctx) => {
    const authorIdBySlug = new Map<string, Id<'authors'>>();
    for (const a of seedAuthors) {
      const existing = await ctx.db
        .query('authors')
        .withIndex('by_slug', (q) => q.eq('slug', a.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, a);
        authorIdBySlug.set(a.slug, existing._id);
      } else {
        authorIdBySlug.set(a.slug, await ctx.db.insert('authors', a));
      }
    }

    let blogsInserted = 0;
    let blogsUpdated = 0;
    for (const b of seedBlogs) {
      const authorId = authorIdBySlug.get(b.authorSlug);
      if (!authorId) throw new Error(`Unknown author slug: ${b.authorSlug}`);

      const { authorSlug, ...rest } = b;
      void authorSlug;
      const existing = await ctx.db
        .query('blogs')
        .withIndex('by_slug', (q) => q.eq('slug', b.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ...rest, authorId });
        blogsUpdated++;
      } else {
        await ctx.db.insert('blogs', { ...rest, authorId, createdAt: Date.now() });
        blogsInserted++;
      }
    }

    return { authors: seedAuthors.length, blogsInserted, blogsUpdated };
  },
});
