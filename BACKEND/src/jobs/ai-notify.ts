import cron from 'node-cron'
import { config, prisma } from '@/config'
import { DocumentModel } from '@/models/document.model'
import {
  generateNotificationDraft,
  hasNotificationDraft,
} from '@/services/ai/generate.service'
import logger from '@/utils/logger'

/**
 * NIGHTLY NOTIFICATION DRAFTING
 *
 * Finds material published and quests opened in the last day and drafts push
 * copy for each. It sends nothing. The house rule is that no outreach leaves
 * the service without owner approval, and approving the draft is what sends
 * it.
 *
 * That is not only a process rule here, it is also the only off switch that
 * exists. There are no per user notification preferences, no opt out and no
 * quiet hours, and User carries no timezone, so an automatic send would have
 * nothing to respect. Review is the control until that changes.
 *
 * Drafts are the dedupe record too. The Notification table logs broadcasts
 * rather than subjects, so without checking for an existing draft a restart
 * would redraft the same day's material.
 */

/** Written into createdBy so a job drafted row is distinguishable from an admin one. */
const SYSTEM_ACTOR = 'system:ai-notify'

const LOOKBACK_MS = 24 * 60 * 60 * 1000

export interface NotifyDraftSummary {
  considered: number
  drafted: number
  skipped: number
  failed: number
}

export const draftNewContentNotifications =
  async (): Promise<NotifyDraftSummary> => {
    const since = new Date(Date.now() - LOOKBACK_MS)
    const summary: NotifyDraftSummary = {
      considered: 0,
      drafted: 0,
      skipped: 0,
      failed: 0,
    }

    const documents = await DocumentModel.find(
      { createdAt: { $gt: since } },
      { _id: 1, title: 1 }
    ).lean()

    // A quest that opened in the window, not one merely created in it: a quest
    // seeded weeks ahead of its start should be announced when it opens.
    const quests = await prisma.quest.findMany({
      where: { active: true, startsAt: { gt: since, lte: new Date() } },
      select: { id: true, title: true },
    })

    const subjects: { kind: 'content' | 'quest'; id: string; title: string }[] =
      [
        ...documents.map((doc) => ({
          kind: 'content' as const,
          id: String(doc._id),
          title: doc.title,
        })),
        ...quests.map((quest) => ({
          kind: 'quest' as const,
          id: quest.id,
          title: quest.title,
        })),
      ]

    summary.considered = subjects.length

    for (const subject of subjects) {
      if (await hasNotificationDraft(subject.id)) {
        summary.skipped += 1
        continue
      }

      try {
        await generateNotificationDraft(subject.kind, subject.id, SYSTEM_ACTOR)
        summary.drafted += 1
      } catch (error) {
        // One unusable subject must not stop the rest. A failure here costs a
        // draft, and the next run picks the subject up again because no draft
        // was written for it.
        summary.failed += 1
        logger.error(
          error,
          `Could not draft a notification for ${subject.kind} ${subject.id}`
        )
      }
    }

    logger.info(summary, 'Notification drafting finished')
    return summary
  }

export const startAiNotifyJob = () => {
  if (!config.AI_ENABLED) {
    logger.info('Skipping the notification drafting job, AI_ENABLED is false')
    return
  }

  if (config.NODE_ENV === 'test') {
    return
  }

  logger.info('Scheduling the notification drafting job daily at 01:00 UTC')

  // After the midnight cache refresh, before the 02:00 token cleanup, so the
  // three in process jobs do not contend.
  cron.schedule(
    '0 1 * * *',
    async () => {
      try {
        await draftNewContentNotifications()
      } catch (error) {
        logger.error(error, 'Notification drafting job failed')
      }
    },
    { timezone: 'UTC' }
  )
}
