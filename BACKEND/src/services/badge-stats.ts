import { prisma } from '@/config'

/**
 * How many of the user's stored quiz attempts scored full marks.
 *
 * Raw SQL keeps the tally inside Postgres instead of shipping rows over the
 * wire. The current attempt is not in the table yet when this runs during
 * gradeAndRecordAttempt, so the caller adds it to the count when the
 * submission graded perfect; see BadgeContext.fullScoreCount.
 */
export const getFullScoreAttemptCount = async (
  userId: string
): Promise<number> => {
  // Tagged template, so the userId is sent as a bound parameter rather than
  // concatenated into the statement. COUNT(*) returns one row even with no
  // matches; the guard covers the degenerate empty result regardless.
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM "QuizAttempt"
    WHERE "userId" = ${userId} AND score = "total"`
  return Number(rows[0]?.count ?? 0)
}
