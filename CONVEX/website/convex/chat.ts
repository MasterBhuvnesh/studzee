import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getUserId, requireUserId } from './model/users';
import { nimEmbed, nimChatStream, type ChatMessage } from './nim';
import { RAG_TOP_K } from './model/embeddings';

export const create = mutation({
  args: { blogSlug: v.optional(v.string()) },
  returns: v.id('chats'),
  handler: async (ctx, { blogSlug }) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert('chats', {
      userId,
      title: 'New chat',
      blogSlug,
      createdAt: now,
      lastMessageAt: now,
    });
  },
});

export const remove = mutation({
  args: { chatId: v.id('chats') },
  returns: v.null(),
  handler: async (ctx, { chatId }) => {
    const userId = await requireUserId(ctx);
    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) return null;
    const msgs = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', chatId))
      .collect();
    for (const m of msgs) await ctx.db.delete(m._id);
    await ctx.db.delete(chatId);
    return null;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query('chats')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(50);
  },
});

export const get = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, { chatId }) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;
    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) return null;
    return chat;
  },
});

export const messages = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, { chatId }) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) return [];
    return await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', chatId))
      .order('asc')
      .take(200);
  },
});

// --- internal helpers used by the streaming action ---

export const getOwned = internalQuery({
  args: { chatId: v.id('chats'), userId: v.string() },
  handler: async (ctx, { chatId, userId }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) return null;
    return chat;
  },
});

export const history = internalQuery({
  args: { chatId: v.id('chats') },
  handler: async (ctx, { chatId }) => {
    const msgs = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', chatId))
      .order('asc')
      .take(200);
    return msgs
      .filter((m) => m.done)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
  },
});

export const addUserMessage = internalMutation({
  args: { chatId: v.id('chats'), content: v.string() },
  returns: v.null(),
  handler: async (ctx, { chatId, content }) => {
    await ctx.db.insert('messages', {
      chatId,
      role: 'user',
      content,
      done: true,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const startAssistant = internalMutation({
  args: { chatId: v.id('chats') },
  returns: v.id('messages'),
  handler: async (ctx, { chatId }) => {
    return await ctx.db.insert('messages', {
      chatId,
      role: 'assistant',
      content: '',
      done: false,
      createdAt: Date.now(),
    });
  },
});

export const updateAssistant = internalMutation({
  args: {
    messageId: v.id('messages'),
    content: v.string(),
    reasoning: v.string(),
    done: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { messageId, content, reasoning, done }) => {
    await ctx.db.patch(messageId, {
      content,
      reasoning: reasoning || undefined,
      done,
    });
    return null;
  },
});

export const touch = internalMutation({
  args: { chatId: v.id('chats'), title: v.string() },
  returns: v.null(),
  handler: async (ctx, { chatId, title }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) return null;
    await ctx.db.patch(chatId, {
      lastMessageAt: Date.now(),
      ...(chat.title === 'New chat' ? { title } : {}),
    });
    return null;
  },
});

/**
 * RAG chat: persist the user message, then stream a grounded assistant reply,
 * patching the assistant message row as deltas arrive so the client sees it live
 * and it stays saved.
 */
export const send = action({
  args: { chatId: v.id('chats'), content: v.string() },
  returns: v.null(),
  handler: async (ctx, { chatId, content }): Promise<null> => {
    const userId = await requireUserId(ctx);
    const chat = await ctx.runQuery(internal.chat.getOwned, { chatId, userId });
    if (!chat) throw new Error('Chat not found');

    const priorHistory = await ctx.runQuery(internal.chat.history, { chatId });
    await ctx.runMutation(internal.chat.addUserMessage, { chatId, content });
    const assistantId = await ctx.runMutation(internal.chat.startAssistant, {
      chatId,
    });

    // Best-effort RAG retrieval — a failure here should not kill the reply.
    let contextText = '';
    try {
      const [queryEmbedding] = await nimEmbed([content], 'query');
      const blogSlug = chat.blogSlug;
      const results = await ctx.vectorSearch('chunks', 'by_embedding', {
        vector: queryEmbedding,
        limit: RAG_TOP_K,
        ...(blogSlug ? { filter: (q) => q.eq('blogSlug', blogSlug) } : {}),
      });
      const texts = await ctx.runQuery(internal.rag.loadChunks, {
        ids: results.map((r) => r._id),
      });
      contextText = texts.join('\n\n---\n\n');
    } catch (e) {
      console.error('RAG retrieval failed, answering ungrounded:', e);
    }

    const system = `You are Studzee's tutor for System Design and DevOps. Be clear and concise. Prefer the provided context; if it does not cover the question, use general knowledge and note that briefly.\n\nContext:\n${contextText || '(no specific context found)'}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      ...priorHistory,
      { role: 'user', content },
    ];

    let acc = '';
    let reasoningAcc = '';
    let lastFlush = 0;
    const final = await nimChatStream(
      messages,
      async (d) => {
        if (d.content) acc += d.content;
        if (d.reasoning) reasoningAcc += d.reasoning;
        const now = Date.now();
        if (now - lastFlush > 150) {
          lastFlush = now;
          await ctx.runMutation(internal.chat.updateAssistant, {
            messageId: assistantId,
            content: acc,
            reasoning: reasoningAcc,
            done: false,
          });
        }
      },
      { maxTokens: 1200 }
    );

    await ctx.runMutation(internal.chat.updateAssistant, {
      messageId: assistantId,
      content: final.content,
      reasoning: final.reasoning,
      done: true,
    });
    await ctx.runMutation(internal.chat.touch, {
      chatId,
      title: content.slice(0, 60),
    });
    return null;
  },
});
