import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { createQuest, listQuests, setQuestActive } from './quests'

describe('quests backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('createQuest posts to /admin/quests', async () => {
    mockBackendFetch.mockResolvedValue({ success: true, data: { id: 'q1' } })

    await createQuest({
      title: 'x',
      description: 'y',
      type: 'mcq',
      gems: 10,
      startsAt: '2026-09-02T00:00:00.000Z',
      endsAt: '2026-09-09T00:00:00.000Z',
      payload: { passScore: 1, questions: [] },
    })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/quests',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('listQuests reads /admin/quests and unwraps data', async () => {
    mockBackendFetch.mockResolvedValue({ success: true, data: [{ id: 'q1' }] })

    const result = await listQuests()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/quests')
    expect(result).toEqual([{ id: 'q1' }])
  })

  it('setQuestActive patches /admin/quests/:id with the flag', async () => {
    mockBackendFetch.mockResolvedValue({ success: true, data: { id: 'q1', active: false } })

    await setQuestActive('q1', false)

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/quests/q1',
      expect.objectContaining({ method: 'PATCH', body: { active: false } })
    )
  })
})
