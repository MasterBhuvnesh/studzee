// Runtime constant arrays shared between server modules and client
// components. No imports here on purpose: a client component that
// value-imports from any other lib/backend/* module drags backendFetch, and
// therefore @clerk/nextjs/server, into the client bundle, which Turbopack
// rejects at build time. Type-only imports are erased and stay fine; this
// file exists so a value import has somewhere safe to come from.

export const QUEST_TYPES = ['mcq', 'scq', 'fill_blank', 'read_blog'] as const
export type QuestType = (typeof QUEST_TYPES)[number]

export const DRAFT_KINDS = ['document', 'quiz', 'key_notes', 'quest', 'notification'] as const
export type DraftKind = (typeof DRAFT_KINDS)[number]

export const DRAFT_STATUSES = ['pending', 'approved', 'rejected'] as const
export type DraftStatus = (typeof DRAFT_STATUSES)[number]
