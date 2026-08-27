/**
 * @file src/config/mail.ts
 * @description Transporter configuration for SMTP email service using Nodemailer.
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

// Prioritize IPv4 resolution for container environments without IPv6 routing
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: false,
  },
  family: 4,
} as nodemailer.TransportOptions);

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
