/**
 * @file src/modules/zone/zone.service.ts
 * @description Service layer containing all business rules for the Zone module.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { logger } from '@/config/logger';
import { zoneRepository } from './zone.repository';
import { organizationRepository } from '../organization/organization.repository';
import { prisma } from '@/config/database';
import { CreateZoneDTO, UpdateZoneDTO } from './zone.types';
import { ZONE_LOGS } from './zone.constants';
import { createAuditLog } from '@/utils/audit';
import {
  parseQueryParams,
  buildPaginationMeta,
  buildSearchQuery,
  QueryParams,
} from '@/utils/query-helper';
import { Zone, AuditActorRole, Prisma } from '@prisma/client';

export class ZoneService {
  /**
   * Helper to validate that an incharge user exists and has the correct role.
   */
  private async validateIncharge(inchargeId: string | null | undefined): Promise<void> {
    if (!inchargeId) return;
    const user = await prisma.user.findUnique({
      where: { id: inchargeId },
    });
    if (!user) {
      throw ApiError.notFound('Incharge user not found');
    }
    if (user.role !== 'zone') {
      throw ApiError.badRequest('Incharge user must have the "zone" role');
    }
  }

  /**
   * Creates a new zone, preventing duplicates.
   */
  async createZone(data: CreateZoneDTO, actorId: string, actorRole: AuditActorRole): Promise<Zone> {
    const uppercaseCode = data.code.toUpperCase();

    // Verify parent organization exists
    const org = await organizationRepository.findById(data.organizationId);
    if (!org) {
      throw ApiError.notFound('Parent organization not found');
    }

    // Verify incharge role if assigned
    await this.validateIncharge(data.inchargeId);

    // Check duplicate code
    const isTaken = await zoneRepository.existsByCode(uppercaseCode);
    if (isTaken) {
      throw ApiError.badRequest(`Zone code "${uppercaseCode}" is already taken`);
    }

    const zone = await zoneRepository.create({
      ...data,
      code: uppercaseCode,
    });

    // Record audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: ZONE_LOGS.ZONE_CREATED,
      targetEntityType: 'zone',
      targetEntityId: zone.id,
      targetLabel: zone.name,
      details: `Created zone: ${zone.name} (${zone.code}) under organization ID: ${zone.organizationId}`,
    });

    logger.info(`[${ZONE_LOGS.ZONE_CREATED}] Created zone ID: ${zone.id}`);
    return zone;
  }

  /**
   * Updates zone attributes.
   */
  async updateZone(
    id: string,
    data: UpdateZoneDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<Zone> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw ApiError.notFound('Zone not found');
    }

    // Validate parent organization if changing
    if (data.organizationId) {
      const org = await organizationRepository.findById(data.organizationId);
      if (!org) {
        throw ApiError.notFound('Organization not found');
      }
    }

    // Validate incharge if changing
    if (data.inchargeId !== undefined) {
      await this.validateIncharge(data.inchargeId);
    }

    const updated = await zoneRepository.update(id, data);

    await createAuditLog({
      actorId,
      actorRole,
      action: ZONE_LOGS.ZONE_UPDATED,
      targetEntityType: 'zone',
      targetEntityId: updated.id,
      targetLabel: updated.name,
      details: `Updated zone: ${updated.name}`,
    });

    logger.info(`[${ZONE_LOGS.ZONE_UPDATED}] Updated zone ID: ${updated.id}`);
    return updated;
  }

  /**
   * Retrieves a zone by ID.
   */
  async getZone(id: string): Promise<Zone> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw ApiError.notFound('Zone not found');
    }
    return zone;
  }

  /**
   * Lists zones with pagination, search, sorting and filtering.
   */
  async listZones(params: QueryParams) {
    const { skip, take, orderBy } = parseQueryParams(params, 'name');

    // Build filters
    const where: Prisma.ZoneWhereInput = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true' || (params.isActive as unknown) === true;
    }

    if (params.organizationId) {
      where.organizationId = params.organizationId as string;
    }

    // Build search filters (on name and code)
    if (params.search) {
      Object.assign(where, buildSearchQuery(params.search, ['name', 'code']));
    }

    const [zones, totalCount] = await Promise.all([
      zoneRepository.list(
        where,
        skip,
        take,
        orderBy as Prisma.ZoneOrderByWithRelationInput | undefined
      ),
      zoneRepository.count(where),
    ]);

    const meta = buildPaginationMeta(totalCount, params);

    return { data: zones, meta };
  }

  /**
   * Performs soft deletion of a zone.
   */
  async deleteZone(id: string, actorId: string, actorRole: AuditActorRole): Promise<Zone> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw ApiError.notFound('Zone not found');
    }

    const updated = await zoneRepository.softDelete(id);

    await createAuditLog({
      actorId,
      actorRole,
      action: ZONE_LOGS.ZONE_UPDATED,
      targetEntityType: 'zone',
      targetEntityId: updated.id,
      targetLabel: updated.name,
      details: `Soft-deleted zone: ${updated.name}`,
    });

    logger.info(`[${ZONE_LOGS.ZONE_UPDATED}] Soft-deleted zone ID: ${updated.id}`);
    return updated;
  }
}

export const zoneService = new ZoneService();
