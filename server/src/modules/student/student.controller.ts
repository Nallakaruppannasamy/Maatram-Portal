/**
 * @file src/modules/student/student.controller.ts
 * @description Controller layer parsing Express requests and formatting Student Management API responses.
 */

import { Request, Response } from 'express';
import { studentService } from './student.service';
import { zoneService } from '../zone/zone.service';
import { prisma } from '@/config/database';
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
   * Retrieves student resume data.
   */
  getResume = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const requesterId = req.user!.userId;
    const requesterRole = req.user!.role;
    const requesterZoneId = req.user!.zoneId;

    const data = await studentService.getStudentResume(id, requesterId, requesterRole, requesterZoneId);
    ResponseFormatter.success(res, data, 'Resume data retrieved successfully');
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
   * Updates SPOC status of a student.
   */
  updateSpocStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { isSpoc } = req.body;
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const student = await studentService.updateSpocStatus(id, isSpoc, actorId, actorRole);

    ResponseFormatter.success(
      res,
      student,
      `Student SPOC status successfully updated to ${isSpoc ? 'active' : 'inactive'}`
    );
  });

  /**
   * Lists students with pagination, search, sorting, and filters.
   */
  listStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const queryParams = { ...req.query };

    if (req.user?.role === 'zone') {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(req.user.userId);
      queryParams.zoneId = assignedZoneId || req.user.zoneId;

      // If a collegeId was specified, verify that the college belongs to this zone!
      if (queryParams.collegeId && typeof queryParams.collegeId === 'string' && queryParams.collegeId !== 'All') {
        const college = await prisma.college.findUnique({
          where: { id: queryParams.collegeId },
          select: { zoneId: true },
        });
        if (!college || college.zoneId !== queryParams.zoneId) {
          throw ApiError.forbidden('Access denied: You can only view students in colleges assigned to your zone');
        }
      }
    }

    const result = await studentService.listStudents(queryParams, req.user?.role);

    ResponseFormatter.success(res, result.items, 'Students listed successfully', 200, result.meta);
  });

  /**
   * Imports students from CSV file.
   */
  /**
   * Imports students from Excel or CSV file.
   */
  importStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded. Please upload a valid Excel (.xlsx, .xls) or CSV file.');
    }

    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const report = await studentService.importStudents(
      req.file.buffer,
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
   * Downloads dynamically generated Excel template for student imports.
   */
  getTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const buffer = await studentService.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Student_Import_Template.xlsx'
    );
    res.status(200).send(buffer);
  });

  /**
   * Manually registers a student and generates/sends their credentials.
   */
  manualRegister = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const student = await studentService.manualRegisterStudent(req.body, actorId, actorRole);
    ResponseFormatter.success(res, student, 'Student provisioned and welcome email sent successfully', 201);
  });

  /**
   * Exports students list in CSV or Excel format.
   */
  exportStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const format = ((req.query.format as string) || 'csv').toLowerCase();
    const queryParams = { ...req.query };

    if (req.user?.role === 'zone') {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(req.user.userId);
      queryParams.zoneId = assignedZoneId || req.user.zoneId;

      if (queryParams.collegeId && typeof queryParams.collegeId === 'string' && queryParams.collegeId !== 'All') {
        const college = await prisma.college.findUnique({
          where: { id: queryParams.collegeId },
          select: { zoneId: true },
        });
        if (!college || college.zoneId !== queryParams.zoneId) {
          throw ApiError.forbidden('Access denied: You can only export students in colleges assigned to your zone');
        }
      }
    }

    if (format === 'xlsx') {
      const buffer = await studentService.exportToExcel(queryParams, req.user?.role);
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
      const csvContent = await studentService.exportToCsv(queryParams, req.user?.role);
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
