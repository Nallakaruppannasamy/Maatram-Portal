import dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import app from './app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { checkDatabaseConnection } from '@/config/database';
import { verifyMailConnection } from '@/config/mail';

const PORT = Number(process.env.PORT) || env.PORT || 5000;

const bootstrap = async () => {
  logger.info('🚀 Bootstrapping Maatram Backend Service...');

  // 1. Establish & verify database connection
  await checkDatabaseConnection();

  // 2. Establish & verify SMTP mail connection
  await verifyMailConnection();

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`✨ Server listening on 0.0.0.0:${PORT} in ${env.NODE_ENV} mode.`);
    logger.info(`📄 Swagger Documentation available at /api-docs`);
  });

  // Graceful shutdown handler
  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Global unhandled errors catcher
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
