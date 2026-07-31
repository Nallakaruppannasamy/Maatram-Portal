/**
 * @file src/modules/zone/zone.repository.ts
 * @description Repository layer encapsulating Prisma queries for the Zone model.
 */

import { prisma } from '@/config/database';
import { Zone, Prisma } from '@prisma/client';
import { CreateZoneDTO, UpdateZoneDTO } from './zone.types';

export class ZoneRepository {
  /**
   * Creates a new zone in the database.
   */
  async create(data: CreateZoneDTO): Promise<Zone> {
    return prisma.zone.create({
      data: {
        name: data.name,
        code: data.code,
        regionLabel: data.regionLabel,
        organizationId: data.organizationId,
        inchargeId: data.inchargeId || null,
      },
    });
  }

  /**
   * Updates an existing zone's attributes.
   */
  async update(id: string, data: UpdateZoneDTO): Promise<Zone> {
    return prisma.zone.update({
      where: { id },
      data,
    });
  }

  /**
   * Retrieves a zone by ID, including its parent organization and incharge user.
   */
  async findById(id: string): Promise<Zone | null> {
    return prisma.zone.findUnique({
      where: { id },
      include: {
        organization: true,
        incharge: {
          include: {
            userProfile: true,
          },
        },
      },
    });
  }

  /**
   * Checks if a zone code is already taken, optionally excluding an ID (for updates).
   */
  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const zone = await prisma.zone.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!zone;
  }

  /**
   * Lists zones matching filters, search queries, pagination and sorting.
   */
  async list(
    where: Prisma.ZoneWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ZoneOrderByWithRelationInput | undefined
  ): Promise<Zone[]> {
    return prisma.zone.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        organization: true,
        incharge: {
          include: {
            userProfile: true,
          },
        },
      },
    });
  }

  /**
   * Counts the number of zones matching filters and search queries.
   */
  async count(where: Prisma.ZoneWhereInput): Promise<number> {
    return prisma.zone.count({
      where,
    });
  }

  /**
   * Performs soft deletion of a zone (sets isActive to false).
   */
  async softDelete(id: string): Promise<Zone> {
    return prisma.zone.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const zoneRepository = new ZoneRepository();
