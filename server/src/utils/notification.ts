/**
 * @file src/utils/notification.ts
 * @description Real Email Notification Service powered by Nodemailer & SMTP.
 */

import { transporter } from '@/config/mail';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export class NotificationService {
  /**
   * Sends an email via configured SMTP transport.
   * If sending fails, logs the notification payload gracefully as a safety fallback.
   */
  async sendEmail(payload: NotificationPayload): Promise<void> {
    try {
      const mailOptions = {
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: payload.html || payload.body.replace(/\n/g, '<br>'),
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`📧 [EMAIL SENT] MessageId: ${info.messageId} | Recipient: ${payload.to}`);
    } catch (error) {
      logger.error(`❌ [EMAIL FAILURE] Failed to send email to ${payload.to}: ${(error as Error).message}`);
      logger.info(`✉️ [EMAIL FALLBACK LOG]
        To: ${payload.to}
        Subject: ${payload.subject}
        Body: ${payload.body}
      `);
    }
  }
}

export const notificationService = new NotificationService();
export const mockNotificationService = notificationService;
