/**
 * Phase 2 verification against the live remote stores: quests (list, window,
 * read blog and MCQ completion, duplicate short circuit), the topic backfill
 * that makes machine-learning server filtering work, tag filtering, and the
 * perfectionist tier catalog. Prints statuses only, never credentials.
 */
import express, { Application } from 'express'
import request from 'supertest'

import {
  connectDB,
  connectPostgres,
  connectRedis,
  disconnectDB,
  disconnectPostgres,
  disconnectRedis,
  prisma,
} from '@/config'
import { errorHandler } from '@/middleware/errorHandler'
import contentRoutes from '@/api/routes/content.route'
import progressRoutes from '@/api/routes/progress.route'
import questRoutes from '@/api/routes/quest.route'
import { DocumentModel } from '@/models/document.model'

const devUserId = 'dev-user-id'

function quizToObject(quiz: unknown): Record<string, any> {
  if (quiz instanceof Map) return Object.fromEntries(quiz)
  return (quiz as Record<string, any>) ?? {}
}

async function main() {
  if (!process.env.DEV_TOKEN) throw new Error('DEV_TOKEN missing in env')
  const token = `Bearer ${process.env.DEV_TOKEN}`

  await connectDB()
  await connectPostgres()
  await connectRedis()

  // Deterministic runs: clear the dev identity's tracker rows and quest
  // completions. This identity is the local development bypass, never a
  // real Clerk user.
  await prisma.quizAttempt.deleteMany({ where: { userId: devUserId } })
  await prisma.dailyActivity.deleteMany({ where: { userId: devUserId } })
  await prisma.awardedBadge.deleteMany({ where: { userId: devUserId } })
  await prisma.userProgress.deleteMany({ where: { userId: devUserId } })
  await prisma.questCompletion.deleteMany({ where: { userId: devUserId } })

  const app: Application = express()
  app.use(express.json())
  app.use('/content', contentRoutes)
  app.use('/progress', progressRoutes)
  app.use('/quests', questRoutes)
  app.use(errorHandler)

  const results: string[] = []
  const check = (name: string, ok: boolean, detail: string) =>
    results.push(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${detail}`)

  // 1. Quest list shows the three seeded samples in window
  let r = await request(app).get('/quests').set('Authorization', token)
  const quests = r.body?.data ?? []
  const byType = (type: string) => quests.find((q: any) => q.type === type)
  check(
    'GET /quests lists the seeded samples',
    r.status === 200 &&
      quests.length === 3 &&
      byType('read_blog') &&
      byType('mcq') &&
      byType('fill_blank'),
    `${r.status} count=${quests.length} types=[${quests.map((q: any) => q.type).join(',')}]`
  )

  // 2. Topic backfill: the four original ML documents now match the filter
  r = await request(app).get('/content?topic=machine-learning&limit=50')
  const mlTitles = (r.body?.data ?? []).map((d: any) => d.title)
  check(
    'topic filter finds the backfilled ML documents',
    r.status === 200 && mlTitles.length >= 4,
    `${r.status} count=${mlTitles.length}`
  )

  // 3. Tag filter returns the system design docs sharing a tag
  r = await request(app).get('/content?tag=architecture&limit=50')
  const tagged = (r.body?.data ?? []).map((d: any) => d.title)
  check(
    'tag filter matches tagged documents',
    r.status === 200 &&
      tagged.includes('CAP Theorem') &&
      tagged.includes('Load Balancers Explained'),
    `${r.status} [${tagged.join(' | ')}]`
  )

  // 4. Read a blog quest completes and awards its gems
  const readQuest = byType('read_blog')
  r = await request(app)
    .post(`/quests/${readQuest.id}/complete`)
    .set('Authorization', token)
    .send({ read: true })
  const readResult = r.body?.data
  check(
    'read_blog quest completes and awards gems',
    r.status === 200 &&
      readResult?.passed === true &&
      readResult?.gemsAwarded === readQuest.gems,
    `${r.status} gems=${readResult?.gemsAwarded}`
  )

  // 5. Completing it again short circuits instead of paying twice
  r = await request(app)
    .post(`/quests/${readQuest.id}/complete`)
    .set('Authorization', token)
    .send({ read: true })
  check(
    'duplicate completion awards nothing',
    r.status === 200 && r.body?.data?.alreadyCompleted === true,
    `${r.status} alreadyCompleted=${r.body?.data?.alreadyCompleted}`
  )

  // 6. MCQ quest with the correct answers passes and pays. The list serves
  // sanitized questions, so the answers for grading come from the stored row.
  const mcq = byType('mcq')
  const stored = await prisma.quest.findUnique({ where: { id: mcq.id } })
  const storedPayload = (stored?.payload ?? {}) as {
    questions?: { key: string; ans: string; options: string[] }[]
  }
  const mcqResponses: Record<string, number> = {}
  for (const q of mcq.questions ?? []) {
    const storedQuestion = storedPayload.questions?.find((x) => x.key === q.key)
    mcqResponses[q.key] = storedQuestion
      ? q.options.indexOf(storedQuestion.ans)
      : 0
  }
  r = await request(app)
    .post(`/quests/${mcq.id}/complete`)
    .set('Authorization', token)
    .send({ responses: mcqResponses })
  const mcqResult = r.body?.data
  check(
    'mcq quest grades a passing submission',
    r.status === 200 &&
      mcqResult?.passed === true &&
      mcqResult?.gemsAwarded === mcq.gems,
    `${r.status} passed=${mcqResult?.passed} gems=${mcqResult?.gemsAwarded}`
  )

  // 7. Wrong answers on the still open fill_blank quest pay nothing
  const fill = byType('fill_blank')
  const wrongResponses: Record<string, number> = {}
  for (const q of fill.questions ?? []) wrongResponses[q.key] = 99
  r = await request(app)
    .post(`/quests/${fill.id}/complete`)
    .set('Authorization', token)
    .send({ responses: wrongResponses })
  check(
    'failing fill_blank submission pays nothing',
    r.status === 200 && r.body?.data?.passed === false,
    `${r.status} passed=${r.body?.data?.passed}`
  )

  // 8. Progress reflects the quest gems and the tier catalog is served
  r = await request(app).get('/progress/me').set('Authorization', token)
  const me = r.body?.data
  const perfectionistTiers = (me?.allBadges ?? []).filter((b: any) =>
    b.key.startsWith('perfectionist')
  )
  check(
    'progress reflects quest gems and tiered catalog',
    r.status === 200 &&
      me?.points === readQuest.gems + mcq.gems &&
      perfectionistTiers.length === 4,
    `${r.status} points=${me?.points} tiers=${perfectionistTiers.length}`
  )

  console.log('\n===== PHASE 2 VERIFICATION =====')
  results.forEach((line) => console.log(line))
  const failed = results.filter((x) => x.startsWith('FAIL')).length
  console.log(`===== ${results.length - failed}/${results.length} passed =====`)

  await Promise.allSettled([
    disconnectDB(),
    disconnectPostgres(),
    disconnectRedis(),
  ])
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(async (e) => {
  console.error('VERIFY ERROR:', e instanceof Error ? e.message : e)
  process.exit(1)
})
