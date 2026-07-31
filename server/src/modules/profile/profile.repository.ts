/**
 * @file src/modules/profile/profile.repository.ts
 * @description Repository layer encapsulating Prisma queries for User Profile entities.
 */

import { prisma } from '@/config/database';
import { UserProfile, Student } from '@prisma/client';
import { UpdateProfileDTO } from './profile.types';

export class ProfileRepository {
  /**
   * Retrieves profile details for staff (UserProfile) or student (Student).
   */
  async findProfileByUserId(userId: string, role: string): Promise<UserProfile | Student | null> {
    if (role === 'student') {
      return prisma.student.findUnique({
        where: { userId },
        include: {
          zone: true,
          college: true,
          department: true,
          program: true,
        },
      });
    }

    return prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            organization: true,
            zone: true,
          },
        },
      },
    });
  }

  /**
   * Updates staff profile (UserProfile).
   */
  async updateStaffProfile(userId: string, data: UpdateProfileDTO): Promise<UserProfile> {
    return prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        fullName: data.fullName || 'System User',
        mobile: data.mobile || null,
        designation: data.designation || null,
        profileImage: data.profileImage || null,
        bio: data.bio || null,
      },
    });
  }

  /**
   * Updates student profile (Student).
   */
  async updateStudentProfile(
    userId: string,
    data: { fullName?: string; mobile?: string }
  ): Promise<Student> {
    const parts = (data.fullName || '').trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    return prisma.student.update({
      where: { userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        mobile: data.mobile,
      },
    });
  }
}

export const profileRepository = new ProfileRepository();
