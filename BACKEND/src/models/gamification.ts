/**
 * GAMIFICATION REGISTRY
 *
 * Levels and badges are code level constants rather than database rows, by
 * owner decision: thresholds ship through code review like any other schema
 * change, and nothing in the database defines what a badge means. The tracker
 * tables in Postgres record only that a threshold was reached.
 */

export interface Level {
  key: string
  label: string
  minPoints: number
  /**
   * Artwork URL. Optional so the type survives a rung added before its art
   * exists; the client falls back to a bundled placeholder when it is absent.
   */
  imageUrl?: string
}

/**
 * Where the level artwork lives. The objects sit in the public images bucket
 * under levels/, uploaded once rather than bundled into the clients, so new
 * art ships without an app release. The host is written out rather than
 * derived from S3_PUBLIC_URL on purpose: the local MinIO bucket holds no
 * artwork, and a derived URL would break the art in development while the
 * deployed one worked.
 */
const LEVEL_ART =
  'https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/images/levels'

/**
 * Ascending by minPoints. The first entry must start at 0 so every user has a
 * level; the read side relies on that when picking the highest qualifying one.
 *
 * The first four thresholds are unchanged from the original ladder, so no
 * existing user drops a rung. Expert, Grandmaster and Legend extend the top
 * end, which moves Master from 500 to 1000.
 */
export const LEVELS: Level[] = [
  {
    key: 'novice',
    label: 'Novice',
    minPoints: 0,
    imageUrl: `${LEVEL_ART}/novice.png`,
  },
  {
    key: 'apprentice',
    label: 'Apprentice',
    minPoints: 100,
    imageUrl: `${LEVEL_ART}/apprentice.png`,
  },
  {
    key: 'scholar',
    label: 'Scholar',
    minPoints: 250,
    imageUrl: `${LEVEL_ART}/scholar.png`,
  },
  {
    key: 'expert',
    label: 'Expert',
    minPoints: 500,
    imageUrl: `${LEVEL_ART}/expert.png`,
  },
  {
    key: 'master',
    label: 'Master',
    minPoints: 1000,
    imageUrl: `${LEVEL_ART}/master.png`,
  },
  {
    key: 'grandmaster',
    label: 'Grandmaster',
    minPoints: 2000,
    imageUrl: `${LEVEL_ART}/grandmaster.png`,
  },
  {
    key: 'legend',
    label: 'Legend',
    minPoints: 5000,
    imageUrl: `${LEVEL_ART}/legend.png`,
  },
]

/**
 * Highest level whose threshold the points have reached, falling back to the
 * first entry for any non negative total.
 */
export const resolveLevel = (points: number): Level | null => {
  let current: Level | null = null
  for (const level of LEVELS) {
    if (points >= level.minPoints) current = level
  }
  return current
}

/**
 * The next level above the current one, or null at the top of the ladder.
 */
export const resolveNextLevel = (points: number): Level | null => {
  return LEVELS.find((level) => level.minPoints > points) ?? null
}

export interface Badge {
  key: string
  label: string
  description: string
  /**
   * The number the predicate compares against, in the unit the description
   * names: attempts, streak days, points or perfect attempts.
   */
  threshold: number
  /**
   * Artwork URL, added 29-08-2026, reusing the levels/ folder in the images
   * bucket rather than a separate badges/ prefix. Still optional so the type
   * survives a badge added before its art exists; the client falls back to a
   * bundled placeholder when it is absent.
   */
  imageUrl?: string
}

/**
 * The perfectionist badge is a tiered ladder sharing one predicate over
 * fullScoreCount. Tiers ascend by threshold, so a user crossing a higher rung
 * has already earned every lower one.
 */
export const BADGES: Badge[] = [
  {
    key: 'first-steps',
    label: 'First Steps',
    description: 'Complete your first quiz attempt',
    threshold: 1,
    imageUrl: `${LEVEL_ART}/first-steps.png`,
  },
  {
    key: 'streak-starter',
    label: 'Streak Starter',
    description: 'Practise 3 days in a row',
    threshold: 3,
    imageUrl: `${LEVEL_ART}/streak-starter.png`,
  },
  {
    key: 'week-warrior',
    label: 'Week Warrior',
    description: 'Practise 7 days in a row',
    threshold: 7,
    imageUrl: `${LEVEL_ART}/week-warrior.png`,
  },
  {
    key: 'century',
    label: 'Century',
    description: 'Earn 100 total points',
    threshold: 100,
    imageUrl: `${LEVEL_ART}/century.png`,
  },
  {
    key: 'half-k',
    label: 'Half K',
    description: 'Earn 500 total points',
    threshold: 500,
    imageUrl: `${LEVEL_ART}/half-k.png`,
  },
  {
    key: 'perfectionist',
    label: 'Perfectionist',
    description: 'Score full marks on a quiz attempt',
    threshold: 1,
    imageUrl: `${LEVEL_ART}/perfectionist.png`,
  },
  {
    key: 'perfectionist-x2',
    label: 'Perfectionist II',
    description: 'Score full marks on 10 quiz attempts',
    threshold: 10,
    imageUrl: `${LEVEL_ART}/perfectionist-x2.png`,
  },
  {
    key: 'perfectionist-x3',
    label: 'Perfectionist III',
    description: 'Score full marks on 25 quiz attempts',
    threshold: 25,
    imageUrl: `${LEVEL_ART}/perfectionist-x3.png`,
  },
  {
    key: 'perfectionist-x4',
    label: 'Perfectionist IV',
    description: 'Score full marks on 100 quiz attempts',
    threshold: 100,
    imageUrl: `${LEVEL_ART}/perfectionist-x4.png`,
  },
]

export interface BadgeContext {
  attemptCount: number
  longestStreak: number
  totalPoints: number
  /**
   * Stored full-score attempts PLUS the current attempt when it graded
   * perfect. The stored rows are written after evaluation, so counting them
   * alone would miss the attempt that crosses the threshold; the caller adds
   * the in-flight submission to keep the predicates seeing post-submission
   * state. This replaces the old hasPerfectAttempt boolean, which was
   * equivalent only for the single-badge tier.
   */
  fullScoreCount: number
}

/**
 * One predicate per badge key. Record forces an entry for every badge above,
 * so adding a badge without a predicate fails to compile rather than silently
 * never awarding.
 */
const BADGE_PREDICATES: Record<
  string,
  (ctx: BadgeContext, threshold: number) => boolean
> = {
  'first-steps': (ctx, threshold) => ctx.attemptCount >= threshold,
  'streak-starter': (ctx, threshold) => ctx.longestStreak >= threshold,
  'week-warrior': (ctx, threshold) => ctx.longestStreak >= threshold,
  century: (ctx, threshold) => ctx.totalPoints >= threshold,
  'half-k': (ctx, threshold) => ctx.totalPoints >= threshold,
  perfectionist: (ctx, threshold) => ctx.fullScoreCount >= threshold,
  'perfectionist-x2': (ctx, threshold) => ctx.fullScoreCount >= threshold,
  'perfectionist-x3': (ctx, threshold) => ctx.fullScoreCount >= threshold,
  'perfectionist-x4': (ctx, threshold) => ctx.fullScoreCount >= threshold,
}

/**
 * Every badge key the context currently deserves. The caller filters out keys
 * already recorded in AwardedBadge before inserting anything.
 */
export const evaluateBadges = (ctx: BadgeContext): string[] => {
  return BADGES.filter((badge) =>
    BADGE_PREDICATES[badge.key](ctx, badge.threshold)
  ).map((badge) => badge.key)
}

/**
 * Catalog entry lookup for turning awarded keys back into display metadata.
 */
export const findBadge = (key: string): Badge | undefined =>
  BADGES.find((badge) => badge.key === key)

/**
 * Level display shape without the ladder position, matching what the API
 * returns for level and nextLevel.
 */
export type LevelSummary = Pick<
  Level,
  'key' | 'label' | 'minPoints' | 'imageUrl'
>
