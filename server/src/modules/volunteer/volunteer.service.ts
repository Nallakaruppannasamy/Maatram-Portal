/**
 * @file src/modules/volunteer/volunteer.service.ts
 * @description Service layer containing business logic for Volunteer Management.
 */

import { VolunteerProfileStatus, AuditActorRole, VolunteerCategory, VolunteerStatus, NotificationType } from '@prisma/client';
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
import { zoneService } from '../zone/zone.service';
import * as XLSX from 'xlsx';

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
   * Changes the status of a volunteer or volunteer submission.
   */
  async changeStatus(
    id: string,
    newStatus: string,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<any> {
    const statusStr = String(newStatus).toLowerCase();
    const isSubmissionStatus = ['pending', 'approved', 'rejected'].includes(statusStr);

    if (isSubmissionStatus) {
      if (actorRole === AuditActorRole.admin) {
        throw ApiError.forbidden(
          'Super Admin has read-only access to volunteer submissions. Approval and rejection are restricted to Zone Incharges.'
        );
      }
      return this.updateSubmissionStatus(id, newStatus, undefined, actorId, actorRole);
    }

    const upperStatus = newStatus.toUpperCase() as VolunteerProfileStatus;
    const volunteer = await volunteerRepository.findById(id);
    if (!volunteer) {
      throw ApiError.notFound(`Volunteer or Submission with ID "${id}" not found`);
    }

    const currentStatus = volunteer.status;
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(upperStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition: cannot change from "${currentStatus}" to "${upperStatus}". ` +
          (allowedTransitions.length > 0
            ? `Allowed: ${allowedTransitions.join(', ')}`
            : 'This status is terminal and cannot be changed.')
      );
    }

    const updated = await volunteerRepository.updateStatus(id, upperStatus);

    const auditAction =
      upperStatus === VolunteerProfileStatus.ACTIVE
        ? VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_REACTIVATED
        : upperStatus === VolunteerProfileStatus.EXITED ||
            upperStatus === VolunteerProfileStatus.SUSPENDED
          ? VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_DEACTIVATED
          : VOLUNTEER_AUDIT_ACTIONS.VOLUNTEER_STATUS_CHANGED;

    await createAuditLog({
      actorId,
      actorRole,
      action: auditAction,
      targetEntityType: 'volunteer',
      targetEntityId: volunteer.id,
      targetLabel: `${volunteer.firstName} ${volunteer.lastName} (${volunteer.volunteerId})`,
      details: `Volunteer status changed from "${currentStatus}" to "${upperStatus}" by actor ${actorId}`,
    });

    logger.info(
      `[VOLUNTEER_STATUS_CHANGED] Volunteer ${volunteer.volunteerId}: ${currentStatus} → ${upperStatus}`
    );

    return {
      ...updated!,
      fullName: this.computeFullName(updated!.firstName, updated!.middleName, updated!.lastName),
    };
  }

  /**
   * Lists volunteers or volunteer submissions with pagination, search, and filtering.
   */
  async listVolunteers(
    queryParams: QueryParams,
    actorId?: string,
    actorRole?: string
  ): Promise<{
    items: any[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const rawStatus = queryParams.status ? String(queryParams.status).trim() : undefined;
    const lowerStatus = rawStatus ? rawStatus.toLowerCase() : undefined;

    const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected'];
    const PROFILE_STATUSES = ['active', 'inactive', 'on_leave', 'suspended', 'exited'];

    if (
      lowerStatus &&
      !SUBMISSION_STATUSES.includes(lowerStatus) &&
      !PROFILE_STATUSES.includes(lowerStatus)
    ) {
      throw ApiError.badRequest(
        `Invalid status filter value: "${rawStatus}". Supported status values are: pending, approved, rejected, active, inactive, on_leave, suspended, exited.`
      );
    }

    const isStudent = actorRole === 'student';
    const isSubmissionQuery =
      isStudent ||
      queryParams.view === 'logs' ||
      queryParams.type === 'submissions' ||
      queryParams.type === 'submission' ||
      (lowerStatus ? SUBMISSION_STATUSES.includes(lowerStatus) : false);

    if (isSubmissionQuery) {
      let studentId: string | undefined = undefined;
      let zoneId: string | undefined = undefined;

      if (isStudent && actorId) {
        const student = await prisma.student.findUnique({ where: { userId: actorId } });
        if (!student) throw ApiError.notFound('Student profile not found');
        studentId = student.id;
      } else if (actorRole === 'zone' && actorId) {
        const assignedZoneId = await zoneService.getAssignedZoneIdForUser(actorId);
        if (assignedZoneId) {
          zoneId = assignedZoneId;
        } else {
          return {
            items: [],
            meta: buildPaginationMeta(0, {
              page: queryParams.page ? Number(queryParams.page) : 1,
              limit: queryParams.limit ? Number(queryParams.limit) : 10,
            }),
          };
        }
      } else if (actorRole === 'admin' && queryParams.zoneId && queryParams.zoneId !== 'All' && queryParams.zoneId !== 'all') {
        zoneId = String(queryParams.zoneId);
      }

      const { items, total } = await volunteerRepository.listSubmissions({
        page: queryParams.page ? Number(queryParams.page) : 1,
        limit: queryParams.limit ? Number(queryParams.limit) : 10,
        search: queryParams.search as string,
        status: lowerStatus && lowerStatus !== 'all' ? lowerStatus : undefined,
        category: queryParams.category as string,
        collegeId: queryParams.collegeId as string,
        studentId,
        zoneId,
      });

      return {
        items,
        meta: buildPaginationMeta(total, {
          page: queryParams.page ? Number(queryParams.page) : 1,
          limit: queryParams.limit ? Number(queryParams.limit) : 10,
        }),
      };
    }

    const options: VolunteerQueryOptions = {
      page: queryParams.page as number,
      limit: queryParams.limit as number,
      search: queryParams.search as string,
      sortBy: queryParams.sortBy as string,
      sortOrder: queryParams.sortOrder as 'asc' | 'desc',
      organizationId: queryParams.organizationId as string,
      zoneId: queryParams.zoneId as string,
      status: lowerStatus ? (lowerStatus.toUpperCase() as VolunteerProfileStatus) : undefined,
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

  /**
   * Creates a volunteer activity submission for a student.
   */
  async createSubmission(
    data: {
      title: string;
      category: VolunteerCategory;
      description: string;
      eventDate: string;
      count?: number | null;
      imageUrl?: string | null;
    },
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<any> {
    const student = await prisma.student.findUnique({
      where: { userId: actorId },
    });
    if (!student) {
      throw ApiError.notFound('Student profile not found');
    }

    if (!student.zoneId) {
      throw ApiError.badRequest('Student is not assigned to any Zone. Cannot submit volunteer log.');
    }

    // Validate category-specific count rules
    const countRequiredCategories: VolunteerCategory[] = [
      VolunteerCategory.TELE_VERIFICATION,
      VolunteerCategory.PHYSICAL_VERIFICATION,
      VolunteerCategory.SCHOOL_VISIT,
    ];

    let countValue: number | null = null;
    if (countRequiredCategories.includes(data.category)) {
      if (data.count === undefined || data.count === null) {
        throw ApiError.badRequest(`Count is mandatory for category ${data.category}`);
      }
      countValue = Number(data.count);
      if (isNaN(countValue) || countValue < 1 || countValue > 1000) {
        throw ApiError.badRequest('Count must be an integer between 1 and 1000');
      }
    }

    const submissionCode = await volunteerRepository.generateSubmissionCode();

    const submission = await volunteerRepository.createSubmission({
      submissionCode,
      studentId: student.id,
      zoneId: student.zoneId,
      title: data.title.trim(),
      category: data.category,
      description: data.description.trim(),
      eventDate: new Date(data.eventDate),
      count: countValue,
      imageUrl: data.imageUrl || null,
    });

    // Notify the student's assigned Zone Incharge
    const zone = await prisma.zone.findUnique({
      where: { id: student.zoneId },
      select: { inchargeId: true, name: true },
    });

    if (zone?.inchargeId) {
      await prisma.notification.create({
        data: {
          recipientId: zone.inchargeId,
          title: 'New Volunteering Activity Submitted',
          message: `Scholar ${student.firstName} ${student.lastName} submitted a new volunteering log "${data.title.trim()}" in ${zone.name}. Requires review/action.`,
          type: NotificationType.pending,
        },
      }).catch((e) => logger.warn(`Failed to notify zone incharge: ${e.message}`));
    }

    await createAuditLog({
      actorId,
      actorRole,
      action: 'VOLUNTEER_SUBMITTED',
      targetEntityType: 'volunteer_submission',
      targetEntityId: submission.id,
      targetLabel: submission.title,
      details: `Student submitted volunteer log with code ${submissionCode}`,
    });

    return submission;
  }

  /**
   * Fetches a volunteer submission by ID.
   */
  async getSubmissionById(id: string, actorId: string, actorRole: string): Promise<any> {
    const submission = await volunteerRepository.getSubmissionById(id);
    if (!submission) {
      throw ApiError.notFound(`Volunteer submission with ID "${id}" not found`);
    }

    if (actorRole === 'student') {
      const student = await prisma.student.findUnique({ where: { userId: actorId } });
      if (!student || submission.studentId !== student.id) {
        throw ApiError.forbidden('You are not authorized to view this volunteer submission');
      }
    } else if (actorRole === 'zone') {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(actorId);
      if (!assignedZoneId || submission.zoneId !== assignedZoneId) {
        throw ApiError.forbidden('You are not authorized to view submissions outside your zone');
      }
    }

    return submission;
  }

  /**
   * Updates a volunteer submission's approval status.
   */
  async updateSubmissionStatus(
    id: string,
    newStatus: string,
    reviewerComment: string | undefined,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<any> {
    const statusUpper = newStatus.toUpperCase();
    if (statusUpper !== 'APPROVED' && statusUpper !== 'REJECTED') {
      throw ApiError.badRequest('Invalid status value. Must be APPROVED or REJECTED');
    }

    const submission = await volunteerRepository.getSubmissionById(id);
    if (!submission) {
      throw ApiError.notFound(`Volunteer submission with ID "${id}" not found`);
    }

    if (statusUpper === 'REJECTED' && (!reviewerComment || !reviewerComment.trim())) {
      throw ApiError.badRequest('Rejection comments are mandatory');
    }

    if (actorRole === AuditActorRole.admin) {
      throw ApiError.forbidden(
        'Super Admin has read-only access to volunteer submissions. Approval and rejection are restricted to Zone Incharges.'
      );
    }

    if (actorRole !== AuditActorRole.zone) {
      throw ApiError.forbidden('Only Zone Incharges are authorized to review volunteer submissions');
    }

    const assignedZoneId = await zoneService.getAssignedZoneIdForUser(actorId);
    if (!assignedZoneId || submission.zoneId !== assignedZoneId) {
      throw ApiError.forbidden('You are not authorized to review submissions outside your zone');
    }

    const statusValue = statusUpper.toLowerCase() as any;
    const updated = await volunteerRepository.updateSubmissionStatus(
      id,
      statusValue,
      reviewerComment,
      actorId
    );

    const auditAction = statusUpper === 'APPROVED' ? 'VOLUNTEER_APPROVED' : 'VOLUNTEER_REJECTED';
    await createAuditLog({
      actorId,
      actorRole,
      action: auditAction,
      targetEntityType: 'volunteer_submission',
      targetEntityId: id,
      targetLabel: submission.title,
      details: `Volunteer submission ${id} was ${statusValue} by actor ${actorId}`,
    });

    await prisma.notification.create({
      data: {
        recipientId: submission.student.userId,
        title: statusUpper === 'APPROVED' ? 'Volunteer Log Approved!' : 'Volunteer Log Rejected',
        message: `Your submission "${submission.title}" has been ${statusValue}.${
          reviewerComment ? ` Comment: ${reviewerComment}` : ''
        }`,
        type: statusUpper === 'APPROVED' ? 'approved' : 'rejected',
      },
    });

    return updated;
  }

  /**
   * Adds or updates a comment on a volunteer submission.
   */
  async addSubmissionComment(
    id: string,
    comment: string,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<any> {
    const submission = await volunteerRepository.getSubmissionById(id);
    if (!submission) {
      throw ApiError.notFound(`Volunteer submission with ID "${id}" not found`);
    }

    if (actorRole === AuditActorRole.admin) {
      throw ApiError.forbidden(
        'Super Admin has read-only access to volunteer submissions. Comments are restricted to Zone Incharges.'
      );
    }

    if (actorRole !== AuditActorRole.zone) {
      throw ApiError.forbidden('Only Zone Incharges are authorized to comment on volunteer submissions');
    }

    const assignedZoneId = await zoneService.getAssignedZoneIdForUser(actorId);
    if (!assignedZoneId || submission.zoneId !== assignedZoneId) {
      throw ApiError.forbidden('You are not authorized to comment on submissions outside your zone');
    }

    const updated = await volunteerRepository.addSubmissionComment(id, comment, actorId);

    await createAuditLog({
      actorId,
      actorRole,
      action: 'VOLUNTEER_COMMENT_ADDED',
      targetEntityType: 'volunteer_submission',
      targetEntityId: id,
      targetLabel: submission.title,
      details: `Comment added to volunteer submission ${id}: "${comment}"`,
    });

    return updated;
  }

  /**
   * Exports all filtered volunteering logs to an Excel file buffer.
   */
  async exportVolunteeringLogs(
    queryParams: QueryParams,
    actorId?: string,
    actorRole?: string
  ): Promise<Buffer> {
    let studentId: string | undefined = undefined;
    let zoneId: string | undefined = undefined;

    if (actorRole === 'student' && actorId) {
      const student = await prisma.student.findUnique({ where: { userId: actorId } });
      if (!student) throw ApiError.notFound('Student profile not found');
      studentId = student.id;
    } else if (actorRole === 'zone' && actorId) {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(actorId);
      if (assignedZoneId) {
        zoneId = assignedZoneId;
      } else {
        const emptyWb = XLSX.utils.book_new();
        const emptyWs = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(emptyWb, emptyWs, 'Volunteering Logs');
        return XLSX.write(emptyWb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      }
    } else if (actorRole === 'admin' && queryParams.zoneId && queryParams.zoneId !== 'All' && queryParams.zoneId !== 'all') {
      zoneId = String(queryParams.zoneId);
    }

    const rawStatus = queryParams.status ? String(queryParams.status).trim().toLowerCase() : undefined;

    const items = await volunteerRepository.exportSubmissions({
      search: queryParams.search as string,
      status: rawStatus && rawStatus !== 'all' ? rawStatus : undefined,
      category: queryParams.category as string,
      collegeId: queryParams.collegeId as string,
      studentId,
      zoneId,
    });

    const rows = items.map((sub) => {
      const studentFullName = sub.student
        ? [sub.student.firstName, sub.student.middleName, sub.student.lastName].filter(Boolean).join(' ')
        : 'N/A';
      const reviewerName = sub.reviewer?.userProfile?.fullName || sub.reviewer?.email || 'N/A';
      const eventDateStr = sub.eventDate ? new Date(sub.eventDate).toISOString().split('T')[0] : 'N/A';
      const createdAtStr = sub.createdAt ? new Date(sub.createdAt).toISOString().split('T')[0] : 'N/A';

      return {
        'Submission Code': sub.submissionCode || 'N/A',
        'Student Name': studentFullName,
        'Register Number': sub.student?.registrationNumber || 'N/A',
        College: sub.student?.college?.name || 'N/A',
        Zone: sub.zone?.name || 'N/A',
        Category: sub.category || 'N/A',
        Title: sub.title || 'N/A',
        Description: sub.description || 'N/A',
        'Event Date': eventDateStr,
        Count: sub.count ?? 'N/A',
        Points: sub.points || 0,
        Status: (sub.status || 'PENDING').toUpperCase(),
        'Reviewer Name': reviewerName,
        'Reviewer Comment': sub.reviewerComment || '',
        'Submitted At': createdAtStr,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Volunteering Logs');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

export const volunteerService = new VolunteerService();
