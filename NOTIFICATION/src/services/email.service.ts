import nodemailer from "nodemailer";
import { config } from "@/config";
import logger from "@/utils/logger";
import { generateEmailTemplate } from "@/utils/mail";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD,
  },
});


export const sendEmailWithAttachments = async (
  recipients: string[],
  subject: string,
  title: string,
  body: string,
  footer?: string,
  pdfUrls?: string[]
) => {
  try {
    // Prepare attachments if PDF URLs provided
    const attachments = pdfUrls
      ? await Promise.all(
          pdfUrls.map(async (url, index) => ({
            filename: `attachment-${index + 1}.pdf`,
            path: url,
          }))
        )
      : [];

    // Generate HTML content using the email template
    const htmlContent = generateEmailTemplate(title, body, footer);

    const mailOptions = {
      from: config.EMAIL_FROM,
      to: recipients.join(", "),
      subject,
      html: htmlContent,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      { messageId: info.messageId, recipients },
      "Email sent successfully"
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    logger.error({ error: error.message }, "Email sending failed");
    return {
      success: false,
      error: error.message,
    };
  }
};
