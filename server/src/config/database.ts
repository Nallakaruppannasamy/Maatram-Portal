import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';
import { env } from '@/config/env';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
  });

if (env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: unknown) => {
    const event = e as { query: string; params: string; duration: number };
    logger.debug(`Query: ${event.query} | Params: ${event.params} | Duration: ${event.duration}ms`);
  });
}

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const ensureDefaultOrganization = async (): Promise<void> => {
  try {
    const existing = await prisma.organization.findFirst();
    if (!existing) {
      await prisma.organization.upsert({
        where: { code: 'MTM-ORG' },
        update: {},
        create: {
          name: 'Maatram Educational and Charitable Trust',
          code: 'MTM-ORG',
          description: 'Headquarters organization for Maatram Educational and Charitable Trust',
          isActive: true,
        },
      });
      logger.info('🏢 Default Organization (MTM-ORG) initialized in database.');
    }
  } catch (err) {
    logger.warn(`⚠️ Could not verify default organization: ${(err as Error).message}`);
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('🔌 Database connection established successfully via Prisma.');
    await ensureDefaultOrganization();
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

