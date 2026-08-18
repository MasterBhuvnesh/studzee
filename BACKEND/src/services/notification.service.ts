import { prisma } from '@/config'

/**
 * Columns a log listing may be ordered by. Kept as an allowlist because the
 * sort field arrives from the query string and is interpolated into the Prisma
 * orderBy object.
 */
const SORTABLE_FIELDS = ['createdAt', 'status', 'sentBy'] as const
export type SortableField = (typeof SORTABLE_FIELDS)[number]

export const resolveSortField = (value?: string): SortableField =>
  SORTABLE_FIELDS.includes(value as SortableField)
    ? (value as SortableField)
    : 'createdAt'

export interface NotificationRecord {
  title: string
  message: string
  imageUrl?: string
  sentBy: string
  sentTo: string[]
  sentToAll: boolean
  status: string
}

export const saveNotification = async (data: NotificationRecord) =>
  prisma.notification.create({ data })

export const getNotifications = async (
  page: number,
  limit: number,
  sortBy: SortableField,
  order: 'asc' | 'desc'
) => {
  const skip = (page - 1) * limit

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.notification.count(),
  ])

  return {
    notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export interface EmailLogRecord {
  subject: string
  message: string
  pdfUrls: string[]
  sentBy: string
  sentTo: string[]
  status: string
}

export const saveEmailLog = async (data: EmailLogRecord) =>
  prisma.emailLog.create({ data })

export const getEmailLogs = async (
  page: number,
  limit: number,
  sortBy: SortableField,
  order: 'asc' | 'desc'
) => {
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.emailLog.count(),
  ])

  return {
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
