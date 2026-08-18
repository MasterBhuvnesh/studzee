/**
 * UNIT TESTS FOR THE EXPO PUSH SERVICE
 *
 * These cover the two defects found when the notification service was merged
 * into the backend:
 *
 * 1. Every token was sent in a single request. Expo rejects a request carrying
 *    more than 100 messages, so any broadcast past 100 devices failed whole.
 * 2. Tickets were never inspected, so tokens for uninstalled apps were never
 *    pruned and kept being counted as recipients.
 */

import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendExpoNotification } from '@/services/expo.service'

/** Build n well formed Expo tokens. */
const tokens = (n: number) =>
  Array.from({ length: n }, (_, i) => `ExponentPushToken[${i}]`)

/** An Expo response accepting every message in the request. */
const acceptAll = (body: unknown) => ({
  data: { data: (body as unknown[]).map(() => ({ status: 'ok', id: 'r' })) },
})

describe('sendExpoNotification', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('splits a broadcast into requests of at most 100 messages', async () => {
    const batchSizes: number[] = []
    vi.spyOn(axios, 'post').mockImplementation(async (_url, body) => {
      batchSizes.push((body as unknown[]).length)
      return acceptAll(body)
    })

    const result = await sendExpoNotification(tokens(250), 'title', 'body')

    expect(batchSizes).toEqual([100, 100, 50])
    expect(result.sent).toBe(250)
    expect(result.failed).toBe(0)
    expect(result.success).toBe(true)
  })

  it('sends a single request when the broadcast fits in one batch', async () => {
    const post = vi
      .spyOn(axios, 'post')
      .mockImplementation(async (_url, body) => acceptAll(body))

    await sendExpoNotification(tokens(40), 'title', 'body')

    expect(post).toHaveBeenCalledTimes(1)
  })

  it('collects tokens Expo reports as unregistered', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        data: [
          { status: 'ok', id: 'r1' },
          {
            status: 'error',
            message: 'device gone',
            details: { error: 'DeviceNotRegistered' },
          },
        ],
      },
    })

    const result = await sendExpoNotification(
      ['ExponentPushToken[good]', 'ExponentPushToken[dead]'],
      'title',
      'body'
    )

    expect(result.invalidTokens).toEqual(['ExponentPushToken[dead]'])
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.success).toBe(false)
  })

  it('keeps sending later batches after one batch fails', async () => {
    let call = 0
    vi.spyOn(axios, 'post').mockImplementation(async (_url, body) => {
      call += 1
      if (call === 1) throw new Error('network down')
      return acceptAll(body)
    })

    const result = await sendExpoNotification(tokens(150), 'title', 'body')

    expect(call).toBe(2)
    expect(result.failed).toBe(100)
    expect(result.sent).toBe(50)
    expect(result.success).toBe(false)
  })
})
