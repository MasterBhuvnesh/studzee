import { describe, expect, it } from 'vitest'
import { documentFormSchema, notificationFormSchema, questFormSchema } from './schemas'

describe('documentFormSchema', () => {
  it('rejects a title shorter than 3 characters', () => {
    const result = documentFormSchema.safeParse({
      title: 'ab',
      content: {},
      quiz: {},
      topic: 'aws',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a quiz item with fewer than two options', () => {
    const result = documentFormSchema.safeParse({
      title: 'A valid title',
      content: {},
      quiz: { q1: { que: 'Q', ans: 'A', options: ['A'] } },
      topic: 'aws',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a minimal valid document', () => {
    const result = documentFormSchema.safeParse({
      title: 'A valid title',
      content: {},
      quiz: {},
      topic: 'aws',
    })
    expect(result.success).toBe(true)
  })
})

describe('questFormSchema', () => {
  it('rejects endsAt before startsAt', () => {
    const result = questFormSchema.safeParse({
      title: 'Quest',
      description: 'Do the thing',
      type: 'mcq',
      gems: 10,
      startsAt: '2026-09-10T00:00:00.000Z',
      endsAt: '2026-09-01T00:00:00.000Z',
      payload: { passScore: 1, questions: [{ key: 'q1', que: 'Q', options: ['A', 'B'], ans: 'A' }] },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a passScore above the question count', () => {
    const result = questFormSchema.safeParse({
      title: 'Quest',
      description: 'Do the thing',
      type: 'mcq',
      gems: 10,
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-09-10T00:00:00.000Z',
      payload: { passScore: 2, questions: [{ key: 'q1', que: 'Q', options: ['A', 'B'], ans: 'A' }] },
    })
    expect(result.success).toBe(false)
  })

  it('requires contentId for read_blog', () => {
    const result = questFormSchema.safeParse({
      title: 'Quest',
      description: 'Do the thing',
      type: 'read_blog',
      gems: 10,
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-09-10T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('notificationFormSchema', () => {
  it('accepts a send without an image', () => {
    const result = notificationFormSchema.safeParse({
      title: 'New notes published',
      message: 'System Design chapter 4 is now available.',
      sendToAll: true,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid image URL', () => {
    const result = notificationFormSchema.safeParse({
      title: 'New notes published',
      message: 'System Design chapter 4 is now available.',
      imageUrl: 'https://example.com/banner.png',
      sendToAll: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a non URL image value', () => {
    const result = notificationFormSchema.safeParse({
      title: 'New notes published',
      message: 'System Design chapter 4 is now available.',
      imageUrl: 'not a url',
      sendToAll: true,
    })
    expect(result.success).toBe(false)
  })
})
