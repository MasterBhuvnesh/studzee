/**
 * One off phase 1 verification against the live remote stores configured in
 * .env (Atlas Mongo, Neon Postgres, Upstash Redis). Mounts the real content
 * and progress routers with their real middleware so auth, validation,
 * grading, caching and the unlock gate are all exercised, without needing a
 * listening port. Prints statuses and titles only, never credential values.
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
import contentRoutes from '@/api/routes/content.route'
import progressRoutes from '@/api/routes/progress.route'
import { DocumentModel } from '@/models/document.model'
import { errorHandler } from '@/middleware/errorHandler'

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

  // The DEV_TOKEN identity is shared across runs, so clear its tracker rows
  // first and every assertion below sees a fresh account. This identity is a
  // local development bypass, never a real Clerk user.
  const devUserId = 'dev-user-id'
  await prisma.quizAttempt.deleteMany({ where: { userId: devUserId } })
  await prisma.dailyActivity.deleteMany({ where: { userId: devUserId } })
  await prisma.awardedBadge.deleteMany({ where: { userId: devUserId } })
  await prisma.userProgress.deleteMany({ where: { userId: devUserId } })

  const app: Application = express()
  app.use(express.json())
  app.use('/content', contentRoutes)
  app.use('/progress', progressRoutes)
  // Same terminal middleware the real server mounts, so error bodies carry
  // message and code exactly as production clients will see them.
  app.use(errorHandler)

  const results: string[] = []
  const check = (name: string, ok: boolean, detail: string) =>
    results.push(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${detail}`)

  // 1. Topic registry
  let r = await request(app).get('/content/topics')
  const keys = (r.body?.data ?? []).map((t: any) => t.key)
  check(
    'GET /content/topics',
    r.status === 200 && keys.includes('system-design'),
    `${r.status} keys=[${keys.join(',')}]`
  )

  // 2. Topic filter returns only seeded system design docs
  r = await request(app).get('/content?page=1&limit=10&topic=system-design')
  const titles = (r.body?.data ?? []).map((d: any) => d.title)
  check(
    'GET /content?topic=system-design',
    r.status === 200 &&
      titles.includes('CAP Theorem') &&
      titles.includes('Load Balancers Explained'),
    `${r.status} [${titles.join(' | ')}]`
  )

  // 3. Unknown topic key is a 400 naming allowed values
  r = await request(app).get('/content?topic=nonsense')
  check('GET /content?topic=nonsense rejects', r.status === 400, `${r.status}`)

  // 4. Unauthenticated progress access is rejected before anything else
  r = await request(app).get('/progress/me')
  check('GET /progress/me unauthenticated', r.status === 401, `${r.status}`)

  // 5. CAP Theorem carries unlockPoints 50 and the fresh dev user has none
  const cap = (await DocumentModel.findOne({ title: 'CAP Theorem' })
    .lean()
    .exec()) as any
  r = await request(app).get(`/content/${cap._id}`).set('Authorization', token)
  const gateCode = r.body?.code
  check(
    'locked document gates with CONTENT_LOCKED',
    r.status === 403 && gateCode === 'CONTENT_LOCKED',
    `${r.status} code=${gateCode} body=${JSON.stringify(r.body ?? r.text).slice(0, 220)}`
  )

  // 6. Submit a perfect attempt on Load Balancers and expect full marks
  const lb = (await DocumentModel.findOne({ title: 'Load Balancers Explained' })
    .lean()
    .exec()) as any
  const quiz = quizToObject(lb.quiz)
  const responses: Record<string, number> = {}
  for (const [key, q] of Object.entries(quiz)) {
    responses[key] = q.options.indexOf(q.ans)
  }
  r = await request(app)
    .post('/progress/attempts')
    .set('Authorization', token)
    .send({ contentId: String(lb._id), responses })
  const attempt = r.body?.data
  check(
    'POST /progress/attempts grades a perfect run',
    r.status === 200 &&
      attempt?.score === attempt?.total &&
      attempt?.pointsAwarded === attempt?.total * 10,
    `${r.status} score=${attempt?.score}/${attempt?.total} pts=${attempt?.pointsAwarded} streak=${attempt?.streak?.current} newBadges=[${(attempt?.newBadges ?? []).map((b: any) => b.key).join(',')}]`
  )

  // 7. Progress endpoint reflects the attempt
  r = await request(app).get('/progress/me').set('Authorization', token)
  const me = r.body?.data
  check(
    'GET /progress/me reflects points, level, badges',
    r.status === 200 &&
      me?.points === attempt?.totalPoints &&
      me?.streak?.current >= 1 &&
      Array.isArray(me?.badges) &&
      Array.isArray(me?.allBadges),
    `${r.status} points=${me?.points} level=${me?.level?.key} next=${me?.nextLevel?.key} streak=${me?.streak?.current} badges=${me?.badges?.length}/${me?.allBadges?.length}`
  )

  // 8. Repeat attempt scores full again but awards zero delta points
  r = await request(app)
    .post('/progress/attempts')
    .set('Authorization', token)
    .send({ contentId: String(lb._id), responses })
  const repeat = r.body?.data
  check(
    'repeat attempt awards no extra points',
    r.status === 200 &&
      repeat?.score === repeat?.total &&
      repeat?.pointsAwarded === 0,
    `${r.status} ptsAwarded=${repeat?.pointsAwarded}`
  )

  // 9. Cross the CAP gate (needs 50) with another perfect run, then reopen
  const bp = (await DocumentModel.findOne({
    title: 'Backpropagation Intuition',
  })
    .lean()
    .exec()) as any
  const bpQuiz = quizToObject(bp.quiz)
  const bpResponses: Record<string, number> = {}
  for (const [key, q] of Object.entries(bpQuiz)) {
    bpResponses[key] = q.options.indexOf(q.ans)
  }
  r = await request(app)
    .post('/progress/attempts')
    .set('Authorization', token)
    .send({ contentId: String(bp._id), responses: bpResponses })
  const second = r.body?.data
  check(
    'second content awards its own delta',
    r.status === 200 && second?.pointsAwarded === second?.total * 10,
    `${r.status} pts=${second?.pointsAwarded} total=${second?.totalPoints}`
  )

  r = await request(app).get(`/content/${cap._id}`).set('Authorization', token)
  check(
    'document unlocks once points suffice',
    r.status === 200 && r.body?.title === 'CAP Theorem',
    `${r.status}`
  )

  // 10. Wrong answer grades below total
  const wrongResponses: Record<string, number> = {}
  for (const key of Object.keys(quiz)) wrongResponses[key] = 99
  r = await request(app)
    .post('/progress/attempts')
    .set('Authorization', token)
    .send({ contentId: String(lb._id), responses: wrongResponses })
  const wrong = r.body?.data
  check(
    'all wrong answers grade zero',
    r.status === 200 && wrong?.score === 0,
    `${r.status} score=${wrong?.score}/${wrong?.total}`
  )

  console.log('\n===== PHASE 1 VERIFICATION =====')
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
