/**
 * UNIT TESTS FOR THE EMAIL SERVICE AND TEMPLATES
 *
 * Nodemailer fetches an attachment given as a path, so an unrestricted
 * attachment URL let an admin request make the server retrieve any URL and mail
 * the result out. These tests pin the allowlist that closes that, and the HTML
 * escaping that stops a Clerk supplied display name reaching the template raw.
 */

import { describe, expect, it } from 'vitest'
import { sendEmailWithAttachments } from '@/services/email.service'
import {
  generateEmailTemplate,
  generateWelcomeEmailTemplate,
} from '@/utils/mail'

const ALLOWED_HOST = 'lammfakgegmrkxdkwukd.supabase.co'

describe('email attachment allowlist', () => {
  it('rejects an attachment hosted off the allowlist', async () => {
    const result = await sendEmailWithAttachments(
      ['learner@example.com'],
      'subject',
      'title',
      'body',
      undefined,
      undefined,
      ['https://evil.example.com/payload.pdf']
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('not allowed')
  })

  it('rejects an attachment served over plain http', async () => {
    const result = await sendEmailWithAttachments(
      ['learner@example.com'],
      'subject',
      'title',
      'body',
      undefined,
      undefined,
      [`http://${ALLOWED_HOST}/notes.pdf`]
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('https')
  })

  it('rejects a malformed attachment URL', async () => {
    const result = await sendEmailWithAttachments(
      ['learner@example.com'],
      'subject',
      'title',
      'body',
      undefined,
      undefined,
      ['not-a-url']
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('valid URL')
  })

  it('rejects more attachments than the per message cap', async () => {
    const urls = Array.from(
      { length: 11 },
      (_, i) => `https://${ALLOWED_HOST}/notes-${i}.pdf`
    )

    const result = await sendEmailWithAttachments(
      ['learner@example.com'],
      'subject',
      'title',
      'body',
      undefined,
      undefined,
      urls
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('attachments')
  })
})

describe('email templates', () => {
  it('escapes a display name so markup cannot be injected', () => {
    const html = generateWelcomeEmailTemplate('<script>alert(1)</script>')

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes the document title', () => {
    const html = generateEmailTemplate('<b>title</b>', '<p>body</p>')

    expect(html).toContain('&lt;b&gt;title&lt;/b&gt;')
    // The body is composed by the caller and is intentionally raw HTML.
    expect(html).toContain('<p>body</p>')
  })
})
