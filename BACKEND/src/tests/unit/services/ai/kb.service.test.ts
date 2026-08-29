/**
 * UNIT TESTS FOR KNOWLEDGE BASE CHUNKING
 *
 * What are we testing?
 * - The pure half of kb.service: how the corpus is cut up before it is embedded
 *
 * What is not tested here?
 * - reindexKnowledgeBase and searchKnowledgeBase, which are raw SQL against
 *   pgvector. Those need a real Postgres with the extension installed and
 *   belong in the integration suite, not here.
 *
 * Chunking is worth pinning because it decides what the assistant can find.
 * A section that loses its heading, or an editor facing preamble that gets
 * embedded as if it were help text, both degrade retrieval silently.
 */

import { describe, it, expect } from 'vitest'
import {
  buildRegistryChunks,
  chunkSupportMarkdown,
} from '@/services/ai/kb.service'
import { BADGES, LEVELS } from '@/models/gamification'

const markdown = [
  '# STUDZEE SUPPORT KNOWLEDGE BASE',
  '',
  'Editor facing preamble that explains how to maintain this file.',
  '',
  '## STREAKS',
  '',
  'A streak counts consecutive days of activity. Days are counted in UTC.',
  '',
  '## QUESTS',
  '',
  'A quest is a limited time challenge worth a fixed number of gems.',
  '',
].join('\n')

describe('knowledge base chunking', () => {
  describe('chunkSupportMarkdown', () => {
    it('should produce one chunk per second level heading', () => {
      // ACT
      const chunks = chunkSupportMarkdown(markdown)

      // ASSERT
      expect(chunks).toHaveLength(2)
      expect(chunks.map((chunk) => chunk.heading)).toEqual([
        'STREAKS',
        'QUESTS',
      ])
    })

    it('should drop the title and the preamble above the first heading', () => {
      // ACT
      const chunks = chunkSupportMarkdown(markdown)

      // ASSERT
      // The preamble tells a maintainer how to edit the file. Embedded, it
      // would only ever be retrieved as noise.
      const combined = chunks.map((chunk) => chunk.text).join('\n')
      expect(combined).not.toContain('Editor facing preamble')
      expect(combined).not.toContain('STUDZEE SUPPORT KNOWLEDGE BASE')
    })

    it('should keep the heading inside the chunk text', () => {
      // ACT
      const chunks = chunkSupportMarkdown(markdown)

      // ASSERT
      // The heading carries most of the topical signal. Embedding the body
      // alone measurably weakens the match for a question phrased like the
      // heading.
      expect(chunks[0].text.startsWith('STREAKS')).toBe(true)
      expect(chunks[0].text).toContain('consecutive days')
    })

    it('should tag every chunk as the support markdown source', () => {
      // ACT
      const chunks = chunkSupportMarkdown(markdown)

      // ASSERT
      expect(chunks.every((chunk) => chunk.source === 'support-md')).toBe(true)
      expect(chunks.every((chunk) => chunk.sourceId === null)).toBe(true)
    })

    it('should return nothing for markdown with no second level headings', () => {
      // ACT
      const chunks = chunkSupportMarkdown('# Title\n\nJust prose.\n')

      // ASSERT
      expect(chunks).toEqual([])
    })
  })

  describe('buildRegistryChunks', () => {
    it('should render every level and badge out of the code constants', () => {
      // ACT
      const chunks = buildRegistryChunks()

      // ASSERT
      // These are generated rather than written into the markdown so that
      // changing a threshold in gamification.ts cannot leave the assistant
      // quoting the old one.
      const levelChunk = chunks.find((chunk) =>
        chunk.heading?.includes('LEVELS')
      )
      const badgeChunk = chunks.find((chunk) => chunk.heading === 'BADGES')

      for (const level of LEVELS) {
        expect(levelChunk?.text).toContain(level.label)
        expect(levelChunk?.text).toContain(String(level.minPoints))
      }
      for (const badge of BADGES) {
        expect(badgeChunk?.text).toContain(badge.label)
      }
    })

    it('should list the topic registry', () => {
      // ACT
      const chunks = buildRegistryChunks()

      // ASSERT
      const topicChunk = chunks.find(
        (chunk) => chunk.heading === 'TOPICS COVERED'
      )
      expect(topicChunk?.text).toContain('Machine Learning')
      expect(topicChunk?.text).toContain('System Design')
    })
  })
})
