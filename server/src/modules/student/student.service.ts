/**
 * @file src/modules/student/student.service.ts
 * @description Service layer containing business logic and transactions for Student Management.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { studentRepository } from './student.repository';
import {
  CreateStudentDTO,
  UpdateStudentDTO,
  StudentQueryOptions,
  StudentWithRelations,
  StudentImportRow,
  StudentImportReport,
} from './student.types';
import { STUDENT_AUDIT_ACTIONS } from './student.constants';
import { createAuditLog } from '@/utils/audit';
import { generateTempPassword } from '@/utils/password-generator';
import { parseQueryParams, buildPaginationMeta, QueryParams } from '@/utils/query-helper';
import {
  StudentStatus,
  Gender,
  BloodGroup,
  AuditActorRole,
  UserRole,
  ImportStatus,
  Student,
  AccountStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

// Strict status transition map
const ALLOWED_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  [StudentStatus.ACTIVE]: [
    StudentStatus.INACTIVE,
    StudentStatus.SUSPENDED,
    StudentStatus.DROPPED,
    StudentStatus.GRADUATED,
  ],
  [StudentStatus.INACTIVE]: [StudentStatus.ACTIVE],
  [StudentStatus.SUSPENDED]: [StudentStatus.ACTIVE, StudentStatus.DROPPED],
  [StudentStatus.DROPPED]: [], // Terminal state
  [StudentStatus.GRADUATED]: [StudentStatus.ALUMNI],
  [StudentStatus.ALUMNI]: [], // Terminal state
};

export class StudentService {
  /**
   * Generates a dynamic fullName from firstName, middleName, and lastName.
   */
  computeFullName(firstName: string, middleName: string | null, lastName: string): string {
    return [firstName, middleName, lastName].filter(Boolean).join(' ');
  }

  /**
   * Hashes temporary passwords.
   */
  hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  /**
   * Validates target entities existence (organization, zone, college, department, program).
   */
  private async validateEntities(
    orgId: string,
    zoneId: string,
    collegeId: string,
    departmentId: string,
    programId: string
  ): Promise<void> {
    const [org, zone, college, department, program] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.zone.findUnique({ where: { id: zoneId } }),
      prisma.college.findUnique({ where: { id: collegeId } }),
      prisma.department.findUnique({ where: { id: departmentId } }),
      prisma.program.findUnique({ where: { id: programId } }),
    ]);

    if (!org) throw ApiError.badRequest(`Organization with ID ${orgId} does not exist`);
    if (!zone) throw ApiError.badRequest(`Zone with ID ${zoneId} does not exist`);
    if (!college) throw ApiError.badRequest(`College with ID ${collegeId} does not exist`);
    if (!department) throw ApiError.badRequest(`Department with ID ${departmentId} does not exist`);
    if (!program) throw ApiError.badRequest(`Program with ID ${programId} does not exist`);

    // Verify relations hierarchy
    if (college.zoneId !== zoneId) {
      throw ApiError.badRequest(`College is not associated with Zone ${zoneId}`);
    }
    if (department.collegeId !== collegeId) {
      throw ApiError.badRequest(`Department is not associated with College ${collegeId}`);
    }
    if (program.departmentId !== departmentId) {
      throw ApiError.badRequest(`Program is not associated with Department ${departmentId}`);
    }
  }

  /**
   * Creates a student record.
   */
  async createStudent(
    data: CreateStudentDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<StudentWithRelations> {
    // 1. Uniqueness checks
    const regNumExists = await studentRepository.existsByRegistrationNumber(
      data.registrationNumber
    );
    if (regNumExists) {
      throw new ApiError(409, `Registration number ${data.registrationNumber} already exists`);
    }

    const emailExists = await studentRepository.existsByEmail(data.email);
    if (emailExists) {
      throw new ApiError(409, `Email address ${data.email} already exists`);
    }

    // 2. Validate relations exist
    await this.validateEntities(
      data.organizationId,
      data.zoneId,
      data.collegeId,
      data.departmentId,
      data.programId
    );

    // 3. Generate credentials
    const tempPassword = generateTempPassword();
    const tempPasswordHashed = this.hashPassword(tempPassword);

    // 4. Save
    const student = await studentRepository.createStudent(data, tempPasswordHashed, tempPassword);
    const fullName = this.computeFullName(student.firstName, student.middleName, student.lastName);

    // 5. Audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: STUDENT_AUDIT_ACTIONS.STUDENT_CREATED,
      targetEntityType: 'student',
      targetEntityId: student.id,
      targetLabel: fullName,
      details: `Student account created for ${fullName} with Registration Number: ${student.registrationNumber}`,
    });

    logger.info(`[STUDENT_CREATED] Student ${fullName} created successfully by actor ${actorId}`);
    return {
      ...student,
      fullName,
    };
  }

  /**
   * Retrieves a student by ID.
   */
  async getStudentById(id: string): Promise<StudentWithRelations> {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw ApiError.notFound(`Student with ID ${id} not found`);
    }
    return {
      ...student,
      fullName: this.computeFullName(student.firstName, student.middleName, student.lastName),
    };
  }

  /**
   * Updates student details.
   */
  async updateStudent(
    id: string,
    data: UpdateStudentDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<StudentWithRelations> {
    const student = await this.getStudentById(id);

    // Uniqueness validation on registration number
    if (
      data.registrationNumber !== undefined &&
      data.registrationNumber !== student.registrationNumber
    ) {
      const regNumExists = await studentRepository.existsByRegistrationNumber(
        data.registrationNumber,
        id
      );
      if (regNumExists) {
        throw new ApiError(409, `Registration number ${data.registrationNumber} already exists`);
      }
    }

    // Validate relationships if changed
    const orgId = data.organizationId ?? student.organizationId;
    const zoneId = data.zoneId ?? student.zoneId;
    const collegeId = data.collegeId ?? student.collegeId;
    const departmentId = data.departmentId ?? student.departmentId;
    const programId = data.programId ?? student.programId;

    if (
      data.organizationId !== undefined ||
      data.zoneId !== undefined ||
      data.collegeId !== undefined ||
      data.departmentId !== undefined ||
      data.programId !== undefined
    ) {
      await this.validateEntities(orgId, zoneId, collegeId, departmentId, programId);
    }

    const updated = await studentRepository.updateStudent(id, student.userId, data);
    const fullName = this.computeFullName(updated.firstName, updated.middleName, updated.lastName);

    // Audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: STUDENT_AUDIT_ACTIONS.STUDENT_UPDATED,
      targetEntityType: 'student',
      targetEntityId: updated.id,
      targetLabel: fullName,
      details: `Student account updated for ${fullName} (${updated.registrationNumber})`,
    });

    logger.info(`[STUDENT_UPDATED] Student ${fullName} updated successfully by actor ${actorId}`);
    return {
      ...updated,
      fullName,
    };
  }

  /**
   * Changes status of a student.
   */
  async changeStatus(
    id: string,
    status: StudentStatus,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<StudentWithRelations> {
    const student = await this.getStudentById(id);

    if (student.status === status) {
      return student;
    }

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[student.status];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(`Invalid status transition from ${student.status} to ${status}`);
    }

    const updated = await studentRepository.changeStatus(id, student.userId, status);
    const fullName = this.computeFullName(updated.firstName, updated.middleName, updated.lastName);

    const action =
      status === StudentStatus.ACTIVE
        ? STUDENT_AUDIT_ACTIONS.STUDENT_ACTIVATED
        : status === StudentStatus.INACTIVE
          ? STUDENT_AUDIT_ACTIONS.STUDENT_DEACTIVATED
          : STUDENT_AUDIT_ACTIONS.STUDENT_STATUS_CHANGED;

    // Audit log
    await createAuditLog({
      actorId,
      actorRole,
      action,
      targetEntityType: 'student',
      targetEntityId: updated.id,
      targetLabel: fullName,
      details: `Student status changed from ${student.status} to ${status} for ${fullName} (${updated.registrationNumber})`,
    });

    logger.info(
      `[STUDENT_STATUS_CHANGED] Status of ${fullName} changed to ${status} by actor ${actorId}`
    );
    return {
      ...updated,
      fullName,
    };
  }

  /**
   * Lists paginated students.
   */
  async listStudents(queryParams: QueryParams) {
    const options: StudentQueryOptions = {
      page: queryParams.page ? Number(queryParams.page) : 1,
      limit: queryParams.limit ? Number(queryParams.limit) : 10,
      search: queryParams.search as string,
      sortBy: queryParams.sortBy as string,
      sortOrder: queryParams.sortOrder as 'asc' | 'desc',
      organizationId: queryParams.organizationId as string,
      zoneId: queryParams.zoneId as string,
      collegeId: queryParams.collegeId as string,
      departmentId: queryParams.departmentId as string,
      status: queryParams.status as StudentStatus,
      batch: queryParams.batch as string,
    };

    const { skip, take, orderBy } = parseQueryParams(options, 'registrationNumber');
    const [students, total] = await Promise.all([
      studentRepository.listStudents(options, skip, take, orderBy),
      studentRepository.countStudents(options),
    ]);

    const items = students.map((student) => ({
      ...student,
      fullName: this.computeFullName(student.firstName, student.middleName, student.lastName),
    }));

    return {
      items,
      meta: buildPaginationMeta(total, options),
    };
  }

  /**
   * Parses CSV lines correctly, respecting quoted commas.
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map((val) => val.replace(/^"|"$/g, '').trim());
  }

  /**
   * Performs high-performance transactional CSV import using in-memory caches.
   */
  async importStudents(
    csvContent: string,
    fileName: string,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<StudentImportReport> {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) {
      throw ApiError.badRequest('CSV content is empty or missing headers');
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const expectedHeaders = [
      'registrationnumber',
      'firstname',
      'middlename',
      'lastname',
      'gender',
      'dateofbirth',
      'bloodgroup',
      'nationality',
      'community',
      'religion',
      'email',
      'mobile',
      'alternatemobile',
      'parentname',
      'parentmobile',
      'parentoccupation',
      'guardianname',
      'guardianmobile',
      'addressline1',
      'addressline2',
      'city',
      'district',
      'state',
      'country',
      'pincode',
      'organizationcode',
      'zonecode',
      'collegecode',
      'departmentname',
      'programname',
      'course',
      'batch',
      'academicyear',
      'semester',
      'section',
    ];

    // Verify headers match
    for (const h of expectedHeaders) {
      if (!headers.includes(h)) {
        throw ApiError.badRequest(`Missing required CSV header: "${h}"`);
      }
    }

    const rows: StudentImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length < headers.length) continue; // skip trailing malformed rows

      const row: Record<string, string> = {};
      headers.forEach((h, index) => {
        row[h] = values[index] || '';
      });

      rows.push({
        registrationNumber: row.registrationnumber,
        firstName: row.firstname,
        middleName: row.middlename || undefined,
        lastName: row.lastname,
        gender: row.gender,
        dateOfBirth: row.dateofbirth,
        bloodGroup: row.bloodgroup || undefined,
        nationality: row.nationality || undefined,
        community: row.community || undefined,
        religion: row.religion || undefined,
        email: row.email,
        mobile: row.mobile || undefined,
        alternateMobile: row.alternatemobile || undefined,
        parentName: row.parentname,
        parentMobile: row.parentmobile,
        parentOccupation: row.parentoccupation || undefined,
        guardianName: row.guardianname || undefined,
        guardianMobile: row.guardianmobile || undefined,
        addressLine1: row.addressline1,
        addressLine2: row.addressline2 || undefined,
        city: row.city,
        district: row.district,
        state: row.state,
        country: row.country,
        pincode: row.pincode,
        organizationCode: row.organizationcode,
        zoneCode: row.zonecode,
        collegeCode: row.collegecode,
        departmentName: row.departmentname,
        programName: row.programname,
        course: row.course,
        batch: row.batch,
        academicYear: row.academicyear,
        semester: row.semester || undefined,
        section: row.section || undefined,
      });
    }

    const report: StudentImportReport = {
      totalRows: rows.length,
      successCount: 0,
      duplicateCount: 0,
      errorCount: 0,
      errors: [],
    };

    if (rows.length === 0) {
      throw ApiError.badRequest('No data rows found in CSV');
    }

    // Create record in EnrollmentImport table in database
    const dbImport = await prisma.enrollmentImport.create({
      data: {
        importedById: actorId,
        fileName,
        totalRows: rows.length,
        successCount: 0,
        duplicateCount: 0,
        errorCount: 0,
        status: ImportStatus.processing,
      },
    });

    // ─── HIGH PERFORMANCE PRE-FETCH CACHING ───────────────────────────────────
    const [organizations, zones, colleges, departments, programs] = await Promise.all([
      prisma.organization.findMany(),
      prisma.zone.findMany(),
      prisma.college.findMany(),
      prisma.department.findMany(),
      prisma.program.findMany(),
    ]);

    const orgCache = new Map(organizations.map((o) => [o.code.toUpperCase(), o]));
    const zoneCache = new Map(zones.map((z) => [z.code.toUpperCase(), z]));
    const collegeCache = new Map(colleges.map((c) => [c.code.toUpperCase(), c]));

    // Map departments: Key is `${collegeId}_${deptName.toUpperCase()}`
    const deptCache = new Map<string, (typeof departments)[number]>();
    departments.forEach((d) => {
      deptCache.set(`${d.collegeId}_${d.name.toUpperCase()}`, d);
    });

    // Map programs: Key is `${deptId}_${progName.toUpperCase()}`
    const progCache = new Map<string, (typeof programs)[number]>();
    programs.forEach((p) => {
      progCache.set(`${p.departmentId}_${p.name.toUpperCase()}`, p);
    });

    // Pre-fetch all emails and registration numbers in DB for fast lookup
    const allEmails = new Set(
      (await prisma.user.findMany({ select: { email: true } })).map((u) => u.email?.toLowerCase())
    );
    const allRegNums = new Set(
      (await prisma.student.findMany({ select: { registrationNumber: true } })).map((s) =>
        s.registrationNumber.toUpperCase()
      )
    );

    // Track duplicates locally within the CSV
    const localEmails = new Set<string>();
    const localRegNums = new Set<string>();

    const recordsToCreate: {
      user: {
        email: string;
        registerNumber: string;
        role: UserRole;
        passwordHash: string;
        tempPassword: string;
        isFirstLogin: boolean;
        isActive: boolean;
        organizationId: string;
        zoneId: string;
      };
      student: Omit<Student, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    }[] = [];

    // ─── VALIDATION PHASE ────────────────────────────────────────────────────
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const rowNum = idx + 2; // Row number in Excel/CSV is 1-indexed header + 1-indexed offset
      const rowErrors: string[] = [];

      // Required fields checks
      if (!row.registrationNumber) rowErrors.push('Missing registration number');
      if (!row.firstName) rowErrors.push('Missing first name');
      if (!row.lastName) rowErrors.push('Missing last name');
      if (!row.email) rowErrors.push('Missing email address');
      if (!row.parentName) rowErrors.push('Missing parent name');
      if (!row.parentMobile) rowErrors.push('Missing parent mobile');
      if (!row.addressLine1) rowErrors.push('Missing address line 1');
      if (!row.city) rowErrors.push('Missing city');
      if (!row.district) rowErrors.push('Missing district');
      if (!row.state) rowErrors.push('Missing state');
      if (!row.country) rowErrors.push('Missing country');
      if (!row.pincode) rowErrors.push('Missing pincode');
      if (!row.organizationCode) rowErrors.push('Missing organization code');
      if (!row.zoneCode) rowErrors.push('Missing zone code');
      if (!row.collegeCode) rowErrors.push('Missing college code');
      if (!row.departmentName) rowErrors.push('Missing department name');
      if (!row.programName) rowErrors.push('Missing program name');
      if (!row.course) rowErrors.push('Missing course');
      if (!row.batch) rowErrors.push('Missing batch');
      if (!row.academicYear) rowErrors.push('Missing academic year');

      if (rowErrors.length > 0) {
        report.errorCount++;
        report.errors.push({ row: rowNum, error: rowErrors.join(', ') });
        continue;
      }

      // Check enums
      const genderUpper = row.gender.toUpperCase();
      if (!Object.values(Gender).includes(genderUpper as Gender)) {
        rowErrors.push(`Invalid gender value: "${row.gender}"`);
      }

      let bloodGroupVal: BloodGroup | null = null;
      if (row.bloodGroup) {
        const bgNormalized = row.bloodGroup
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace('+', '_POSITIVE')
          .replace('-', '_NEGATIVE');
        if (Object.values(BloodGroup).includes(bgNormalized as BloodGroup)) {
          bloodGroupVal = bgNormalized as BloodGroup;
        } else {
          rowErrors.push(`Invalid blood group: "${row.bloodGroup}"`);
        }
      }

      // Validate email format
      if (!/^\S+@\S+\.\S+$/.test(row.email)) {
        rowErrors.push(`Invalid email format: "${row.email}"`);
      }

      // Validate dateOfBirth format
      if (isNaN(Date.parse(row.dateOfBirth))) {
        rowErrors.push(`Invalid date format for Date of Birth: "${row.dateOfBirth}"`);
      }

      // Check duplicates
      const emailLower = row.email.trim().toLowerCase();
      const regUpper = row.registrationNumber.trim().toUpperCase();

      if (allEmails.has(emailLower) || localEmails.has(emailLower)) {
        report.duplicateCount++;
        rowErrors.push(`Duplicate email: "${row.email}"`);
      }
      if (allRegNums.has(regUpper) || localRegNums.has(regUpper)) {
        report.duplicateCount++;
        rowErrors.push(`Duplicate registration number: "${row.registrationNumber}"`);
      }

      // Lookups validation
      const org = orgCache.get(row.organizationCode.toUpperCase());
      if (!org) {
        rowErrors.push(`Organization code "${row.organizationCode}" does not exist`);
      }

      const zone = zoneCache.get(row.zoneCode.toUpperCase());
      if (!zone) {
        rowErrors.push(`Zone code "${row.zoneCode}" does not exist`);
      }

      const college = collegeCache.get(row.collegeCode.toUpperCase());
      if (!college) {
        rowErrors.push(`College code "${row.collegeCode}" does not exist`);
      }

      // Validate hierarchy
      if (college && zone && college.zoneId !== zone.id) {
        rowErrors.push(
          `College "${row.collegeCode}" is not associated with Zone "${row.zoneCode}"`
        );
      }

      let dept: (typeof departments)[number] | undefined;
      if (college) {
        dept = deptCache.get(`${college.id}_${row.departmentName.toUpperCase()}`);
        if (!dept) {
          rowErrors.push(
            `Department "${row.departmentName}" does not exist under college "${row.collegeCode}"`
          );
        }
      }

      let prog: (typeof programs)[number] | undefined;
      if (dept) {
        prog = progCache.get(`${dept.id}_${row.programName.toUpperCase()}`);
        if (!prog) {
          rowErrors.push(
            `Program "${row.programName}" does not exist under department "${row.departmentName}"`
          );
        }
      }

      if (rowErrors.length > 0) {
        report.errorCount++;
        report.errors.push({ row: rowNum, error: rowErrors.join(', ') });
        continue;
      }

      // Add to local uniqueness tracking
      localEmails.add(emailLower);
      localRegNums.add(regUpper);

      // Generate credentials
      const tempPassword = generateTempPassword();
      const tempPasswordHashed = this.hashPassword(tempPassword);

      recordsToCreate.push({
        user: {
          email: emailLower,
          registerNumber: row.registrationNumber.trim(),
          role: UserRole.student,
          passwordHash: tempPasswordHashed,
          tempPassword,
          isFirstLogin: true,
          isActive: true,
          organizationId: org!.id,
          zoneId: zone!.id,
        },
        student: {
          registrationNumber: row.registrationNumber.trim(),
          firstName: row.firstName.trim(),
          middleName: row.middleName?.trim() || null,
          lastName: row.lastName.trim(),
          gender: genderUpper as Gender,
          dateOfBirth: new Date(row.dateOfBirth),
          bloodGroup: bloodGroupVal,
          nationality: row.nationality?.trim() || null,
          community: row.community?.trim() || null,
          religion: row.religion?.trim() || null,
          mobile: row.mobile?.trim() || null,
          alternateMobile: row.alternateMobile?.trim() || null,
          parentName: row.parentName.trim(),
          parentMobile: row.parentMobile.trim(),
          parentOccupation: row.parentOccupation?.trim() || null,
          guardianName: row.guardianName?.trim() || null,
          guardianMobile: row.guardianMobile?.trim() || null,
          addressLine1: row.addressLine1.trim(),
          addressLine2: row.addressLine2?.trim() || null,
          city: row.city.trim(),
          district: row.district.trim(),
          state: row.state.trim(),
          country: row.country.trim(),
          pincode: row.pincode.trim(),
          organizationId: org!.id,
          zoneId: zone!.id,
          collegeId: college!.id,
          departmentId: dept!.id,
          programId: prog!.id,
          course: row.course.trim(),
          batch: row.batch.trim(),
          academicYear: row.academicYear.trim(),
          semester: row.semester?.trim() || null,
          section: row.section?.trim() || null,
          verificationCode: `MTM-${row.batch.split('-')[0] || new Date().getFullYear()}-${row.registrationNumber.trim().toUpperCase()}`,
          accountStatus: AccountStatus.pending_first_login,
          status: StudentStatus.ACTIVE,
          resumeLastGeneratedAt: null,
        },
      });
    }

    // ─── COMMIT PHASE (PRISMA TRANSACTION) ──────────────────────────────────
    if (report.errorCount > 0) {
      // Abort import: update database enrollment import status to failed
      await prisma.enrollmentImport.update({
        where: { id: dbImport.id },
        data: {
          errorCount: report.errorCount,
          duplicateCount: report.duplicateCount,
          status: ImportStatus.failed,
        },
      });
      logger.warn(
        `[STUDENT_IMPORT_FAILED] Import "${fileName}" failed validation check with ${report.errorCount} errors`
      );
      return report;
    }

    try {
      await studentRepository.importStudents(recordsToCreate);

      report.successCount = recordsToCreate.length;

      // Update database status
      await prisma.enrollmentImport.update({
        where: { id: dbImport.id },
        data: {
          successCount: report.successCount,
          status: ImportStatus.completed,
        },
      });

      // Audit Log entry
      await createAuditLog({
        actorId,
        actorRole,
        action: STUDENT_AUDIT_ACTIONS.STUDENT_IMPORTED,
        targetEntityType: 'enrollment_import',
        targetEntityId: dbImport.id,
        targetLabel: fileName,
        details: `Successfully imported ${report.successCount} student profiles from file: ${fileName}`,
      });

      logger.info(
        `[STUDENT_IMPORTED] Successfully imported ${report.successCount} students from ${fileName} by actor ${actorId}`
      );
      return report;
    } catch (dbError: unknown) {
      await prisma.enrollmentImport.update({
        where: { id: dbImport.id },
        data: {
          status: ImportStatus.failed,
          errorCount: report.totalRows,
        },
      });
      logger.error(
        `[STUDENT_IMPORT_ROLLBACK] DB Transaction rollback during import of ${fileName}. Reason:`,
        dbError
      );
      throw ApiError.internal(
        `Import transaction failed and was rolled back: ${(dbError as Error).message}`
      );
    }
  }

  /**
   * Helper to format a string value for safe CSV usage (escapes quotes and wraps in quotes if needed).
   */
  private formatCsvValue(val: string | null | undefined): string {
    if (val === null || val === undefined) return '';
    const clean = String(val).replace(/"/g, '""');
    if (
      clean.includes(',') ||
      clean.includes('\n') ||
      clean.includes('\r') ||
      clean.includes('"')
    ) {
      return `"${clean}"`;
    }
    return clean;
  }

  /**
   * Generates CSV string for exporting filtered students list.
   */
  async exportToCsv(queryParams: Omit<QueryParams, 'page' | 'limit'>): Promise<string> {
    const options: StudentQueryOptions = {
      search: queryParams.search as string,
      sortBy: queryParams.sortBy as string,
      sortOrder: queryParams.sortOrder as 'asc' | 'desc',
      organizationId: queryParams.organizationId as string,
      zoneId: queryParams.zoneId as string,
      collegeId: queryParams.collegeId as string,
      departmentId: queryParams.departmentId as string,
      status: queryParams.status as StudentStatus,
      batch: queryParams.batch as string,
    };

    const { orderBy } = parseQueryParams(options, 'registrationNumber');
    const students = await studentRepository.exportStudents(options, orderBy);

    const headers = [
      'Registration Number',
      'Full Name',
      'Gender',
      'Date of Birth',
      'Blood Group',
      'Nationality',
      'Email',
      'Mobile',
      'Parent Name',
      'Parent Mobile',
      'Address',
      'City',
      'District',
      'State',
      'Pincode',
      'Organization',
      'Zone',
      'College',
      'Department',
      'Program',
      'Course',
      'Batch',
      'Academic Year',
      'Semester',
      'Section',
      'Status',
    ];

    const lines = [headers.join(',')];

    students.forEach((student) => {
      const dobStr = student.dateOfBirth.toISOString().split('T')[0];
      const address = [student.addressLine1, student.addressLine2].filter(Boolean).join(', ');
      const fullName = this.computeFullName(
        student.firstName,
        student.middleName,
        student.lastName
      );

      const row = [
        this.formatCsvValue(student.registrationNumber),
        this.formatCsvValue(fullName),
        this.formatCsvValue(student.gender),
        this.formatCsvValue(dobStr),
        this.formatCsvValue(student.bloodGroup),
        this.formatCsvValue(student.nationality),
        this.formatCsvValue(student.user.email),
        this.formatCsvValue(student.mobile),
        this.formatCsvValue(student.parentName),
        this.formatCsvValue(student.parentMobile),
        this.formatCsvValue(address),
        this.formatCsvValue(student.city),
        this.formatCsvValue(student.district),
        this.formatCsvValue(student.state),
        this.formatCsvValue(student.pincode),
        this.formatCsvValue(student.organization.name),
        this.formatCsvValue(student.zone.name),
        this.formatCsvValue(student.college.name),
        this.formatCsvValue(student.department.name),
        this.formatCsvValue(student.program.name),
        this.formatCsvValue(student.course),
        this.formatCsvValue(student.batch),
        this.formatCsvValue(student.academicYear),
        this.formatCsvValue(student.semester),
        this.formatCsvValue(student.section),
        this.formatCsvValue(student.status),
      ];

      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  /**
   * Generates Excel file buffer for exporting filtered students list.
   */
  async exportToExcel(queryParams: Omit<QueryParams, 'page' | 'limit'>): Promise<Buffer> {
    const options: StudentQueryOptions = {
      search: queryParams.search as string,
      sortBy: queryParams.sortBy as string,
      sortOrder: queryParams.sortOrder as 'asc' | 'desc',
      organizationId: queryParams.organizationId as string,
      zoneId: queryParams.zoneId as string,
      collegeId: queryParams.collegeId as string,
      departmentId: queryParams.departmentId as string,
      status: queryParams.status as StudentStatus,
      batch: queryParams.batch as string,
    };

    const { orderBy } = parseQueryParams(options, 'registrationNumber');
    const students = await studentRepository.exportStudents(options, orderBy);

    const rows = students.map((s) => {
      const dobStr = s.dateOfBirth.toISOString().split('T')[0];
      const address = [s.addressLine1, s.addressLine2].filter(Boolean).join(', ');
      const fullName = this.computeFullName(s.firstName, s.middleName, s.lastName);

      return {
        'Registration Number': s.registrationNumber,
        'Full Name': fullName,
        Gender: s.gender,
        'Date of Birth': dobStr,
        'Blood Group': s.bloodGroup || '',
        Nationality: s.nationality || '',
        Email: s.user.email || '',
        Mobile: s.mobile || '',
        'Parent Name': s.parentName,
        'Parent Mobile': s.parentMobile,
        Address: address,
        City: s.city,
        District: s.district,
        State: s.state,
        Pincode: s.pincode,
        Organization: s.organization.name,
        Zone: s.zone.name,
        College: s.college.name,
        Department: s.department.name,
        Program: s.program.name,
        Course: s.course,
        Batch: s.batch,
        'Academic Year': s.academicYear,
        Semester: s.semester || '',
        Section: s.section || '',
        Status: s.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Return XLSX buffer representation
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

export const studentService = new StudentService();
