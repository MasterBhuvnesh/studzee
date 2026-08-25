import {
  connectDB,
  connectPostgres,
  disconnectDB,
  disconnectPostgres,
  prisma,
} from '@/config'
import { DocumentModel } from '@/models/document.model'
import { CreateQuestSchema } from '@/models/quest.validation'
import logger from '@/utils/logger'

/**
 * QUEST SEEDER
 *
 * Additive only: each sample quest is inserted when no quest with the same
 * title exists and never updated or deleted, so the script is safe to run
 * repeatedly. Windows start whenever the script runs and last 30 days.
 * The read_blog sample resolves its contentId at seed time by looking up the
 * Mongo document it references, and is skipped when that document is absent,
 * because a read_blog quest without content cannot be completed.
 */
const WINDOW_DAYS = 30

/** The document the read_blog sample asks the caller to open. */
const READ_QUEST_CONTENT_TITLE = 'Load Balancers Explained'

interface SeedQuest {
  title: string
  description: string
  type: 'mcq' | 'scq' | 'fill_blank' | 'read_blog'
  gems: number
  payload?: Record<string, unknown>
}

// Choice answers hold option text and sit at options[0] by convention, which
// also makes them readable here.
const SEED_QUESTS: SeedQuest[] = [
  {
    title: 'Weekly Quest: Read Load Balancers Explained',
    description:
      'Open the Load Balancers Explained document and read it through to claim your gems.',
    type: 'read_blog',
    gems: 15,
  },
  {
    title: 'Monthly MCQ Challenge: System Design Basics',
    description:
      'Answer all three system design questions correctly to earn the full reward.',
    type: 'mcq',
    gems: 40,
    payload: {
      passScore: 3,
      questions: [
        {
          key: 'q1',
          que: 'What does the CAP theorem say a distributed data store must trade off during a network partition?',
          options: [
            'It can keep only two of consistency, availability and partition tolerance',
            'It must always sacrifice availability',
            'It must replicate every write synchronously',
          ],
          ans: 'It can keep only two of consistency, availability and partition tolerance',
        },
        {
          key: 'q2',
          que: 'Which scaling approach adds more machines rather than upgrading one machine?',
          options: ['Horizontal scaling', 'Vertical scaling', 'Caching'],
          ans: 'Horizontal scaling',
        },
        {
          key: 'q3',
          que: 'What is the primary purpose of a load balancer?',
          options: [
            'Distribute incoming requests across multiple servers',
            'Store session state permanently',
            'Encrypt traffic between clients',
          ],
          ans: 'Distribute incoming requests across multiple servers',
        },
      ],
    },
  },
  {
    title: 'Quick Fill: CAP Theorem Terms',
    description:
      'Fill in both CAP theorem terms correctly. Matching ignores case and surrounding spaces.',
    type: 'fill_blank',
    gems: 10,
    payload: {
      passScore: 2,
      questions: [
        {
          key: 'q1',
          que: 'In CAP, choosing availability under a partition means giving up strong ______.',
          answer: 'consistency',
        },
        {
          key: 'q2',
          que: 'CAP guarantees only two of its three properties when a ______ splits the network.',
          answer: 'partition',
        },
      ],
    },
  },
]

const seedQuests = async () => {
  logger.info('Connecting to databases for quest seeding...')
  await connectDB()
  await connectPostgres()

  try {
    const startsAt = new Date()
    const endsAt = new Date(startsAt)
    endsAt.setDate(endsAt.getDate() + WINDOW_DAYS)

    let insertedCount = 0
    let skippedCount = 0
    let invalidCount = 0

    for (const quest of SEED_QUESTS) {
      const existing = await prisma.quest.findUnique({
        where: { title: quest.title },
      })
      if (existing) {
        skippedCount++
        logger.info(`Quest already exists, skipping: ${quest.title}`)
        continue
      }

      // The read_blog sample needs its Mongo target to exist before it does.
      let contentId: string | undefined
      if (quest.type === 'read_blog') {
        const document = await DocumentModel.findOne({
          title: READ_QUEST_CONTENT_TITLE,
        })
          .select('_id')
          .lean()

        if (!document) {
          invalidCount++
          logger.error(
            `Content '${READ_QUEST_CONTENT_TITLE}' not found in Mongo, skipping quest: ${quest.title}`
          )
          continue
        }
        contentId = String((document as { _id: unknown })._id)
      }

      const parsed = CreateQuestSchema.safeParse({
        title: quest.title,
        description: quest.description,
        type: quest.type,
        gems: quest.gems,
        ...(contentId ? { contentId } : {}),
        ...(quest.payload ? { payload: quest.payload } : {}),
        active: true,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      })

      if (!parsed.success) {
        invalidCount++
        logger.error(
          {
            title: quest.title,
            errors: parsed.error.flatten().fieldErrors,
          },
          'Invalid seed quest, skipping'
        )
        continue
      }

      const created = await prisma.quest.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          type: parsed.data.type,
          gems: parsed.data.gems,
          contentId: parsed.data.contentId ?? null,
          ...(parsed.data.payload !== undefined
            ? { payload: parsed.data.payload as object }
            : {}),
          active: true,
          startsAt: parsed.data.startsAt,
          endsAt: parsed.data.endsAt,
        },
      })

      insertedCount++
      logger.info(`Inserted quest ${created.id}: ${quest.title}`)
    }

    logger.info(
      `Quest seeding finished: ${insertedCount} inserted, ${skippedCount} skipped (already existed), ${invalidCount} invalid.`
    )

    if (invalidCount > 0) {
      process.exitCode = 1
    }
  } catch (error) {
    logger.error(error, 'Error during quest seeding')
    process.exitCode = 1
  } finally {
    await disconnectPostgres()
    await disconnectDB()
    logger.info('Databases disconnected.')
  }
}

seedQuests()
