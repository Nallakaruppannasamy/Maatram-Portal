/**
 * @file src/modules/student/import-job.manager.ts
 * @description Asynchronous batch import engine for student provisioning with live progress tracking.
 */

import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { studentRepository } from './student.repository';
import { ImportStatus, UserRole, AccountStatus, StudentStatus, AuditActorRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { createAuditLog } from '@/utils/audit';
import { notificationService } from '@/utils/notification';
import { env } from '@/config/env';

export interface ImportJobRowError {
  row: number;
  regNumber?: string;
  email?: string;
  error: string;
}

export interface ImportJobState {
  importId: string;
  fileName: string;
  importedById: string;
  status: 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  percentage: number;
  errors: ImportJobRowError[];
  startedAt: Date;
  completedAt?: Date;
}

export interface NormalizedStudentRow {
  name: string;
  registrationNumber: string;
  email: string;
  dateOfBirth: string;
  rawRowNumber: number;
}

function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  if (typeof val === 'number') {
    const parsed = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatDobAsPassword(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `MTM@${dd}${mm}${yyyy}`;
}

export class ImportJobManager {
  private static instance: ImportJobManager;
  private jobs: Map<string, ImportJobState> = new Map();

  private constructor() {}

  public static getInstance(): ImportJobManager {
    if (!ImportJobManager.instance) {
      ImportJobManager.instance = new ImportJobManager();
    }
    return ImportJobManager.instance;
  }

  public createJob(params: {
    importId: string;
    fileName: string;
    importedById: string;
    totalRows: number;
  }): ImportJobState {
    const state: ImportJobState = {
      importId: params.importId,
      fileName: params.fileName,
      importedById: params.importedById,
      status: 'PROCESSING',
      totalRows: params.totalRows,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      duplicateRows: 0,
      percentage: 0,
      errors: [],
      startedAt: new Date(),
    };

    this.jobs.set(params.importId, state);
    return state;
  }

  public async getJob(importId: string): Promise<ImportJobState | null> {
    const memoryJob = this.jobs.get(importId);
    if (memoryJob) {
      return memoryJob;
    }

    // Reconstruct from DB if memory job expired or server restarted
    const dbRecord = await prisma.enrollmentImport.findUnique({
      where: { id: importId },
    });

    if (!dbRecord) {
      return null;
    }

    let status: 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED' = 'PROCESSING';
    if (dbRecord.status === ImportStatus.completed) {
      status = dbRecord.errorCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
    } else if (dbRecord.status === ImportStatus.failed) {
      status = 'FAILED';
    }

    const processed = dbRecord.successCount + dbRecord.errorCount + dbRecord.duplicateCount;
    const percentage = dbRecord.totalRows > 0 ? Math.min(100, Math.round((processed / dbRecord.totalRows) * 100)) : 100;

    const reconstructed: ImportJobState = {
      importId: dbRecord.id,
      fileName: dbRecord.fileName,
      importedById: dbRecord.importedById,
      status,
      totalRows: dbRecord.totalRows,
      processedRows: processed,
      successfulRows: dbRecord.successCount,
      failedRows: dbRecord.errorCount,
      duplicateRows: dbRecord.duplicateCount,
      percentage,
      errors: [],
      startedAt: dbRecord.importedAt,
    };

    this.jobs.set(importId, reconstructed);
    return reconstructed;
  }

  /**
   * Spawns asynchronous background worker for batch processing.
   */
  public startProcessing(params: {
    importId: string;
    organizationId: string;
    rows: NormalizedStudentRow[];
    actorId: string;
    actorRole: string;
  }): void {
    setImmediate(async () => {
      try {
        await this.processBatches(params);
      } catch (err) {
        logger.error(`[IMPORT_JOB_CRITICAL_ERROR] Job ${params.importId} failed unhandled:`, err);
        const job = this.jobs.get(params.importId);
        if (job) {
          job.status = 'FAILED';
          job.errors.push({
            row: 0,
            error: `Unhandled system error during import: ${(err as Error).message}`,
          });
        }
        await prisma.enrollmentImport.update({
          where: { id: params.importId },
          data: {
            status: ImportStatus.failed,
            errorCount: params.rows.length,
          },
        }).catch(() => {});
      }
    });
  }

  /**
   * Core batch processor.
   */
  private async processBatches(params: {
    importId: string;
    organizationId: string;
    rows: NormalizedStudentRow[];
    actorId: string;
    actorRole: string;
  }): Promise<void> {
    const { importId, organizationId, rows, actorId } = params;
    const job = this.jobs.get(importId);
    if (!job) return;

    const BATCH_SIZE = 50;
    const seenEmailsInFile = new Set<string>();
    const seenRegsInFile = new Set<string>();

    const emailQueue: Array<{
      email: string;
      studentName: string;
      registrationNumber: string;
      tempPassword: string;
      studentId: string;
    }> = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batchRows = rows.slice(i, i + BATCH_SIZE);
      const validRecordsForBatch: Array<{
        firstName: string;
        middleName?: string | null;
        lastName: string;
        registrationNumber: string;
        email: string;
        dateOfBirth: Date;
        tempPasswordHashed: string;
        tempPassword: string;
        organizationId: string;
        rawRowNumber: number;
      }> = [];

      // Extract batch emails and reg numbers for bulk DB lookup
      const batchCandidateEmails = batchRows
        .map((r) => r.email?.trim().toLowerCase())
        .filter(Boolean);
      const batchCandidateRegs = batchRows
        .map((r) => r.registrationNumber?.trim().toUpperCase())
        .filter(Boolean);

      // Perform bulk database duplicate checks for this batch
      const [existingUsers, existingStudents] = await Promise.all([
        prisma.user.findMany({
          where: { email: { in: batchCandidateEmails } },
          select: { email: true },
        }),
        prisma.student.findMany({
          where: { registrationNumber: { in: batchCandidateRegs } },
          select: { registrationNumber: true },
        }),
      ]);

      const existingDbEmails = new Set(existingUsers.map((u) => u.email?.toLowerCase()));
      const existingDbRegs = new Set(existingStudents.map((s) => s.registrationNumber.toUpperCase()));

      // Validate each row in current batch
      const candidateRecordsToHash: Array<{
        firstName: string;
        lastName: string;
        registrationNumber: string;
        email: string;
        dateOfBirth: Date;
        tempPassword: string;
        rawRowNumber: number;
      }> = [];

      for (const row of batchRows) {
        const rowNum = row.rawRowNumber;
        const rowErrors: string[] = [];

        if (!row.name || !row.name.trim()) rowErrors.push('Missing Student Name');
        if (!row.registrationNumber || !row.registrationNumber.trim()) rowErrors.push('Missing Register Number');
        if (!row.email || !row.email.trim()) rowErrors.push('Missing Email');
        if (!row.dateOfBirth) rowErrors.push('Missing Date Of Birth');

        if (rowErrors.length > 0) {
          job.failedRows++;
          job.processedRows++;
          job.errors.push({ row: rowNum, regNumber: row.registrationNumber, email: row.email, error: rowErrors.join(', ') });
          continue;
        }

        const emailClean = row.email.trim().toLowerCase();
        const regClean = row.registrationNumber.trim().toUpperCase();

        if (!/^\S+@\S+\.\S+$/.test(emailClean)) {
          rowErrors.push(`Invalid email format: "${row.email}"`);
        }

        const dob = parseExcelDate(row.dateOfBirth);
        if (!dob) {
          rowErrors.push(`Invalid Date of Birth format: "${row.dateOfBirth}"`);
        }

        if (existingDbEmails.has(emailClean)) {
          rowErrors.push(`Duplicate email in database: "${emailClean}"`);
        }
        if (existingDbRegs.has(regClean)) {
          rowErrors.push(`Duplicate register number in database: "${regClean}"`);
        }

        if (seenEmailsInFile.has(emailClean)) {
          rowErrors.push(`Duplicate email in spreadsheet: "${emailClean}"`);
        }
        if (seenRegsInFile.has(regClean)) {
          rowErrors.push(`Duplicate register number in spreadsheet: "${regClean}"`);
        }

        if (rowErrors.length > 0) {
          job.failedRows++;
          if (rowErrors.some((e) => e.includes('Duplicate'))) {
            job.duplicateRows++;
          }
          job.processedRows++;
          job.errors.push({ row: rowNum, regNumber: regClean, email: emailClean, error: rowErrors.join(', ') });
          continue;
        }

        seenEmailsInFile.add(emailClean);
        seenRegsInFile.add(regClean);

        const nameParts = row.name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '.';
        const tempPassword = formatDobAsPassword(dob!);

        candidateRecordsToHash.push({
          firstName,
          lastName,
          registrationNumber: regClean,
          email: emailClean,
          dateOfBirth: dob!,
          tempPassword,
          rawRowNumber: rowNum,
        });
      }

      // Concurrently hash passwords for valid batch candidates
      if (candidateRecordsToHash.length > 0) {
        const hashedRecords = await Promise.all(
          candidateRecordsToHash.map(async (rec) => {
            const tempPasswordHashed = await bcrypt.hash(rec.tempPassword, 10);
            return {
              ...rec,
              tempPasswordHashed,
              organizationId,
            };
          })
        );

        validRecordsForBatch.push(...hashedRecords);
      }

      // Atomically insert the valid batch into PostgreSQL
      if (validRecordsForBatch.length > 0) {
        try {
          const createdStudents = await studentRepository.provisionStudentsBulk(validRecordsForBatch);
          job.successfulRows += createdStudents.length;
          job.processedRows += createdStudents.length;

          // Enqueue welcome emails
          for (const rec of validRecordsForBatch) {
            const studentName = `${rec.firstName} ${rec.lastName === '.' ? '' : rec.lastName}`.trim();
            const created = createdStudents.find((s) => s.registrationNumber === rec.registrationNumber);
            emailQueue.push({
              email: rec.email,
              studentName,
              registrationNumber: rec.registrationNumber,
              tempPassword: rec.tempPassword,
              studentId: created?.id || '',
            });
          }
        } catch (dbErr) {
          logger.error(`[IMPORT_BATCH_FAIL] Failed inserting batch of ${validRecordsForBatch.length} records:`, dbErr);
          for (const rec of validRecordsForBatch) {
            job.failedRows++;
            job.processedRows++;
            job.errors.push({
              row: rec.rawRowNumber,
              regNumber: rec.registrationNumber,
              email: rec.email,
              error: `Database insertion failed: ${(dbErr as Error).message}`,
            });
          }
        }
      }

      // Update progress in job state & PostgreSQL
      job.percentage = job.totalRows > 0 ? Math.min(100, Math.round((job.processedRows / job.totalRows) * 100)) : 100;

      await prisma.enrollmentImport.update({
        where: { id: importId },
        data: {
          successCount: job.successfulRows,
          errorCount: job.failedRows,
          duplicateCount: job.duplicateRows,
          status: ImportStatus.processing,
        },
      }).catch(() => {});
    }

    // Determine final status
    if (job.successfulRows === job.totalRows && job.totalRows > 0) {
      job.status = 'COMPLETED';
    } else if (job.successfulRows > 0) {
      job.status = 'COMPLETED_WITH_ERRORS';
    } else {
      job.status = 'FAILED';
    }

    job.completedAt = new Date();
    job.percentage = 100;

    await prisma.enrollmentImport.update({
      where: { id: importId },
      data: {
        successCount: job.successfulRows,
        errorCount: job.failedRows,
        duplicateCount: job.duplicateRows,
        status: job.successfulRows > 0 ? ImportStatus.completed : ImportStatus.failed,
      },
    }).catch(() => {});

    // Write audit summary
    await createAuditLog({
      actorId,
      actorRole: 'admin',
      action: 'STUDENT_IMPORTED',
      targetEntityType: 'enrollment_import',
      targetEntityId: importId,
      targetLabel: job.fileName,
      details: `Import completed: total=${job.totalRows}, success=${job.successfulRows}, failed=${job.failedRows}, duplicates=${job.duplicateRows}`,
    }).catch(() => {});

    logger.info(`[IMPORT_JOB_FINISHED] Job ${importId}: ${job.successfulRows}/${job.totalRows} succeeded, ${job.failedRows} failed`);

    // Process queued welcome emails in background with concurrency limit of 5
    this.processEmailQueue(emailQueue, actorId);
  }

  /**
   * Non-blocking throttled email dispatcher with batch audit logging.
   */
  private async processEmailQueue(
    queue: Array<{
      email: string;
      studentName: string;
      registrationNumber: string;
      tempPassword: string;
      studentId: string;
    }>,
    actorId: string
  ): Promise<void> {
    if (queue.length === 0) return;

    const CONCURRENCY = 5;
    const auditEntriesToInsert: any[] = [];

    for (let i = 0; i < queue.length; i += CONCURRENCY) {
      const chunk = queue.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(async (item) => {
          const portalUrl = env.FRONTEND_URL || 'https://maatram-portal.onrender.com';
          const emailPayload = {
            to: item.email,
            subject: 'Welcome to Maatram Foundation - Your Student Account Credentials',
            body: `Dear ${item.studentName},\n\nWelcome to Maatram Foundation! Your student account has been successfully provisioned.\n\nPortal URL: ${portalUrl}\nRegistration Number: ${item.registrationNumber}\nTemporary Password: ${item.tempPassword}\n\nInstructions:\n1. Log in to the portal using your credentials.\n2. You will be prompted to change your temporary password on your first login.\n3. Complete your profile fields to activate your account.\n\nBest regards,\nMaatram Foundation Team`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px;">
                <h2 style="color: #D4AF37; margin-bottom: 16px;">Welcome to Maatram Foundation</h2>
                <p>Dear <strong>${item.studentName}</strong>,</p>
                <p>Welcome to Maatram Foundation! Your student account has been successfully provisioned.</p>
                <div style="background-color: #FCF8FA; border-left: 4px solid #D4AF37; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #111827;">Portal Credentials</h3>
                  <p><strong>Portal URL:</strong> <a href="${portalUrl}" style="color: #D4AF37; text-decoration: none;">${portalUrl}</a></p>
                  <p><strong>Registration Number:</strong> <code style="font-family: monospace; font-size: 14px; font-weight: bold;">${item.registrationNumber}</code></p>
                  <p><strong>Temporary Password:</strong> <code style="font-family: monospace; font-size: 14px; font-weight: bold; color: #D4AF37;">${item.tempPassword}</code></p>
                </div>
                <p style="font-size: 12px; color: #76777d; margin-top: 24px;">This is an automated message. Please do not reply directly to this email.</p>
              </div>
            `,
          };

          const res = await notificationService.sendEmail(emailPayload);
          return { item, res };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          const { item, res } = r.value;
          auditEntriesToInsert.push({
            id: randomUUID(),
            logCode: `AUD-${randomUUID().slice(0, 8).toUpperCase()}`,
            actorId,
            actorRole: AuditActorRole.admin,
            action: res.success ? 'WELCOME_EMAIL_SENT' : 'WELCOME_EMAIL_FAILED',
            targetEntityType: 'student',
            targetEntityId: item.studentId || null,
            targetLabel: item.studentName,
            details: res.success
              ? `Credentials welcome email sent to ${item.email}`
              : `Credentials email delivery failed: ${res.error || 'Unknown error'}`,
            ipAddress: '127.0.0.1',
          });
        }
      }

      if (auditEntriesToInsert.length >= 50) {
        await prisma.auditLog.createMany({ data: auditEntriesToInsert }).catch(() => {});
        auditEntriesToInsert.length = 0;
      }
    }

    if (auditEntriesToInsert.length > 0) {
      await prisma.auditLog.createMany({ data: auditEntriesToInsert }).catch(() => {});
    }
  }
}

export const importJobManager = ImportJobManager.getInstance();
