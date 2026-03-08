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
body{
margin:0;
padding:0;
background-color:#f4f4f4;
}

table{
border-collapse:collapse;
}

td{
font-family:"Google Sans",Arial,sans-serif;
font-size:16px;
line-height:1.6;
color:#3c4043;
}

img{
max-width:100%;
height:auto;
}

@media screen and (max-width:600px){
.content{
width:100%!important;
max-width:100%!important;
}
}
</style>
</head>

<body style="margin:0;padding:0;background-color:#f4f4f4">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4">
<tr>
<td align="center">

<table class="content" width="600" cellpadding="0" cellspacing="0"
style="max-width:600px;background:#ffffff;margin:20px auto;border-radius:8px;overflow:hidden">

<tr>
<td>
<img src="https://studzee-assets.s3.ap-south-1.amazonaws.com/assets/studzee_banner.png" alt="Studzee Banner">
</td>
</tr>

<tr>
<td style="padding:30px">

<p style="margin:0 0 20px 0">
<strong>Hi ${displayName},</strong>
</p>

<p style="margin:0 0 20px 0">
Welcome to <strong>Studzee</strong> 
</p>

<p style="margin:0 0 20px 0">
Studzee is an <strong>AI-powered document-to-learning platform</strong> that converts raw educational content into structured lessons, summaries, and quizzes across web, mobile, and desktop apps.
</p>

<p style="margin:0 0 20px 0">
Right now we are focusing on three topics:
</p>

<p style="margin:0 0 20px 20px">
• System Design<br>
• Machine Learning<br>
• Deep Learning
</p>

<p style="margin:0 0 20px 0">
All notes will be available directly inside the <strong>Studzee app</strong>.
If you are using the <strong>website</strong>, you will also be able to download the notes.
</p>

<p style="margin:0 0 20px 0">
You can also subscribe to our <strong>newsletter</strong> to receive updates and newly published notes as soon as they are released.
</p>

<p style="margin:0 0 20px 0">
Explore Studzee: <br>
<a href="https://studzee.in">https://studzee.in</a>
</p>

<p style="margin:0">
Happy learning  <br>
<strong>Team Studzee</strong>
</p>

</td>
</tr>
</table>

<table width="600" class="content" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr>
<td align="center" style="padding:20px;font-size:12px;color:#888888">

<p style="margin:0">
This is an automated email from Studzee.
</p>

<p style="margin:10px 0 0 0">
© ${new Date().getFullYear()} Studzee
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
