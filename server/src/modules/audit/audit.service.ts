/**
 * @file src/modules/audit/audit.service.ts
 * @description Service layer for querying, searching, filtering, and paginating Audit Logs with strict Zone-scoping.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { prisma } from '@/config/database';
import { zoneService } from '../zone/zone.service';
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
   * Lists audit logs with multi-field search, composable filtering, sorting, pagination, and strict Zone scoping.
   */
  async listAuditLogs(params: AuditLogQueryParams, user?: any): Promise<PaginatedAuditLogs> {
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

    // --- 0. ZONE SCOPING ENFORCEMENT ---
    let assignedZoneId: string | null = null;
    if (user?.role === 'zone') {
      assignedZoneId = await zoneService.getAssignedZoneIdForUser(user.userId);
      if (!assignedZoneId) {
        return {
          items: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            stats: {
              totalLogs: 0,
              adminEvents: 0,
              zoneEvents: 0,
              studentEvents: 0,
            },
          },
        };
      }

      // If a college filter was requested, verify that the college belongs to the Incharge's zone
      if (params.collegeId && typeof params.collegeId === 'string' && params.collegeId !== 'All') {
        const college = await prisma.college.findUnique({
          where: { id: params.collegeId },
          select: { zoneId: true },
        });
        if (!college || college.zoneId !== assignedZoneId) {
          throw ApiError.forbidden('Access denied: You can only view audit logs for colleges in your assigned zone');
        }
      }

      // Fetch zone related entity IDs
      const [collegesInZone, studentsInZone, submissionsInZone] = await Promise.all([
        prisma.college.findMany({
          where: { zoneId: assignedZoneId },
          select: { id: true },
        }),
        prisma.student.findMany({
          where: { zoneId: assignedZoneId },
          select: { id: true, userId: true, collegeId: true },
        }),
        prisma.volunteerSubmission.findMany({
          where: { zoneId: assignedZoneId },
          select: { id: true },
        }),
      ]);

      const zoneCollegeIds = collegesInZone.map((c) => c.id);
      const zoneStudentIds = studentsInZone.map((s) => s.id);
      const zoneStudentUserIds = studentsInZone.map((s) => s.userId).filter(Boolean);
      const zoneSubmissionIds = submissionsInZone.map((sub) => sub.id);

      // If college filter is active, further scope to that college
      if (params.collegeId && typeof params.collegeId === 'string' && params.collegeId !== 'All') {
        const selectedCollegeId = params.collegeId;
        const collegeStudentIds = studentsInZone
          .filter((s) => s.collegeId === selectedCollegeId)
          .map((s) => s.id);
        const collegeStudentUserIds = studentsInZone
          .filter((s) => s.collegeId === selectedCollegeId)
          .map((s) => s.userId)
          .filter(Boolean);

        const collegeOrClauses: Prisma.AuditLogWhereInput[] = [
          { actor: { student: { collegeId: selectedCollegeId } } },
          { AND: [{ targetEntityType: 'college' }, { targetEntityId: selectedCollegeId }] },
          ...(collegeStudentIds.length > 0
            ? [{ AND: [{ targetEntityType: 'student' }, { targetEntityId: { in: [...collegeStudentIds, ...collegeStudentUserIds] } }] }]
            : []),
          ...(collegeStudentUserIds.length > 0
            ? [{ AND: [{ targetEntityType: { in: ['profile', 'user'] } }, { targetEntityId: { in: collegeStudentUserIds } }] }]
            : []),
        ];

        andClauses.push({ OR: collegeOrClauses });
      } else {
        // Standard Zone Scoping
        const zoneOrClauses: Prisma.AuditLogWhereInput[] = [
          { actor: { zoneId: assignedZoneId } },
          { actor: { student: { zoneId: assignedZoneId } } },
          { AND: [{ targetEntityType: 'zone' }, { targetEntityId: assignedZoneId }] },
          ...(zoneCollegeIds.length > 0
            ? [{ AND: [{ targetEntityType: 'college' }, { targetEntityId: { in: zoneCollegeIds } }] }]
            : []),
          ...(zoneStudentIds.length > 0
            ? [{ AND: [{ targetEntityType: 'student' }, { targetEntityId: { in: [...zoneStudentIds, ...zoneStudentUserIds] } }] }]
            : []),
          ...(zoneStudentUserIds.length > 0
            ? [{ AND: [{ targetEntityType: { in: ['profile', 'user'] } }, { targetEntityId: { in: zoneStudentUserIds } }] }]
            : []),
          ...(zoneSubmissionIds.length > 0
            ? [{ AND: [{ targetEntityType: 'volunteer' }, { targetEntityId: { in: [...zoneSubmissionIds, ...zoneStudentIds] } }] }]
            : []),
        ];

        andClauses.push({ OR: zoneOrClauses });
      }
    } else if (params.zoneId && typeof params.zoneId === 'string' && params.zoneId !== 'All') {
      // Super Admin explicit zone filter
      const zId = params.zoneId.trim();
      andClauses.push({
        OR: [
          { actor: { zoneId: zId } },
          { actor: { student: { zoneId: zId } } },
        ],
      });
    }

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

    // 5. Date Range Filters
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

    // Base scope where clause for calculating summary metrics without pagination or action/role narrow filters
    const statsWhereBase: Prisma.AuditLogWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    // Execute queries in parallel
    const [rawLogs, totalCount, adminCount, zoneCount, studentCount] = await Promise.all([
      auditRepository.list(where, skip, limit, orderBy),
      auditRepository.count(where),
      auditRepository.count({
        AND: [...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []), { actorRole: AuditActorRole.admin }],
      }),
      auditRepository.count({
        AND: [...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []), { actorRole: AuditActorRole.zone }],
      }),
      auditRepository.count({
        AND: [...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []), { actorRole: AuditActorRole.student }],
      }),
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
        stats: {
          totalLogs: totalCount,
          adminEvents: adminCount,
          zoneEvents: zoneCount,
          studentEvents: studentCount,
        },
      },
    };
  }

  /**
   * Retrieves single audit log record by ID with strict zone authorization.
   */
  async getAuditLogById(id: string, user?: any): Promise<SanitizedAuditLog> {
    const raw = await auditRepository.findById(id);
    if (!raw) {
      throw ApiError.notFound('Audit log record not found');
    }

    if (user?.role === 'zone') {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(user.userId);
      if (!assignedZoneId) {
        throw ApiError.forbidden('Access denied: You cannot view audit logs outside your assigned zone');
      }

      // Verify if log matches assigned zone
      const actorZoneId = raw.actor?.zoneId || raw.actor?.student?.zone?.id;
      const isActorInZone = actorZoneId === assignedZoneId;
      const isTargetZone = raw.targetEntityType === 'zone' && raw.targetEntityId === assignedZoneId;

      let isTargetInZone = false;
      if (raw.targetEntityType === 'student' && raw.targetEntityId) {
        const student = await prisma.student.findFirst({
          where: {
            OR: [
              { id: raw.targetEntityId },
              { userId: raw.targetEntityId },
            ],
            zoneId: assignedZoneId,
          },
          select: { id: true },
        });
        isTargetInZone = student !== null;
      } else if (raw.targetEntityType === 'college' && raw.targetEntityId) {
        const college = await prisma.college.findFirst({
          where: { id: raw.targetEntityId, zoneId: assignedZoneId },
          select: { id: true },
        });
        isTargetInZone = college !== null;
      } else if (raw.targetEntityType === 'volunteer' && raw.targetEntityId) {
        const submission = await prisma.volunteerSubmission.findFirst({
          where: { id: raw.targetEntityId, zoneId: assignedZoneId },
          select: { id: true },
        });
        isTargetInZone = submission !== null;
      } else if ((raw.targetEntityType === 'profile' || raw.targetEntityType === 'user') && raw.targetEntityId) {
        const userInZone = await prisma.user.findFirst({
          where: {
            id: raw.targetEntityId,
            OR: [
              { zoneId: assignedZoneId },
              { student: { zoneId: assignedZoneId } },
            ],
          },
          select: { id: true },
        });
        isTargetInZone = userInZone !== null;
      }

      if (!isActorInZone && !isTargetZone && !isTargetInZone) {
        throw ApiError.forbidden('Access denied: You cannot view audit logs outside your assigned zone');
      }
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
