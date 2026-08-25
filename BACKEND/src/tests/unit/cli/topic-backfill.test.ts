/**
 * UNIT TESTS FOR THE TOPIC AND TAG BACKFILL PATCH BUILDER
 *
 * The seeder must repair production documents that predate the topic field
 * and tags without ever overwriting a value that is already stored. These are
 * pure tests over buildBackfillPatch: no Mongo, no Redis.
 */
import { describe, expect, it } from 'vitest'
import { buildBackfillPatch } from '@/cli/seeds/topic-backfill'

const FIXTURE = {
  topic: 'machine-learning',
  tags: ['fundamentals', 'nlp'],
}

describe('buildBackfillPatch', () => {
  it('fills both fields when the stored document predates them', () => {
    const patch = buildBackfillPatch({}, FIXTURE)

    expect(patch).toEqual({
      topic: 'machine-learning',
      tags: ['fundamentals', 'nlp'],
    })
  })

  it('treats an explicit empty tags array as missing', () => {
    const patch = buildBackfillPatch({ topic: 'devops', tags: [] }, FIXTURE)

    expect(patch).toEqual({ tags: ['fundamentals', 'nlp'] })
  })

  it('treats a null topic as missing', () => {
    const patch = buildBackfillPatch({ topic: null, tags: ['a', 'b'] }, FIXTURE)

    expect(patch).toEqual({ topic: 'machine-learning' })
  })

  it('never overwrites an existing topic, even when it differs from the fixture', () => {
    const patch = buildBackfillPatch(
      { topic: 'system-design', tags: [] },
      FIXTURE
    )

    // Only tags may be patched; the stored topic stays exactly as it is.
    expect(patch).toEqual({ tags: ['fundamentals', 'nlp'] })
  })

  it('never overwrites non empty tags', () => {
    const patch = buildBackfillPatch(
      { tags: ['existing', 'values', 'stay'] },
      FIXTURE
    )

    expect(patch).toEqual({ topic: 'machine-learning' })
  })

  it('returns an empty patch for a document that is already complete', () => {
    const patch = buildBackfillPatch(
      { topic: 'machine-learning', tags: ['older', 'tags'] },
      FIXTURE
    )

    expect(patch).toEqual({})
  })

  it('cannot fill a field the fixture itself lacks', () => {
    // Empty fixture fills nothing.
    expect(buildBackfillPatch({}, {})).toEqual({})
    // The fixture has no tags to give, but its topic is still fillable.
    expect(buildBackfillPatch({ tags: [] }, { topic: 'devops' })).toEqual({
      topic: 'devops',
    })
    // The fixture has no topic to give, but its tags are still fillable.
    expect(buildBackfillPatch({ topic: null }, { tags: ['a', 'b'] })).toEqual({
      tags: ['a', 'b'],
    })
  })
})
