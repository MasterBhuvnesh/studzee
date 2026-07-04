import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { nimChat, parseQuiz, type AiQuestion } from './nim';
import { requireFeature } from './model/billing';

/** AI "quick summary" for a blog. Gated by the `ai_summary` feature. */
export const summarize = action({
  args: { blogSlug: v.string() },
  handler: async (ctx, { blogSlug }): Promise<{ summary: string }> => {
    await requireFeature(ctx, 'ai_summary');
    const blog = await ctx.runQuery(api.blogs.getBySlug, { slug: blogSlug });
    if (!blog) throw new Error('Topic not found');

    const content = await nimChat(
      [
        {
          role: 'system',
          content:
            'You are a concise technical tutor. Summarize for a learner in 3 short sentences. No preamble.',
        },
        {
          role: 'user',
          content: `Title: ${blog.title}\n\n${blog.description}`,
        },
      ],
      { maxTokens: 400 }
    );
    return { summary: content.trim() };
  },
});

/**
 * Generate a fresh 5-question quiz for a topic (or a random one). Answers are
 * returned so the client can grade this practice quiz locally — it is separate
 * from the authored 10-question quiz that drives progress.
 */
export const generateQuiz = action({
  args: { blogSlug: v.optional(v.string()) },
  handler: async (
    ctx,
    { blogSlug }
  ): Promise<{ blogSlug: string; title: string; questions: AiQuestion[] }> => {
    await requireFeature(ctx, 'ai_quiz');

    let slug = blogSlug;
    if (!slug || slug === 'random') {
      const all = await ctx.runQuery(api.blogs.list, {});
      if (all.length === 0) throw new Error('No topics available');
      slug = all[Math.floor(Math.random() * all.length)].slug;
    }

    const blog = await ctx.runQuery(api.blogs.getBySlug, { slug });
    if (!blog) throw new Error('Topic not found');

    const raw = await nimChat(
      [
        {
          role: 'system',
          content:
            'You write quiz questions. Return ONLY a JSON array, no prose, no code fences.',
        },
        {
          role: 'user',
          content: `Create exactly 5 multiple-choice questions about the topic below. Each item must be {"question": string, "options": [four strings], "answerIndex": integer 0-3}.\n\nTitle: ${blog.title}\n\n${blog.description}`,
        },
      ],
      { maxTokens: 1500, temperature: 0.7 }
    );

    return { blogSlug: slug, title: blog.title, questions: parseQuiz(raw) };
  },
});
