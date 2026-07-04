import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getUserId, requireUserId } from './model/users';
import { notify } from './model/notifications';

const PASS_RATIO = 0.7;

/** Grade the authored 10-question quiz server-side and record the attempt. */
export const submit = mutation({
  args: { blogSlug: v.string(), answers: v.array(v.number()) },
  handler: async (ctx, { blogSlug, answers }) => {
    const userId = await requireUserId(ctx);
    const blog = await ctx.db
      .query('blogs')
      .withIndex('by_slug', (q) => q.eq('slug', blogSlug))
      .unique();
    if (!blog) throw new Error('Blog not found');

    const total = blog.quiz.length;
    let score = 0;
    const results = blog.quiz.map((q, i) => {
      const chosenIndex = answers[i] ?? -1;
      const correct = chosenIndex === q.answerIndex;
      if (correct) score++;
      return { correctIndex: q.answerIndex, chosenIndex, correct };
    });
    const passed = total > 0 && score / total >= PASS_RATIO;

    const existing = await ctx.db
      .query('quizAttempts')
      .withIndex('by_user_blog', (q) =>
        q.eq('userId', userId).eq('blogSlug', blogSlug)
      )
      .unique();

    const alreadyPassed = existing?.passed ?? false;
    if (existing) {
      await ctx.db.patch(existing._id, {
        // keep the best score, but remember the latest attempt time
        score: Math.max(score, existing.score),
        total,
        passed: alreadyPassed || passed,
        attemptedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('quizAttempts', {
        userId,
        blogSlug,
        score,
        total,
        passed,
        attemptedAt: Date.now(),
      });
    }

    // Notify only on the first pass.
    if (passed && !alreadyPassed) {
      await notify(ctx, {
        userId,
        type: 'quiz-passed',
        title: `Quiz passed: ${blog.title}`,
        body: `You scored ${score}/${total}. Nice work!`,
        link: `/blog/${blog.slug}`,
      });
    }

    return { score, total, passed, results };
  },
});

/** Current user's attempt status per blog (dashboard badges). */
export const statusForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query('quizAttempts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.map((r) => ({
      blogSlug: r.blogSlug,
      score: r.score,
      total: r.total,
      passed: r.passed,
    }));
  },
});

export const statusForBlog = query({
  args: { blogSlug: v.string() },
  handler: async (ctx, { blogSlug }) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query('quizAttempts')
      .withIndex('by_user_blog', (q) =>
        q.eq('userId', userId).eq('blogSlug', blogSlug)
      )
      .unique();
    if (!row) return null;
    return {
      score: row.score,
      total: row.total,
      passed: row.passed,
      attemptedAt: row.attemptedAt,
    };
  },
});
