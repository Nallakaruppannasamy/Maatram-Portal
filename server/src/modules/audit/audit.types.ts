/**
 * @file src/modules/audit/audit.types.ts
 * @description Type definitions and query options for the Audit Log module.
 */

import { AuditActorRole } from '@prisma/client';

export interface AuditLogQueryParams {
  page?: string | number;
  limit?: string | number;
  search?: string;
  action?: string;
  actorRole?: AuditActorRole | string;
  zoneId?: string;
  from?: string;
  to?: string;
  targetEntityType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface SanitizedActor {
  id: string;
  email: string | null;
  registerNumber: string | null;
  employeeId: string | null;
  role: string;
  zoneId: string | null;
  fullName: string;
  zoneName?: string | null;
}

export interface SanitizedAuditLog {
  id: string;
  logCode: string;
  actorId: string;
  actorRole: AuditActorRole;
  action: string;
  targetEntityType: string;
  targetEntityId: string | null;
  targetLabel: string;
  details: string;
  ipAddress: string;
  userAgent: string | null;
  createdAt: Date;
  actor: SanitizedActor;
  zone?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface PaginatedAuditLogs {
  items: SanitizedAuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
