/**
 * @file src/modules/audit/audit.service.ts
 * @description Service layer for querying, searching, filtering, and paginating Audit Logs.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { auditRepository } from './audit.repository';
import {
  AuditLogQueryParams,
  PaginatedAuditLogs,
  SanitizedAuditLog,
} from './audit.types';
import { AuditActorRole, Prisma } from '@prisma/client';

export class AuditService {
  /**
   * Helper to format raw database audit record into sanitized output.
   */
  private formatAuditLog(raw: any): SanitizedAuditLog {
    const actorUser = raw.actor;
    const actorFullName =
      actorUser?.userProfile?.fullName ||
      (actorUser?.student
        ? `${actorUser.student.firstName || ''} ${actorUser.student.lastName || ''}`.trim()
        : actorUser?.email || 'System User');

    const zone =
      actorUser?.zone ||
      actorUser?.student?.zone ||
      null;

    return {
      id: raw.id,
      logCode: raw.logCode,
      actorId: raw.actorId,
      actorRole: raw.actorRole,
      action: raw.action,
      targetEntityType: raw.targetEntityType,
      targetEntityId: raw.targetEntityId,
      targetLabel: raw.targetLabel,
      details: raw.details,
      ipAddress: raw.ipAddress,
      userAgent: raw.userAgent,
      createdAt: raw.createdAt,
      actor: {
        id: actorUser?.id || raw.actorId,
        email: actorUser?.email || null,
        registerNumber: actorUser?.registerNumber || null,
        employeeId: actorUser?.employeeId || null,
        role: actorUser?.role || raw.actorRole,
        zoneId: actorUser?.zoneId || zone?.id || null,
        fullName: actorFullName,
        zoneName: zone?.name || null,
      },
      zone: zone
        ? {
            id: zone.id,
            name: zone.name,
            code: zone.code,
          }
        : null,
    };
  }

  /**
   * Lists audit logs with multi-field search, composable filtering, sorting, and pagination.
   */
  async listAuditLogs(params: AuditLogQueryParams): Promise<PaginatedAuditLogs> {
    const page = Math.max(1, parseInt(String(params.page || 1), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(params.limit || 20), 10)));
    const skip = (page - 1) * limit;

    // Sorting: Whitelist allowed fields to prevent injection
    const allowedSortFields = ['createdAt', 'action', 'actorRole', 'targetEntityType', 'logCode'];
    const sortBy = allowedSortFields.includes(String(params.sortBy || ''))
      ? String(params.sortBy)
      : 'createdAt';
    const sortOrder: 'asc' | 'desc' =
      params.sortOrder === 'asc' || params.sortOrder === 'desc' ? params.sortOrder : 'desc';

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Build Where Clause
    const where: Prisma.AuditLogWhereInput = {};
    const andClauses: Prisma.AuditLogWhereInput[] = [];

    // 1. Search Query
    if (params.search && typeof params.search === 'string' && params.search.trim() !== '') {
      const q = params.search.trim();
      andClauses.push({
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { details: { contains: q, mode: 'insensitive' } },
          { targetLabel: { contains: q, mode: 'insensitive' } },
          { targetEntityType: { contains: q, mode: 'insensitive' } },
          { logCode: { contains: q, mode: 'insensitive' } },
          { actor: { email: { contains: q, mode: 'insensitive' } } },
          { actor: { registerNumber: { contains: q, mode: 'insensitive' } } },
          { actor: { employeeId: { contains: q, mode: 'insensitive' } } },
          { actor: { userProfile: { fullName: { contains: q, mode: 'insensitive' } } } },
          { actor: { student: { firstName: { contains: q, mode: 'insensitive' } } } },
          { actor: { student: { lastName: { contains: q, mode: 'insensitive' } } } },
          { actor: { student: { registrationNumber: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }

    // 2. Action Filter
    if (params.action && typeof params.action === 'string' && params.action !== 'All') {
      andClauses.push({ action: params.action.trim() });
    }

    // 3. Actor Role Filter
    if (params.actorRole && typeof params.actorRole === 'string' && params.actorRole !== 'All') {
      const validRoles = Object.values(AuditActorRole);
      if (validRoles.includes(params.actorRole as AuditActorRole)) {
        andClauses.push({ actorRole: params.actorRole as AuditActorRole });
      }
    }

    // 4. Target Entity Type Filter
    if (params.targetEntityType && typeof params.targetEntityType === 'string' && params.targetEntityType !== 'All') {
      andClauses.push({ targetEntityType: params.targetEntityType.trim() });
    }

    // 5. Zone Filter
    if (params.zoneId && typeof params.zoneId === 'string' && params.zoneId !== 'All') {
      const zId = params.zoneId.trim();
      andClauses.push({
        OR: [
          { actor: { zoneId: zId } },
          { actor: { student: { zoneId: zId } } },
        ],
      });
    }

    // 6. Date Range Filters
    if (params.from || params.startDate) {
      const fromDateStr = String(params.from || params.startDate);
      const fromDate = new Date(fromDateStr);
      if (!isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
        andClauses.push({ createdAt: { gte: fromDate } });
      }
    }

    if (params.to || params.endDate) {
      const toDateStr = String(params.to || params.endDate);
      const toDate = new Date(toDateStr);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        andClauses.push({ createdAt: { lte: toDate } });
      }
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    // Execute queries in parallel
    const [rawLogs, totalCount] = await Promise.all([
      auditRepository.list(where, skip, limit, orderBy),
      auditRepository.count(where),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const items = rawLogs.map((log) => this.formatAuditLog(log));

    return {
      items,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(totalPages, 1),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single audit log record by ID.
   */
  async getAuditLogById(id: string): Promise<SanitizedAuditLog> {
    const raw = await auditRepository.findById(id);
    if (!raw) {
      throw ApiError.notFound('Audit log record not found');
    }
    return this.formatAuditLog(raw);
  }

  /**
   * Retrieves all distinct action types currently logged.
   */
  async getAuditActions(): Promise<string[]> {
    return auditRepository.getDistinctActions();
  }
}

export const auditService = new AuditService();
