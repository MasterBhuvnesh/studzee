/**
 * UNIT TESTS FOR TOPIC VALIDATION
 *
 * What are we testing?
 * - TopicSchema accepts exactly the fixed registry keys and nothing else
 * - DocumentSchema applies the default topic and validates unlockPoints
 * - Partial parsing (the admin update path) does not force the default in
 */
import { describe, it, expect } from 'vitest'
import { DocumentSchema } from '@/models/document.validation'
import {
  TopicSchema,
  TOPIC_KEYS,
  TOPIC_REGISTRY,
  DEFAULT_TOPIC_KEY,
} from '@/models/topics'

/** Minimal document that satisfies every required field of DocumentSchema. */
const validDocument = {
  title: 'Valid Test Document',
  content: [
    {
      title: 'INTRODUCTION',
      content: [{ type: 'text', value: 'Some text.' }],
    },
  ],
  quiz: {
    '1': { que: 'What?', ans: 'This', options: ['This', 'That'] },
  },
}

describe('TopicSchema', () => {
  it('accepts every key in the registry', () => {
    for (const key of TOPIC_KEYS) {
      const result = TopicSchema.safeParse(key)
      expect(result.success).toBe(true)
    }
  })

  it('matches the registry keys to labels one for one', () => {
    expect(TOPIC_REGISTRY).toHaveLength(TOPIC_KEYS.length)
    expect(TOPIC_REGISTRY.map((entry) => entry.key)).toEqual([...TOPIC_KEYS])
    for (const entry of TOPIC_REGISTRY) {
      expect(entry.label.length).toBeGreaterThan(0)
    }
  })

  it('rejects an unknown topic with a message listing allowed keys', () => {
    const result = TopicSchema.safeParse('blockchain')
    expect(result.success).toBe(false)
    if (!result.success) {
      const message = result.error.issues[0].message
      expect(message).toContain('Allowed topics')
      // The message doubles as API documentation, so it must name them all.
      for (const key of TOPIC_KEYS) {
        expect(message).toContain(key)
      }
    }
  })

  it('rejects an empty string rather than silently defaulting', () => {
    expect(TopicSchema.safeParse('').success).toBe(false)
  })
})

describe('DocumentSchema topic field', () => {
  it('defaults a missing topic to machine-learning on output', () => {
    const result = DocumentSchema.parse(validDocument)
    expect(result.topic).toBe('machine-learning')
    expect(result.topic).toBe(DEFAULT_TOPIC_KEY)
  })

  it('keeps an explicit topic as given', () => {
    const result = DocumentSchema.parse({
      ...validDocument,
      topic: 'system-design',
    })
    expect(result.topic).toBe('system-design')
  })

  it('rejects an unknown topic on a document payload', () => {
    const result = DocumentSchema.safeParse({
      ...validDocument,
      topic: 'blockchain',
    })
    expect(result.success).toBe(false)
  })

  it('does not require topic on input so legacy payloads still validate', () => {
    const input = { ...validDocument }
    delete (input as Record<string, unknown>).topic
    expect(DocumentSchema.safeParse(input).success).toBe(true)
  })
})

describe('DocumentSchema unlockPoints field', () => {
  it('leaves unlockPoints absent when not provided', () => {
    const result = DocumentSchema.parse(validDocument)
    expect(result.unlockPoints).toBeUndefined()
  })

  it('accepts zero and positive integers', () => {
    expect(
      DocumentSchema.parse({ ...validDocument, unlockPoints: 0 }).unlockPoints
    ).toBe(0)
    expect(
      DocumentSchema.parse({ ...validDocument, unlockPoints: 50 }).unlockPoints
    ).toBe(50)
  })

  it('rejects negative values', () => {
    expect(
      DocumentSchema.safeParse({ ...validDocument, unlockPoints: -1 }).success
    ).toBe(false)
  })

  it('rejects non-integers and non-numbers', () => {
    expect(
      DocumentSchema.safeParse({ ...validDocument, unlockPoints: 2.5 }).success
    ).toBe(false)
    expect(
      DocumentSchema.safeParse({ ...validDocument, unlockPoints: '50' }).success
    ).toBe(false)
  })
})

describe('DocumentSchema partial parsing (admin update path)', () => {
  it('does not force the topic default into a partial update', () => {
    // AdminService updates use DocumentSchema.partial(). If defaults fired
    // there, every partial update would silently rewrite the topic.
    const parsed = DocumentSchema.partial().parse({})
    expect(parsed.topic).toBeUndefined()
    expect(parsed.unlockPoints).toBeUndefined()
  })

  it('still rejects an invalid topic inside a partial update', () => {
    const parsed = DocumentSchema.partial().safeParse({ topic: 'nope' })
    expect(parsed.success).toBe(false)
  })
})
