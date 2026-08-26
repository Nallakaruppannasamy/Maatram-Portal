/**
 * @file src/modules/profile/profile.service.ts
 * @description Service layer containing business rules for User Profile self-service.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { prisma } from '@/config/database';
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
        if ((data as any)[key] !== undefined && (data as any)[key] !== null) {
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

  /**
   * Helper to ensure active user is a student and resolve their Student entity ID.
   */
  private async getStudentIdForUser(userId: string, role: string): Promise<string> {
    if (role !== 'student') {
      throw ApiError.forbidden('Only students can manage their skills, projects, and certifications');
    }
    const profile = await profileRepository.findProfileByUserId(userId, 'student');
    if (!profile || !profile.id) {
      throw ApiError.notFound('Student profile not found');
    }
    return profile.id;
  }

  // ─── Skill Services ──────────────────────────────────────────────────────
  async addSkill(userId: string, role: string, skillName: string) {
    if (!skillName || !skillName.trim()) throw ApiError.badRequest('Skill name is required');
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.addSkill(studentId, skillName);
  }

  async updateSkill(userId: string, role: string, id: string, skillName: string) {
    if (!skillName || !skillName.trim()) throw ApiError.badRequest('Skill name is required');
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.updateSkill(studentId, id, skillName);
  }

  async deleteSkill(userId: string, role: string, id: string) {
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.deleteSkill(studentId, id);
  }

  // ─── Project Services ────────────────────────────────────────────────────
  async addProject(userId: string, role: string, data: any) {
    if (!data.title || !data.title.trim()) throw ApiError.badRequest('Project title is required');
    if (!data.description || !data.description.trim()) throw ApiError.badRequest('Project description is required');
    if (!data.techStack || !data.techStack.trim()) throw ApiError.badRequest('Tech stack is required');
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.addProject(studentId, data);
  }

  async updateProject(userId: string, role: string, id: string, data: any) {
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.updateProject(studentId, id, data);
  }

  async deleteProject(userId: string, role: string, id: string) {
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.deleteProject(studentId, id);
  }

  // ─── Certification Services ──────────────────────────────────────────────
  async addCertification(userId: string, role: string, data: any) {
    if (!data.title || !data.title.trim()) throw ApiError.badRequest('Certification title is required');
    if (!data.issuer || !data.issuer.trim()) throw ApiError.badRequest('Issuer is required');
    if (!data.issueDate) throw ApiError.badRequest('Issue date is required');
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.addCertification(studentId, data);
  }

  async updateCertification(userId: string, role: string, id: string, data: any) {
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.updateCertification(studentId, id, data);
  }

  async deleteCertification(userId: string, role: string, id: string) {
    const studentId = await this.getStudentIdForUser(userId, role);
    return profileRepository.deleteCertification(studentId, id);
  }

  /**
   * Automatically persists an uploaded profile image URL and returns the updated profile.
   */
  async uploadProfileImage(userId: string, role: string, fileUrl: string) {
    if (role === 'student') {
      await prisma.student.updateMany({
        where: { userId },
        data: { profileImage: fileUrl },
      });
    } else {
      await prisma.userProfile.upsert({
        where: { userId },
        update: { profileImage: fileUrl },
        create: {
          userId,
          fullName: 'System User',
          profileImage: fileUrl,
        },
      });
    }
    return this.getProfile(userId, role);
  }
}

export const profileService = new ProfileService();
