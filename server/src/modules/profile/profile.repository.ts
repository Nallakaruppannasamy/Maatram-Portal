/**
 * @file src/modules/profile/profile.repository.ts
 * @description Repository layer encapsulating Prisma queries for User Profile entities.
 */

import { prisma } from '@/config/database';
import { UserProfile, Student } from '@prisma/client';
import { UpdateProfileDTO } from './profile.types';
import { ApiError } from '@/common/exceptions/apiError';
import { calculateAcademicStatus } from '@/utils/academic-calc';

export class ProfileRepository {
  /**
   * Retrieves profile details for staff (UserProfile) or student (Student).
   */
  async findProfileByUserId(userId: string, role: string): Promise<any> {
    if (role === 'student') {
      return prisma.student.findUnique({
        where: { userId },
        include: {
          zone: true,
          college: true,
          department: true,
          program: true,
          semesterGrades: {
            orderBy: { semesterNumber: 'asc' },
          },
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
   * Retrieves all active colleges.
   */
  async getColleges() {
    return prisma.college.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves all degrees (programs).
   */
  async getDegrees() {
    return prisma.program.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves all departments.
   */
  async getDepartments() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Updates staff profile (UserProfile).
   */
  async updateStaffProfile(userId: string, data: UpdateProfileDTO): Promise<UserProfile> {
    return prisma.userProfile.upsert({
      where: { userId },
      update: {
        fullName: data.fullName || undefined,
        mobile: data.mobile || undefined,
        designation: data.designation || undefined,
        profileImage: data.profileImage || undefined,
        bio: data.bio || undefined,
      },
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
   * Updates student profile (Student) using transactional hierarchy verification.
   */
  async updateStudentProfile(userId: string, data: UpdateProfileDTO): Promise<Student> {
    // 1. Fetch current student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw ApiError.notFound('Student profile not found');
    }

    // 2. Validate academic hierarchy & resolve Zone automatically
    const targetCollegeId = data.collegeId !== undefined ? data.collegeId : student.collegeId;
    const targetDeptId = data.departmentId !== undefined ? data.departmentId : student.departmentId;
    const targetProgramId = data.programId !== undefined ? data.programId : student.programId;

    let resolvedZoneId = student.zoneId;

    if (targetCollegeId && targetDeptId && targetProgramId) {
      const [college, dept, prog] = await Promise.all([
        prisma.college.findUnique({ where: { id: targetCollegeId } }),
        prisma.department.findUnique({ where: { id: targetDeptId } }),
        prisma.program.findUnique({ where: { id: targetProgramId } }),
      ]);

      if (!college) throw ApiError.badRequest('Invalid College selection');
      if (!dept) throw ApiError.badRequest('Invalid Department selection');
      if (!prog) throw ApiError.badRequest('Invalid Degree/Program selection');

      if (dept.collegeId !== targetCollegeId) {
        throw ApiError.badRequest('Selected Department does not belong to the selected College');
      }
      if (prog.departmentId !== targetDeptId) {
        throw ApiError.badRequest('Selected Degree/Program does not belong to the selected Department');
      }

      resolvedZoneId = college.zoneId;
    } else if (targetCollegeId || targetDeptId || targetProgramId) {
      // If only some are provided, throw an error
      throw ApiError.badRequest('College, Department, and Degree/Program must all be specified together');
    }

    // 3. Compute academic year and semester if batch is set/changed
    const targetBatch = data.batch || student.batch;
    let calculatedAcademicYear = student.academicYear;
    let calculatedSemester = student.semester;

    if (data.batch) {
      const calculated = calculateAcademicStatus(data.batch);
      calculatedAcademicYear = calculated.academicYear;
      calculatedSemester = calculated.semester;
    }

    // 4. Update student and semester grades within a transaction
    return prisma.$transaction(async (tx) => {
      if (data.semesterGrades) {
        // Clear existing GPAs
        await tx.semesterGrade.deleteMany({
          where: { studentId: student.id },
        });

        // Insert new GPAs
        if (data.semesterGrades.length > 0) {
          await tx.semesterGrade.createMany({
            data: data.semesterGrades.map((g) => ({
              studentId: student.id,
              semesterNumber: g.semesterNumber,
              gpa: g.gpa,
            })),
          });
        }
      }

      return tx.student.update({
        where: { userId },
        data: {
          firstName: data.firstName || undefined,
          middleName: data.middleName === null ? null : (data.middleName || undefined),
          lastName: data.lastName || undefined,
          gender: data.gender || undefined,
          bloodGroup: data.bloodGroup || undefined,
          nationality: data.nationality === null ? null : (data.nationality || undefined),
          community: data.community === null ? null : (data.community || undefined),
          religion: data.religion === null ? null : (data.religion || undefined),
          mobile: data.mobile || undefined,
          alternateMobile: data.alternateMobile === null ? null : (data.alternateMobile || undefined),
          parentName: data.parentName || undefined,
          parentMobile: data.parentMobile || undefined,
          parentOccupation: data.parentOccupation === null ? null : (data.parentOccupation || undefined),
          guardianName: data.guardianName === null ? null : (data.guardianName || undefined),
          guardianMobile: data.guardianMobile === null ? null : (data.guardianMobile || undefined),
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 === null ? null : (data.addressLine2 || undefined),
          city: data.city || undefined,
          district: data.district || undefined,
          state: data.state || undefined,
          country: data.country || undefined,
          pincode: data.pincode || undefined,
          collegeId: targetCollegeId,
          departmentId: targetDeptId,
          programId: targetProgramId,
          zoneId: resolvedZoneId, // Automatically assigned!
          batch: targetBatch || undefined,
          academicYear: calculatedAcademicYear || undefined,
          semester: calculatedSemester || undefined,
          cgpa: data.cgpa !== undefined ? data.cgpa : undefined,
          careerObjective: data.careerObjective !== undefined ? data.careerObjective : undefined,
          profileImage: data.profileImage !== undefined ? data.profileImage : undefined,
        },
        include: {
          zone: true,
          college: true,
          department: true,
          program: true,
          semesterGrades: {
            orderBy: { semesterNumber: 'asc' },
          },
        },
      });
    });
  }
}

export const profileRepository = new ProfileRepository();
