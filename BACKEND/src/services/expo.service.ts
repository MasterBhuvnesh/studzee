import axios from 'axios'
import logger from '@/utils/logger'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts'

/**
 * Expo rejects a push request carrying more than 100 messages. Broadcasts are
 * chunked to this size and sent as separate requests.
 */
const EXPO_MAX_MESSAGES_PER_REQUEST = 100

export interface ExpoMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export interface ExpoTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

export interface ExpoSendResult {
  success: boolean
  sent: number
  failed: number
  ticketIds: string[]
  /** Tokens Expo reported as unregistered, safe to delete from the database. */
  invalidTokens: string[]
  errors: string[]
}

/**
 * Split an array into fixed size chunks.
 */
const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Send a push notification to a set of Expo tokens.
 *
 * Messages are chunked to the Expo request limit, so a broadcast to more than
 * 100 devices no longer fails as a whole. A chunk that fails does not abort the
 * remaining chunks, and the result reports what got through.
 */
export const sendExpoNotification = async (
  tokens: string[],
  title: string,
  body: string,
  imageUrl?: string
): Promise<ExpoSendResult> => {
  const result: ExpoSendResult = {
    success: true,
    sent: 0,
    failed: 0,
    ticketIds: [],
    invalidTokens: [],
    errors: [],
  }

  const batches = chunk(tokens, EXPO_MAX_MESSAGES_PER_REQUEST)

  for (const batch of batches) {
    const messages: ExpoMessage[] = batch.map((token) => ({
      to: token,
      title,
      body,
      ...(imageUrl && { data: { imageUrl } }),
    }))

    try {
      const response = await axios.post<{ data: ExpoTicket[] }>(
        EXPO_PUSH_URL,
        messages,
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      )

      const tickets = response.data?.data ?? []

      tickets.forEach((ticket, index) => {
        if (ticket.status === 'ok') {
          result.sent += 1
          if (ticket.id) result.ticketIds.push(ticket.id)
          return
        }

        result.failed += 1
        if (ticket.message) result.errors.push(ticket.message)

        // Expo reports a retired device token with this error code. Collecting
        // them lets the caller prune the token table.
        if (ticket.details?.error === 'DeviceNotRegistered') {
          result.invalidTokens.push(batch[index])
        }
      })
    } catch (error) {
      result.failed += batch.length
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push(message)
      logger.error(error, `Expo push batch of ${batch.length} failed`)
    }
  }

  result.success = result.failed === 0

  logger.info(
    {
      tokens: tokens.length,
      batches: batches.length,
      sent: result.sent,
      failed: result.failed,
      invalidTokens: result.invalidTokens.length,
    },
    'Expo push completed'
  )

  return result
}

/**
 * Fetch delivery receipts for previously issued push tickets.
 *
 * Expo resolves a receipt some time after the ticket, so this is called by the
 * token cleanup job rather than inline with the send.
 */
export const checkExpoReceipts = async (
  receiptIds: string[]
): Promise<Record<string, ExpoTicket>> => {
  const receipts: Record<string, ExpoTicket> = {}

  for (const batch of chunk(receiptIds, EXPO_MAX_MESSAGES_PER_REQUEST)) {
    try {
      const response = await axios.post<{ data: Record<string, ExpoTicket> }>(
        EXPO_RECEIPTS_URL,
        { ids: batch },
        { timeout: 15000 }
      )
      Object.assign(receipts, response.data?.data ?? {})
    } catch (error) {
      logger.error(error, 'Failed to fetch Expo receipts')
    }
  }

  return receipts
}
