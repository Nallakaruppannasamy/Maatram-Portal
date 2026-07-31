/**
 * @file src/modules/volunteer/volunteer.repository.ts
 * @description Repository layer encapsulating all Prisma queries for Volunteer entities.
 */

import { prisma } from '@/config/database';
import { VolunteerProfileStatus } from '@prisma/client';
import {
  CreateVolunteerDTO,
  UpdateVolunteerDTO,
  VolunteerQueryOptions,
  VolunteerWithRelations,
} from './volunteer.types';

export class VolunteerRepository {
  /**
   * Checks if a volunteer ID already exists (excluding a specific record if updating).
   */
  async existsByVolunteerId(volunteerId: string, excludeId?: string): Promise<boolean> {
    const record = await prisma.volunteer.findFirst({
      where: {
        volunteerId: { equals: volunteerId.trim(), mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
        deletedAt: null,
      },
    });
    return record !== null;
  }

  /**
   * Checks if an email already exists (excluding a specific record if updating).
   */
  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const record = await prisma.volunteer.findFirst({
      where: {
        email: { equals: email.trim().toLowerCase(), mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
        deletedAt: null,
      },
    });
    return record !== null;
  }

  /**
   * Finds a single volunteer by ID (soft-delete aware).
   */
  async findById(id: string): Promise<VolunteerWithRelations | null> {
    return prisma.volunteer.findFirst({
      where: { id, deletedAt: null },
      include: {
        organization: true,
        zone: true,
        skills: true,
      },
    }) as unknown as Promise<VolunteerWithRelations | null>;
  }

  /**
   * Creates a new volunteer along with their skills in a transaction.
   */
  async createVolunteer(data: CreateVolunteerDTO): Promise<VolunteerWithRelations> {
    return prisma.$transaction(async (tx) => {
      const volunteer = await tx.volunteer.create({
        data: {
          volunteerId: data.volunteerId.trim(),
          firstName: data.firstName.trim(),
          middleName: data.middleName?.trim() || null,
          lastName: data.lastName.trim(),
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          email: data.email.trim().toLowerCase(),
          mobile: data.mobile.trim(),
          alternateMobile: data.alternateMobile?.trim() || null,
          organizationId: data.organizationId,
          zoneId: data.zoneId,
          volunteerType: data.volunteerType.trim(),
          joiningDate: new Date(data.joiningDate),
          experience: data.experience?.trim() || null,
          availability: data.availability?.trim() || null,
          emergencyContact: data.emergencyContact?.trim() || null,
          status: VolunteerProfileStatus.ACTIVE,
        },
      });

      // Create skills if provided
      if (data.skills && data.skills.length > 0) {
        const uniqueSkills = [...new Set(data.skills.map((s) => s.trim().toLowerCase()))];
        await tx.volunteerSkill.createMany({
          data: uniqueSkills.map((skillName) => ({
            volunteerId: volunteer.id,
            skillName,
          })),
          skipDuplicates: true,
        });
      }

      // Return full record with relations
      const loaded = await tx.volunteer.findUnique({
        where: { id: volunteer.id },
        include: { organization: true, zone: true, skills: true },
      });

      return loaded as unknown as VolunteerWithRelations;
    });
  }

  /**
   * Updates a volunteer and replaces skills atomically in a transaction.
   */
  async updateVolunteer(id: string, data: UpdateVolunteerDTO): Promise<VolunteerWithRelations> {
    return prisma.$transaction(async (tx) => {
      await tx.volunteer.update({
        where: { id },
        data: {
          firstName: data.firstName !== undefined ? data.firstName.trim() : undefined,
          middleName: data.middleName !== undefined ? data.middleName?.trim() || null : undefined,
          lastName: data.lastName !== undefined ? data.lastName.trim() : undefined,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth !== undefined ? new Date(data.dateOfBirth) : undefined,
          mobile: data.mobile !== undefined ? data.mobile.trim() : undefined,
          alternateMobile: data.alternateMobile,
          organizationId: data.organizationId,
          zoneId: data.zoneId,
          volunteerType: data.volunteerType !== undefined ? data.volunteerType.trim() : undefined,
          joiningDate: data.joiningDate !== undefined ? new Date(data.joiningDate) : undefined,
          experience: data.experience,
          availability: data.availability,
          emergencyContact: data.emergencyContact,
        },
      });

      // Replace skills atomically if provided
      if (data.skills !== undefined) {
        await tx.volunteerSkill.deleteMany({ where: { volunteerId: id } });
        if (data.skills.length > 0) {
          const uniqueSkills = [...new Set(data.skills.map((s) => s.trim().toLowerCase()))];
          await tx.volunteerSkill.createMany({
            data: uniqueSkills.map((skillName) => ({ volunteerId: id, skillName })),
            skipDuplicates: true,
          });
        }
      }

      const loaded = await tx.volunteer.findUnique({
        where: { id },
        include: { organization: true, zone: true, skills: true },
      });

      return loaded as unknown as VolunteerWithRelations;
    });
  }

  /**
   * Updates the status field of a volunteer.
   */
  async updateStatus(id: string, status: VolunteerProfileStatus): Promise<VolunteerWithRelations> {
    await prisma.volunteer.update({ where: { id }, data: { status } });
    return this.findById(id) as unknown as Promise<VolunteerWithRelations>;
  }

  /**
   * Soft-deletes a volunteer (sets deletedAt timestamp).
   */
  async softDelete(id: string): Promise<void> {
    await prisma.volunteer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Lists volunteers with pagination, search, and filtering.
   */
  async listVolunteers(
    options: VolunteerQueryOptions,
    skip: number,
    take: number,
    orderBy: Record<string, unknown>
  ): Promise<VolunteerWithRelations[]> {
    const where = this.buildWhereClause(options);
    return prisma.volunteer.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { organization: true, zone: true, skills: true },
    }) as unknown as Promise<VolunteerWithRelations[]>;
  }

  /**
   * Counts volunteers matching the given filter.
   */
  async countVolunteers(options: VolunteerQueryOptions): Promise<number> {
    const where = this.buildWhereClause(options);
    return prisma.volunteer.count({ where });
  }

  /**
   * Builds a reusable Prisma WHERE clause from query options.
   */
  private buildWhereClause(options: VolunteerQueryOptions): Record<string, unknown> {
    const where: Record<string, unknown> = { deletedAt: null };

    if (options.organizationId) where.organizationId = options.organizationId;
    if (options.zoneId) where.zoneId = options.zoneId;
    if (options.status) where.status = options.status;
    if (options.volunteerType)
      where.volunteerType = { contains: options.volunteerType, mode: 'insensitive' };

    // Filter by skill (looks through the nested skills relation)
    if (options.skill) {
      where.skills = {
        some: { skillName: { contains: options.skill, mode: 'insensitive' } },
      };
    }

    // Full-text search across multiple fields
    if (options.search && options.search.trim()) {
      const searchStr = options.search.trim();
      where.OR = [
        { volunteerId: { contains: searchStr, mode: 'insensitive' } },
        { firstName: { contains: searchStr, mode: 'insensitive' } },
        { lastName: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { mobile: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}

export const volunteerRepository = new VolunteerRepository();
