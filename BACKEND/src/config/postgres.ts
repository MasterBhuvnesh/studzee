import { PrismaClient } from '@prisma/client'
import { config } from '@/config'

/**
 * Prisma client for the Postgres side of the service (users, push tokens,
 * notification and email audit logs).
 *
 * The client is cached on globalThis so that ts-node-dev respawns during
 * development reuse one connection pool instead of opening a new one on every
 * reload. Query logging is development only, since it writes every statement
 * and its parameters to the application log.
 */
declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined
}

export const prisma =
  global.prismaClient ||
  new PrismaClient({
    log:
      config.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  })

if (config.NODE_ENV !== 'production') {
  global.prismaClient = prisma
}

/**
 * Verify the Postgres connection at boot so the service fails fast rather than
 * on the first request that needs it.
 */
export const connectPostgres = async (): Promise<void> => {
  await prisma.$connect()
}

export const disconnectPostgres = async (): Promise<void> => {
  await prisma.$disconnect()
}
