/**
 * @file src/utils/notification.ts
 * @description Mock Notification Service for logging transactional links
 * (e.g. password resets). Full SMTP integration is planned for a future version.
 */

import { logger } from '@/config/logger';

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
}

export class MockNotificationService {
  /**
   * Simulates sending an email by logging the payload to the logger.
   */
  async sendEmail(payload: NotificationPayload): Promise<void> {
    logger.info(`✉️ [MOCK EMAIL SENT]
      To: ${payload.to}
      Subject: ${payload.subject}
      Body: ${payload.body}
    `);
  }
}

export const mockNotificationService = new MockNotificationService();
