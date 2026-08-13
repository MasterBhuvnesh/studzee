/**
 * UNIT TESTS FOR THE NOTIFICATION CONTROLLER
 *
 * The services are mocked, so these cover the decisions the controller makes on
 * its own: which set of devices a broadcast targets, what happens when that set
 * is empty, how a partial delivery is reported, and whether retired tokens are
 * pruned. The audit record is asserted alongside the response, because a
 * broadcast that reports success while recording nothing is indistinguishable
 * from one that never ran.
 */

import { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as NotificationController from '@/api/controllers/notification.controller'
import * as ExpoService from '@/services/expo.service'
import type { ExpoSendResult } from '@/services/expo.service'
import * as NotificationService from '@/services/notification.service'
import * as UserService from '@/services/user.service'

vi.mock('@/services/expo.service')
vi.mock('@/services/notification.service')
vi.mock('@/services/user.service')

const CLERK_ID = 'user_admin'

let mockRes: Partial<Response>
let mockNext: NextFunction

/** A request carrying an authenticated Clerk identity and the given body. */
const requestWith = (body: unknown): Request =>
  ({
    body,
    auth: () => ({ userId: CLERK_ID }),
  }) as unknown as Request

/**
 * An Expo result with every field populated, so the fixtures satisfy
 * ExpoSendResult rather than only the properties a given test cares about.
 */
const expoResult = (
  overrides: Partial<ExpoSendResult> = {}
): ExpoSendResult => ({
  success: true,
  sent: 0,
  failed: 0,
  ticketIds: [],
  invalidTokens: [],
  errors: [],
  ...overrides,
})

/** An Expo result that delivered to every token. */
const delivered = (sent: number) => expoResult({ sent })

const validBody = {
  title: 'Exam update',
  message: 'Timetable published',
  sendToAll: true,
}

beforeEach(() => {
  vi.clearAllMocks()

  mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }
  // NextFunction is overloaded, so a bare mock does not match it structurally.
  mockNext = vi.fn() as unknown as NextFunction

  // resolveSortField is an allowlist rather than a dependency, so the mocked
  // module needs it to behave like the real one for the listing tests.
  vi.mocked(NotificationService.resolveSortField).mockImplementation((value) =>
    (['createdAt', 'status', 'sentBy'] as const).includes(
      value as 'createdAt'
    )
      ? (value as 'createdAt')
      : 'createdAt'
  )
})

describe('registerDevice', () => {
  it('registers against the Clerk identity from the token, not the body', async () => {
    vi.mocked(UserService.registerOrUpdateUser).mockResolvedValue({
      id: 'row_1',
      email: 'student@example.test',
      expoTokens: ['ExponentPushToken[a]', 'ExponentPushToken[b]'],
    } as never)

    const req = requestWith({
      email: 'student@example.test',
      expoToken: 'ExponentPushToken[a]',
      clerkId: 'user_someone_else',
    })

    await NotificationController.registerDevice(req, mockRes as Response, mockNext)

    expect(UserService.registerOrUpdateUser).toHaveBeenCalledWith(
      CLERK_ID,
      'student@example.test',
      'ExponentPushToken[a]'
    )
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Device registered successfully',
      data: { id: 'row_1', email: 'student@example.test', devices: 2 },
    })
  })

  it('forwards a failure to the error handler', async () => {
    const failure = new Error('postgres unreachable')
    vi.mocked(UserService.registerOrUpdateUser).mockRejectedValue(failure)

    await NotificationController.registerDevice(
      requestWith({ email: 'a@example.test', expoToken: 'ExponentPushToken[a]' }),
      mockRes as Response,
      mockNext
    )

    expect(mockNext).toHaveBeenCalledWith(failure)
    expect(mockRes.json).not.toHaveBeenCalled()
  })
})

describe('sendPushNotification', () => {
  it('targets every registered device when sendToAll is set', async () => {
    const tokens = ['ExponentPushToken[a]', 'ExponentPushToken[b]']
    vi.mocked(UserService.getAllUsersTokens).mockResolvedValue(tokens)
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(delivered(2))

    await NotificationController.sendPushNotification(
      requestWith(validBody),
      mockRes as Response,
      mockNext
    )

    expect(UserService.getAllUsersTokens).toHaveBeenCalled()
    expect(UserService.getUsersByEmails).not.toHaveBeenCalled()
    expect(ExpoService.sendExpoNotification).toHaveBeenCalledWith(
      tokens,
      'Exam update',
      'Timetable published',
      undefined
    )
  })

  it('collects the tokens of the named users when sendToAll is clear', async () => {
    vi.mocked(UserService.getUsersByEmails).mockResolvedValue([
      { expoTokens: ['ExponentPushToken[a]'] },
      { expoTokens: ['ExponentPushToken[b]', 'ExponentPushToken[c]'] },
    ] as never)
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(delivered(3))

    await NotificationController.sendPushNotification(
      requestWith({
        ...validBody,
        sendToAll: false,
        emails: ['a@example.test', 'b@example.test'],
      }),
      mockRes as Response,
      mockNext
    )

    expect(UserService.getUsersByEmails).toHaveBeenCalledWith([
      'a@example.test',
      'b@example.test',
    ])
    expect(UserService.getAllUsersTokens).not.toHaveBeenCalled()
    expect(ExpoService.sendExpoNotification).toHaveBeenCalledWith(
      ['ExponentPushToken[a]', 'ExponentPushToken[b]', 'ExponentPushToken[c]'],
      'Exam update',
      'Timetable published',
      undefined
    )
  })

  it('answers 404 without contacting Expo when no device is registered', async () => {
    vi.mocked(UserService.getAllUsersTokens).mockResolvedValue([])

    await NotificationController.sendPushNotification(
      requestWith(validBody),
      mockRes as Response,
      mockNext
    )

    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'No registered devices found',
    })
    expect(ExpoService.sendExpoNotification).not.toHaveBeenCalled()
    // Nothing was attempted, so nothing belongs in the audit log.
    expect(NotificationService.saveNotification).not.toHaveBeenCalled()
  })

  it('records a full delivery as sent and answers 200', async () => {
    vi.mocked(UserService.getAllUsersTokens).mockResolvedValue([
      'ExponentPushToken[a]',
    ])
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(delivered(1))

    await NotificationController.sendPushNotification(
      requestWith({ ...validBody, imageUrl: 'https://example.test/b.png' }),
      mockRes as Response,
      mockNext
    )

    expect(NotificationService.saveNotification).toHaveBeenCalledWith({
      title: 'Exam update',
      message: 'Timetable published',
      imageUrl: 'https://example.test/b.png',
      sentBy: CLERK_ID,
      sentTo: [],
      sentToAll: true,
      status: 'sent',
    })
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Notification sent',
      data: { targeted: 1, sent: 1, failed: 0, prunedTokens: 0 },
    })
  })

  it('answers 207 and records failed when only some devices received it', async () => {
    vi.mocked(UserService.getAllUsersTokens).mockResolvedValue([
      'ExponentPushToken[a]',
      'ExponentPushToken[b]',
    ])
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(
      expoResult({ success: false, sent: 1, failed: 1 })
    )

    await NotificationController.sendPushNotification(
      requestWith(validBody),
      mockRes as Response,
      mockNext
    )

    expect(mockRes.status).toHaveBeenCalledWith(207)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Notification partially delivered',
      data: { targeted: 2, sent: 1, failed: 1, prunedTokens: 0 },
    })
    expect(NotificationService.saveNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    )
  })

  it('prunes the tokens Expo reported as retired', async () => {
    vi.mocked(UserService.getAllUsersTokens).mockResolvedValue([
      'ExponentPushToken[a]',
      'ExponentPushToken[dead]',
    ])
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(
      expoResult({
        success: false,
        sent: 1,
        failed: 1,
        invalidTokens: ['ExponentPushToken[dead]'],
      })
    )

    await NotificationController.sendPushNotification(
      requestWith(validBody),
      mockRes as Response,
      mockNext
    )

    expect(UserService.removeExpoTokens).toHaveBeenCalledWith([
      'ExponentPushToken[dead]',
    ])
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ prunedTokens: 1 }),
      })
    )
  })

  it('leaves the token table alone when every device is still valid', async () => {
    vi.mocked(UserService.getAllUsersTokens).mockResolvedValue([
      'ExponentPushToken[a]',
    ])
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(delivered(1))

    await NotificationController.sendPushNotification(
      requestWith(validBody),
      mockRes as Response,
      mockNext
    )

    expect(UserService.removeExpoTokens).not.toHaveBeenCalled()
  })

  it('attributes the broadcast to the caller rather than the request body', async () => {
    vi.mocked(UserService.getAllUsersTokens).mockResolvedValue([
      'ExponentPushToken[a]',
    ])
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(delivered(1))

    await NotificationController.sendPushNotification(
      requestWith({ ...validBody, sentBy: 'user_impersonated' }),
      mockRes as Response,
      mockNext
    )

    expect(NotificationService.saveNotification).toHaveBeenCalledWith(
      expect.objectContaining({ sentBy: CLERK_ID })
    )
  })

  it('records the addressed recipients when the broadcast is targeted', async () => {
    vi.mocked(UserService.getUsersByEmails).mockResolvedValue([
      { expoTokens: ['ExponentPushToken[a]'] },
    ] as never)
    vi.mocked(ExpoService.sendExpoNotification).mockResolvedValue(delivered(1))

    await NotificationController.sendPushNotification(
      requestWith({
        ...validBody,
        sendToAll: false,
        emails: ['a@example.test'],
      }),
      mockRes as Response,
      mockNext
    )

    expect(NotificationService.saveNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        sentTo: ['a@example.test'],
        sentToAll: false,
      })
    )
  })

  it('forwards a failure to the error handler', async () => {
    const failure = new Error('expo unreachable')
    vi.mocked(UserService.getAllUsersTokens).mockRejectedValue(failure)

    await NotificationController.sendPushNotification(
      requestWith(validBody),
      mockRes as Response,
      mockNext
    )

    expect(mockNext).toHaveBeenCalledWith(failure)
  })
})

describe('listNotifications', () => {
  /** The listing reads the validated query the middleware left on res.locals. */
  const responseWithQuery = (query: unknown): Partial<Response> => ({
    ...mockRes,
    locals: { query },
  })

  it('passes the validated paging through to the service', async () => {
    vi.mocked(NotificationService.getNotifications).mockResolvedValue({
      notifications: [],
      pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
    } as never)

    const res = responseWithQuery({
      page: 2,
      limit: 50,
      sortBy: 'status',
      order: 'asc',
    })

    await NotificationController.listNotifications(
      {} as Request,
      res as Response,
      mockNext
    )

    expect(NotificationService.getNotifications).toHaveBeenCalledWith(
      2,
      50,
      'status',
      'asc'
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('substitutes the default column when the sort field is not allowed', async () => {
    vi.mocked(NotificationService.getNotifications).mockResolvedValue({
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    } as never)

    await NotificationController.listNotifications(
      {} as Request,
      responseWithQuery({
        page: 1,
        limit: 20,
        sortBy: 'password',
        order: 'desc',
      }) as Response,
      mockNext
    )

    expect(NotificationService.getNotifications).toHaveBeenCalledWith(
      1,
      20,
      'createdAt',
      'desc'
    )
  })

  it('forwards a failure to the error handler', async () => {
    const failure = new Error('postgres unreachable')
    vi.mocked(NotificationService.getNotifications).mockRejectedValue(failure)

    await NotificationController.listNotifications(
      {} as Request,
      responseWithQuery({ page: 1, limit: 20, order: 'desc' }) as Response,
      mockNext
    )

    expect(mockNext).toHaveBeenCalledWith(failure)
  })
})
