/**
 * UNIT TEST FOR THE PDF ROUTE
 *
 * Pure wiring, so the point is what is absent as much as what is present: this
 * route mounts no auth and no validation middleware. The listing is public by
 * design, and the controller parses the query itself. Anything added here later
 * should be a deliberate decision rather than a silent one.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

const { listPdfs } = vi.hoisted(() => ({
  listPdfs: vi.fn((_req: express.Request, res: express.Response) => {
    res.status(200).json({ data: [], meta: { total: 0 } })
  }),
}))

vi.mock('@/api/controllers/pdf.controller', () => ({ listPdfs }))

const buildApp = async () => {
  const { default: pdfRoute } = await import('@/api/routes/pdf.route')
  return express().use('/pdfs', pdfRoute)
}

describe('GET /pdfs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should route to the list controller', async () => {
    const res = await request(await buildApp()).get('/pdfs')

    expect(res.status).toBe(200)
    expect(listPdfs).toHaveBeenCalledTimes(1)
  })

  it('should reach the controller without any credentials', async () => {
    // The PDF listing is public. If auth is ever added, this is the test that
    // should fail first rather than a client discovering it.
    const res = await request(await buildApp()).get('/pdfs')

    expect(res.status).toBe(200)
  })

  it('should pass the query string through untouched', async () => {
    await request(await buildApp()).get('/pdfs?page=2&limit=5')

    expect(listPdfs.mock.calls[0][0].query).toEqual({ page: '2', limit: '5' })
  })

  it('should not accept a POST', async () => {
    expect((await request(await buildApp()).post('/pdfs')).status).toBe(404)
  })
})
