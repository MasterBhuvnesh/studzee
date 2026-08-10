import { config } from '@/config'

/**
 * Escape a value for interpolation into HTML.
 *
 * Admin supplied subjects, titles and display names reach these templates, and
 * a display name comes straight from Clerk, so nothing is trusted.
 */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Shared head block. Inline styles only, for email client compatibility. */
const head = (title: string): string => `
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f4f4f4; }
      table { border-collapse: collapse; }
      td {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #3c4043;
      }
      a { color: #1a73e8; text-decoration: none; font-weight: 600; }
      img { max-width: 100%; height: auto; }
      @media screen and (max-width: 600px) {
        .content { width: 100% !important; max-width: 100% !important; }
      }
    </style>
  </head>`

/** Shared footer block. */
const footerBlock = (text: string): string => `
  <table class="content" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px">
    <tr>
      <td align="center" style="padding: 20px; font-size: 12px; color: #888888">
        <p style="margin: 0">${escapeHtml(text)}</p>
        <p style="margin: 10px 0 0 0">&copy; ${new Date().getFullYear()} Studzee</p>
      </td>
    </tr>
  </table>`

/**
 * Generic transactional email shell.
 *
 * @param title - Document title, shown by some clients
 * @param body - Body content as an HTML fragment, composed by the caller
 * @param footer - Footer note, defaults to the automated message notice
 * @param banner - Banner image URL, defaults to the configured brand banner
 */
export const generateEmailTemplate = (
  title: string,
  body: string,
  footer?: string,
  banner?: string
): string => {
  const bannerUrl = banner || config.EMAIL_BANNER_URL
  const footerText = footer || 'This is an automated email. Please do not reply.'

  return `<!DOCTYPE html>
<html lang="en">
${head(title)}
  <body>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4">
      <tr>
        <td align="center">
          <table class="content" width="600" cellpadding="0" cellspacing="0"
            style="max-width: 600px; background: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden">
            <tr>
              <td>
                <img src="${escapeHtml(bannerUrl)}" alt="Studzee" />
              </td>
            </tr>
            <tr>
              <td style="padding: 30px">
                ${body}
              </td>
            </tr>
          </table>
          ${footerBlock(footerText)}
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Welcome email sent when Clerk reports a new user.
 *
 * The copy that changes most often lives in WELCOME_COPY below rather than
 * inline in the markup, so editing it does not mean rewriting the template.
 */
const WELCOME_COPY = {
  intro:
    'Studzee is an AI powered document to learning platform that converts raw educational content into structured lessons, summaries, and quizzes across web, mobile, and desktop apps.',
  topicsLabel: 'Right now we are focusing on three topics:',
  topics: ['System Design', 'Machine Learning', 'Deep Learning'],
  availability:
    'All notes are available directly inside the Studzee app. If you are using the website, you can also download them.',
  newsletter:
    'You can subscribe to our newsletter to receive updates and newly published notes as soon as they are released.',
}

export const generateWelcomeEmailTemplate = (displayName: string): string => {
  const topics = WELCOME_COPY.topics
    .map((topic) => escapeHtml(topic))
    .join('<br />')

  const body = `
    <p style="margin: 0 0 20px 0"><strong>Hi ${escapeHtml(displayName)},</strong></p>
    <p style="margin: 0 0 20px 0">Welcome to <strong>Studzee</strong>.</p>
    <p style="margin: 0 0 20px 0">${WELCOME_COPY.intro}</p>
    <p style="margin: 0 0 20px 0">${WELCOME_COPY.topicsLabel}</p>
    <p style="margin: 0 0 20px 20px">${topics}</p>
    <p style="margin: 0 0 20px 0">${WELCOME_COPY.availability}</p>
    <p style="margin: 0 0 20px 0">${WELCOME_COPY.newsletter}</p>
    <p style="margin: 0 0 20px 0">
      Explore Studzee:<br />
      <a href="${config.SITE_URL}">${config.SITE_URL}</a>
    </p>
    <p style="margin: 0">Happy learning,<br /><strong>Team Studzee</strong></p>`

  return generateEmailTemplate(
    'Welcome to Studzee',
    body,
    'This is an automated email from Studzee.'
  )
}
