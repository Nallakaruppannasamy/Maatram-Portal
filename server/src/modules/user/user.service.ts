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
      return userRepository.create(data, pwHash, tempPassword, tx);
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

    // In a real system, the temporary password would be sent by email.
    // For now we log it securely in the server environment.
    logger.info(`[USER PROVISIONED] Email: ${user.email} | Temp Password: ${tempPassword}`);

    return {
      user,
      tempPassword, // Return so testing script or admin can see it in output response
    };
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

    if (params.role) {
      where.role = params.role as UserRole;
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

    const [users, totalCount] = await Promise.all([
      userRepository.list(
        where,
        skip,
        take,
        orderBy as Prisma.UserOrderByWithRelationInput | undefined
      ),
      userRepository.count(where),
    ]);

    const meta = buildPaginationMeta(totalCount, params);

    return { data: users, meta };
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
}

export const userService = new UserService();
