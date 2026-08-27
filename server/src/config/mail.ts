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

// Custom DNS lookup enforcing IPv4 resolution for Nodemailer SMTP sockets
const ipv4Lookup = (hostname: string, options: any, callback: any) => {
  const cb = typeof options === 'function' ? options : callback;
  dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    cb(err, address, family);
  });
};

export const isResendActive = (): boolean => {
  return Boolean(env.RESEND_API_KEY && (env.NODE_ENV === 'production' || env.NODE_ENV === 'test' || !env.SMTP_USER));
};

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  lookup: ipv4Lookup,
  tls: {
    servername: env.SMTP_HOST,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
} as nodemailer.TransportOptions);

/**
 * Verifies connection status with the active email provider.
 */
export const verifyMailConnection = async (): Promise<boolean> => {
  if (isResendActive()) {
    logger.info('📧 [MAIL] Resend HTTPS API is active as the email provider.');
    return true;
  }

  // Fallback to local SMTP transporter check
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('⚠️ SMTP credentials not configured.');
    return false;
  }

  try {
    const addresses = await dns.promises.resolve4(env.SMTP_HOST).catch(() => []);
    logger.info(
      `🔍 SMTP DNS Resolution: host=${env.SMTP_HOST} -> IPv4: [${addresses.join(', ')}], port=${env.SMTP_PORT}, secure=${env.SMTP_PORT === 465}`
    );
  } catch (e) {
    // Non-blocking DNS diagnostic logging
  }

  try {
    await transporter.verify();
    logger.info('📧 SMTP Mail Server connected successfully.');
    return true;
  } catch (error) {
    logger.warn(`⚠️ SMTP Mail Server connection check failed: ${(error as Error).message}`);
    return false;
  }
};
