/**
 * @file src/modules/volunteer/volunteer.service.ts
 * @description Service layer containing business logic for Volunteer Management.
 */

import { VolunteerProfileStatus, AuditActorRole } from '@prisma/client';
import { ApiError } from '@/common/exceptions/apiError';
import { createAuditLog } from '@/utils/audit';
import { parseQueryParams, buildPaginationMeta, QueryParams } from '@/utils/query-helper';
import { logger } from '@/config/logger';
import { volunteerRepository } from './volunteer.repository';
import { VOLUNTEER_AUDIT_ACTIONS } from './volunteer.constants';
import {
  CreateVolunteerDTO,
  UpdateVolunteerDTO,
  VolunteerQueryOptions,
  VolunteerWithRelations,
} from './volunteer.types';
import { prisma } from '@/config/database';

// ─── Status Transition State Machine ─────────────────────────────────────────

const ALLOWED_STATUS_TRANSITIONS: Record<VolunteerProfileStatus, VolunteerProfileStatus[]> = {
  [VolunteerProfileStatus.ACTIVE]: [
    VolunteerProfileStatus.INACTIVE,
    VolunteerProfileStatus.ON_LEAVE,
    VolunteerProfileStatus.SUSPENDED,
    VolunteerProfileStatus.EXITED,
  ],
  [VolunteerProfileStatus.ON_LEAVE]: [
    VolunteerProfileStatus.ACTIVE,
    VolunteerProfileStatus.INACTIVE,
  ],
  [VolunteerProfileStatus.INACTIVE]: [
    VolunteerProfileStatus.ACTIVE,
    VolunteerProfileStatus.SUSPENDED,
  ],
  [VolunteerProfileStatus.SUSPENDED]: [VolunteerProfileStatus.ACTIVE],
  [VolunteerProfileStatus.EXITED]: [], // Terminal state
};

// ─── VolunteerService Class ───────────────────────────────────────────────────

class VolunteerService {
  /**
   * Computes full name from name parts.
   */
  private computeFullName(firstName: string, middleName: string | null, lastName: string): string {
    return [firstName, middleName, lastName].filter(Boolean).join(' ');
  }

  /**
   * Validates that an organization ID exists in the database.
   */
  private async validateOrganization(organizationId: string): Promise<void> {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw ApiError.notFound(`Organization with ID "${organizationId}" does not exist`);
    }
    if (!org.isActive) {
      throw ApiError.badRequest(`Organization "${org.name}" is not active`);
    }
  }

  /**
   * Validates that a zone ID exists in the database.
   */
  private async validateZone(zoneId: string): Promise<void> {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw ApiError.notFound(`Zone with ID "${zoneId}" does not exist`);
    }
    if (!zone.isActive) {
      throw ApiError.badRequest(`Zone "${zone.name}" is not active`);
    }
  }

  /**
   * Creates a new volunteer.
   */
  async createVolunteer(
    data: CreateVolunteerDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<VolunteerWithRelations> {
    // 1. Duplicate checks
    const [idExists, emailExists] = await Promise.all([
      volunteerRepository.existsByVolunteerId(data.volunteerId),
      volunteerRepository.existsByEmail(data.email),
    ]);

    if (idExists) {
      throw ApiError.conflict(`Volunteer ID "${data.volunteerId}" is already registered`);
    }
    if (emailExists) {
      throw ApiError.conflict(`A volunteer with email "${data.email}" already exists`);
    }

    // 2. Validate organization and zone
    await Promise.all([
      this.validateOrganization(data.organizationId),
      this.validateZone(data.zoneId),
    ]);

    // 3. Create the volunteer
    const volunteer = await volunteerRepository.createVolunteer(data);

    // 4. Audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_CREATED,
      targetEntityType: 'volunteer',
      targetEntityId: volunteer.id,
      targetLabel: `${volunteer.firstName} ${volunteer.lastName} (${volunteer.volunteerId})`,
      details: `Volunteer "${volunteer.firstName} ${volunteer.lastName}" was created with ID ${volunteer.volunteerId}`,
    });

    logger.info(
      `[VOLUNTEER_CREATED] Volunteer ${volunteer.volunteerId} created by actor ${actorId}`
    );

    return {
      ...volunteer,
      fullName: this.computeFullName(volunteer.firstName, volunteer.middleName, volunteer.lastName),
    };
  }

  /**
   * Retrieves a single volunteer by ID.
   */
  async getVolunteerById(id: string): Promise<VolunteerWithRelations> {
    const volunteer = await volunteerRepository.findById(id);
    if (!volunteer) {
      throw ApiError.notFound(`Volunteer with ID "${id}" not found`);
    }
    return {
      ...volunteer,
      fullName: this.computeFullName(volunteer.firstName, volunteer.middleName, volunteer.lastName),
    };
  }

  /**
   * Updates a volunteer's profile.
   */
  async updateVolunteer(
    id: string,
    data: UpdateVolunteerDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<VolunteerWithRelations> {
    // Ensure volunteer exists
    const existing = await volunteerRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Volunteer with ID "${id}" not found`);
    }

    // Validate org/zone if being changed
    if (data.organizationId) await this.validateOrganization(data.organizationId);
    if (data.zoneId) await this.validateZone(data.zoneId);

    // Update
    const volunteer = await volunteerRepository.updateVolunteer(id, data);

    // Audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_UPDATED,
      targetEntityType: 'volunteer',
      targetEntityId: volunteer.id,
      targetLabel: `${volunteer.firstName} ${volunteer.lastName} (${volunteer.volunteerId})`,
      details: `Volunteer "${volunteer.volunteerId}" was updated by actor ${actorId}`,
    });

    logger.info(
      `[VOLUNTEER_UPDATED] Volunteer ${volunteer.volunteerId} updated by actor ${actorId}`
    );

    return {
      ...volunteer,
      fullName: this.computeFullName(volunteer.firstName, volunteer.middleName, volunteer.lastName),
    };
  }

  /**
   * Changes the status of a volunteer using the state machine.
   */
  async changeStatus(
    id: string,
    newStatus: VolunteerProfileStatus,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<VolunteerWithRelations> {
    const volunteer = await volunteerRepository.findById(id);
    if (!volunteer) {
      throw ApiError.notFound(`Volunteer with ID "${id}" not found`);
    }

    const currentStatus = volunteer.status;
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition: cannot change from "${currentStatus}" to "${newStatus}". ` +
          (allowedTransitions.length > 0
            ? `Allowed: ${allowedTransitions.join(', ')}`
            : 'This status is terminal and cannot be changed.')
      );
    }

    const updated = await volunteerRepository.updateStatus(id, newStatus);

    // Determine audit action
    const auditAction =
      newStatus === VolunteerProfileStatus.ACTIVE
        ? VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_REACTIVATED
        : newStatus === VolunteerProfileStatus.EXITED ||
            newStatus === VolunteerProfileStatus.SUSPENDED
          ? VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_DEACTIVATED
          : VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_STATUS_CHANGED;

    await createAuditLog({
      actorId,
      actorRole,
      action: auditAction,
      targetEntityType: 'volunteer',
      targetEntityId: volunteer.id,
      targetLabel: `${volunteer.firstName} ${volunteer.lastName} (${volunteer.volunteerId})`,
      details: `Volunteer status changed from "${currentStatus}" to "${newStatus}" by actor ${actorId}`,
    });

    logger.info(
      `[VOLUNTEER_STATUS_CHANGED] Volunteer ${volunteer.volunteerId}: ${currentStatus} → ${newStatus}`
    );

    return {
      ...updated!,
      fullName: this.computeFullName(updated!.firstName, updated!.middleName, updated!.lastName),
    };
  }

  /**
   * Lists volunteers with pagination, search, sorting, and filtering.
   */
  async listVolunteers(queryParams: QueryParams): Promise<{
    items: (VolunteerWithRelations & { fullName: string })[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const options: VolunteerQueryOptions = {
      page: queryParams.page as number,
      limit: queryParams.limit as number,
      search: queryParams.search as string,
      sortBy: queryParams.sortBy as string,
      sortOrder: queryParams.sortOrder as 'asc' | 'desc',
      organizationId: queryParams.organizationId as string,
      zoneId: queryParams.zoneId as string,
      status: queryParams.status as VolunteerProfileStatus,
      volunteerType: queryParams.volunteerType as string,
      skill: queryParams.skill as string,
    };

    const { skip, take, orderBy } = parseQueryParams(options, 'volunteerId');
    const [volunteers, total] = await Promise.all([
      volunteerRepository.listVolunteers(options, skip, take, orderBy ?? { volunteerId: 'asc' }),
      volunteerRepository.countVolunteers(options),
    ]);

    const items = volunteers.map((v) => ({
      ...v,
      fullName: this.computeFullName(v.firstName, v.middleName, v.lastName),
    }));

    return {
      items,
      meta: buildPaginationMeta(total, options),
    };
  }
}

export const volunteerService = new VolunteerService();
