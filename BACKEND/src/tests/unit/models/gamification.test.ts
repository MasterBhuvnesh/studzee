/**
 * UNIT TESTS FOR THE GAMIFICATION REGISTRY
 *
 * Pure function tests over the code level catalog: no mocks, no database.
 * What is pinned here:
 * 1. The four perfectionist tiers ascend 1, 10, 25, 100 and share one
 *    predicate over fullScoreCount.
 * 2. Tier boundaries are inclusive at the threshold and exclusive below it.
 * 3. The optional imageUrl field is present on the interfaces but undefined on
 *    every entry, so clients keep falling back to their bundled placeholder.
 */
import { describe, expect, it } from 'vitest'
import {
  BadgeContext,
  BADGES,
  evaluateBadges,
  findBadge,
  LEVELS,
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

describe('imageUrl placeholder contract', () => {
  it('is undefined on every badge entry for now', () => {
    for (const badge of BADGES) {
      expect(badge.imageUrl).toBeUndefined()
    }
  })

  it('is undefined on every level entry for now', () => {
    for (const level of LEVELS) {
      expect(level.imageUrl).toBeUndefined()
    }
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
