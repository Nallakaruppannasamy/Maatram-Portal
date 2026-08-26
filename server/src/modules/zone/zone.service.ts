/**
 * @file src/modules/zone/zone.service.ts
 * @description Service layer containing all business rules for the Zone module.
 */

import { ApiError } from '@/common/exceptions/apiError';
import { logger } from '@/config/logger';
import { zoneRepository } from './zone.repository';
import { organizationRepository } from '../organization/organization.repository';
import { prisma } from '@/config/database';
import { CreateZoneDTO, UpdateZoneDTO } from './zone.types';
import { ZONE_LOGS } from './zone.constants';
import { createAuditLog } from '@/utils/audit';
import {
  parseQueryParams,
  buildPaginationMeta,
  buildSearchQuery,
  QueryParams,
} from '@/utils/query-helper';
import { Zone, AuditActorRole, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

export class ZoneService {
  /**
   * Helper to validate that an incharge user exists and has the correct role.
   */
  private async validateIncharge(inchargeId: string | null | undefined): Promise<void> {
    if (!inchargeId) return;
    const user = await prisma.user.findUnique({
      where: { id: inchargeId },
    });
    if (!user) {
      throw ApiError.notFound('Incharge user not found');
    }
    if (user.role !== 'zone') {
      throw ApiError.badRequest('Incharge user must have the "zone" role');
    }
  }

  /**
   * Creates a new zone, preventing duplicates.
   */
  async createZone(data: CreateZoneDTO, actorId: string, actorRole: AuditActorRole): Promise<Zone> {
    const uppercaseCode = data.code.toUpperCase();

    // Verify parent organization exists
    const org = await organizationRepository.findById(data.organizationId);
    if (!org) {
      throw ApiError.notFound('Parent organization not found');
    }

    // Verify incharge role if assigned
    await this.validateIncharge(data.inchargeId);

    // Check duplicate code
    const isTaken = await zoneRepository.existsByCode(uppercaseCode);
    if (isTaken) {
      throw ApiError.badRequest(`Zone code "${uppercaseCode}" is already taken`);
    }

    const zone = await zoneRepository.create({
      ...data,
      code: uppercaseCode,
    });

    // Record audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: ZONE_LOGS.ZONE_CREATED,
      targetEntityType: 'zone',
      targetEntityId: zone.id,
      targetLabel: zone.name,
      details: `Created zone: ${zone.name} (${zone.code}) under organization ID: ${zone.organizationId}`,
    });

    logger.info(`[${ZONE_LOGS.ZONE_CREATED}] Created zone ID: ${zone.id}`);
    return zone;
  }

  /**
   * Updates zone attributes.
   */
  async updateZone(
    id: string,
    data: UpdateZoneDTO,
    actorId: string,
    actorRole: AuditActorRole
  ): Promise<Zone> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw ApiError.notFound('Zone not found');
    }

    // Validate parent organization if changing
    if (data.organizationId) {
      const org = await organizationRepository.findById(data.organizationId);
      if (!org) {
        throw ApiError.notFound('Organization not found');
      }
    }

    // Validate incharge if changing
    if (data.inchargeId !== undefined) {
      await this.validateIncharge(data.inchargeId);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If inchargeId is changing, handle bidirectional user zoneId mapping updates
      if (data.inchargeId !== undefined) {
        const currentZone = await tx.zone.findUnique({
          where: { id },
          select: { inchargeId: true }
        });

        // 1. If there was a previous incharge, remove their zoneId mapping
        if (currentZone?.inchargeId && currentZone.inchargeId !== data.inchargeId) {
          await tx.user.update({
            where: { id: currentZone.inchargeId },
            data: { zoneId: null }
          });
        }

        // 2. If a new incharge is being assigned
        if (data.inchargeId) {
          // If the new incharge was previously assigned as incharge to another zone, clear that zone's inchargeId
          const prevZone = await tx.zone.findFirst({
            where: { inchargeId: data.inchargeId, NOT: { id } }
          });
          if (prevZone) {
            await tx.zone.update({
              where: { id: prevZone.id },
              data: { inchargeId: null }
            });
          }

          // Set their zoneId
          await tx.user.update({
            where: { id: data.inchargeId },
            data: { zoneId: id }
          });
        }
      }

      // Perform the actual update
      return tx.zone.update({
        where: { id },
        data: {
          name: data.name,
          regionLabel: data.regionLabel,
          organizationId: data.organizationId,
          isActive: data.isActive,
          inchargeId: data.inchargeId === undefined ? undefined : (data.inchargeId || null)
        }
      });
    });

    await createAuditLog({
      actorId,
      actorRole,
      action: ZONE_LOGS.ZONE_UPDATED,
      targetEntityType: 'zone',
      targetEntityId: updated.id,
      targetLabel: updated.name,
      details: `Updated zone: ${updated.name}`,
    });

    logger.info(`[${ZONE_LOGS.ZONE_UPDATED}] Updated zone ID: ${updated.id}`);
    return updated;
  }

  /**
   * Retrieves a zone by ID.
   */
  async getZone(id: string): Promise<Zone> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw ApiError.notFound('Zone not found');
    }
    return zone;
  }

  /**
   * Lists zones with pagination, search, sorting and filtering.
   */
  async listZones(params: QueryParams) {
    const { skip, take, orderBy } = parseQueryParams(params, 'name');

    // Build filters
    const where: Prisma.ZoneWhereInput = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true' || (params.isActive as unknown) === true;
    }

    if (params.organizationId) {
      where.organizationId = params.organizationId as string;
    }

    // Build search filters (on name and code)
    if (params.search) {
      Object.assign(where, buildSearchQuery(params.search, ['name', 'code']));
    }

    const [zones, totalCount] = await Promise.all([
      zoneRepository.list(
        where,
        skip,
        take,
        orderBy as Prisma.ZoneOrderByWithRelationInput | undefined
      ),
      zoneRepository.count(where),
    ]);

    const items = zones.map((z: any) => ({
      ...z,
      collegeCount: z._count?.colleges ?? z.colleges?.length ?? 0,
      studentCount: z._count?.students ?? z.students?.length ?? 0,
    }));

    const meta = buildPaginationMeta(totalCount, params);

    return { data: items, meta };
  }

  /**
   * Performs soft deletion of a zone.
   */
  async deleteZone(id: string, actorId: string, actorRole: AuditActorRole): Promise<Zone> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw ApiError.notFound('Zone not found');
    }

    const updated = await zoneRepository.softDelete(id);

    await createAuditLog({
      actorId,
      actorRole,
      action: ZONE_LOGS.ZONE_UPDATED,
      targetEntityType: 'zone',
      targetEntityId: updated.id,
      targetLabel: updated.name,
      details: `Soft-deleted zone: ${updated.name}`,
    });

    logger.info(`[${ZONE_LOGS.ZONE_UPDATED}] Soft-deleted zone ID: ${updated.id}`);
    return updated;
  }

  /**
   * Helper to resolve the assigned zone ID for a user.
   */
  async getAssignedZoneIdForUser(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { zoneId: true },
    });

    if (user?.zoneId) {
      return user.zoneId;
    }

    const zone = await prisma.zone.findFirst({
      where: { inchargeId: userId },
      select: { id: true },
    });

    return zone?.id || null;
  }

  /**
   * Retrieves colleges assigned to the authenticated user's zone.
   */
  async getMyColleges(userId: string): Promise<any[]> {
    const zoneId = await this.getAssignedZoneIdForUser(userId);
    if (!zoneId) {
      return [];
    }
    return this.getZoneColleges(zoneId);
  }

  /**
   * Exports colleges assigned to the authenticated user's zone.
   */
  /**
   * Exports colleges assigned to the authenticated user's zone.
   */
  async exportMyColleges(userId: string, format: string): Promise<Buffer | string> {
    const zoneId = await this.getAssignedZoneIdForUser(userId);
    if (!zoneId) {
      if (format === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet([]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Colleges');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      }
      return 'College Name,Code,Location,Departments,Programs,Total Students,Active Students\n';
    }
    return this.exportZoneColleges(zoneId, format);
  }

  /**
   * Retrieves detailed academic counts for colleges assigned to a zone.
   */
  async getZoneColleges(zoneId: string): Promise<any[]> {
    const colleges = await prisma.college.findMany({
      where: { zoneId, isActive: true },
      include: {
        departments: {
          include: {
            programs: true,
          },
        },
        students: {
          select: {
            id: true,
            status: true,
            batch: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return colleges.map((col) => {
      const colStudents = col.students || [];
      const studentCount = colStudents.length;
      const activeStudents = colStudents.filter((s: any) => s.status === 'ACTIVE').length;

      const departmentCount = col.departments.length;
      const programCount = col.departments.reduce((sum: number, d: any) => sum + d.programs.length, 0);

      const departmentList = col.departments.map((d) => d.name);

      const programList: string[] = [];
      col.departments.forEach((d) => {
        d.programs.forEach((p) => {
          if (!programList.includes(p.name)) {
            programList.push(p.name);
          }
        });
      });

      const batchDistribution: Record<string, number> = {};
      colStudents.forEach((st) => {
        if (st.batch) {
          batchDistribution[st.batch] = (batchDistribution[st.batch] || 0) + 1;
        }
      });

      return {
        id: col.id,
        name: col.name,
        code: col.code,
        location: col.location,
        degrees: col.departments.map((d) => ({
          id: d.id,
          name: d.name,
          departments: d.programs.map((p) => ({
            id: p.id,
            name: p.name,
            durationYears: p.durationYears,
          })),
        })),
        departmentCount,
        programCount,
        studentCount,
        activeStudents,
        departmentList,
        programList,
        batchDistribution,
      };
    });
  }

  /**
   * Exports detailed zone colleges data to Excel or CSV.
   */
  async exportZoneColleges(zoneId: string, format: string): Promise<Buffer | string> {
    const list = await this.getZoneColleges(zoneId);
    const rows = list.map((item) => ({
      'College Name': item.name,
      Code: item.code,
      Location: item.location,
      Departments: item.departmentCount,
      Programs: item.programCount,
      'Total Students': item.studentCount,
      'Active Students': item.activeStudents,
    }));

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Colleges');
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    } else {
      const headers = [
        'College Name',
        'Code',
        'Location',
        'Departments',
        'Programs',
        'Total Students',
        'Active Students',
      ];
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          [
            `"${(row['College Name'] || '').replace(/"/g, '""')}"`,
            `"${(row.Code || '').replace(/"/g, '""')}"`,
            `"${(row.Location || '').replace(/"/g, '""')}"`,
            row.Departments,
            row.Programs,
            row['Total Students'],
            row['Active Students'],
          ].join(',')
        ),
      ].join('\n');
      return csvContent;
    }
  }

  // --- College CRUD ---
  async addCollege(zoneId: string, data: { name: string; code: string; location: string }): Promise<any> {
    const uppercaseCode = data.code.toUpperCase();
    const existing = await prisma.college.findUnique({ where: { code: uppercaseCode } });
    if (existing) {
      if (existing.isActive) {
        throw ApiError.badRequest(`College code "${uppercaseCode}" is already in use`);
      } else {
        // Reactivate soft-deleted college
        return prisma.college.update({
          where: { id: existing.id },
          data: { name: data.name, location: data.location, zoneId, isActive: true },
        });
      }
    }
    return prisma.college.create({
      data: {
        name: data.name,
        code: uppercaseCode,
        location: data.location,
        zoneId,
        isActive: true,
      },
    });
  }

  async updateCollege(collegeId: string, data: { name: string; location: string }): Promise<any> {
    const college = await prisma.college.findUnique({ where: { id: collegeId } });
    if (!college) throw ApiError.notFound('College not found');
    return prisma.college.update({
      where: { id: collegeId },
      data: {
        name: data.name,
        location: data.location,
      },
    });
  }

  async deleteCollege(collegeId: string): Promise<any> {
    const college = await prisma.college.findUnique({ where: { id: collegeId } });
    if (!college) throw ApiError.notFound('College not found');

    // Check if students are registered under this college
    const studentCount = await prisma.student.count({ where: { collegeId } });
    if (studentCount > 0) {
      throw ApiError.badRequest(
        `College cannot be deleted because ${studentCount} student${studentCount > 1 ? 's are' : ' is'} associated with this college.`
      );
    }

    // Safely delete dependent academic programs & departments before deleting college in a transaction
    return prisma.$transaction(async (tx) => {
      const departments = await tx.department.findMany({
        where: { collegeId },
        select: { id: true },
      });
      const deptIds = departments.map((d) => d.id);
      if (deptIds.length > 0) {
        await tx.program.deleteMany({
          where: { departmentId: { in: deptIds } },
        });
        await tx.department.deleteMany({
          where: { id: { in: deptIds } },
        });
      }
      return tx.college.delete({ where: { id: collegeId } });
    });
  }

  // --- Department CRUD ---
  async addDepartment(collegeId: string, name: string): Promise<any> {
    const college = await prisma.college.findUnique({ where: { id: collegeId } });
    if (!college) throw ApiError.notFound('College not found');
    // Validate duplicate department name case-insensitively in same college
    const existing = await prisma.department.findFirst({
      where: { collegeId, name: { equals: name, mode: 'insensitive' } }
    });
    if (existing) {
      throw ApiError.badRequest(`Degree "${name}" already exists in this college`);
    }
    return prisma.department.create({
      data: { name, collegeId }
    });
  }

  async updateDepartment(departmentId: string, name: string): Promise<any> {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw ApiError.notFound('Degree not found');
    const existing = await prisma.department.findFirst({
      where: { collegeId: dept.collegeId, name: { equals: name, mode: 'insensitive' }, NOT: { id: departmentId } }
    });
    if (existing) {
      throw ApiError.badRequest(`Degree "${name}" already exists in this college`);
    }
    return prisma.department.update({
      where: { id: departmentId },
      data: { name }
    });
  }

  async deleteDepartment(departmentId: string): Promise<any> {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw ApiError.notFound('Degree not found');
    const studentCount = await prisma.student.count({ where: { departmentId } });
    if (studentCount > 0) {
      throw ApiError.badRequest('Cannot delete degree because students are currently enrolled in it');
    }
    // Delete associated programs first or check program count
    const programCount = await prisma.program.count({ where: { departmentId } });
    if (programCount > 0) {
      await prisma.program.deleteMany({ where: { departmentId } });
    }
    return prisma.department.delete({ where: { id: departmentId } });
  }

  // --- Program/Degree CRUD ---
  async addProgram(departmentId: string, name: string, durationYears: number): Promise<any> {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw ApiError.notFound('Degree not found');
    const existing = await prisma.program.findFirst({
      where: { departmentId, name: { equals: name, mode: 'insensitive' } }
    });
    if (existing) {
      throw ApiError.badRequest(`Department "${name}" already exists in this degree`);
    }
    return prisma.program.create({
      data: { name, departmentId, durationYears: durationYears || 4 }
    });
  }

  async updateProgram(programId: string, name: string, durationYears: number): Promise<any> {
    const prog = await prisma.program.findUnique({ where: { id: programId } });
    if (!prog) throw ApiError.notFound('Department not found');
    const existing = await prisma.program.findFirst({
      where: { departmentId: prog.departmentId, name: { equals: name, mode: 'insensitive' }, NOT: { id: programId } }
    });
    if (existing) {
      throw ApiError.badRequest(`Department "${name}" already exists in this degree`);
    }
    return prisma.program.update({
      where: { id: programId },
      data: { name, durationYears }
    });
  }

  async deleteProgram(programId: string): Promise<any> {
    const prog = await prisma.program.findUnique({ where: { id: programId } });
    if (!prog) throw ApiError.notFound('Department not found');
    const studentCount = await prisma.student.count({ where: { programId } });
    if (studentCount > 0) {
      throw ApiError.badRequest('Cannot delete department because students are currently enrolled in it');
    }
    return prisma.program.delete({ where: { id: programId } });
  }

  // --- Excel Bulk Import & Template ---
  async importZoneStructure(zoneId: string, fileBuffer: Buffer): Promise<any> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

    let collegesCreated = 0;
    let departmentsCreated = 0;
    let programsCreated = 0;

    await prisma.$transaction(
      async (tx) => {
        const collegeCache = new Map<string, any>();
        const deptCache = new Map<string, any>();
        const programCache = new Map<string, any>();

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          const collegeName = row['College Name']?.toString().trim();
          const collegeCode = row['College Code']?.toString().trim().toUpperCase();
          const collegeLocation = row['College Location']?.toString().trim();
          const departmentName = row['Department Name']?.toString().trim();
          const programName = row['Degree/Program Name']?.toString().trim();
          const duration = parseInt(row['Duration (Years)']?.toString() || '4', 10);

          if (!collegeName || !collegeCode || !collegeLocation || !departmentName || !programName) {
            throw ApiError.badRequest(`Row ${i + 2} has missing required fields`);
          }

          // 1. College resolve
          let college = collegeCache.get(collegeCode);
          if (!college) {
            college = await tx.college.findUnique({ where: { code: collegeCode } });
            if (college) {
              if (college.zoneId !== zoneId) {
                throw ApiError.badRequest(`Row ${i + 2}: College "${collegeName}" with code "${collegeCode}" belongs to a different zone.`);
              }
              if (!college.isActive) {
                college = await tx.college.update({
                  where: { id: college.id },
                  data: { isActive: true, name: collegeName, location: collegeLocation }
                });
                collegesCreated++;
              }
            } else {
              college = await tx.college.create({
                data: { name: collegeName, code: collegeCode, location: collegeLocation, zoneId, isActive: true }
              });
              collegesCreated++;
            }
            collegeCache.set(collegeCode, college);
          }

          // 2. Degree (DB Department) resolve
          const degreeKey = `${college.id}:${programName.toLowerCase()}`;
          let degree = deptCache.get(degreeKey);
          if (!degree) {
            degree = await tx.department.findFirst({
              where: { collegeId: college.id, name: { equals: programName, mode: 'insensitive' } }
            });
            if (!degree) {
              degree = await tx.department.create({
                data: { name: programName, collegeId: college.id }
              });
              departmentsCreated++; // increment Degree count (stored in DB Department table)
            }
            deptCache.set(degreeKey, degree);
          }

          // 3. Department (DB Program) resolve
          const deptKey = `${degree.id}:${departmentName.toLowerCase()}`;
          let department = programCache.get(deptKey);
          if (!department) {
            department = await tx.program.findFirst({
              where: { departmentId: degree.id, name: { equals: departmentName, mode: 'insensitive' } }
            });
            if (!department) {
              department = await tx.program.create({
                data: { name: departmentName, departmentId: degree.id, durationYears: duration || 4 }
              });
              programsCreated++; // increment Department count (stored in DB Program table)
            }
            programCache.set(deptKey, department);
          }
        }
      },
      {
        timeout: 60000, // 60 seconds timeout for bulk zone structure import
        maxWait: 10000,  // 10 seconds max wait to acquire db lock
      }
    );

    return {
      totalRows: rawData.length,
      collegesCreated,
      degreesCreated: departmentsCreated,
      departmentsCreated: programsCreated
    };
  }

  async getTemplateBuffer(): Promise<Buffer> {
    const headers = [
      {
        'College Name': 'Madras Institute of Technology',
        'College Code': 'MIT-CHE',
        'College Location': 'Chromepet, Chennai',
        'Department Name': 'Computer Science and Engineering',
        'Degree/Program Name': 'B.E. Computer Science and Engineering',
        'Duration (Years)': 4
      },
      {
        'College Name': 'College of Engineering Guindy',
        'College Code': 'CEG-CHE',
        'College Location': 'Guindy, Chennai',
        'Department Name': 'Mechanical Engineering',
        'Degree/Program Name': 'B.E. Mechanical Engineering',
        'Duration (Years)': 4
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

export const zoneService = new ZoneService();
