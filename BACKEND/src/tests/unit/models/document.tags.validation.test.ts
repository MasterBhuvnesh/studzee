/**
 * UNIT TESTS FOR TAG VALIDATION
 *
 * What are we testing?
 * - DocumentSchema accepts 2 to 5 tags, each trimmed and 1 to 30 characters
 * - Trimming happens before the length checks, so padded input is normalised
 *   rather than rejected or smuggled through
 * - Tags stay optional so legacy payloads keep validating
 */
import { describe, it, expect } from 'vitest'
import { DocumentSchema } from '@/models/document.validation'

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

const parseWith = (tags: unknown) =>
  DocumentSchema.safeParse({ ...validDocument, tags })

describe('DocumentSchema tags field', () => {
  it('accepts two tags and trims surrounding whitespace from each', () => {
    const result = DocumentSchema.parse({
      ...validDocument,
      tags: ['  fundamentals ', ' nlp'],
    })
    expect(result.tags).toEqual(['fundamentals', 'nlp'])
  })

  it('accepts five tags, the documented maximum', () => {
    const result = parseWith(['a', 'b', 'c', 'd', 'e'])
    expect(result.success).toBe(true)
  })

  it('rejects a single tag, the documented minimum is two', () => {
    const result = parseWith(['solo'])
    expect(result.success).toBe(false)
  })

  it('rejects six tags', () => {
    const result = parseWith(['a', 'b', 'c', 'd', 'e', 'f'])
    expect(result.success).toBe(false)
  })

  it('rejects an empty array', () => {
    const result = parseWith([])
    expect(result.success).toBe(false)
  })

  it('rejects a tag longer than thirty characters after trimming', () => {
    // Exactly 30 characters once the padding is removed.
    const trimmed = `${'x'.repeat(30)}   `
    expect(parseWith(['ok-one', trimmed]).success).toBe(true)
    expect(parseWith(['ok-one', 'y'.repeat(31)]).success).toBe(false)
  })

  it('rejects a tag that is empty or whitespace only after trimming', () => {
    expect(parseWith(['one', '']).success).toBe(false)
    expect(parseWith(['one', '   ']).success).toBe(false)
  })

  it('rejects non string entries inside the array', () => {
    const result = parseWith(['one', 42])
    expect(result.success).toBe(false)
  })

  it('leaves tags absent when not provided so legacy payloads validate', () => {
    const result = DocumentSchema.safeParse(validDocument)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toBeUndefined()
    }
  })

  it('passes tags through a partial update unchanged', () => {
    const parsed = DocumentSchema.partial().parse({ tags: ['a', 'b'] })
    expect(parsed.tags).toEqual(['a', 'b'])
    expect(DocumentSchema.partial().parse({}).tags).toBeUndefined()
  })
})
