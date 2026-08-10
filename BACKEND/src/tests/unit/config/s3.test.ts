/**
 * UNIT TESTS FOR OBJECT STORAGE URL HANDLING
 *
 * The public URL and the object key have to round trip, because a stored URL
 * is what a later delete is derived from. Getting this wrong deletes the wrong
 * object or silently fails.
 *
 * The previous implementation hardcoded the AWS virtual-hosted form
 * (`bucket.s3.region.amazonaws.com/key`) and recovered the key by taking the
 * whole URL path. Against Supabase that produced unreachable URLs, and a key
 * of `storage/v1/object/public/<bucket>/...` rather than the real key.
 */

import { describe, expect, it } from 'vitest'
import { getKeyFromUrl, getPublicUrl } from '@/config/s3'

// globalSetup pins S3_PUBLIC_URL to the local MinIO form.
const BASE = 'http://localhost:9000/studzee'

describe('getPublicUrl', () => {
  it('joins the configured base and the key', () => {
    expect(getPublicUrl('images/abc.png')).toBe(`${BASE}/images/abc.png`)
  })

  it('does not double up separators when the key is rooted', () => {
    expect(getPublicUrl('/pdfs/notes.pdf')).toBe(`${BASE}/pdfs/notes.pdf`)
  })
})

describe('getKeyFromUrl', () => {
  it('round trips a URL this service generated', () => {
    const key = 'images/507f1f77bcf86cd799439011.png'
    expect(getKeyFromUrl(getPublicUrl(key))).toBe(key)
  })

  it('recovers the key from a Supabase public URL', () => {
    const url =
      'https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/studzee/pdfs/notes.pdf'

    // Not on the configured base, so the trailing folder/filename fallback
    // applies. It must not return the storage/v1/object/public path segments.
    expect(getKeyFromUrl(url)).toBe('pdfs/notes.pdf')
  })

  it('recovers the key from a legacy AWS URL', () => {
    const url =
      'https://studzee-assets.s3.ap-south-1.amazonaws.com/images/abc.png'

    expect(getKeyFromUrl(url)).toBe('images/abc.png')
  })

  it('rejects a URL with nothing key shaped in it', () => {
    expect(() => getKeyFromUrl('https://example.com/')).toThrow(
      /Cannot derive an object key/
    )
  })
})
