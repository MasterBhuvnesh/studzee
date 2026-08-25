/**
 * UNIT TESTS FOR QUEST VALIDATION
 *
 * Pins the admin create schema per quest type and the completion submission
 * union the route validates with. The service re-checks window and pass score
 * semantics at grading time; this file only guards what crosses the wire.
 */

import { describe, expect, it } from 'vitest'

import {
  CreateQuestSchema,
  QuestSubmissionSchema,
} from '@/models/quest.validation'

const CHOICE_PAYLOAD = {
  passScore: 1,
  questions: [
    { key: 'q1', que: 'One?', options: ['Right', 'Wrong'], ans: 'Right' },
  ],
}

const base = {
  title: 'Test Quest',
  description: 'A quest',
  gems: 10,
  startsAt: '2026-08-25T00:00:00.000Z',
  endsAt: '2026-09-24T00:00:00.000Z',
}

describe('CreateQuestSchema', () => {
  it('accepts an mcq quest and defaults active to true', () => {
    const parsed = CreateQuestSchema.parse({
      ...base,
      type: 'mcq',
      payload: CHOICE_PAYLOAD,
    })

    expect(parsed.type).toBe('mcq')
    expect(parsed.active).toBe(true)
    expect(parsed.startsAt).toBeInstanceOf(Date)
    expect(parsed.endsAt).toBeInstanceOf(Date)
  })

  it('accepts an scq quest on the same payload shape', () => {
    const parsed = CreateQuestSchema.parse({
      ...base,
      type: 'scq',
      payload: CHOICE_PAYLOAD,
    })

    expect(parsed.payload).toEqual(CHOICE_PAYLOAD)
  })

  it('accepts a fill_blank quest whose questions carry answers', () => {
    const parsed = CreateQuestSchema.parse({
      ...base,
      type: 'fill_blank',
      payload: {
        passScore: 2,
        questions: [
          { key: 'q1', que: 'Blank', answer: 'consistency' },
          { key: 'q2', que: 'Blank', answer: 'partition' },
        ],
      },
    })

    expect(parsed.type).toBe('fill_blank')
  })

  it('accepts a read_blog quest pointing at a document', () => {
    const parsed = CreateQuestSchema.parse({
      ...base,
      type: 'read_blog',
      contentId: '507f1f77bcf86cd799439011',
    })

    expect(parsed.contentId).toBe('507f1f77bcf86cd799439011')
  })

  it.each([
    ['a graded quest without a payload', { ...base, type: 'mcq' }, 'payload'],
    [
      'a read_blog quest without contentId',
      { ...base, type: 'read_blog' },
      'contentId',
    ],
    [
      'a passScore above the question count',
      {
        ...base,
        type: 'fill_blank',
        payload: {
          passScore: 3,
          questions: [{ key: 'q1', que: 'Blank', answer: 'x' }],
        },
      },
      'passScore',
    ],
    [
      'a window that ends before it starts',
      {
        ...base,
        type: 'read_blog',
        contentId: '507f1f77bcf86cd799439011',
        endsAt: '2026-08-24T00:00:00.000Z',
      },
      'endsAt',
    ],
    [
      'non positive gems',
      { ...base, type: 'mcq', gems: 0, payload: CHOICE_PAYLOAD },
      'gems',
    ],
    [
      'an unknown type',
      { ...base, type: 'trivia', payload: CHOICE_PAYLOAD },
      'type',
    ],
  ])('rejects %s', (_label, body, path) => {
    const result = CreateQuestSchema.safeParse(body)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(Object.keys(result.error.flatten().fieldErrors)).toContain(path)
    }
  })
})

describe('QuestSubmissionSchema', () => {
  it.each([
    ['an empty read_blog sheet', {}],
    ['numeric option indices', { responses: { q1: 0, q2: 2 } }],
    ['free text answers', { responses: { q1: 'partition' } }],
    ['a body with no responses field', { something: true }],
  ])('accepts %s', (_label, body) => {
    expect(QuestSubmissionSchema.safeParse(body).success).toBe(true)
  })

  it.each([
    ['boolean response values', { responses: { q1: true } }],
    ['a non object responses map', { responses: 'all wrong' }],
  ])('rejects %s', (_label, body) => {
    expect(QuestSubmissionSchema.safeParse(body).success).toBe(false)
  })
})
