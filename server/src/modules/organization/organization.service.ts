/**
 * @file src/modules/organization/organization.service.ts
 * @description Service layer containing all business rules for the Organization module.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { logger } from '@/config/logger';
import { organizationRepository } from './organization.repository';
import { CreateOrganizationDTO, UpdateOrganizationDTO } from './organization.types';
import { ORG_LOGS } from './organization.constants';
import { createAuditLog } from '@/utils/audit';
import {
  parseQueryParams,
  buildPaginationMeta,
  buildSearchQuery,
  QueryParams,
} from '@/utils/query-helper';
import { Organization, AuditActorRole, Prisma } from '@prisma/client';

export class OrganizationService {
  /**
   * Creates a new organization, preventing duplicates.
   */
  async createOrganization(
    data: CreateOrganizationDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<Organization> {
    const uppercaseCode = data.code.toUpperCase();

    // Check duplicate code
    const isTaken = await organizationRepository.existsByCode(uppercaseCode);
    if (isTaken) {
      throw ApiError.badRequest(`Organization code "${uppercaseCode}" is already taken`);
    }

    const org = await organizationRepository.create({
      ...data,
      code: uppercaseCode,
    });

    // Record audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: ORG_LOGS.ORGANIZATION_CREATED,
      targetEntityType: 'organization',
      targetEntityId: org.id,
      targetLabel: org.name,
      details: `Created organization: ${org.name} (${org.code})`,
    });

    logger.info(`[${ORG_LOGS.ORGANIZATION_CREATED}] Created organization ID: ${org.id}`);
    return org;
  }

  /**
   * Updates organization attributes.
   */
  async updateOrganization(
    id: string,
    data: UpdateOrganizationDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<Organization> {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    const updated = await organizationRepository.update(id, data);

    await createAuditLog({
      actorId,
      actorRole,
      action: ORG_LOGS.ORGANIZATION_UPDATED,
      targetEntityType: 'organization',
      targetEntityId: updated.id,
      targetLabel: updated.name,
      details: `Updated organization: ${updated.name}`,
    });

    logger.info(`[${ORG_LOGS.ORGANIZATION_UPDATED}] Updated organization ID: ${updated.id}`);
    return updated;
  }

  /**
   * Retrieves an organization by ID.
   */
  async getOrganization(id: string): Promise<Organization> {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }
    return org;
  }

  /**
   * Lists organizations with pagination, search, sorting and active filtering.
   */
  async listOrganizations(params: QueryParams) {
    const { skip, take, orderBy } = parseQueryParams(params, 'name');

    // Build filters
    const where: Prisma.OrganizationWhereInput = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true' || (params.isActive as unknown) === true;
    }

    // Build search filters (on name and code)
    if (params.search) {
      Object.assign(where, buildSearchQuery(params.search, ['name', 'code']));
    }

    const [orgs, totalCount] = await Promise.all([
      organizationRepository.list(
        where,
        skip,
        take,
        orderBy as Prisma.OrganizationOrderByWithRelationInput | undefined
      ),
      organizationRepository.count(where),
    ]);

    const meta = buildPaginationMeta(totalCount, params);

    return { data: orgs, meta };
  }

  /**
   * Performs soft deletion of an organization.
   */
  async deleteOrganization(
    id: string,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<Organization> {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    const updated = await organizationRepository.softDelete(id);

    await createAuditLog({
      actorId,
      actorRole,
      action: ORG_LOGS.ORGANIZATION_UPDATED,
      targetEntityType: 'organization',
      targetEntityId: updated.id,
      targetLabel: updated.name,
      details: `Soft-deleted organization: ${updated.name}`,
    });

    logger.info(`[${ORG_LOGS.ORGANIZATION_UPDATED}] Soft-deleted organization ID: ${updated.id}`);
    return updated;
  }
}

export const organizationService = new OrganizationService();
