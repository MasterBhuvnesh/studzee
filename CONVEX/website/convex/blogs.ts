import { query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';
import { pathValidator } from './schema';

/** Client-safe quiz: questions + options only, never the answer index. */
function safeQuiz(blog: Doc<'blogs'>) {
  return blog.quiz.map((q) => ({ question: q.question, options: q.options }));
}

/** Summary shape for cards, listings, graph — no quiz answers, no full body. */
export function summarize(blog: Doc<'blogs'>) {
  const { quiz, description, ...rest } = blog;
  void description;
  return { ...rest, quizCount: quiz.length };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    // ponytail: blogs is a small seeded content table; 500 is a safe ceiling.
    const blogs = await ctx.db.query('blogs').take(500);
    return blogs.sort((a, b) => a.order - b.order).map(summarize);
  },
});

export const byPath = query({
  args: { path: pathValidator },
  handler: async (ctx, { path }) => {
    const blogs = await ctx.db
      .query('blogs')
      .withIndex('by_path', (q) => q.eq('path', path))
      .collect();
    return blogs.sort((a, b) => a.order - b.order).map(summarize);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const blog = await ctx.db
      .query('blogs')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique();
    if (!blog) return null;

    const author = await ctx.db.get(blog.authorId);
    const { quiz, ...rest } = blog;
    return {
      ...rest,
      quiz: safeQuiz(blog),
      quizCount: quiz.length,
      author: author
        ? {
            slug: author.slug,
            name: author.name,
            avatar: author.avatar,
            role: author.role,
          }
        : null,
    };
  },
});

/** Nodes + de-duplicated undirected links for the dashboard topic graph. */
export const graph = query({
  args: {},
  handler: async (ctx) => {
    const blogs = await ctx.db.query('blogs').take(500);
    const slugs = new Set(blogs.map((b) => b.slug));

    const nodes = blogs.map((b) => ({
      id: b.slug,
      title: b.title,
      path: b.path,
    }));

    const seen = new Set<string>();
    const links: { source: string; target: string }[] = [];
    for (const b of blogs) {
      for (const target of b.linkedSlugs) {
        if (!slugs.has(target)) continue;
        const key = [b.slug, target].sort().join('::');
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ source: b.slug, target });
      }
    }
    return { nodes, links };
  },
});
