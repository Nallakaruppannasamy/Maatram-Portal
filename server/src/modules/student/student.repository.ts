/**
 * @file src/modules/student/student.repository.ts
 * @description Repository layer encapsulating Prisma queries for Student entities.
 */

import { prisma } from '@/config/database';
import { Student, StudentStatus, UserRole, AccountStatus } from '@prisma/client';
import {
  CreateStudentDTO,
  UpdateStudentDTO,
  StudentQueryOptions,
  StudentWithRelations,
} from './student.types';

export class StudentRepository {
  /**
   * Checks if a registration number already exists (excluding a specific student ID if updating).
   */
  async existsByRegistrationNumber(regNum: string, excludeId?: string): Promise<boolean> {
    const student = await prisma.student.findFirst({
      where: {
        registrationNumber: { equals: regNum.trim(), mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return student !== null;
  }

  /**
   * Checks if an email already exists (excluding a specific user ID if updating).
   */
  async existsByEmail(email: string, excludeUserId?: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email.trim(), mode: 'insensitive' },
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
    });
    return user !== null;
  }

  /**
   * Finds a student by Student ID, returning all relations.
   */
  async findById(id: string): Promise<StudentWithRelations | null> {
    return prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        organization: true,
        zone: true,
        college: true,
        department: true,
        program: true,
      },
    }) as unknown as Promise<StudentWithRelations | null>;
  }

  /**
   * Finds a student by Student ID or User ID with all relations needed for a resume.
   */
  async findByIdWithResumeData(identifier: string): Promise<any | null> {
    return prisma.student.findFirst({
      where: {
        OR: [
          { id: identifier },
          { userId: identifier },
        ],
      },
      include: {
        user: true,
        organization: true,
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
        volunteerSubmissions: {
          where: {
            status: 'approved',
          },
          orderBy: { eventDate: 'desc' },
        },
      },
    });
  }

  /**
   * Finds a student by User ID.
   */
  async findByUserId(userId: string): Promise<Student | null> {
    return prisma.student.findUnique({
      where: { userId },
    });
  }

  /**
   * Creates both a User identity and a Student profile in a transaction.
   */
  async createStudent(
    data: CreateStudentDTO,
    tempPasswordHashed: string
  ): Promise<StudentWithRelations> {
    const verificationCode = `MTM-${data.batch.split('-')[0] || new Date().getFullYear()}-${data.registrationNumber.trim().toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email.trim().toLowerCase(),
          registerNumber: data.registrationNumber.trim(),
          role: UserRole.student,
          passwordHash: tempPasswordHashed,
          isFirstLogin: true,
          isActive: true,
          organizationId: data.organizationId,
          zoneId: data.zoneId,
        },
      });

      // 2. Create Student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          registrationNumber: data.registrationNumber.trim(),
          firstName: data.firstName.trim(),
          middleName: data.middleName?.trim() || null,
          lastName: data.lastName.trim(),
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          bloodGroup: data.bloodGroup || null,
          nationality: data.nationality?.trim() || null,
          community: data.community?.trim() || null,
          religion: data.religion?.trim() || null,
          mobile: data.mobile?.trim() || null,
          alternateMobile: data.alternateMobile?.trim() || null,
          parentName: data.parentName.trim(),
          parentMobile: data.parentMobile.trim(),
          parentOccupation: data.parentOccupation?.trim() || null,
          guardianName: data.guardianName?.trim() || null,
          guardianMobile: data.guardianMobile?.trim() || null,
          addressLine1: data.addressLine1.trim(),
          addressLine2: data.addressLine2?.trim() || null,
          city: data.city.trim(),
          district: data.district.trim(),
          state: data.state.trim(),
          country: data.country.trim(),
          pincode: data.pincode.trim(),
          organizationId: data.organizationId,
          zoneId: data.zoneId,
          collegeId: data.collegeId,
          departmentId: data.departmentId,
          programId: data.programId,
          course: data.course.trim(),
          batch: data.batch.trim(),
          academicYear: data.academicYear.trim(),
          semester: data.semester?.trim() || null,
          section: data.section?.trim() || null,
          verificationCode,
          accountStatus: AccountStatus.pending_first_login,
          status: StudentStatus.ACTIVE,
        },
      });

      // Fetch student with loaded relations to return
      const loaded = await tx.student.findUnique({
        where: { id: student.id },
        include: {
          user: true,
          organization: true,
          zone: true,
          college: true,
          department: true,
          program: true,
        },
      });

      return loaded as unknown as StudentWithRelations;
    });
  }

  /**
   * Updates Student profile and User email/registrationNumber inside a transaction.
   */
  async updateStudent(
    id: string,
    userId: string,
    data: UpdateStudentDTO
  ): Promise<StudentWithRelations> {
    return prisma.$transaction(async (tx) => {
      // 1. Update User identity if email or registrationNumber changed
      if (
        data.registrationNumber !== undefined ||
        data.organizationId !== undefined ||
        data.zoneId !== undefined
      ) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.registrationNumber !== undefined && {
              registerNumber: data.registrationNumber.trim(),
            }),
            ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
            ...(data.zoneId !== undefined && { zoneId: data.zoneId }),
          },
        });
      }

      // 2. Update Student Profile
      const student = await tx.student.update({
        where: { id },
        data: {
          firstName: data.firstName !== undefined ? data.firstName.trim() : undefined,
          middleName: data.middleName !== undefined ? data.middleName?.trim() || null : undefined,
          lastName: data.lastName !== undefined ? data.lastName.trim() : undefined,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth !== undefined ? new Date(data.dateOfBirth) : undefined,
          bloodGroup: data.bloodGroup,
          nationality: data.nationality,
          community: data.community,
          religion: data.religion,
          mobile: data.mobile,
          alternateMobile: data.alternateMobile,
          parentName: data.parentName !== undefined ? data.parentName.trim() : undefined,
          parentMobile: data.parentMobile !== undefined ? data.parentMobile.trim() : undefined,
          parentOccupation: data.parentOccupation,
          guardianName: data.guardianName,
          guardianMobile: data.guardianMobile,
          addressLine1: data.addressLine1 !== undefined ? data.addressLine1.trim() : undefined,
          addressLine2: data.addressLine2,
          city: data.city !== undefined ? data.city.trim() : undefined,
          district: data.district !== undefined ? data.district.trim() : undefined,
          state: data.state !== undefined ? data.state.trim() : undefined,
          country: data.country !== undefined ? data.country.trim() : undefined,
          pincode: data.pincode !== undefined ? data.pincode.trim() : undefined,
          organizationId: data.organizationId,
          zoneId: data.zoneId,
          collegeId: data.collegeId,
          departmentId: data.departmentId,
          programId: data.programId,
          course: data.course !== undefined ? data.course.trim() : undefined,
          batch: data.batch !== undefined ? data.batch.trim() : undefined,
          academicYear: data.academicYear !== undefined ? data.academicYear.trim() : undefined,
          semester: data.semester,
          section: data.section,
        },
      });

      const loaded = await tx.student.findUnique({
        where: { id: student.id },
        include: {
          user: true,
          organization: true,
          zone: true,
          college: true,
          department: true,
          program: true,
        },
      });

      return loaded as unknown as StudentWithRelations;
    });
  }

  /**
   * Changes status of a student (and optionally disables User login if deactivated).
   */
  async changeStatus(
    id: string,
    userId: string,
    status: StudentStatus
  ): Promise<StudentWithRelations> {
    return prisma.$transaction(async (tx) => {
      // 1. Update Student status
      const student = await tx.student.update({
        where: { id },
        data: { status },
      });

      // 2. Disable User account if status is INACTIVE, SUSPENDED, or DROPPED
      const shouldDeactivate = ['INACTIVE', 'SUSPENDED', 'DROPPED'].includes(status);
      await tx.user.update({
        where: { id: userId },
        data: { isActive: !shouldDeactivate },
      });

      const loaded = await tx.student.findUnique({
        where: { id: student.id },
        include: {
          user: true,
          organization: true,
          zone: true,
          college: true,
          department: true,
          program: true,
        },
      });

      return loaded as unknown as StudentWithRelations;
    });
  }

  /**
   * Updates SPOC status of a student.
   */
  async updateSpoc(id: string, isSpoc: boolean): Promise<StudentWithRelations> {
    const updated = await prisma.student.update({
      where: { id },
      data: { isSpoc },
      include: {
        user: true,
        organization: true,
        zone: true,
        college: true,
        department: true,
        program: true,
      },
    });

    return updated as unknown as StudentWithRelations;
  }

  /**
   * Executes a bulk insert of student records inside a single transaction.
   */
  async importStudents(
    records: {
      user: {
        email: string;
        registerNumber: string;
        role: UserRole;
        passwordHash: string;
        isFirstLogin: boolean;
        isActive: boolean;
        organizationId: string;
        zoneId: string;
      };
      student: Omit<Student, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    }[]
  ): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        for (const record of records) {
          // 1. Create User
          const user = await tx.user.create({
            data: record.user,
          });

          // 2. Create Student with userId
          await tx.student.create({
            data: {
              ...record.student,
              userId: user.id,
            },
          });
        }
      },
      {
        maxWait: 95000,
        timeout: 90000,
      }
    );
  }

  /**
   * Builds the Prisma where query clauses based on search/filter options.
   */
  buildWhereClause(options: StudentQueryOptions) {
    const where: Record<string, unknown> = {};

    // Filters
    if (options.organizationId) {
      where.organizationId = options.organizationId;
    }
    if (options.zoneId) {
      where.zoneId = options.zoneId;
    }
    if (options.collegeId) {
      where.collegeId = options.collegeId;
    }
    if (options.departmentId) {
      where.departmentId = options.departmentId;
    }
    if (options.status) {
      where.status = options.status;
    }
    if (options.batch) {
      where.batch = { equals: options.batch.trim(), mode: 'insensitive' };
    }
    if (options.academicYear) {
      where.academicYear = { equals: options.academicYear.trim(), mode: 'insensitive' };
    }
    if (options.isSpoc !== undefined) {
      where.isSpoc = options.isSpoc;
    }

    // Active vs Archived lifecycle filtering (defaults to User.isActive = true)
    if (options.isActive !== undefined) {
      where.user = {
        ...((where.user as Record<string, unknown>) || {}),
        isActive: options.isActive,
      };
    } else if (options.scope === 'archived') {
      where.user = {
        ...((where.user as Record<string, unknown>) || {}),
        isActive: false,
      };
    } else if (options.scope === 'all' || options.view === 'provisioning') {
      // Do not restrict by User.isActive (Student Provisioning / global admin views)
    } else {
      // Default: Active Student Directory
      where.user = {
        ...((where.user as Record<string, unknown>) || {}),
        isActive: true,
      };
    }

    // Search query
    if (options.search) {
      const searchStr = options.search.trim();
      where.OR = [
        { registrationNumber: { contains: searchStr, mode: 'insensitive' } },
        { firstName: { contains: searchStr, mode: 'insensitive' } },
        { middleName: { contains: searchStr, mode: 'insensitive' } },
        { lastName: { contains: searchStr, mode: 'insensitive' } },
        { parentName: { contains: searchStr, mode: 'insensitive' } },
        { mobile: { contains: searchStr, mode: 'insensitive' } },
        { course: { contains: searchStr, mode: 'insensitive' } },
        { user: { email: { contains: searchStr, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  /**
   * Lists students with search, filters, pagination, and sorting.
   */
  async listStudents(
    options: StudentQueryOptions,
    skip: number,
    take: number,
    orderBy: Record<string, unknown> | undefined
  ): Promise<StudentWithRelations[]> {
    const where = this.buildWhereClause(options);

    return prisma.student.findMany({
      where: where as never,
      skip,
      take,
      orderBy: orderBy as never,
      include: {
        user: true,
        organization: true,
        zone: true,
        college: true,
        department: true,
        program: true,
      },
    }) as unknown as Promise<StudentWithRelations[]>;
  }

  /**
   * Counts the total number of students matching the search/filter criteria.
   */
  async countStudents(options: StudentQueryOptions): Promise<number> {
    const where = this.buildWhereClause(options);
    return prisma.student.count({
      where: where as never,
    });
  }

  /**
   * Fetches all matching students without pagination for exports.
   */
  async exportStudents(
    options: Omit<StudentQueryOptions, 'page' | 'limit'>,
    orderBy: Record<string, unknown> | undefined
  ): Promise<StudentWithRelations[]> {
    const where = this.buildWhereClause(options);

    return prisma.student.findMany({
      where: where as never,
      orderBy: orderBy as never,
      include: {
        user: true,
        organization: true,
        zone: true,
        college: true,
        department: true,
        program: true,
      },
    }) as unknown as Promise<StudentWithRelations[]>;
  }
  /**
   * Provisions a single student manually inside a transaction.
   */
  async provisionStudent(data: {
    firstName: string;
    middleName?: string | null;
    lastName: string;
    registrationNumber: string;
    email: string;
    dateOfBirth: Date;
    tempPasswordHashed: string;
    tempPassword: string;
    organizationId: string;
  }): Promise<StudentWithRelations> {
    const verificationCode = `MTM-${new Date().getFullYear()}-${data.registrationNumber.trim().toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      // 1. Create User identity
      const user = await tx.user.create({
        data: {
          email: data.email.trim().toLowerCase(),
          registerNumber: data.registrationNumber.trim(),
          role: UserRole.student,
          passwordHash: data.tempPasswordHashed,
          tempPassword: data.tempPassword,
          isFirstLogin: true,
          isActive: true,
          organizationId: data.organizationId,
        },
      });

      // 2. Create Student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          registrationNumber: data.registrationNumber.trim(),
          firstName: data.firstName.trim(),
          middleName: data.middleName || null,
          lastName: data.lastName.trim(),
          dateOfBirth: data.dateOfBirth,
          verificationCode,
          organizationId: data.organizationId,
          accountStatus: AccountStatus.pending_first_login,
          status: StudentStatus.ACTIVE,
        },
      });

      // 3. Load relations
      const loaded = await tx.student.findUnique({
        where: { id: student.id },
        include: {
          user: true,
          organization: true,
          zone: true,
          college: true,
          department: true,
          program: true,
        },
      });

      return loaded as unknown as StudentWithRelations;
    });
  }

  /**
   * Provisions multiple students in a single transaction. Fully rolls back if any row fails.
   */
  async provisionStudentsBulk(
    records: {
      firstName: string;
      middleName?: string | null;
      lastName: string;
      registrationNumber: string;
      email: string;
      dateOfBirth: Date;
      tempPasswordHashed: string;
      tempPassword: string;
      organizationId: string;
    }[]
  ): Promise<StudentWithRelations[]> {
    return prisma.$transaction(
      async (tx) => {
        const createdStudentIds: string[] = [];

        for (const record of records) {
          const verificationCode = `MTM-${new Date().getFullYear()}-${record.registrationNumber.trim().toUpperCase()}`;

          // 1. Create User identity
          const user = await tx.user.create({
            data: {
              email: record.email.trim().toLowerCase(),
              registerNumber: record.registrationNumber.trim(),
              role: UserRole.student,
              passwordHash: record.tempPasswordHashed,
              tempPassword: record.tempPassword,
              isFirstLogin: true,
              isActive: true,
              organizationId: record.organizationId,
            },
          });

          // 2. Create Student profile
          const student = await tx.student.create({
            data: {
              userId: user.id,
              registrationNumber: record.registrationNumber.trim(),
              firstName: record.firstName.trim(),
              middleName: record.middleName || null,
              lastName: record.lastName.trim(),
              dateOfBirth: record.dateOfBirth,
              verificationCode,
              organizationId: record.organizationId,
              accountStatus: AccountStatus.pending_first_login,
              status: StudentStatus.ACTIVE,
            },
          });

          createdStudentIds.push(student.id);
        }

        if (createdStudentIds.length === 0) {
          return [];
        }

        // 3. Batch load all created relations in a single query
        const loadedStudents = await tx.student.findMany({
          where: { id: { in: createdStudentIds } },
          include: {
            user: true,
            organization: true,
            zone: true,
            college: true,
            department: true,
            program: true,
          },
        });

        return loadedStudents as unknown as StudentWithRelations[];
      },
      {
        timeout: 60000, // 60 seconds timeout for bulk provisioning
        maxWait: 10000, // 10 seconds max wait time to acquire connection lock
      }
    );
  }
}

export const studentRepository = new StudentRepository();

