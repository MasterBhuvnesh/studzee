/**
 * UNIT TESTS FOR THE AI CLIENT
 *
 * What are we testing?
 * - The transport wrapper around an OpenAI compatible endpoint
 *
 * How are external calls mocked?
 * - vi.spyOn on global fetch, the same shape expo.service.test.ts uses for
 *   axios. The suite has no HTTP interception library and does not need one:
 *   there is exactly one call site to stub.
 *
 * What matters here?
 * - The retry contract. chatJson gets one retry and only one, because a loop
 *   against a 550B model spends real money. Several tests below count calls
 *   rather than only checking the outcome.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { config } from '@/config'
import { chatJson, chatText, embed } from '@/services/ai/client'
import { AppError } from '@/types/errors'

/** A fetch Response carrying a chat completion with the given content. */
const chatReply = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const embeddingReply = (vectors: number[][]) =>
  new Response(
    JSON.stringify({ data: vectors.map((embedding) => ({ embedding })) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )

/** The configured dimension in the test environment. */
// Read from config rather than pinned to a number: the dimension belongs to
// whichever embedding model is configured, and hard coding it here would
// break the suite every time that model changes.
const DIM = config.AI_EMBED_DIM
const vectorOf = (length: number) => new Array(length).fill(0.1)

const ShapeSchema = z.object({ answer: z.string(), count: z.number() })

describe('AI client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('chatText', () => {
    it('should return the completion content', async () => {
      // ARRANGE
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(chatReply('Streaks reset at midnight UTC.'))

      // ACT
      const result = await chatText([{ role: 'user', content: 'streaks?' }])

      // ASSERT
      expect(result).toBe('Streaks reset at midnight UTC.')
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy.mock.calls[0][0]).toContain('/chat/completions')
    })

    it('should strip a reasoning block before returning the answer', async () => {
      // ARRANGE
      // Nemotron style models emit their thinking ahead of the answer. Leaving
      // it in would put the model's internal monologue in front of a user.
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        chatReply('<think>weighing the options</think>\nThe answer is four.')
      )

      // ACT
      const result = await chatText([{ role: 'user', content: 'q' }])

      // ASSERT
      expect(result).toBe('The answer is four.')
      expect(result).not.toContain('think')
    })

    it('should unwrap a fenced code block', async () => {
      // ARRANGE
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        chatReply('```json\n{"a":1}\n```')
      )

      // ACT
      const result = await chatText([{ role: 'user', content: 'q' }])

      // ASSERT
      expect(result).toBe('{"a":1}')
    })

    it('should raise a 502 when the endpoint returns an error status', async () => {
      // ARRANGE
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('rate limited', { status: 429 })
      )

      // ACT
      const failure = await chatText([{ role: 'user', content: 'q' }]).catch(
        (error: AppError) => error
      )

      // ASSERT
      // The upstream status is deliberately not passed through. A 429 from the
      // provider is not the caller's rate limit and must not look like one.
      expect((failure as AppError).statusCode).toBe(502)
      expect((failure as AppError).code).toBe('AI_UPSTREAM')
    })

    it('should raise a 504 when the request times out', async () => {
      // ARRANGE
      const timeout = new Error('timed out')
      timeout.name = 'TimeoutError'
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(timeout)

      // ACT
      const failure = await chatText([{ role: 'user', content: 'q' }]).catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).statusCode).toBe(504)
      expect((failure as AppError).code).toBe('AI_TIMEOUT')
    })

    it('should raise a 502 on an empty completion', async () => {
      // ARRANGE
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(chatReply('   '))

      // ACT
      const failure = await chatText([{ role: 'user', content: 'q' }]).catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).code).toBe('AI_EMPTY')
    })
  })

  describe('punctuation normalising', () => {
    // House style forbids em dashes. The prompt says so and the model produced
    // them anyway on the first live generation, so the client enforces it.
    // Normalising happens on the raw reply, so it covers chatJson too.
    const normalised = async (content: string) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(chatReply(content))
      return chatText([{ role: 'user', content: 'go' }])
    }

    it('should turn a dash used as punctuation into a comma', async () => {
      // ACT
      const result = await normalised(
        'Four strategies exist\u2014full, partial\u2014each differing.'
      )

      // ASSERT
      expect(result).toBe(
        'Four strategies exist, full, partial, each differing.'
      )
    })

    it('should not leave a doubled comma where the model already had one', async () => {
      // ACT
      const result = await normalised('a, b \u2013 c')

      // ASSERT
      expect(result).toBe('a, b, c')
    })

    it('should reduce a non breaking hyphen to a plain one', async () => {
      // ACT
      const result = await normalised('real\u2011time telemetry')

      // ASSERT
      expect(result).toBe('real-time telemetry')
    })
  })

  describe('chatJson', () => {
    it('should return parsed output when the first reply validates', async () => {
      // ARRANGE
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(chatReply('{"answer":"yes","count":2}'))

      // ACT
      const result = await chatJson(
        [{ role: 'user', content: 'q' }],
        ShapeSchema
      )

      // ASSERT
      expect(result).toEqual({ answer: 'yes', count: 2 })
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should retry once with the validation errors and succeed', async () => {
      // ARRANGE
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(chatReply('{"answer":"yes"}'))
        .mockResolvedValueOnce(chatReply('{"answer":"yes","count":2}'))

      // ACT
      const result = await chatJson(
        [{ role: 'user', content: 'q' }],
        ShapeSchema
      )

      // ASSERT
      expect(result).toEqual({ answer: 'yes', count: 2 })
      expect(fetchSpy).toHaveBeenCalledTimes(2)

      // The retry has to carry the failure back, otherwise the model has no
      // more information than it had the first time and will repeat itself.
      const retryBody = JSON.parse(
        fetchSpy.mock.calls[1][1]?.body as string
      ) as { messages: { role: string; content: string }[] }
      expect(retryBody.messages).toHaveLength(3)
      expect(retryBody.messages[2].content).toContain('count')
    })

    it('should stop after exactly one retry and raise AI_INVALID_OUTPUT', async () => {
      // ARRANGE
      // mockImplementation rather than mockResolvedValue: a Response body can
      // only be read once, so returning the same instance twice would fail the
      // second read for a reason that has nothing to do with the retry.
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => chatReply('{"answer":"yes"}'))

      // ACT
      const failure = await chatJson(
        [{ role: 'user', content: 'q' }],
        ShapeSchema
      ).catch((error: AppError) => error)

      // ASSERT
      expect((failure as AppError).code).toBe('AI_INVALID_OUTPUT')
      // Two calls, never three. This is the money guard.
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('should treat unparseable JSON as a validation failure and retry', async () => {
      // ARRANGE
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(chatReply('sorry, I cannot do that'))
        .mockResolvedValueOnce(chatReply('{"answer":"ok","count":1}'))

      // ACT
      const result = await chatJson(
        [{ role: 'user', content: 'q' }],
        ShapeSchema
      )

      // ASSERT
      expect(result).toEqual({ answer: 'ok', count: 1 })
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('embed', () => {
    it('should return one vector per input', async () => {
      // ARRANGE
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        embeddingReply([vectorOf(DIM), vectorOf(DIM)])
      )

      // ACT
      const result = await embed(['a', 'b'])

      // ASSERT
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveLength(DIM)
    })

    it('should not call the endpoint for an empty batch', async () => {
      // ARRANGE
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      // ACT
      const result = await embed([])

      // ASSERT
      expect(result).toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should reject a vector whose dimension does not match the column', async () => {
      // ARRANGE
      // A dimension mismatch would otherwise surface as an opaque Postgres
      // error on every insert, long after the cause.
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        embeddingReply([vectorOf(768)])
      )

      // ACT
      const failure = await embed(['a']).catch((error: AppError) => error)

      // ASSERT
      expect((failure as AppError).code).toBe('AI_EMBED_DIM_MISMATCH')
      expect((failure as AppError).message).toContain('768')
    })

    it('should reject a short batch', async () => {
      // ARRANGE
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        embeddingReply([vectorOf(DIM)])
      )

      // ACT
      const failure = await embed(['a', 'b']).catch((error: AppError) => error)

      // ASSERT
      expect((failure as AppError).code).toBe('AI_EMBED_COUNT')
    })
  })
})
