/**
 * Generates an HTML email template with customizable title, body, and footer
 * @param title - Email title (shown in browser/email client)
 * @param body - Main body content (HTML string)
 * @param footer - Footer text content
 * @returns Complete HTML email string
 */
export const generateEmailTemplate = (
  title: string,
  body: string,
  footer?: string,
  banner?: string,
): string => {
  // Default footer if not provided
  const footerText =
    footer || 'This is an automated email. Please do not reply.';
  return `<!DOCTYPE html>


<html lang="en">
  <head>
    <!-- Character encoding -->
    <meta charset="UTF-8" />

    <!-- Ensures proper scaling on mobile devices -->
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <!-- Email title (mostly used by some clients and browsers) -->
    <title>${title}</title>

    <!-- Preconnect to Google Fonts for performance -->
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin
    />

    <!-- Google Sans font for clean Material-style typography -->
    <link
      href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;700&display=swap"
      rel="stylesheet"
    />

    <!-- Embedded styles (safe for most modern email clients) -->
    <style>
      /* Reset body spacing and set base background */
      body {
        margin: 0;
        padding: 0;
        background-color: #ffffff;
      }

      /* Remove gaps between table cells */
      table {
        border-collapse: collapse;
      }

      /* Base typography for all table cells */
      td {
        font-family: "Google Sans", Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #3c4043;
      }

      /* Link styling */
      a {
        color: #1a73e8;
        text-decoration: none;
        font-weight: 600;
      }

      /* Card container styling */
      .card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        margin: 20px auto;
        overflow: hidden;
      }

      /* Section heading style */
      .section-title {
        background-color: #bbdefb;
        color: #232a76;
        padding: 10px;
        font-weight: 700;
        text-align: left;
      }

      /* Accent text color */
      .white-kar {
        color: #1a237e;
      }

      /* Responsive behavior for small screens */
      @media screen and (max-width: 600px) {
        .content {
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    </style>
  </head>

  <body>
    <!-- Outer wrapper table (full width background) -->
    <table
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
      style="background-color: #ffffff"
    >
      <tr>
        <td align="center">
          <!-- Main email content card -->
          <table
            class="content card"
            width="600"
            border="0"
            cellspacing="0"
            cellpadding="0"
          >
            <tr>
              <td style="padding: 30px">
                <img
                  src=${banner}
                  alt="Studzee"
                  style="max-width: 100%; height: auto"
                />

                ${body}
              </td>
            </tr>
          </table>

          <!-- Footer / disclaimer section -->
          <table
            class="content"
            width="600"
            border="0"
            cellspacing="0"
            cellpadding="0"
            style="width: 600px; max-width: 600px"
          >
            <tr>
              <td
                align="center"
                style="
                  padding: 20px 30px;
                  font-family: 'Google Sans', Arial, sans-serif;
                  font-size: 12px;
                  color: #555;
                "
              >
                <!-- Footer note -->
                <p style="margin: 0">
                  ${footerText}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

/**
 * Generates a welcome email template for new users
 * @param displayName - User's display name
 * @returns Complete HTML email string
 */
export const generateWelcomeEmailTemplate = (displayName: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Studzee</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;700&display=swap" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      table {
        border-collapse: collapse;
      }
      td {
        font-family: "Google Sans", Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #3c4043;
      }
      a {
        color: #1a73e8;
        text-decoration: none;
        font-weight: 600;
      }
      .card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        margin: 20px auto;
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
        color: #ffffff;
        padding: 40px 30px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }
      .content-body {
        padding: 30px;
      }
      .feature-box {
        background-color: #e8eaf6;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .feature-item {
        padding: 10px 0;
        border-bottom: 1px solid #c5cae9;
      }
      .feature-item:last-child {
        border-bottom: none;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
        color: #ffffff !important;
        padding: 14px 28px;
        border-radius: 25px;
        font-weight: 700;
        text-decoration: none;
        margin: 20px 0;
      }
      .footer {
        padding: 20px 30px;
        font-size: 12px;
        color: #757575;
        text-align: center;
      }
      @media screen and (max-width: 600px) {
        .content { width: 100% !important; max-width: 100% !important; }
        .header { padding: 30px 20px; }
        .content-body { padding: 20px; }
      }
    </style>
  </head>
  <body>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 20px 0;">
      <tr>
        <td align="center">
          <table class="content card" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
            <tr>
              <td class="header">
                <h1>Welcome to Studzee! 🎉</h1>
              </td>
            </tr>
            <tr>
              <td class="content-body">
                <p style="font-size: 18px; margin-top: 0;">
                  Hi <strong>${displayName}</strong>,
                </p>
                <p>
                  We're thrilled to have you join the Studzee community! Your journey to smarter learning starts here.
                </p>
                
                <div class="feature-box">
                  <p style="margin: 0 0 10px 0; font-weight: 700; color: #1a237e;">
                    Here's what you can do with Studzee:
                  </p>
                  <div class="feature-item">
                    📚 <strong>Access Study Materials</strong> - Browse through curated notes and resources
                  </div>
                  <div class="feature-item">
                    🔔 <strong>Stay Updated</strong> - Get notifications for important updates
                  </div>
                  <div class="feature-item">
                    📧 <strong>Email Alerts</strong> - Receive important announcements directly
                  </div>
                </div>

                <p>
                  If you have any questions or need help getting started, feel free to reach out to our support team.
                </p>

                <p style="text-align: center;">
                  <a href="https://studzee.com" class="cta-button">
                    Get Started
                  </a>
                </p>

                <p style="margin-bottom: 0;">
                  Happy learning!<br />
                  <strong>The Studzee Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td class="footer">
                <p style="margin: 0;">
                  This is an automated welcome email. Please do not reply directly to this email.
                </p>
                <p style="margin: 10px 0 0 0;">
                  © ${new Date().getFullYear()} Studzee. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
