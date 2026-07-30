/**
 * @file src/modules/user/user.repository.ts
 * @description Repository layer encapsulating Prisma queries for User and UserProfile.
 */

import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';
import { CreateUserDTO, UpdateUserDTO } from './user.types';

export class UserRepository {
  /**
   * Creates a User and UserProfile inside a transaction.
   */
  async create(
    data: CreateUserDTO,
    passwordHash: string,
    tempPassword: string,
    tx: Prisma.TransactionClient = prisma as unknown as Prisma.TransactionClient
  ) {
    return tx.user.create({
      data: {
        email: data.email,
        role: data.role,
        employeeId: data.employeeId || null,
        passwordHash,
        tempPassword,
        isFirstLogin: true,
        isActive: true,
        organizationId: data.organizationId || null,
        zoneId: data.zoneId || null,
        userProfile: {
          create: {
            fullName: data.fullName,
            mobile: data.mobile || null,
            designation: data.designation || null,
          },
        },
      },
      include: {
        userProfile: true,
        organization: true,
        zone: true,
      },
    });
  }

  /**
   * Updates user and profile fields.
   */
  async update(
    id: string,
    data: UpdateUserDTO,
    tx: Prisma.TransactionClient = prisma as unknown as Prisma.TransactionClient
  ) {
    return tx.user.update({
      where: { id },
      data: {
        email: data.email,
        role: data.role,
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        zoneId: data.zoneId,
        isActive: data.isActive,
        userProfile: {
          update: {
            fullName: data.fullName,
            mobile: data.mobile,
            designation: data.designation,
          },
        },
      },
      include: {
        userProfile: true,
        organization: true,
        zone: true,
      },
    });
  }

  /**
   * Retrieves a user by ID with relations.
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
        organization: true,
        zone: true,
        student: true,
      },
    });
  }

  /**
   * Retrieves a user by email.
   */
  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        userProfile: true,
        organization: true,
        zone: true,
      },
    });
  }

  /**
   * Checks if an email is already registered.
   */
  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!user;
  }

  /**
   * Checks if an employee ID is already taken.
   */
  async existsByEmployeeId(employeeId: string, excludeId?: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        employeeId: { equals: employeeId, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!user;
  }

  /**
   * Lists users matching filters and search queries.
   */
  async list(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.UserOrderByWithRelationInput | undefined
  ) {
    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        userProfile: true,
        organization: true,
        zone: true,
      },
    });
  }

  /**
   * Counts users matching filters.
   */
  async count(where: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({
      where,
    });
  }

  /**
   * Deactivates a user account.
   */
  async deactivate(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activates a user account.
   */
  async activate(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
}

export const userRepository = new UserRepository();
