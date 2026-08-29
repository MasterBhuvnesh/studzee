import {
  connectDB,
  connectPostgres,
  disconnectDB,
  disconnectPostgres,
} from '@/config'
import { config } from '@/config'
import { reindexKnowledgeBase } from '@/services/ai/kb.service'
import logger from '@/utils/logger'

/**
 * Rebuild the support knowledge base from the command line.
 *
 * Mongo is needed as well as Postgres: the corpus includes a chunk per study
 * document, so the content collection has to be readable. Redis is not, which
 * is why it is not connected here.
 *
 * Run this after editing src/services/ai/kb/support.md, after changing a level
 * or badge, and after a content import. Nothing reindexes on its own.
 */
const run = async () => {
  if (!config.AI_ENABLED) {
    logger.error(
      'AI_ENABLED is false, so there is no embedding endpoint to call. ' +
        'Set AI_ENABLED=true and AI_API_KEY before reindexing.'
    )
    process.exit(1)
  }

  logger.info('Connecting to databases...')
  await connectDB()
  await connectPostgres()

  logger.info(
    { model: config.AI_EMBED_MODEL, dimensions: config.AI_EMBED_DIM },
    'Rebuilding the support knowledge base...'
  )
  const result = await reindexKnowledgeBase()

  logger.info('Disconnecting from databases...')
  await disconnectDB()
  await disconnectPostgres()

  logger.info(result, 'Reindex finished.')
  process.exit(0)
}

run().catch((error) => {
  logger.error(error, 'Reindex failed')
  process.exit(1)
})
