/**
 * @file src/modules/auth/auth.repository.ts
 * @description Repository layer containing all database access queries for the Authentication module.
 */

import { prisma } from '@/config/database';
import { RefreshToken, PasswordResetToken } from '@prisma/client';

export class AuthRepository {
  /**
   * Finds a user by email or register number, joining necessary profiles.
   */
  async findUserByIdentifier(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { registerNumber: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: {
        userProfile: true,
        zone: true,
        student: {
          include: {
            zone: true,
            college: true,
            department: true,
            program: true,
          },
        },
        zoneIncharge: {
          include: {
            colleges: true,
          },
        },
      },
    });
  }

  /**
   * Finds a user by primary key ID, joining necessary profiles.
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
        zone: true,
        student: {
          include: {
            zone: true,
            college: true,
            department: true,
            program: true,
          },
        },
        zoneIncharge: {
          include: {
            colleges: true,
          },
        },
      },
    });
  }

  /**
   * Creates a new refresh token entry in the database.
   */
  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  /**
   * Finds a refresh token by its hash.
   */
  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
  }

  /**
   * Revokes a specific refresh token by its hash.
   */
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes all active refresh tokens for a user.
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Creates a password reset token entry in the database.
   */
  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  /**
   * Finds a valid password reset token by its hash.
   */
  async getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });
  }

  /**
   * Marks a password reset token as used.
   */
  async markPasswordResetUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /**
   * Updates a user's password, first login state, and temporary password.
   */
  async updatePassword(
    userId: string,
    passwordHash: string,
    isFirstLogin = false,
    tempPassword: string | null = null
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        isFirstLogin,
        tempPassword,
      },
    });
  }

  /**
   * Updates the last login timestamp for a user.
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
export const authRepository = new AuthRepository();
