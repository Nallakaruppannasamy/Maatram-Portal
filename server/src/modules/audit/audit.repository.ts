/**
 * @file src/modules/audit/audit.repository.ts
 * @description Data access layer for Audit Logs using Prisma ORM.
 */

import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';

const ACTOR_SAFE_SELECT = {
  id: true,
  email: true,
  registerNumber: true,
  employeeId: true,
  role: true,
  zoneId: true,
  userProfile: {
    select: {
      fullName: true,
    },
  },
  zone: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      registrationNumber: true,
      zone: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
};

export class AuditRepository {
  /**
   * Lists audit logs matching the given filter, pagination, and sorting.
   */
  async list(
    where: Prisma.AuditLogWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.AuditLogOrderByWithRelationInput
  ) {
    return prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select: {
        id: true,
        logCode: true,
        actorId: true,
        actorRole: true,
        action: true,
        targetEntityType: true,
        targetEntityId: true,
        targetLabel: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        actor: {
          select: ACTOR_SAFE_SELECT,
        },
      },
    });
  }

  /**
   * Counts audit logs matching the given filter.
   */
  async count(where: Prisma.AuditLogWhereInput): Promise<number> {
    return prisma.auditLog.count({ where });
  }

  /**
   * Finds a single audit log record by ID with safe relation selections.
   */
  async findById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
      select: {
        id: true,
        logCode: true,
        actorId: true,
        actorRole: true,
        action: true,
        targetEntityType: true,
        targetEntityId: true,
        targetLabel: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        actor: {
          select: ACTOR_SAFE_SELECT,
        },
      },
    });
  }

  /**
   * Retrieves all distinct action types currently recorded in the database.
   */
  async getDistinctActions(): Promise<string[]> {
    const records = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });
    return records.map((r) => r.action);
  }
}

export const auditRepository = new AuditRepository();
