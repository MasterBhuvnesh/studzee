/**
 * UNIT TESTS FOR AI CONFIG
 *
 * What are we testing?
 * - Which chat model generation uses: the stored admin choice when it names a
 *   model still on the allowlist, otherwise the AI_MODEL environment default
 *
 * What is mocked?
 * - prisma, so no database is needed. The real config is kept so AI_MODEL
 *   still resolves.
 *
 * The behaviours pinned here are the ones that would otherwise brick
 * generation: a stored model retired from the allowlist, or a database wobble
 * on the read path, must fall back rather than fail.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { config } from '@/config'

const { aiConfigFindUnique, aiConfigUpsert } = vi.hoisted(() => ({
  aiConfigFindUnique: vi.fn(),
  aiConfigUpsert: vi.fn(),
}))

vi.mock('@/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config')>()
  return {
    ...actual,
    prisma: {
      aiConfig: {
        findUnique: aiConfigFindUnique,
        upsert: aiConfigUpsert,
      },
    },
  }
})

import {
  getAiConfig,
  resolveChatModel,
  updateAiConfig,
} from '@/services/ai/config.service'
import { AI_CHAT_MODELS } from '@/models/ai.validation'

describe('AI config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('resolveChatModel', () => {
    it('should prefer the stored model when it is allowlisted', async () => {
      // ARRANGE
      aiConfigFindUnique.mockResolvedValue({
        id: 'global',
        chatModel: AI_CHAT_MODELS[2],
      })

      // ACT
      const result = await resolveChatModel()

      // ASSERT
      expect(result).toBe(AI_CHAT_MODELS[2])
    })

    it('should fall back to AI_MODEL when no row is stored', async () => {
      // ARRANGE
      aiConfigFindUnique.mockResolvedValue(null)

      // ACT
      const result = await resolveChatModel()

      // ASSERT
      expect(result).toBe(config.AI_MODEL)
    })

    it('should fall back to AI_MODEL when the stored model was retired', async () => {
      // ARRANGE
      aiConfigFindUnique.mockResolvedValue({
        id: 'global',
        chatModel: 'nvidia/retired-model',
      })

      // ACT
      const result = await resolveChatModel()

      // ASSERT
      expect(result).toBe(config.AI_MODEL)
    })

    it('should fall back to AI_MODEL when the read fails', async () => {
      // ARRANGE
      aiConfigFindUnique.mockRejectedValue(new Error('connection lost'))

      // ACT
      const result = await resolveChatModel()

      // ASSERT
      expect(result).toBe(config.AI_MODEL)
    })
  })

  describe('getAiConfig', () => {
    it('should report the stored source with the allowlist', async () => {
      // ARRANGE
      aiConfigFindUnique.mockResolvedValue({
        id: 'global',
        chatModel: AI_CHAT_MODELS[0],
        updatedBy: 'user_admin',
        updatedAt: new Date('2026-09-10T10:00:00.000Z'),
      })

      // ACT
      const result = await getAiConfig()

      // ASSERT
      expect(result).toMatchObject({
        chatModel: AI_CHAT_MODELS[0],
        source: 'stored',
        updatedBy: 'user_admin',
        updatedAt: '2026-09-10T10:00:00.000Z',
      })
      expect(result.availableModels).toContain(AI_CHAT_MODELS[0])
      expect(result.defaultModel).toBe(config.AI_MODEL)
    })

    it('should report the env source when nothing is stored', async () => {
      // ARRANGE
      aiConfigFindUnique.mockResolvedValue(null)

      // ACT
      const result = await getAiConfig()

      // ASSERT
      expect(result).toMatchObject({
        chatModel: config.AI_MODEL,
        source: 'env',
        updatedBy: null,
        updatedAt: null,
      })
    })
  })

  describe('updateAiConfig', () => {
    it('should upsert the global row with the admin identity', async () => {
      // ARRANGE
      aiConfigUpsert.mockResolvedValue({
        id: 'global',
        chatModel: AI_CHAT_MODELS[1],
        updatedBy: 'user_admin',
      })

      // ACT
      await updateAiConfig(AI_CHAT_MODELS[1], 'user_admin')

      // ASSERT
      expect(aiConfigUpsert).toHaveBeenCalledWith({
        where: { id: 'global' },
        create: {
          id: 'global',
          chatModel: AI_CHAT_MODELS[1],
          updatedBy: 'user_admin',
        },
        update: { chatModel: AI_CHAT_MODELS[1], updatedBy: 'user_admin' },
      })
    })
  })
})
