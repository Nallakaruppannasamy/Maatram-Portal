/**
 * @file src/modules/student/student.service.ts
 * @description Service layer containing business logic and transactions for Student Management.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { studentRepository } from './student.repository';
import { notificationService } from '@/utils/notification';
import { env } from '@/config/env';

/**
 * Parses date of birth supporting multiple formats (YYYY-MM-DD, DD/MM/YYYY, or Excel serial numbers)
 * in a timezone-independent UTC manner.
 */
export function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return new Date(Date.UTC(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate()));
  }
  if (typeof val === 'number') {
    // Excel serial date number (base date: Dec 30, 1899)
    const utcDays = Math.floor(val - 25569);
    const date = new Date(Date.UTC(1970, 0, 1 + utcDays));
    return isNaN(date.getTime()) ? null : date;
  }
  const str = String(val).trim();
  if (!str) return null;

  // Try YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(str)) {
    const parts = str.split(/[/-]/);
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(Date.UTC(y, m, d));
    if (date.getUTCFullYear() === y && date.getUTCMonth() === m && date.getUTCDate() === d) {
      return date;
    }
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str)) {
    const parts = str.split(/[/-]/);
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const date = new Date(Date.UTC(y, m, d));
    if (date.getUTCFullYear() === y && date.getUTCMonth() === m && date.getUTCDate() === d) {
      return date;
    }
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

/**
 * Formats a Date into dd/mm/yyyy string for temporary password using UTC date components.
 */
export function formatDobAsPassword(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
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
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Validates target entities existence (organization, zone, college, department, program).
   */
  private async validateEntities(
    orgId: string,
    zoneId: string | null,
    collegeId: string | null,
    departmentId: string | null,
    programId: string | null
  ): Promise<void> {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw ApiError.badRequest(`Organization with ID ${orgId} does not exist`);

    const [zone, college, department, program] = await Promise.all([
      zoneId ? prisma.zone.findUnique({ where: { id: zoneId } }) : null,
      collegeId ? prisma.college.findUnique({ where: { id: collegeId } }) : null,
      departmentId ? prisma.department.findUnique({ where: { id: departmentId } }) : null,
      programId ? prisma.program.findUnique({ where: { id: programId } }) : null,
    ]);

    if (zoneId && !zone) throw ApiError.badRequest(`Zone with ID ${zoneId} does not exist`);
    if (collegeId && !college) throw ApiError.badRequest(`College with ID ${collegeId} does not exist`);
    if (departmentId && !department) throw ApiError.badRequest(`Department with ID ${departmentId} does not exist`);
    if (programId && !program) throw ApiError.badRequest(`Program with ID ${programId} does not exist`);

    // Verify relations hierarchy
    if (college && zone && college.zoneId !== zoneId) {
      throw ApiError.badRequest(`College is not associated with Zone ${zoneId}`);
    }
    if (department && collegeId && department.collegeId !== collegeId) {
      throw ApiError.badRequest(`Department is not associated with College ${collegeId}`);
    }
    if (program && departmentId && program.departmentId !== departmentId) {
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
    const tempPasswordHashed = await this.hashPassword(tempPassword);

    // 4. Save
    const student = await studentRepository.createStudent(data, tempPasswordHashed);
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
   * Helper to map query sortBy field to Prisma schema field/relation paths.
   */
  private mapSortBy(sortBy?: string): string {
    if (!sortBy) return 'registrationNumber';
    const clean = sortBy.trim();
    if (clean === 'zone') return 'zone.name';
    if (clean === 'college') return 'college.name';
    if (clean === 'batch') return 'batch';
    if (clean === 'name') return 'firstName';
    if (clean === 'registerNumber' || clean === 'registrationNumber') return 'registrationNumber';
    if (clean === 'cgpa') return 'cgpa';
    return clean;
  }

  /**
   * Lists paginated students.
   */
  async listStudents(queryParams: QueryParams) {
    const options: StudentQueryOptions = {
      page: queryParams.page ? Number(queryParams.page) : 1,
      limit: queryParams.limit ? Number(queryParams.limit) : 10,
      search: queryParams.search as string,
      sortBy: this.mapSortBy(queryParams.sortBy as string),
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
   * Performs high-performance transactional bulk Excel/CSV import.
   * If any row validation or database operation fails, the entire import is rolled back.
   */
  async importStudents(
    fileBuffer: Buffer,
    fileName: string,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<any> {
    const report = {
      totalRows: 0,
      successCount: 0,
      duplicateCount: 0,
      errorCount: 0,
      errors: [] as { row: number; error: string }[],
    };

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    } catch (err: any) {
      throw ApiError.badRequest('Invalid Excel or CSV file structure');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    if (rows.length === 0) {
      throw ApiError.badRequest('The uploaded file is empty');
    }

    report.totalRows = rows.length;

    // Normalize keys to find the required columns case-insensitively and space-insensitively
    const normalizedRows = rows.map((row) => {
      const normalized: any = {};
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
        if (cleanKey === 'studentname' || cleanKey === 'fullname' || cleanKey === 'name') {
          normalized.name = String(val).trim();
        } else if (
          cleanKey === 'registernumber' ||
          cleanKey === 'registerno' ||
          cleanKey === 'registrationnumber'
        ) {
          normalized.registrationNumber = String(val).trim();
        } else if (cleanKey === 'email' || cleanKey === 'emailaddress') {
          normalized.email = String(val).trim();
        } else if (cleanKey === 'dateofbirth' || cleanKey === 'dob') {
          normalized.dateOfBirth = val;
        }
      }
      return normalized;
    });

    // Check for missing columns in headers
    const firstRowKeys = Object.keys(normalizedRows[0] || {});
    const requiredKeys = ['name', 'registrationNumber', 'email', 'dateOfBirth'];
    const missingKeys = requiredKeys.filter((key) => !firstRowKeys.includes(key));
    if (missingKeys.length > 0) {
      throw ApiError.badRequest(
        `Missing required columns: ${missingKeys
          .map((k) =>
            k === 'registrationNumber'
              ? 'Register Number'
              : k === 'dateOfBirth'
              ? 'Date Of Birth'
              : k === 'name'
              ? 'Student Name'
              : k
          )
          .join(', ')}`
      );
    }

    // Get default organization (MTM-ORG)
    const org = await prisma.organization.findUnique({ where: { code: 'MTM-ORG' } });
    if (!org) {
      throw ApiError.internal('Default organization (MTM-ORG) not found in database');
    }

    // Load existing emails and registration numbers for fast lookup
    const allEmails = new Set(
      (await prisma.user.findMany({ select: { email: true } })).map((u) => u.email?.toLowerCase())
    );
    const allRegNums = new Set(
      (await prisma.student.findMany({ select: { registrationNumber: true } })).map((s) =>
        s.registrationNumber.toUpperCase()
      )
    );

    const localEmails = new Set<string>();
    const localRegNums = new Set<string>();
    const recordsToCreate: any[] = [];

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

    // ─── VALIDATION PHASE ────────────────────────────────────────────────────
    for (let idx = 0; idx < normalizedRows.length; idx++) {
      const row = normalizedRows[idx];
      const rowNum = idx + 2; // Offset for 1-based index and header
      const rowErrors: string[] = [];

      if (!row.name) rowErrors.push('Missing Student Name');
      if (!row.registrationNumber) rowErrors.push('Missing Register Number');
      if (!row.email) rowErrors.push('Missing Email');
      if (!row.dateOfBirth) rowErrors.push('Missing Date Of Birth');

      if (rowErrors.length > 0) {
        report.errorCount++;
        report.errors.push({ row: rowNum, error: rowErrors.join(', ') });
        continue;
      }

      // Validate email format
      if (!/^\S+@\S+\.\S+$/.test(row.email)) {
        rowErrors.push(`Invalid email format: "${row.email}"`);
      }

      // Parse DOB date
      const dob = parseExcelDate(row.dateOfBirth);
      if (!dob) {
        rowErrors.push(`Invalid date format for Date of Birth: "${row.dateOfBirth}"`);
      }

      const emailLower = row.email.toLowerCase();
      const regUpper = row.registrationNumber.toUpperCase();

      // Check duplicates in DB
      if (allEmails.has(emailLower)) {
        rowErrors.push(`Duplicate Email in database: "${row.email}"`);
      }
      if (allRegNums.has(regUpper)) {
        rowErrors.push(`Duplicate Register Number in database: "${row.registrationNumber}"`);
      }

      // Check local duplicates in this file
      if (localEmails.has(emailLower)) {
        rowErrors.push(`Duplicate Email inside the file: "${row.email}"`);
      }
      if (localRegNums.has(regUpper)) {
        rowErrors.push(`Duplicate Register Number inside the file: "${row.registrationNumber}"`);
      }

      if (rowErrors.length > 0) {
        report.errorCount++;
        report.errors.push({ row: rowNum, error: rowErrors.join(', ') });
        continue;
      }

      // Add to local uniqueness tracking
      localEmails.add(emailLower);
      localRegNums.add(regUpper);

      // Names parsing
      const parts = row.name.split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '.';

      // DOB Temporary password
      const tempPassword = formatDobAsPassword(dob!);
      const tempPasswordHashed = await bcrypt.hash(tempPassword, 10);

      recordsToCreate.push({
        firstName,
        lastName,
        registrationNumber: regUpper,
        email: emailLower,
        dateOfBirth: dob!,
        tempPasswordHashed,
        tempPassword,
        organizationId: org.id,
      });
    }

    // ─── COMMIT PHASE ────────────────────────────────────────────────────────
    if (report.errorCount > 0) {
      // Update database import status to failed
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
      // Execute the bulk insert inside the transaction
      const createdStudents = await studentRepository.provisionStudentsBulk(recordsToCreate);
      report.successCount = createdStudents.length;

      // Update database status to completed
      await prisma.enrollmentImport.update({
        where: { id: dbImport.id },
        data: {
          successCount: report.successCount,
          status: ImportStatus.completed,
        },
      });

      // Audit Log for import success
      await createAuditLog({
        actorId,
        actorRole,
        action: STUDENT_AUDIT_ACTIONS.STUDENT_IMPORTED,
        targetEntityType: 'enrollment_import',
        targetEntityId: dbImport.id,
        targetLabel: fileName,
        details: `Successfully imported ${report.successCount} student profiles from file: ${fileName}`,
      });

      // Send Welcome Emails & Log Audit trail for individual students in background
      for (const record of recordsToCreate) {
        const studentName = `${record.firstName} ${record.lastName === '.' ? '' : record.lastName}`.trim();
        const createdStudent = createdStudents.find((s) => s.registrationNumber === record.registrationNumber);
        const studentId = createdStudent?.id || '';

        // Audit Log for individual creation
        await createAuditLog({
          actorId,
          actorRole,
          action: 'STUDENT_CREATED',
          targetEntityType: 'student',
          targetEntityId: studentId,
          targetLabel: studentName,
          details: `Student account provisioned via bulk import: regNumber=${record.registrationNumber}, email=${record.email}`,
        });

        // Welcome Email
        const portalUrl = env.FRONTEND_URL || 'http://localhost:5173';
        const emailPayload = {
          to: record.email,
          subject: 'Welcome to Maatram Foundation - Your Student Account Credentials',
          body: `Dear ${studentName},\n\nWelcome to Maatram Foundation! Your student account has been successfully provisioned.\n\nPortal URL: ${portalUrl}\nRegistration Number: ${record.registrationNumber}\nTemporary Password: ${record.tempPassword}\n\nInstructions:\n1. Log in to the portal using your credentials.\n2. You will be prompted to change your temporary password on your first login.\n3. Complete your profile fields to activate your account.\n\nBest regards,\nMaatram Foundation Team`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px;">
              <h2 style="color: #D4AF37; margin-bottom: 16px;">Welcome to Maatram Foundation</h2>
              <p>Dear <strong>${studentName}</strong>,</p>
              <p>Welcome to Maatram Foundation! Your student account has been successfully provisioned.</p>
              <div style="background-color: #FCF8FA; border-left: 4px solid #D4AF37; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #111827;">Portal Credentials</h3>
                <p><strong>Portal URL:</strong> <a href="${portalUrl}" style="color: #D4AF37; text-decoration: none;">${portalUrl}</a></p>
                <p><strong>Registration Number:</strong> <code style="font-family: monospace; font-size: 14px; font-weight: bold;">${record.registrationNumber}</code></p>
                <p><strong>Temporary Password:</strong> <code style="font-family: monospace; font-size: 14px; font-weight: bold; color: #D4AF37;">${record.tempPassword}</code></p>
              </div>
              <h3 style="color: #111827;">Next Steps</h3>
              <ol style="font-size: 14px; color: #45464c;">
                <li>Log in using the temporary credentials.</li>
                <li>Change your temporary password.</li>
                <li>Fill out your personal, academic, address details in the Student Profile.</li>
              </ol>
              <p style="font-size: 12px; color: #76777d; margin-top: 24px;">This is an automated message. Please do not reply directly to this email.</p>
            </div>
          `,
        };

        await notificationService.sendEmail(emailPayload);

        // Audit Log for email sent
        await createAuditLog({
          actorId,
          actorRole,
          action: 'WELCOME_EMAIL_SENT',
          targetEntityType: 'student',
          targetEntityId: studentId,
          targetLabel: studentName,
          details: `Credentials welcome email sent to ${record.email}`,
        });
      }

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
  async exportToCsv(queryParams: QueryParams): Promise<string> {
    const options: StudentQueryOptions = {
      search: queryParams.search as string,
      sortBy: this.mapSortBy(queryParams.sortBy as string),
      sortOrder: queryParams.sortOrder as 'asc' | 'desc',
      organizationId: queryParams.organizationId as string,
      zoneId: queryParams.zoneId as string,
      collegeId: queryParams.collegeId as string,
      departmentId: queryParams.departmentId as string,
      status: queryParams.status as StudentStatus,
      batch: queryParams.batch as string,
      academicYear: queryParams.academicYear as string,
    };

    const { orderBy } = parseQueryParams(options, 'registrationNumber');
    
    let students: StudentWithRelations[];
    if (queryParams.page !== undefined && queryParams.limit !== undefined) {
      const page = parseInt(String(queryParams.page), 10) || 1;
      const limit = parseInt(String(queryParams.limit), 10) || 10;
      const skip = (page - 1) * limit;
      students = await studentRepository.listStudents(options, skip, limit, orderBy);
    } else {
      students = await studentRepository.exportStudents(options, orderBy);
    }

    if (queryParams.view === 'provisioning') {
      const headers = [
        'Student Name',
        'Register No.',
        'Email Address',
        'Temp Password',
        'Import Date',
        'Lifecycle Status',
      ];
      const lines = [headers.join(',')];
      students.forEach((student) => {
        const fullName = this.computeFullName(
          student.firstName,
          student.middleName,
          student.lastName
        );
        const importDate = student.user?.createdAt ? student.user.createdAt.toISOString().split('T')[0] : 'N/A';
        const rawStatus = (student.user as any)?.accountStatus || student.accountStatus || 'pending_first_login';

        const row = [
          this.formatCsvValue(fullName || student.user?.email || ''),
          this.formatCsvValue(student.registrationNumber || ''),
          this.formatCsvValue(student.user?.email || ''),
          this.formatCsvValue(student.user?.tempPassword || 'Set by user'),
          this.formatCsvValue(importDate),
          this.formatCsvValue(rawStatus),
        ];
        lines.push(row.join(','));
      });
      return lines.join('\n');
    }

    const headers = [
      'Register Number',
      'Name',
      'College Name',
      'Zone',
      'Batch',
      'CGPA',
      'Status',
    ];

    const lines = [headers.join(',')];

    students.forEach((student) => {
      const fullName = this.computeFullName(
        student.firstName,
        student.middleName,
        student.lastName
      );

      const row = [
        this.formatCsvValue(student.registrationNumber || 'UNASSIGNED'),
        this.formatCsvValue(fullName || 'Scholar Student'),
        this.formatCsvValue(student.college?.name || 'Maatram College'),
        this.formatCsvValue(student.zone?.name || 'N/A'),
        this.formatCsvValue(student.batch || '2024-2028'),
        this.formatCsvValue(student.cgpa ? Number(student.cgpa).toFixed(2) : 'N/A'),
        this.formatCsvValue(student.status || 'ACTIVE'),
      ];

      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  /**
   * Generates Excel file buffer for exporting filtered students list.
   */
  async exportToExcel(queryParams: QueryParams): Promise<Buffer> {
    const options: StudentQueryOptions = {
      search: queryParams.search as string,
      sortBy: this.mapSortBy(queryParams.sortBy as string),
      sortOrder: queryParams.sortOrder as 'asc' | 'desc',
      organizationId: queryParams.organizationId as string,
      zoneId: queryParams.zoneId as string,
      collegeId: queryParams.collegeId as string,
      departmentId: queryParams.departmentId as string,
      status: queryParams.status as StudentStatus,
      batch: queryParams.batch as string,
      academicYear: queryParams.academicYear as string,
    };

    const { orderBy } = parseQueryParams(options, 'registrationNumber');
    
    let students: StudentWithRelations[];
    if (queryParams.page !== undefined && queryParams.limit !== undefined) {
      const page = parseInt(String(queryParams.page), 10) || 1;
      const limit = parseInt(String(queryParams.limit), 10) || 10;
      const skip = (page - 1) * limit;
      students = await studentRepository.listStudents(options, skip, limit, orderBy);
    } else {
      students = await studentRepository.exportStudents(options, orderBy);
    }

    let rows: Record<string, any>[];
    if (queryParams.view === 'provisioning') {
      rows = students.map((s) => {
        const fullName = this.computeFullName(s.firstName, s.middleName, s.lastName);
        const importDate = s.user?.createdAt ? s.user.createdAt.toISOString().split('T')[0] : 'N/A';
        const rawStatus = (s.user as any)?.accountStatus || s.accountStatus || 'pending_first_login';

        return {
          'Student Name': fullName || s.user?.email || '',
          'Register No.': s.registrationNumber || '',
          'Email Address': s.user?.email || '',
          'Temp Password': s.user?.tempPassword || 'Set by user',
          'Import Date': importDate,
          'Lifecycle Status': rawStatus,
        };
      });
    } else {
      rows = students.map((s) => {
        const fullName = this.computeFullName(s.firstName, s.middleName, s.lastName);
        return {
          'Register Number': s.registrationNumber || 'UNASSIGNED',
          Name: fullName || 'Scholar Student',
          'College Name': s.college?.name || 'Maatram College',
          Zone: s.zone?.name || 'N/A',
          Batch: s.batch || '2024-2028',
          CGPA: s.cgpa ? Number(s.cgpa).toFixed(2) : 'N/A',
          Status: s.status || 'ACTIVE',
        };
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Generates a 4-field student registration Excel template dynamically.
   */
  async generateTemplate(): Promise<Buffer> {
    const headers = [['Student Name', 'Register Number', 'Email', 'Date Of Birth']];
    const sampleRow = [['John Doe', '2024CS001', 'johndoe@example.com', '15/08/2004']];
    const data = [...headers, ...sampleRow];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
      { wch: 25 }, // Student Name
      { wch: 20 }, // Register Number
      { wch: 30 }, // Email
      { wch: 20 }, // Date of Birth
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Student Template');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Manually registers a student and generates a temporary password based on Date of Birth.
   */
  async manualRegisterStudent(
    body: { studentName: string; registrationNumber: string; email: string; dateOfBirth: string },
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<StudentWithRelations> {
    const { studentName, registrationNumber, email, dateOfBirth } = body;
    const emailLower = email.trim().toLowerCase();
    const regUpper = registrationNumber.trim().toUpperCase();

    const dob = parseExcelDate(dateOfBirth);
    if (!dob) {
      throw ApiError.badRequest('Invalid date of birth format (must be YYYY-MM-DD or DD/MM/YYYY)');
    }

    // Check duplicate email or registrationNumber
    const [existingEmail, existingReg] = await Promise.all([
      prisma.user.findUnique({ where: { email: emailLower } }),
      prisma.student.findUnique({ where: { registrationNumber: regUpper } }),
    ]);

    if (existingEmail) {
      throw ApiError.badRequest(`Email "${email}" is already registered`);
    }
    if (existingReg) {
      throw ApiError.badRequest(`Register Number "${registrationNumber}" is already registered`);
    }

    const org = await prisma.organization.findUnique({ where: { code: 'MTM-ORG' } });
    if (!org) {
      throw ApiError.internal('Default organization (MTM-ORG) not found in database');
    }

    // DOB Temporary password
    const tempPassword = formatDobAsPassword(dob);
    const tempPasswordHashed = await bcrypt.hash(tempPassword, 10);

    const parts = studentName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '.';

    const student = await studentRepository.provisionStudent({
      firstName,
      lastName,
      registrationNumber: regUpper,
      email: emailLower,
      dateOfBirth: dob,
      tempPasswordHashed,
      tempPassword,
      organizationId: org.id,
    });

    const fullStudentName = `${firstName} ${lastName === '.' ? '' : lastName}`.trim();

    // Log audits
    await createAuditLog({
      actorId,
      actorRole,
      action: 'STUDENT_CREATED',
      targetEntityType: 'student',
      targetEntityId: student.id,
      targetLabel: fullStudentName,
      details: `Student account manually provisioned: regNumber=${regUpper}, email=${emailLower}`,
    });

    // Send credentials email
    const portalUrl = env.FRONTEND_URL || 'http://localhost:5173';
    await notificationService.sendEmail({
      to: emailLower,
      subject: 'Welcome to Maatram Foundation - Your Student Account Credentials',
      body: `Dear ${fullStudentName},\n\nWelcome to Maatram Foundation! Your student account has been successfully provisioned.\n\nPortal URL: ${portalUrl}\nRegistration Number: ${regUpper}\nTemporary Password: ${tempPassword}\n\nInstructions:\n1. Log in to the portal using your credentials.\n2. You will be prompted to change your temporary password on your first login.\n3. Complete your profile fields to activate your account.\n\nBest regards,\nMaatram Foundation Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px;">
          <h2 style="color: #D4AF37; margin-bottom: 16px;">Welcome to Maatram Foundation</h2>
          <p>Dear <strong>${fullStudentName}</strong>,</p>
          <p>Welcome to Maatram Foundation! Your student account has been successfully provisioned.</p>
          <div style="background-color: #FCF8FA; border-left: 4px solid #D4AF37; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #111827;">Portal Credentials</h3>
            <p><strong>Portal URL:</strong> <a href="${portalUrl}" style="color: #D4AF37; text-decoration: none;">${portalUrl}</a></p>
            <p><strong>Registration Number:</strong> <code style="font-family: monospace; font-size: 14px; font-weight: bold;">${regUpper}</code></p>
            <p><strong>Temporary Password:</strong> <code style="font-family: monospace; font-size: 14px; font-weight: bold; color: #D4AF37;">${tempPassword}</code></p>
          </div>
          <h3 style="color: #111827;">Next Steps</h3>
          <ol style="font-size: 14px; color: #45464c;">
            <li>Log in using the temporary credentials.</li>
            <li>Change your temporary password.</li>
            <li>Fill out your personal, academic, address details in the Student Profile.</li>
          </ol>
          <p style="font-size: 12px; color: #76777d; margin-top: 24px;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      `,
    });

    await createAuditLog({
      actorId,
      actorRole,
      action: 'WELCOME_EMAIL_SENT',
      targetEntityType: 'student',
      targetEntityId: student.id,
      targetLabel: fullStudentName,
      details: `Credentials welcome email sent to ${emailLower}`,
    });

    return student;
  }

  /**
   * Retrieves student resume data, checking role-based permissions strictly.
   */
  async getStudentResume(
    studentIdentifier: string,
    requesterId: string,
    requesterRole: string,
    requesterZoneId?: string
  ): Promise<any> {
    let targetId = studentIdentifier;
    if (studentIdentifier === 'me' && requesterRole === 'student') {
      const selfStudent = await studentRepository.findByUserId(requesterId);
      if (!selfStudent) throw ApiError.notFound('Student profile not found');
      targetId = selfStudent.id;
    }

    const student = await studentRepository.findByIdWithResumeData(targetId);
    if (!student) {
      throw ApiError.notFound(`Student record with ID "${studentIdentifier}" not found`);
    }

    // Strict Role access validation
    if (requesterRole === 'student') {
      if (student.userId !== requesterId) {
        throw new ApiError(403, 'Forbidden: You do not have permission to view another student\'s resume');
      }
    } else if (requesterRole === 'zone') {
      if (!requesterZoneId || student.zoneId !== requesterZoneId) {
        throw new ApiError(403, 'Forbidden: You do not have permission to view student resumes outside your assigned zone');
      }
    } else if (requesterRole !== 'admin') {
      throw new ApiError(403, 'Forbidden: Unauthorized access');
    }

    const fullName = this.computeFullName(student.firstName, student.middleName, student.lastName);
    return {
      ...student,
      fullName,
    };
  }
}

export const studentService = new StudentService();
