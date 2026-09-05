/**
 * @file src/modules/user/user.service.ts
 * @description Service layer containing business rules for User Management.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { logger } from '@/config/logger';
import { userRepository } from './user.repository';
import { organizationRepository } from '../organization/organization.repository';
import { zoneRepository } from '../zone/zone.repository';
import { prisma } from '@/config/database';
import { hashPassword } from '@/utils/password';
import { generateTempPassword } from '@/utils/password-generator';
import { notificationService } from '@/utils/notification';
import { CreateUserDTO, UpdateUserDTO } from './user.types';
import { USER_LOGS } from './user.constants';
import { createAuditLog } from '@/utils/audit';
import {
  parseQueryParams,
  buildPaginationMeta,
  buildSearchQuery,
  QueryParams,
} from '@/utils/query-helper';
import { AuditActorRole, Prisma, UserRole } from '@prisma/client';
import * as XLSX from 'xlsx';

export class UserService {
  /**
   * Helper to validate that related organization and zone exist in the database.
   */
  private async validateOrgAndZone(orgId?: string, zoneId?: string): Promise<void> {
    if (orgId) {
      const org = await organizationRepository.findById(orgId);
      if (!org) {
        throw ApiError.notFound('Assigned organization not found');
      }
    }
    if (zoneId) {
      const zone = await zoneRepository.findById(zoneId);
      if (!zone) {
        throw ApiError.notFound('Assigned zone not found');
      }
      if (orgId && zone.organizationId !== orgId) {
        throw ApiError.badRequest('The assigned zone does not belong to the selected organization');
      }
    }
  }

  /**
   * Provisions a new user within a database transaction.
   */
  async createUser(data: CreateUserDTO, actorId: string, actorRole: AuditActorRole) {
    // Validate uniqueness
    const emailTaken = await userRepository.existsByEmail(data.email);
    if (emailTaken) {
      throw ApiError.badRequest(`Email "${data.email}" is already registered`);
    }

    if (data.employeeId) {
      const empIdTaken = await userRepository.existsByEmployeeId(data.employeeId);
      if (empIdTaken) {
        throw ApiError.badRequest(`Employee ID "${data.employeeId}" is already taken`);
      }
    }

    // Validate relations
    await this.validateOrgAndZone(data.organizationId, data.zoneId);

    // Generate credentials
    const tempPassword = generateTempPassword();
    const pwHash = await hashPassword(tempPassword);

    // Run transaction
    const user = await prisma.$transaction(async (tx) => {
      return userRepository.create(data, pwHash, tx);
    });

    await createAuditLog({
      actorId,
      actorRole,
      action: USER_LOGS.USER_CREATED,
      targetEntityType: 'user',
      targetEntityId: user.id,
      targetLabel: user.userProfile?.fullName || user.email || '',
      details: `Created administrative user: ${user.email} (${user.role})`,
    });

    // Send temporary password credentials email
    await notificationService.sendEmail({
      to: user.email || '',
      subject: 'Maatram Foundation — Welcome & Account Credentials',
      body: `Hello ${user.userProfile?.fullName || 'User'},\n\nYour account has been provisioned on the Maatram Foundation Portal.\n\nEmail: ${user.email}\nTemporary Password: ${tempPassword}\n\nPlease log in and update your password immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1a56db;">Welcome to Maatram Foundation</h2>
          <p>Hello <strong>${user.userProfile?.fullName || 'User'}</strong>,</p>
          <p>Your account has been provisioned on the Maatram Foundation Portal.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> <code style="font-size: 16px; color: #d97706;">${tempPassword}</code></p>
          </div>
          <p>Please log in and update your password immediately upon first login.</p>
        </div>
      `,
    });

    logger.info(`[USER PROVISIONED] Email: ${user.email}`);

    return user;
  }

  /**
   * Updates an existing user and their profile.
   */
  async updateUser(id: string, data: UpdateUserDTO, actorId: string, actorRole: AuditActorRole) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (data.email) {
      const emailTaken = await userRepository.existsByEmail(data.email, id);
      if (emailTaken) {
        throw ApiError.badRequest(`Email "${data.email}" is already registered`);
      }
    }

    if (data.employeeId) {
      const empIdTaken = await userRepository.existsByEmployeeId(data.employeeId, id);
      if (empIdTaken) {
        throw ApiError.badRequest(`Employee ID "${data.employeeId}" is already taken`);
      }
    }

    await this.validateOrgAndZone(
      data.organizationId || user.organizationId || undefined,
      data.zoneId !== undefined ? data.zoneId || undefined : user.zoneId || undefined
    );

    const updated = await prisma.$transaction(async (tx) => {
      return userRepository.update(id, data, tx);
    });

    await createAuditLog({
      actorId,
      actorRole,
      action: USER_LOGS.USER_UPDATED,
      targetEntityType: 'user',
      targetEntityId: updated.id,
      targetLabel: updated.userProfile?.fullName || updated.email || '',
      details: `Updated administrative user details: ${updated.email}`,
    });

    logger.info(`[${USER_LOGS.USER_UPDATED}] Updated user ID: ${updated.id}`);
    return updated;
  }

  /**
   * Toggles activation status.
   */
  async toggleUserActivation(
    id: string,
    isActive: boolean,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (isActive) {
      await userRepository.activate(id);
    } else {
      await userRepository.deactivate(id);
    }

    const action = isActive ? USER_LOGS.USER_ACTIVATED : USER_LOGS.USER_DEACTIVATED;
    await createAuditLog({
      actorId,
      actorRole,
      action,
      targetEntityType: 'user',
      targetEntityId: user.id,
      targetLabel: user.userProfile?.fullName || user.email || '',
      details: `${isActive ? 'Activated' : 'Deactivated'} user account: ${user.email}`,
    });

    logger.info(`[${action}] Account status changed for user ID: ${id}`);
  }

  /**
   * Lists users with filtering, sorting, search and pagination.
   */
  async listUsers(params: QueryParams) {
    const { skip, take, orderBy } = parseQueryParams(params, 'email');

    // Build filters
    const where: Prisma.UserWhereInput = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true' || (params.isActive as unknown) === true;
    }

    if (params.role && (params.role === 'admin' || params.role === 'zone')) {
      where.role = params.role as UserRole;
    } else {
      where.role = { in: [UserRole.admin, UserRole.zone] };
    }

    if (params.organizationId) {
      where.organizationId = params.organizationId as string;
    }

    if (params.zoneId) {
      where.zoneId = params.zoneId as string;
    }

    // Search filter (on email, employeeId, or userProfile.fullName)
    if (params.search) {
      Object.assign(
        where,
        buildSearchQuery(params.search, ['email', 'employeeId', 'userProfile.fullName'])
      );
    }

    const [users, totalCount, totalMembers, superAdmins, zoneIncharges, activeAccounts] = await Promise.all([
      userRepository.list(
        where,
        skip,
        take,
        orderBy as Prisma.UserOrderByWithRelationInput | undefined
      ),
      userRepository.count(where),
      prisma.user.count({ where: { role: { in: [UserRole.admin, UserRole.zone] } } }),
      prisma.user.count({ where: { role: UserRole.admin } }),
      prisma.user.count({ where: { role: UserRole.zone } }),
      prisma.user.count({ where: { role: { in: [UserRole.admin, UserRole.zone] }, isActive: true } }),
    ]);

    const meta = buildPaginationMeta(totalCount, params);

    return {
      items: users,
      pagination: {
        page: meta.page,
        limit: meta.limit,
        totalItems: totalCount,
        totalPages: meta.totalPages,
      },
      stats: {
        totalMembers,
        superAdmins,
        zoneIncharges,
        activeAccounts,
      },
    };
  }

  /**
   * Gets a user by ID.
   */
  async getUser(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Generates Excel buffer for filtered team members.
   */
  async exportToExcel(params: QueryParams): Promise<Buffer> {
    const where: Prisma.UserWhereInput = {};

    if (params.isActive !== undefined && params.isActive !== 'all' && params.isActive !== '') {
      where.isActive = params.isActive === 'true' || (params.isActive as unknown) === true;
    }

    if (params.role && (params.role === 'admin' || params.role === 'zone')) {
      where.role = params.role as UserRole;
    } else {
      where.role = { in: [UserRole.admin, UserRole.zone] };
    }

    if (params.organizationId && params.organizationId !== 'all') {
      where.organizationId = params.organizationId as string;
    }

    if (params.zoneId && params.zoneId !== 'all') {
      where.zoneId = params.zoneId as string;
    }

    if (params.search) {
      Object.assign(
        where,
        buildSearchQuery(params.search, ['email', 'employeeId', 'userProfile.fullName'])
      );
    }

    const { orderBy } = parseQueryParams(params, 'email');

    const users = await prisma.user.findMany({
      where,
      orderBy: orderBy as Prisma.UserOrderByWithRelationInput | undefined,
      include: {
        userProfile: true,
        organization: true,
        zone: true,
      },
    });

    const rows = users.map((u) => ({
      'Full Name': u.userProfile?.fullName || 'N/A',
      Email: u.email,
      'Employee ID': u.employeeId || 'N/A',
      Role: u.role === 'admin' ? 'Super Admin' : u.role === 'zone' ? 'Zone Incharge' : u.role,
      Designation: u.userProfile?.designation || 'N/A',
      Mobile: u.userProfile?.mobile || 'N/A',
      Organization: u.organization?.name || 'N/A',
      'Assigned Zone': u.zone?.name || 'All Zones',
      Status: u.isActive ? 'Active' : 'Deactivated',
      'Created At': u.createdAt ? u.createdAt.toISOString().split('T')[0] : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Members');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

export const userService = new UserService();
