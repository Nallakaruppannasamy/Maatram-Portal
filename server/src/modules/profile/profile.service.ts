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
   * Helper to calculate student profile completion percentage and track missing sections.
   */
  calculateCompletion(profile: any) {
    const sections = {
      'Personal Details': ['firstName', 'lastName', 'gender', 'dateOfBirth', 'bloodGroup', 'nationality', 'community', 'religion'],
      'Contact Details': ['mobile', 'alternateMobile'],
      'Parent/Guardian Details': ['parentName', 'parentMobile', 'parentOccupation'],
      'Address Details': ['addressLine1', 'city', 'district', 'state', 'country', 'pincode'],
      'Academic Details': ['collegeId', 'departmentId', 'programId', 'batch'],
      'Career Details': ['careerObjective'],
      'Media Details': ['profileImage'],
    };

    let totalFields = 0;
    let filledFields = 0;
    const missingSections: string[] = [];

    for (const [sectionName, fields] of Object.entries(sections)) {
      let sectionMissing = false;
      for (const field of fields) {
        totalFields++;
        const val = profile[field];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          filledFields++;
        } else {
          sectionMissing = true;
        }
      }
      if (sectionMissing) {
        missingSections.push(sectionName);
      }
    }

    const completionPercentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 100;

    return {
      completionPercentage,
      missingSections,
    };
  }

  /**
   * Retrieves profile details for the currently logged in user.
   */
  async getProfile(userId: string, role: string) {
    const profile = await profileRepository.findProfileByUserId(userId, role);
    if (!profile) {
      throw ApiError.notFound('Profile details not found');
    }

    if (role === 'student') {
      const completion = this.calculateCompletion(profile);
      return {
        ...profile,
        completionPercentage: completion.completionPercentage,
        missingSections: completion.missingSections,
      };
    }

    return profile;
  }

  /**
   * Retrieves all colleges.
   */
  async getColleges() {
    return profileRepository.getColleges();
  }

  /**
   * Retrieves all degrees.
   */
  async getDegrees() {
    return profileRepository.getDegrees();
  }

  /**
   * Retrieves all departments.
   */
  async getDepartments() {
    return profileRepository.getDepartments();
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
    let updated: any;
    let targetLabel = '';

    if (role === 'student') {
      // Students cannot update restricted fields
      const restrictedFields = ['email', 'registrationNumber', 'dateOfBirth', 'zoneId', 'organizationId'];
      for (const key of restrictedFields) {
        if ((data as any)[key] !== undefined) {
          throw ApiError.badRequest(`Field "${key}" is restricted and cannot be updated by students.`);
        }
      }

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
      details: `User updated self-service profile details: mobile=${data.mobile || 'N/A'}`,
    });

    logger.info(`[PROFILE_UPDATED] Profile updated for user ID: ${userId}`);
    return this.getProfile(userId, role);
  }
}

export const profileService = new ProfileService();
