/**
 * @file src/modules/student/student.controller.ts
 * @description Controller layer parsing Express requests and formatting Student Management API responses.
 */

import { Request, Response } from 'express';
import { studentService } from './student.service';
import { ApiError } from '@/common/exceptions/apiError';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { AuditActorRole } from '@prisma/client';

export class StudentController {
  /**
   * Helper to map user request roles to audit actor roles.
   */
  private getAuditActorRole(role: string): AuditActorRole {
    if (role === 'admin') return AuditActorRole.admin;
    if (role === 'zone') return AuditActorRole.zone;
    if (role === 'student') return AuditActorRole.student;
    return AuditActorRole.system;
  }

  /**
   * Creates a student record.
   */
  createStudent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const student = await studentService.createStudent(req.body, actorId, actorRole);

    ResponseFormatter.success(res, student, 'Student account created successfully', 201);
  });

  /**
   * Retrieves a student profile by ID.
   */
  getStudentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const student = await studentService.getStudentById(id);

    ResponseFormatter.success(res, student, 'Student profile retrieved successfully');
  });

  /**
   * Updates student details.
   */
  updateStudent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const student = await studentService.updateStudent(id, req.body, actorId, actorRole);

    ResponseFormatter.success(res, student, 'Student account updated successfully');
  });

  /**
   * Changes status of a student.
   */
  changeStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const student = await studentService.changeStatus(id, status, actorId, actorRole);

    ResponseFormatter.success(res, student, `Student status successfully changed to ${status}`);
  });

  /**
   * Lists students with pagination, search, sorting, and filters.
   */
  listStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await studentService.listStudents(req.query);

    ResponseFormatter.success(res, result.items, 'Students listed successfully', 200, result.meta);
  });

  /**
   * Imports students from CSV file.
   */
  importStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded. Please upload a valid CSV file.');
    }

    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const csvContent = req.file.buffer.toString('utf-8');
    const report = await studentService.importStudents(
      csvContent,
      req.file.originalname,
      actorId,
      actorRole
    );

    if (report.errorCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Import failed due to row validation errors',
        data: report,
      });
      return;
    }

    ResponseFormatter.success(res, report, 'All students successfully imported');
  });

  /**
   * Exports students list in CSV or Excel format.
   */
  exportStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const format = ((req.query.format as string) || 'csv').toLowerCase();

    if (format === 'xlsx') {
      const buffer = await studentService.exportToExcel(req.query);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=students-export-${Date.now()}.xlsx`
      );
      res.status(200).send(buffer);
    } else if (format === 'csv') {
      const csvContent = await studentService.exportToCsv(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=students-export-${Date.now()}.csv`
      );
      res.status(200).send(csvContent);
    } else {
      throw ApiError.badRequest(
        `Unsupported export format: "${format}". Supported formats are "csv" and "xlsx".`
      );
    }
  });
}

export const studentController = new StudentController();
