/**
 * @file src/utils/audit.ts
 * @description Centralized helper utility to record administrative audit logs.
 */

import { prisma } from '@/config/database';
import { AuditActorRole } from '@prisma/client';
import { getRequestContext } from '@/common/middleware/requestContext';
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
 * Automatically resolves client IP address and User Agent from the current Request Context
 * if not explicitly provided in params.
 */
export const createAuditLog = async (params: AuditLogParams): Promise<void> => {
  const ctx = getRequestContext();
  const logCode = `AUD-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;

  const resolvedIp = params.ipAddress || ctx?.ipAddress || '127.0.0.1';
  const resolvedUserAgent = params.userAgent || ctx?.userAgent || null;

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
      ipAddress: resolvedIp,
      userAgent: resolvedUserAgent,
    },
  });
};
