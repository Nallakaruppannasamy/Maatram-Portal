/**
 * @file src/modules/organization/organization.repository.ts
 * @description Repository layer encapsulating Prisma queries for the Organization model.
 */

import { prisma } from '@/config/database';
import { Organization, Prisma } from '@prisma/client';
import { CreateOrganizationDTO, UpdateOrganizationDTO } from './organization.types';

export class OrganizationRepository {
  /**
   * Creates a new organization in the database.
   */
  async create(data: CreateOrganizationDTO): Promise<Organization> {
    return prisma.organization.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
      },
    });
  }

  /**
   * Updates an existing organization's attributes.
   */
  async update(id: string, data: UpdateOrganizationDTO): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  /**
   * Retrieves an organization by ID.
   */
  async findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Checks if an organization code is already taken, optionally excluding an ID (for updates).
   */
  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const org = await prisma.organization.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!org;
  }

  /**
   * Lists organizations matching filters, search queries, pagination and sorting.
   */
  async list(
    where: Prisma.OrganizationWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.OrganizationOrderByWithRelationInput | undefined
  ): Promise<Organization[]> {
    return prisma.organization.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  /**
   * Counts the number of organizations matching filters and search queries.
   */
  async count(where: Prisma.OrganizationWhereInput): Promise<number> {
    return prisma.organization.count({
      where,
    });
  }

  /**
   * Performs soft deletion of an organization (sets isActive to false).
   */
  async softDelete(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Fetches full nested tree from Organization down to Programs/Degrees
   */
  async getHierarchyTree(): Promise<any[]> {
    return prisma.organization.findMany({
      where: { isActive: true },
      include: {
        zones: {
          where: { isActive: true },
          include: {
            incharge: {
              select: {
                id: true,
                email: true,
                userProfile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
            colleges: {
              where: { isActive: true },
              include: {
                departments: {
                  include: {
                    programs: true,
                  },
                },
                students: {
                  where: {
                    user: {
                      isActive: true,
                    },
                  },
                  select: {
                    id: true,
                    status: true,
                    departmentId: true,
                    programId: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

export const organizationRepository = new OrganizationRepository();
