/**
 * @file src/modules/profile/profile.service.ts
 * @description Service layer containing business rules for User Profile self-service.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { logger } from '@/config/logger';
import { profileRepository } from './profile.repository';
import { UpdateProfileDTO } from './profile.types';
import { createAuditLog } from '@/utils/audit';
import { AuditActorRole, UserProfile, Student } from '@prisma/client';

export class ProfileService {
  /**
   * Retrieves profile details for the currently logged in user.
   */
  async getProfile(userId: string, role: string) {
    const profile = await profileRepository.findProfileByUserId(userId, role);
    if (!profile) {
      throw ApiError.notFound('Profile details not found');
    }
    return profile;
  }

  /**
   * Updates profile details and logs audit entry.
   */
  async updateProfile(
    userId: string,
    role: string,
    data: UpdateProfileDTO,
    actorRole: AuditActorRole
  ) {
    let updated: UserProfile | Student;
    let targetLabel = '';

    if (role === 'student') {
      const studentUpdated = await profileRepository.updateStudentProfile(userId, data);
      updated = studentUpdated;
      targetLabel = [studentUpdated.firstName, studentUpdated.middleName, studentUpdated.lastName]
        .filter(Boolean)
        .join(' ');
    } else {
      const staffUpdated = await profileRepository.updateStaffProfile(userId, data);
      updated = staffUpdated;
      targetLabel = staffUpdated.fullName;
    }

    // Record audit entry
    await createAuditLog({
      actorId: userId,
      actorRole,
      action: 'PROFILE_UPDATED',
      targetEntityType: 'profile',
      targetEntityId: userId,
      targetLabel,
      details: `User updated self-service profile details: mobile=${data.mobile || 'N/A'}, designation=${data.designation || 'N/A'}`,
    });

    logger.info(`[PROFILE_UPDATED] Profile updated for user ID: ${userId}`);
    return updated;
  }
}

export const profileService = new ProfileService();
