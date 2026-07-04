import { action, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { nimEmbed } from './nim';
import { EMBED_DIM } from './model/embeddings';

function chunkBlog(blog: {
  title: string;
  summary: string;
  facts: string[];
  description: string;
}): string[] {
  const chunks: string[] = [`${blog.title}. ${blog.summary}`];
  if (blog.facts.length) {
    chunks.push(`${blog.title} — key facts: ${blog.facts.join(' ')}`);
  }
  for (const para of blog.description.split('\n\n')) {
    const p = para.trim();
    if (p) chunks.push(`${blog.title}: ${p}`);
  }
  return chunks;
}

/** Confirm the embedding model's real output dimension vs EMBED_DIM. */
export const probeDim = action({
  args: {},
  handler: async (): Promise<{
    dimension: number;
    configured: number;
    matches: boolean;
  }> => {
    const [e] = await nimEmbed(['dimension probe'], 'query');
    console.log(
      `nv-embedcode-7b-v1 dimension = ${e.length} (EMBED_DIM = ${EMBED_DIM})`
    );
    return {
      dimension: e.length,
      configured: EMBED_DIM,
      matches: e.length === EMBED_DIM,
    };
  },
});

/** Re-embed every blog into the chunks table. Run after seeding: `npx convex run rag:reindex`. */
export const reindex = action({
  args: {},
  handler: async (ctx): Promise<{ blogs: number; chunks: number }> => {
    const blogs = await ctx.runQuery(internal.rag.fullBlogs, {});
    let total = 0;
    for (const blog of blogs) {
      const texts = chunkBlog(blog);
      const embeddings = await nimEmbed(texts, 'passage');
      await ctx.runMutation(internal.rag.replaceChunks, {
        blogSlug: blog.slug,
        chunks: texts.map((text, i) => ({ text, embedding: embeddings[i] })),
      });
      total += texts.length;
    }
    return { blogs: blogs.length, chunks: total };
  },
});

export const fullBlogs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const blogs = await ctx.db.query('blogs').take(500);
    return blogs.map((b) => ({
      slug: b.slug,
      title: b.title,
      summary: b.summary,
      facts: b.facts,
      description: b.description,
    }));
  },
});

export const replaceChunks = internalMutation({
  args: {
    blogSlug: v.string(),
    chunks: v.array(
      v.object({ text: v.string(), embedding: v.array(v.float64()) })
    ),
  },
  returns: v.null(),
  handler: async (ctx, { blogSlug, chunks }) => {
    const old = await ctx.db
      .query('chunks')
      .withIndex('by_blog', (q) => q.eq('blogSlug', blogSlug))
      .collect();
    for (const c of old) await ctx.db.delete(c._id);
    for (const c of chunks) {
      await ctx.db.insert('chunks', { blogSlug, text: c.text, embedding: c.embedding });
    }
    return null;
  },
});

export const loadChunks = internalQuery({
  args: { ids: v.array(v.id('chunks')) },
  handler: async (ctx, { ids }) => {
    const texts: string[] = [];
    for (const id of ids) {
      const c = await ctx.db.get(id);
      if (c) texts.push(c.text);
    }
    return texts;
  },
});
