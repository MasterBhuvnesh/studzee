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
                <!-- GDG RBU banner / logo image -->
                <img
                  src="https://images2.imgbox.com/4b/ee/zfP80V2d_o.jpg"
                  alt="GDG RBU"
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
