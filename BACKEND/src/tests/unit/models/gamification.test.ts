/**
 * UNIT TESTS FOR THE GAMIFICATION REGISTRY
 *
 * Pure function tests over the code level catalog: no mocks, no database.
 * What is pinned here:
 * 1. The four perfectionist tiers ascend 1, 10, 25, 100 and share one
 *    predicate over fullScoreCount.
 * 2. Tier boundaries are inclusive at the threshold and exclusive below it.
 * 3. Badge imageUrl is still undefined, so clients fall back to their bundled
 *    placeholder there, while every level rung now carries real artwork.
 * 4. The level ladder is seven rungs, ascending, starting at 0.
 */
import { describe, expect, it } from 'vitest'
import {
  BadgeContext,
  BADGES,
  evaluateBadges,
  findBadge,
  LEVELS,
  resolveLevel,
  resolveNextLevel,
} from '@/models/gamification'

const baseContext: BadgeContext = {
  attemptCount: 0,
  longestStreak: 0,
  totalPoints: 0,
  fullScoreCount: 0,
}

const perfectionistKeys = [
  'perfectionist',
  'perfectionist-x2',
  'perfectionist-x3',
  'perfectionist-x4',
]

describe('perfectionist tiers in the catalog', () => {
  it('replaces the single badge with four ascending entries', () => {
    const tiers = BADGES.filter((badge) =>
      perfectionistKeys.includes(badge.key)
    )

    expect(tiers.map((tier) => tier.key)).toEqual(perfectionistKeys)
    expect(tiers.map((tier) => tier.threshold)).toEqual([1, 10, 25, 100])
    expect(tiers.map((tier) => tier.label)).toEqual([
      'Perfectionist',
      'Perfectionist II',
      'Perfectionist III',
      'Perfectionist IV',
    ])
    expect(tiers.map((tier) => tier.description)).toEqual([
      'Score full marks on a quiz attempt',
      'Score full marks on 10 quiz attempts',
      'Score full marks on 25 quiz attempts',
      'Score full marks on 100 quiz attempts',
    ])
  })

  it('keeps every other badge key intact', () => {
    expect(BADGES.map((badge) => badge.key)).toEqual([
      'first-steps',
      'streak-starter',
      'week-warrior',
      'century',
      'half-k',
      ...perfectionistKeys,
    ])
  })
})

describe('perfectionist tier predicates', () => {
  it.each([
    [0, []],
    [1, ['perfectionist']],
    [9, ['perfectionist']],
    [10, ['perfectionist', 'perfectionist-x2']],
    [24, ['perfectionist', 'perfectionist-x2']],
    [25, ['perfectionist', 'perfectionist-x2', 'perfectionist-x3']],
    [99, ['perfectionist', 'perfectionist-x2', 'perfectionist-x3']],
    [
      100,
      [
        'perfectionist',
        'perfectionist-x2',
        'perfectionist-x3',
        'perfectionist-x4',
      ],
    ],
    [101, perfectionistKeys],
  ])(
    'fullScoreCount %i earns exactly the tiers up to its threshold',
    (fullScoreCount, expected) => {
      const keys = evaluateBadges({ ...baseContext, fullScoreCount })

      expect(keys.filter((key) => perfectionistKeys.includes(key))).toEqual(
        expected
      )
    }
  )

  it('leaves the non tier badges to their own context fields', () => {
    const keys = evaluateBadges({
      ...baseContext,
      fullScoreCount: 100,
    })

    // A perfect history alone must not hand out attempts, streaks or points.
    expect(keys).toEqual(perfectionistKeys)
  })
})

describe('imageUrl contract', () => {
  it('carries artwork on every level entry', () => {
    for (const level of LEVELS) {
      expect(level.imageUrl).toMatch(new RegExp(`/levels/${level.key}\.png$`))
    }
  })

  // Badge art was added on 29-08-2026, reusing the levels folder rather than
  // a separate badges/ prefix, so every badge now carries artwork the same
  // way every level already did.
  it('carries artwork on every badge entry', () => {
    for (const badge of BADGES) {
      expect(badge.imageUrl).toMatch(new RegExp(`/levels/${badge.key}\.png$`))
    }
  })
})

describe('the level ladder', () => {
  it('is seven rungs, ascending, opening at zero', () => {
    expect(LEVELS.map((level) => level.key)).toEqual([
      'novice',
      'apprentice',
      'scholar',
      'expert',
      'master',
      'grandmaster',
      'legend',
    ])
    expect(LEVELS.map((level) => level.minPoints)).toEqual([
      0, 100, 250, 500, 1000, 2000, 5000,
    ])
  })

  it('marks exactly one rung current for any point total', () => {
    // The client used to compare each rung against the next boundary, which
    // was true for every rung at or below the total: novice and apprentice
    // both showed as current at 150 points.
    for (const points of [0, 99, 100, 150, 499, 500, 1500, 9999]) {
      const current = resolveLevel(points)
      const qualifying = LEVELS.filter((level) => points >= level.minPoints)

      expect(current).toBe(qualifying[qualifying.length - 1])
    }
  })

  it('runs out of next level at the top of the ladder', () => {
    expect(resolveNextLevel(0)?.key).toBe('apprentice')
    expect(resolveNextLevel(5000)).toBeNull()
  })
})

describe('findBadge', () => {
  it('resolves every tier back to its display metadata', () => {
    expect(findBadge('perfectionist-x2')).toMatchObject({
      label: 'Perfectionist II',
      threshold: 10,
    })
    expect(findBadge('perfectionist-x4')).toMatchObject({
      label: 'Perfectionist IV',
      threshold: 100,
    })
    expect(findBadge('no-such-badge')).toBeUndefined()
  })
})
