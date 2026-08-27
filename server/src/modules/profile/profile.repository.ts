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
          skills: {
            orderBy: { skillName: 'asc' },
          },
          projects: {
            orderBy: { createdAt: 'desc' },
          },
          certifications: {
            orderBy: { issueDate: 'desc' },
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
        ...(data.fullName !== undefined && { fullName: data.fullName || 'System User' }),
        ...(data.mobile !== undefined && { mobile: data.mobile }),
        ...(data.designation !== undefined && { designation: data.designation }),
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
        ...(data.bio !== undefined && { bio: data.bio }),
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
          gender: data.gender === null ? null : (data.gender || undefined),
          bloodGroup: data.bloodGroup === null ? null : (data.bloodGroup || undefined),
          nationality: data.nationality === null ? null : (data.nationality || undefined),
          community: data.community === null ? null : (data.community || undefined),
          religion: data.religion === null ? null : (data.religion || undefined),
          mobile: data.mobile === null ? null : (data.mobile || undefined),
          alternateMobile: data.alternateMobile === null ? null : (data.alternateMobile || undefined),
          parentName: data.parentName === null ? null : (data.parentName || undefined),
          parentMobile: data.parentMobile === null ? null : (data.parentMobile || undefined),
          parentOccupation: data.parentOccupation === null ? null : (data.parentOccupation || undefined),
          guardianName: data.guardianName === null ? null : (data.guardianName || undefined),
          guardianMobile: data.guardianMobile === null ? null : (data.guardianMobile || undefined),
          addressLine1: data.addressLine1 === null ? null : (data.addressLine1 || undefined),
          addressLine2: data.addressLine2 === null ? null : (data.addressLine2 || undefined),
          city: data.city === null ? null : (data.city || undefined),
          district: data.district === null ? null : (data.district || undefined),
          state: data.state === null ? null : (data.state || undefined),
          country: data.country === null ? null : (data.country || undefined),
          pincode: data.pincode === null ? null : (data.pincode || undefined),
          collegeId: targetCollegeId,
          departmentId: targetDeptId,
          programId: targetProgramId,
          zoneId: resolvedZoneId, // Automatically assigned!
          batch: targetBatch || undefined,
          academicYear: calculatedAcademicYear || undefined,
          semester: calculatedSemester || undefined,
          cgpa: data.cgpa !== undefined ? data.cgpa : undefined,
          careerObjective: data.careerObjective === null ? null : (data.careerObjective || undefined),
          profileImage: data.profileImage === null ? null : (data.profileImage || undefined),
        },
        include: {
          zone: true,
          college: true,
          department: true,
          program: true,
          semesterGrades: {
            orderBy: { semesterNumber: 'asc' },
          },
          skills: {
            orderBy: { skillName: 'asc' },
          },
          projects: {
            orderBy: { createdAt: 'desc' },
          },
          certifications: {
            orderBy: { issueDate: 'desc' },
          },
        },
      });
    }, { timeout: 20000, maxWait: 10000 });
  }

  // ─── Skill CRUD ──────────────────────────────────────────────────────────
  async addSkill(studentId: string, skillName: string) {
    return prisma.skill.create({
      data: {
        studentId,
        skillName: skillName.trim(),
      },
    });
  }

  async updateSkill(studentId: string, id: string, skillName: string) {
    const existing = await prisma.skill.findFirst({
      where: { id, studentId },
    });
    if (!existing) throw ApiError.notFound('Skill not found or access denied');
    return prisma.skill.update({
      where: { id },
      data: { skillName: skillName.trim() },
    });
  }

  async deleteSkill(studentId: string, id: string) {
    const existing = await prisma.skill.findFirst({
      where: { id, studentId },
    });
    if (!existing) throw ApiError.notFound('Skill not found or access denied');
    return prisma.skill.delete({
      where: { id },
    });
  }

  // ─── Project CRUD ────────────────────────────────────────────────────────
  async addProject(studentId: string, data: any) {
    return prisma.project.create({
      data: {
        studentId,
        title: data.title.trim(),
        description: data.description.trim(),
        techStack: data.techStack.trim(),
        githubUrl: data.githubUrl ? data.githubUrl.trim() : null,
        demoUrl: data.demoUrl ? data.demoUrl.trim() : null,
      },
    });
  }

  async updateProject(studentId: string, id: string, data: any) {
    const existing = await prisma.project.findFirst({
      where: { id, studentId },
    });
    if (!existing) throw ApiError.notFound('Project not found or access denied');
    return prisma.project.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
        techStack: data.techStack !== undefined ? data.techStack.trim() : undefined,
        githubUrl: data.githubUrl !== undefined ? (data.githubUrl ? data.githubUrl.trim() : null) : undefined,
        demoUrl: data.demoUrl !== undefined ? (data.demoUrl ? data.demoUrl.trim() : null) : undefined,
      },
    });
  }

  async deleteProject(studentId: string, id: string) {
    const existing = await prisma.project.findFirst({
      where: { id, studentId },
    });
    if (!existing) throw ApiError.notFound('Project not found or access denied');
    return prisma.project.delete({
      where: { id },
    });
  }

  // ─── Certification CRUD ──────────────────────────────────────────────────
  async addCertification(studentId: string, data: any) {
    return prisma.certification.create({
      data: {
        studentId,
        title: data.title.trim(),
        issuer: data.issuer.trim(),
        issueDate: new Date(data.issueDate),
        certificateUrl: data.certificateUrl ? data.certificateUrl.trim() : null,
      },
    });
  }

  async updateCertification(studentId: string, id: string, data: any) {
    const existing = await prisma.certification.findFirst({
      where: { id, studentId },
    });
    if (!existing) throw ApiError.notFound('Certification not found or access denied');
    return prisma.certification.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        issuer: data.issuer !== undefined ? data.issuer.trim() : undefined,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        certificateUrl: data.certificateUrl !== undefined ? (data.certificateUrl ? data.certificateUrl.trim() : null) : undefined,
      },
    });
  }

  async deleteCertification(studentId: string, id: string) {
    const existing = await prisma.certification.findFirst({
      where: { id, studentId },
    });
    if (!existing) throw ApiError.notFound('Certification not found or access denied');
    return prisma.certification.delete({
      where: { id },
    });
  }
}

export const profileRepository = new ProfileRepository();
