import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { Prisma } from '@prisma/client'
import { prisma } from '@/config'
import { BADGES, LEVELS } from '@/models/gamification'
import { DocumentModel } from '@/models/document.model'
import { TOPIC_REGISTRY } from '@/models/topics'
import { embed, embedQuery } from '@/services/ai/client'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * KNOWLEDGE BASE
 *
 * The retrieval half of the support agent. Every raw SQL statement in the
 * service lives in this file and nowhere else.
 *
 * It has to be raw because KbChunk.embedding is a pgvector column, which
 * Prisma models as Unsupported: it cannot be selected, inserted or compared
 * through the generated client. Confining that to one file keeps the rest of
 * the codebase on the normal Prisma API.
 *
 * The corpus has three sources and they are combined rather than chosen
 * between. The curated markdown covers how the app works. The registry chunks
 * are rendered out of the gamification and topic constants, so the level
 * ladder and badge list the assistant quotes cannot drift from the ones the
 * service actually awards. The content chunks let it answer questions about
 * the study material itself.
 */

export const KB_SOURCES = ['support-md', 'registry', 'content'] as const
export type KbSource = (typeof KB_SOURCES)[number]

export interface KbChunkInput {
  source: KbSource
  sourceId: string | null
  heading: string | null
  text: string
}

export interface RetrievedChunk {
  id: string
  source: string
  sourceId: string | null
  heading: string | null
  text: string
  similarity: number
}

const appError = (
  statusCode: number,
  message: string,
  code?: string
): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

/**
 * Embedding requests go out in batches. Large enough that reindexing a few
 * hundred chunks is a handful of round trips, small enough to stay inside a
 * provider request size limit.
 */
const EMBED_BATCH = 32

/** Longest passage stored. Beyond this retrieval quality falls off anyway. */
const MAX_CHUNK_CHARS = 2000

/**
 * A match below this is noise. Without a floor an unrelated question still
 * retrieves its five nearest rows, and the assistant then answers from
 * passages that have nothing to do with it.
 */
const MIN_SIMILARITY = 0.3

const truncate = (text: string): string =>
  text.length > MAX_CHUNK_CHARS ? `${text.slice(0, MAX_CHUNK_CHARS)}...` : text

/**
 * The markdown ships as a file rather than a string constant so it reads and
 * edits like prose. tsc does not copy non TypeScript files, so the build
 * script copies the kb directory into dist; the src path is the fallback for
 * ts-node-dev and the test suite, which run from source.
 */
const readSupportMarkdown = (): string => {
  const candidates = [
    path.join(__dirname, 'kb', 'support.md'),
    path.join(process.cwd(), 'src', 'services', 'ai', 'kb', 'support.md'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, 'utf-8')
  }

  throw appError(
    500,
    'The support knowledge base markdown could not be found. The build should ' +
      'copy src/services/ai/kb into dist/services/ai/kb.',
    'KB_SOURCE_MISSING'
  )
}

/**
 * Split the markdown on its second level headings. The document title and the
 * editor facing preamble above the first heading are dropped: they explain how
 * to maintain the file and would only ever be retrieved as noise.
 */
export const chunkSupportMarkdown = (markdown: string): KbChunkInput[] => {
  const sections = markdown.split(/^## /m).slice(1)

  return sections
    .map((section) => {
      const newline = section.indexOf('\n')
      const heading = section.slice(0, newline === -1 ? undefined : newline)
      const body = newline === -1 ? '' : section.slice(newline + 1)
      return {
        source: 'support-md' as const,
        sourceId: null,
        heading: heading.trim(),
        text: truncate(`${heading.trim()}\n\n${body.trim()}`),
      }
    })
    .filter((chunk) => chunk.text.length > 0)
}

/**
 * Levels, badges and topics rendered out of the code constants that define
 * them. Writing these into the markdown instead would mean a badge threshold
 * lived in two places and the assistant would eventually quote the stale one.
 */
export const buildRegistryChunks = (): KbChunkInput[] => {
  const levels = LEVELS.map(
    (level) => `- ${level.label}: reached at ${level.minPoints} points`
  ).join('\n')

  const badges = BADGES.map(
    (badge) => `- ${badge.label}: ${badge.description}`
  ).join('\n')

  const topics = TOPIC_REGISTRY.map((topic) => `- ${topic.label}`).join('\n')

  return [
    {
      source: 'registry',
      sourceId: null,
      heading: 'LEVELS AND THE POINTS LADDER',
      text:
        'LEVELS AND THE POINTS LADDER\n\nYour level is decided by your total ' +
        'points. You hold the highest level whose threshold you have ' +
        `reached.\n\n${levels}\n\nThere is nothing above the top rung.`,
    },
    {
      source: 'registry',
      sourceId: null,
      heading: 'BADGES',
      text:
        'BADGES\n\nBadges unlock automatically the first time you meet their ' +
        'condition. They are never removed once earned, and support cannot ' +
        `grant one.\n\n${badges}`,
    },
    {
      source: 'registry',
      sourceId: null,
      heading: 'TOPICS COVERED',
      text: `TOPICS COVERED\n\nStudzee currently covers:\n\n${topics}`,
    },
  ]
}

/**
 * One chunk per document, built from the fields written for human reading.
 * The full body is deliberately left out: it is long, it would dominate the
 * corpus, and the support agent answers questions about what exists rather
 * than teaching the material.
 */
export const buildContentChunks = async (): Promise<KbChunkInput[]> => {
  const documents = await DocumentModel.find(
    {},
    { title: 1, summary: 1, topic: 1, key_notes: 1 }
  ).lean()

  return documents.map((doc) => {
    const notes = doc.key_notes
      ? Object.entries(doc.key_notes as Record<string, string>)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n')
      : ''

    const text = [
      `STUDY MATERIAL: ${doc.title}`,
      doc.topic ? `Topic: ${doc.topic}` : '',
      doc.summary ? `Summary: ${doc.summary}` : '',
      notes ? `Key notes:\n${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    return {
      source: 'content' as const,
      sourceId: String(doc._id),
      heading: doc.title,
      text: truncate(text),
    }
  })
}

/** A pgvector literal. The column is typed, so the cast is on the parameter. */
const toVectorLiteral = (vector: number[]): string => `[${vector.join(',')}]`

/**
 * Rebuild the whole corpus.
 *
 * Delete and reinsert rather than diff. The corpus is small, embeddings are
 * the expensive part either way, and a full rebuild cannot leave an orphaned
 * chunk behind for a document that was deleted. It runs inside a transaction
 * so a failure part way through leaves the previous corpus intact and the
 * assistant still answering.
 */
export const reindexKnowledgeBase = async (): Promise<{
  chunks: number
  bySource: Record<string, number>
}> => {
  const chunks: KbChunkInput[] = [
    ...chunkSupportMarkdown(readSupportMarkdown()),
    ...buildRegistryChunks(),
    ...(await buildContentChunks()),
  ]

  if (chunks.length === 0) {
    throw appError(500, 'The knowledge base built no chunks', 'KB_EMPTY')
  }

  logger.info({ chunks: chunks.length }, 'Embedding knowledge base chunks')

  const vectors: number[][] = []
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH)
    vectors.push(...(await embed(batch.map((chunk) => chunk.text))))
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM "KbChunk"`

    for (const [index, chunk] of chunks.entries()) {
      // randomUUID rather than a cuid because @default(cuid()) is applied by
      // the Prisma client, which is not involved in a raw insert.
      await tx.$executeRaw`
        INSERT INTO "KbChunk" (id, source, "sourceId", heading, text, embedding, "updatedAt")
        VALUES (
          ${randomUUID()},
          ${chunk.source},
          ${chunk.sourceId},
          ${chunk.heading},
          ${chunk.text},
          ${toVectorLiteral(vectors[index])}::vector,
          NOW()
        )
      `
    }
  })

  const bySource = chunks.reduce<Record<string, number>>((acc, chunk) => {
    acc[chunk.source] = (acc[chunk.source] ?? 0) + 1
    return acc
  }, {})

  logger.info({ chunks: chunks.length, bySource }, 'Knowledge base reindexed')
  return { chunks: chunks.length, bySource }
}

/**
 * Nearest passages to a question.
 *
 * `<=>` is pgvector's cosine distance, so similarity is one minus it. Ordering
 * by the raw distance rather than the derived similarity is what lets the HNSW
 * index serve the query; sorting on the computed column would force a scan.
 */
export const searchKnowledgeBase = async (
  question: string,
  limit = 5
): Promise<RetrievedChunk[]> => {
  const vector = toVectorLiteral(await embedQuery(question))

  const rows = await prisma.$queryRaw<RetrievedChunk[]>(Prisma.sql`
    SELECT
      id,
      source,
      "sourceId",
      heading,
      text,
      1 - (embedding <=> ${vector}::vector) AS similarity
    FROM "KbChunk"
    ORDER BY embedding <=> ${vector}::vector
    LIMIT ${limit}
  `)

  return rows.filter((row) => row.similarity >= MIN_SIMILARITY)
}

/** Row count, used by the reindex tool and the readiness of the support route. */
export const countKnowledgeBase = async (): Promise<number> =>
  prisma.kbChunk.count()
