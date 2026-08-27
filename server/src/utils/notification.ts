/**
 * @file src/utils/notification.ts
 * @description Email Notification Service powered by Resend (HTTPS API) and Nodemailer (SMTP fallback).
 */

import { transporter, isResendActive } from '@/config/mail';
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
   * Sends an email via Resend HTTPS API (production/staging) or Nodemailer SMTP (local fallback).
   */
  async sendEmail(payload: NotificationPayload): Promise<void> {
    let fromAddress = `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`;

    // 1. Resend HTTPS API Mode (Production / Staging / When RESEND_API_KEY is available)
    if (isResendActive() && env.RESEND_API_KEY) {
      if (
        !env.SMTP_FROM_EMAIL ||
        env.SMTP_FROM_EMAIL.includes('@gmail.com') ||
        env.SMTP_FROM_EMAIL.includes('@yahoo.com') ||
        env.SMTP_FROM_EMAIL.includes('@hotmail.com') ||
        env.SMTP_FROM_EMAIL.includes('@outlook.com')
      ) {
        fromAddress = `"${env.SMTP_FROM_NAME}" <onboarding@resend.dev>`;
      }
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [payload.to],
            subject: payload.subject,
            text: payload.body,
            html: payload.html || payload.body.replace(/\n/g, '<br>'),
          }),
        });

        const data = (await response.json()) as { id?: string; message?: string };

        if (!response.ok) {
          throw new Error(data.message || `Resend HTTP error ${response.status}`);
        }

        logger.info(`📧 [RESEND] Email sent successfully via Resend: id=${data.id || 'ok'} | Recipient: ${payload.to}`);
        return;
      } catch (error) {
        logger.error(`❌ [RESEND FAILURE] Failed to send email to ${payload.to}: ${(error as Error).message}`);
        logger.info(`✉️ [EMAIL FALLBACK LOG]
        To: ${payload.to}
        Subject: ${payload.subject}
        Body: ${payload.body}
      `);
        return;
      }
    }

    // 2. Nodemailer SMTP Mode (Local development fallback)
    try {
      const mailOptions = {
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: payload.html || payload.body.replace(/\n/g, '<br>'),
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`📧 [SMTP SENT] MessageId: ${info.messageId} | Recipient: ${payload.to}`);
    } catch (error) {
      logger.error(`❌ [SMTP FAILURE] Failed to send email to ${payload.to}: ${(error as Error).message}`);
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
