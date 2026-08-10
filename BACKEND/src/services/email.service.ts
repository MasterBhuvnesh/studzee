import nodemailer from 'nodemailer'
import { config } from '@/config'
import {
  generateEmailTemplate,
  generateWelcomeEmailTemplate,
} from '@/utils/mail'
import logger from '@/utils/logger'

/** At most this many attachments per message. */
const MAX_ATTACHMENTS = 10

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465, // implicit TLS on 465, STARTTLS elsewhere
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD,
  },
})

const allowedAttachmentHosts = config.EMAIL_ATTACHMENT_HOSTS.split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean)

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Reject any attachment URL that is not HTTPS on an allowlisted host.
 *
 * Nodemailer fetches an attachment given as a path, so without this check an
 * admin request could make the server retrieve an arbitrary URL and mail the
 * result out. The allowlist is the asset bucket by default.
 */
const assertAttachmentsAllowed = (urls: string[]): void => {
  if (urls.length > MAX_ATTACHMENTS) {
    throw new Error(`At most ${MAX_ATTACHMENTS} attachments are allowed`)
  }

  for (const url of urls) {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new Error(`Attachment URL is not a valid URL: ${url}`)
    }

    if (parsed.protocol !== 'https:') {
      throw new Error(`Attachment URL must use https: ${url}`)
    }

    if (!allowedAttachmentHosts.includes(parsed.hostname.toLowerCase())) {
      throw new Error(`Attachment host is not allowed: ${parsed.hostname}`)
    }
  }
}

/**
 * Derive a readable attachment filename from its URL, falling back to a
 * positional name when the path carries nothing useful.
 */
const filenameFromUrl = (url: string, index: number): string => {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
    if (last.toLowerCase().endsWith('.pdf')) return last
  } catch {
    // fall through to the positional name
  }
  return `attachment-${index + 1}.pdf`
}

/**
 * Send a transactional email to one or more recipients, optionally with PDF
 * attachments pulled from the asset bucket.
 *
 * Recipients are passed as bcc so one broadcast does not disclose the whole
 * recipient list to everybody on it.
 */
export const sendEmailWithAttachments = async (
  recipients: string[],
  subject: string,
  title: string,
  body: string,
  banner?: string,
  footer?: string,
  pdfUrls?: string[]
): Promise<EmailResult> => {
  try {
    const urls = pdfUrls ?? []
    assertAttachmentsAllowed(urls)

    const attachments = urls.map((url, index) => ({
      filename: filenameFromUrl(url, index),
      path: url,
    }))

    const info = await transporter.sendMail({
      from: config.EMAIL_FROM,
      to: config.EMAIL_FROM,
      bcc: recipients,
      subject,
      html: generateEmailTemplate(title, body, footer, banner),
      attachments,
    })

    logger.info(
      { messageId: info.messageId, recipients: recipients.length },
      'Email sent'
    )

    return { success: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(error, 'Email sending failed')
    return { success: false, error: message }
  }
}

/**
 * Send the welcome email triggered by the Clerk user.created webhook.
 */
export const sendWelcomeEmail = async (
  email: string,
  displayName: string
): Promise<EmailResult> => {
  try {
    const info = await transporter.sendMail({
      from: config.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Studzee',
      html: generateWelcomeEmailTemplate(displayName),
    })

    logger.info({ messageId: info.messageId, email }, 'Welcome email sent')
    return { success: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(error, `Welcome email failed for ${email}`)
    return { success: false, error: message }
  }
}
