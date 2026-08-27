/**
 * @file src/config/mail.ts
 * @description Transporter configuration for SMTP email service using Nodemailer.
 */

import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

/**
 * Verifies connection status with the SMTP server.
 */
export const verifyMailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('📧 SMTP Mail Server connected successfully.');
    return true;
  } catch (error) {
    logger.warn(`⚠️ SMTP Mail Server connection check failed: ${(error as Error).message}`);
    return false;
  }
};
