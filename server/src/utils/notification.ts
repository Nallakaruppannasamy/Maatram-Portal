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

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  /**
   * Sends an email via Resend HTTPS API (production/staging) or Nodemailer SMTP (local fallback).
   * Safely captures errors and returns an EmailSendResult without throwing unhandled exceptions.
   */
  async sendEmail(payload: NotificationPayload): Promise<EmailSendResult> {
    const maskedRecipient = payload.to.includes('@')
      ? `${payload.to.split('@')[0].slice(0, 3)}***@${payload.to.split('@')[1]}`
      : '***';

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

        const data = (await response.json()) as { id?: string; message?: string; name?: string };

        if (!response.ok) {
          const errMsg = data.message || `Resend HTTP error ${response.status}`;
          logger.error(`❌ [RESEND FAILURE] Failed to deliver email to ${maskedRecipient}: ${errMsg}`);
          logger.info(`✉️ [EMAIL DELIVERY STATUS] Provider: Resend | Recipient: ${maskedRecipient} | Subject: ${payload.subject} | Status: Failed | Reason: ${errMsg}`);
          return { success: false, error: errMsg };
        }

        logger.info(`📧 [RESEND] Email sent successfully via Resend: id=${data.id || 'ok'} | Recipient: ${maskedRecipient}`);
        return { success: true, messageId: data.id };
      } catch (error) {
        const errMsg = (error as Error).message;
        logger.error(`❌ [RESEND FAILURE] Failed to deliver email to ${maskedRecipient}: ${errMsg}`);
        logger.info(`✉️ [EMAIL DELIVERY STATUS] Provider: Resend | Recipient: ${maskedRecipient} | Subject: ${payload.subject} | Status: Failed | Reason: ${errMsg}`);
        return { success: false, error: errMsg };
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
      logger.info(`📧 [SMTP SENT] MessageId: ${info.messageId} | Recipient: ${maskedRecipient}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errMsg = (error as Error).message;
      logger.error(`❌ [SMTP FAILURE] Failed to deliver email to ${maskedRecipient}: ${errMsg}`);
      logger.info(`✉️ [EMAIL DELIVERY STATUS] Provider: SMTP | Recipient: ${maskedRecipient} | Subject: ${payload.subject} | Status: Failed | Reason: ${errMsg}`);
      return { success: false, error: errMsg };
    }
  }
}

export const notificationService = new NotificationService();
export const mockNotificationService = notificationService;
