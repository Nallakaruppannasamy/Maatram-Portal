/**
 * @file src/utils/audit.ts
 * @description Centralized helper utility to record administrative audit logs.
 */

import { prisma } from '@/config/database';
import { AuditActorRole } from '@prisma/client';
import crypto from 'crypto';

interface AuditLogParams {
  actorId: string;
  actorRole: AuditActorRole;
  action: string;
  targetEntityType: string;
  targetEntityId?: string;
  targetLabel: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an audit log entry inside the database.
 */
export const createAuditLog = async (params: AuditLogParams): Promise<void> => {
  const logCode = `AUD-${crypto.randomInt(10000, 99999)}`;

  await prisma.auditLog.create({
    data: {
      logCode,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      targetLabel: params.targetLabel,
      details: params.details,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || null,
    },
  });
};
