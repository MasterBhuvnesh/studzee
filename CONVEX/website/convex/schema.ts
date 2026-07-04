import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { EMBED_DIM } from './model/embeddings';

// path is one of two learning paths for now.
export const pathValidator = v.union(
  v.literal('system-design'),
  v.literal('devops')
);

const quizQuestion = v.object({
  question: v.string(),
  options: v.array(v.string()), // 4 options
  answerIndex: v.number(),
});

export default defineSchema({
  authors: defineTable({
    slug: v.string(),
    name: v.string(),
    avatar: v.string(),
    role: v.string(),
    bio: v.string(),
    socials: v.object({
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
  }).index('by_slug', ['slug']),

  // A blog IS a topic node (1:1). `slug` is the topic id used by linkedSlugs + graph.
  blogs: defineTable({
    path: pathValidator,
    slug: v.string(),
    title: v.string(),
    authorId: v.id('authors'),
    tags: v.array(v.string()),
    shortDescription: v.string(),
    facts: v.array(v.string()),
    description: v.string(), // markdown body
    bannerImg: v.string(),
    summary: v.string(),
    quiz: v.array(quizQuestion), // 10 authored questions
    linkedSlugs: v.array(v.string()), // graph edges
    order: v.number(),
    createdAt: v.number(),
  })
    .index('by_path', ['path'])
    .index('by_slug', ['slug']),

  // userId = Clerk identity.subject everywhere below.
  progress: defineTable({
    userId: v.string(),
    blogSlug: v.string(),
    read: v.boolean(),
    readAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_blog', ['userId', 'blogSlug']),

  quizAttempts: defineTable({
    userId: v.string(),
    blogSlug: v.string(),
    score: v.number(),
    total: v.number(),
    passed: v.boolean(),
    attemptedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_blog', ['userId', 'blogSlug']),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  chats: defineTable({
    userId: v.string(),
    title: v.string(),
    blogSlug: v.optional(v.string()), // seed context when opened from a blog
    createdAt: v.number(),
    lastMessageAt: v.number(),
  }).index('by_user', ['userId']),

  messages: defineTable({
    chatId: v.id('chats'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    reasoning: v.optional(v.string()),
    done: v.boolean(), // false while streaming
    createdAt: v.number(),
  }).index('by_chat', ['chatId']),

  // RAG: embedded blog chunks for grounding the AI chat.
  chunks: defineTable({
    blogSlug: v.string(),
    text: v.string(),
    embedding: v.array(v.float64()),
  })
    .index('by_blog', ['blogSlug'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: EMBED_DIM,
      filterFields: ['blogSlug'],
    }),
});
