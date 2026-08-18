/**
 * UNIT TESTS FOR OBJECT STORAGE URL HANDLING
 *
 * The public URL and the object reference have to round trip, because a stored
 * URL is what a later delete is derived from. Getting this wrong deletes the
 * wrong object or silently fails.
 *
 * The previous implementation hardcoded the AWS virtual-hosted form
 * (`bucket.s3.region.amazonaws.com/key`) and recovered the key by taking the
 * whole URL path. Against Supabase that produced unreachable URLs, and a key
 * of `storage/v1/object/public/<bucket>/...` rather than the real key.
 */

import { describe, expect, it } from 'vitest'
import { getObjectRef, getPublicUrl } from '@/config/s3'

// globalSetup pins S3_PUBLIC_URL to the local MinIO host, with no bucket.
const BASE = 'http://localhost:9000'

describe('getPublicUrl', () => {
  it('joins the base, the bucket and the key', () => {
    expect(getPublicUrl('images', 'abc.png')).toBe(`${BASE}/images/abc.png`)
  })

  it('does not double up separators when the key is rooted', () => {
    expect(getPublicUrl('pdfs', '/notes.pdf')).toBe(`${BASE}/pdfs/notes.pdf`)
  })
})

describe('getObjectRef', () => {
  it('round trips a URL this service generated', () => {
    const url = getPublicUrl('images', '507f1f77bcf86cd799439011.png')

    expect(getObjectRef(url)).toEqual({
      bucket: 'images',
      key: '507f1f77bcf86cd799439011.png',
    })
  })

  it('recovers bucket and key from a Supabase public URL', () => {
    const url =
      'https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/pdfs/notes.pdf'

    // Not on the configured base, so the trailing pair fallback applies. It
    // must not return the storage/v1/object/public path segments.
    expect(getObjectRef(url)).toEqual({ bucket: 'pdfs', key: 'notes.pdf' })
  })

  it('recovers bucket and key from a legacy AWS URL', () => {
    const url =
      'https://studzee-assets.s3.ap-south-1.amazonaws.com/images/abc.png'

    expect(getObjectRef(url)).toEqual({ bucket: 'images', key: 'abc.png' })
  })

  it('rejects a URL with nothing bucket and key shaped in it', () => {
    expect(() => getObjectRef('https://example.com/')).toThrow(
      /Cannot derive an object reference/
    )
  })
})
