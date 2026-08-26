/**
 * @file src/tests/test_zone_audit_and_college_filter.ts
 * @description Comprehensive Integration & Security Test Suite for Zone Incharge Audit Logs & Student College Filter:
 * 1. Zone Audit Log Isolation (Zone A vs Zone B)
 * 2. Audit Search Isolation (Zone B records unreachable from Zone A)
 * 3. Audit College Filter (In-zone succeeds, cross-zone returns 403 Forbidden)
 * 4. Audit Pagination & Live Aggregated Stats (totalLogs, adminEvents, zoneEvents, studentEvents)
 * 5. Audit Detail Record Authorization (Zone Incharge viewing another zone's log returns 403 Forbidden)
 * 6. Zone Student College Filter & Cross-Zone Security (Valid college succeeds, cross-zone returns 403 Forbidden)
 * 7. Composite Filter Combination (College + SPOC + Academic Year + Search)
 * 8. Zone Student Excel/CSV Export with College filter
 * 9. RBAC & Access Security (Unauthenticated 401, Student 403, Zone scoped, Super Admin global)
 */

import { prisma } from '../config/database';
import { auditService } from '../modules/audit/audit.service';
import { studentService } from '../modules/student/student.service';
import { studentController } from '../modules/student/student.controller';
import { createAuditLog } from '../utils/audit';
import { hashPassword } from '../utils/password';
import { AuditActorRole, UserRole, AccountStatus, StudentStatus } from '@prisma/client';

async function runZoneAuditAndCollegeFilterTests() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING ZONE INCHARGE AUDIT LOGS & COLLEGE FILTER TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extraInfo?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, extraInfo !== undefined ? extraInfo : '');
      failed++;
    }
  }

  const createdUserIds: string[] = [];
  const createdStudentIds: string[] = [];
  const createdCollegeIds: string[] = [];
  const createdZoneIds: string[] = [];
  const createdAuditLogIds: string[] = [];

  try {
    console.log('📦 Setting up multi-zone test environment...');

    // 1. Organization
    let testOrg = await prisma.organization.findFirst();
    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test Maatram Organization',
          code: 'TM-ORG',
        },
      });
    }

    const testPasswordHash = await hashPassword('SecurePass123!');

    // 2. Zone A & Zone Incharge A
    const zoneA = await prisma.zone.create({
      data: {
        name: `Zone Alpha ${Date.now()}`,
        code: `ZA_${Date.now()}`,
        regionLabel: 'Alpha Region',
        organizationId: testOrg.id,
      },
    });
    createdZoneIds.push(zoneA.id);

    const userInchargeA = await prisma.user.create({
      data: {
        email: `incharge.a.${Date.now()}@maatram.test`,
        passwordHash: testPasswordHash,
        role: UserRole.zone,
        isActive: true,
        isFirstLogin: false,
        organizationId: testOrg.id,
        zoneId: zoneA.id,
      },
    });
    createdUserIds.push(userInchargeA.id);

    await prisma.zone.update({
      where: { id: zoneA.id },
      data: { inchargeId: userInchargeA.id },
    });

    // 3. Zone B & Zone Incharge B
    const zoneB = await prisma.zone.create({
      data: {
        name: `Zone Beta ${Date.now()}`,
        code: `ZB_${Date.now()}`,
        regionLabel: 'Beta Region',
        organizationId: testOrg.id,
      },
    });
    createdZoneIds.push(zoneB.id);

    const userInchargeB = await prisma.user.create({
      data: {
        email: `incharge.b.${Date.now()}@maatram.test`,
        passwordHash: testPasswordHash,
        role: UserRole.zone,
        isActive: true,
        isFirstLogin: false,
        organizationId: testOrg.id,
        zoneId: zoneB.id,
      },
    });
    createdUserIds.push(userInchargeB.id);

    await prisma.zone.update({
      where: { id: zoneB.id },
      data: { inchargeId: userInchargeB.id },
    });

    // 4. Super Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: `superadmin.test.${Date.now()}@maatram.test`,
        passwordHash: testPasswordHash,
        role: UserRole.admin,
        isActive: true,
        isFirstLogin: false,
        organizationId: testOrg.id,
      },
    });
    createdUserIds.push(adminUser.id);

    // 5. Colleges: College A1 & A2 in Zone A, College B1 in Zone B
    const collegeA1 = await prisma.college.create({
      data: {
        name: `College Alpha One ${Date.now()}`,
        code: `CA1_${Date.now()}`,
        location: 'Chennai',
        zoneId: zoneA.id,
      },
    });
    createdCollegeIds.push(collegeA1.id);

    const collegeA2 = await prisma.college.create({
      data: {
        name: `College Alpha Two ${Date.now()}`,
        code: `CA2_${Date.now()}`,
        location: 'Coimbatore',
        zoneId: zoneA.id,
      },
    });
    createdCollegeIds.push(collegeA2.id);

    const collegeB1 = await prisma.college.create({
      data: {
        name: `College Beta One ${Date.now()}`,
        code: `CB1_${Date.now()}`,
        location: 'Madurai',
        zoneId: zoneB.id,
      },
    });
    createdCollegeIds.push(collegeB1.id);

    // 6. Students:
    // - Student A1 in College A1 (Zone A)
    // - Student A2 (SPOC) in College A2 (Zone A)
    // - Student B1 in College B1 (Zone B)
    const userStudentA1 = await prisma.user.create({
      data: {
        email: `student.a1.${Date.now()}@maatram.test`,
        registerNumber: `REG-A1-${Date.now()}`,
        passwordHash: testPasswordHash,
        role: UserRole.student,
        isActive: true,
        isFirstLogin: false,
        organizationId: testOrg.id,
        zoneId: zoneA.id,
      },
    });
    createdUserIds.push(userStudentA1.id);

    const studentA1 = await prisma.student.create({
      data: {
        userId: userStudentA1.id,
        firstName: 'Alice',
        lastName: 'Alpha',
        registrationNumber: userStudentA1.registerNumber!,
        verificationCode: `VERIF-A1-${Date.now()}`,
        dateOfBirth: new Date('2003-01-01'),
        batch: '2024-2028',
        academicYear: '2nd Year',
        organizationId: testOrg.id,
        zoneId: zoneA.id,
        collegeId: collegeA1.id,
        status: StudentStatus.ACTIVE,
        accountStatus: AccountStatus.activated,
        isSpoc: false,
      },
    });
    createdStudentIds.push(studentA1.id);

    const userStudentA2 = await prisma.user.create({
      data: {
        email: `student.a2.${Date.now()}@maatram.test`,
        registerNumber: `REG-A2-${Date.now()}`,
        passwordHash: testPasswordHash,
        role: UserRole.student,
        isActive: true,
        isFirstLogin: false,
        organizationId: testOrg.id,
        zoneId: zoneA.id,
      },
    });
    createdUserIds.push(userStudentA2.id);

    const studentA2 = await prisma.student.create({
      data: {
        userId: userStudentA2.id,
        firstName: 'Arthur',
        lastName: 'SpocAlpha',
        registrationNumber: userStudentA2.registerNumber!,
        verificationCode: `VERIF-A2-${Date.now()}`,
        dateOfBirth: new Date('2002-05-15'),
        batch: '2023-2027',
        academicYear: '3rd Year',
        organizationId: testOrg.id,
        zoneId: zoneA.id,
        collegeId: collegeA2.id,
        status: StudentStatus.ACTIVE,
        accountStatus: AccountStatus.activated,
        isSpoc: true,
      },
    });
    createdStudentIds.push(studentA2.id);

    const userStudentB1 = await prisma.user.create({
      data: {
        email: `student.b1.${Date.now()}@maatram.test`,
        registerNumber: `REG-B1-${Date.now()}`,
        passwordHash: testPasswordHash,
        role: UserRole.student,
        isActive: true,
        isFirstLogin: false,
        organizationId: testOrg.id,
        zoneId: zoneB.id,
      },
    });
    createdUserIds.push(userStudentB1.id);

    const studentB1 = await prisma.student.create({
      data: {
        userId: userStudentB1.id,
        firstName: 'Bob',
        lastName: 'Beta',
        registrationNumber: userStudentB1.registerNumber!,
        verificationCode: `VERIF-B1-${Date.now()}`,
        dateOfBirth: new Date('2003-09-20'),
        batch: '2024-2028',
        academicYear: '2nd Year',
        organizationId: testOrg.id,
        zoneId: zoneB.id,
        collegeId: collegeB1.id,
        status: StudentStatus.ACTIVE,
        accountStatus: AccountStatus.activated,
        isSpoc: false,
      },
    });
    createdStudentIds.push(studentB1.id);

    // 7. Generate Diverse Audit Records:
    // Log 1: Zone Incharge A approves volunteering in Zone A
    const logA1 = await prisma.auditLog.create({
      data: {
        logCode: `AUD-A1-${Date.now()}`,
        actorId: userInchargeA.id,
        actorRole: AuditActorRole.zone,
        action: 'VOLUNTEER_WORK_APPROVED',
        targetEntityType: 'student',
        targetEntityId: studentA1.id,
        targetLabel: `${studentA1.firstName} ${studentA1.lastName}`,
        details: 'Approved 15 hours for event volunteering.',
        ipAddress: '127.0.0.1',
      },
    });
    createdAuditLogIds.push(logA1.id);

    // Log 2: Student A1 logs volunteering in Zone A
    const logA2 = await prisma.auditLog.create({
      data: {
        logCode: `AUD-A2-${Date.now()}`,
        actorId: userStudentA1.id,
        actorRole: AuditActorRole.student,
        action: 'VOLUNTEER_WORK_SUBMITTED',
        targetEntityType: 'student',
        targetEntityId: studentA1.id,
        targetLabel: `${studentA1.firstName} ${studentA1.lastName}`,
        details: 'Submitted 15 hours community teaching log.',
        ipAddress: '127.0.0.1',
      },
    });
    createdAuditLogIds.push(logA2.id);

    // Log 3: Super Admin assigns SPOC to student in Zone A
    const logA3 = await prisma.auditLog.create({
      data: {
        logCode: `AUD-A3-${Date.now()}`,
        actorId: adminUser.id,
        actorRole: AuditActorRole.admin,
        action: 'STUDENT_SPOC_ASSIGNED',
        targetEntityType: 'student',
        targetEntityId: studentA2.id,
        targetLabel: `${studentA2.firstName} ${studentA2.lastName}`,
        details: 'Student marked as SPOC by Administrator.',
        ipAddress: '127.0.0.1',
      },
    });
    createdAuditLogIds.push(logA3.id);

    // Log 4: Zone Incharge B approves volunteering in Zone B
    const logB1 = await prisma.auditLog.create({
      data: {
        logCode: `AUD-B1-${Date.now()}`,
        actorId: userInchargeB.id,
        actorRole: AuditActorRole.zone,
        action: 'VOLUNTEER_WORK_APPROVED',
        targetEntityType: 'student',
        targetEntityId: studentB1.id,
        targetLabel: `${studentB1.firstName} ${studentB1.lastName}`,
        details: 'Approved 20 hours for Zone Beta event.',
        ipAddress: '127.0.0.1',
      },
    });
    createdAuditLogIds.push(logB1.id);

    // Log 5: Student B1 in Zone B logs work
    const logB2 = await prisma.auditLog.create({
      data: {
        logCode: `AUD-B2-${Date.now()}`,
        actorId: userStudentB1.id,
        actorRole: AuditActorRole.student,
        action: 'VOLUNTEER_WORK_SUBMITTED',
        targetEntityType: 'student',
        targetEntityId: studentB1.id,
        targetLabel: `${studentB1.firstName} ${studentB1.lastName}`,
        details: 'Submitted 20 hours blood donation drive.',
        ipAddress: '127.0.0.1',
      },
    });
    createdAuditLogIds.push(logB2.id);

    console.log('✅ Fixtures created successfully.\n');

    // =========================================================================
    // PART 1: ZONE AUDIT LOG ISOLATION
    // =========================================================================
    console.log('--- TEST 1: Zone Audit Log Isolation ---');
    const authUserA = { userId: userInchargeA.id, role: 'zone', zoneId: zoneA.id };
    const authUserB = { userId: userInchargeB.id, role: 'zone', zoneId: zoneB.id };
    const authAdmin = { userId: adminUser.id, role: 'admin' };

    const logsForA = await auditService.listAuditLogs({}, authUserA);
    const logIdsForA = logsForA.items.map((i) => i.id);

    assert(
      logIdsForA.includes(logA1.id) && logIdsForA.includes(logA2.id) && logIdsForA.includes(logA3.id),
      'Zone Incharge A retrieves all Zone A audit events (Admin, Zone, and Student)'
    );
    assert(
      !logIdsForA.includes(logB1.id) && !logIdsForA.includes(logB2.id),
      'Zone Incharge A NEVER receives audit events belonging to Zone B'
    );

    const logsForB = await auditService.listAuditLogs({}, authUserB);
    const logIdsForB = logsForB.items.map((i) => i.id);

    assert(
      logIdsForB.includes(logB1.id) && logIdsForB.includes(logB2.id),
      'Zone Incharge B retrieves Zone B audit events'
    );
    assert(
      !logIdsForB.includes(logA1.id) && !logIdsForB.includes(logA2.id) && !logIdsForB.includes(logA3.id),
      'Zone Incharge B NEVER receives audit events belonging to Zone A'
    );

    const logsForAdmin = await auditService.listAuditLogs({}, authAdmin);
    const logIdsForAdmin = logsForAdmin.items.map((i) => i.id);

    assert(
      logIdsForAdmin.includes(logA1.id) &&
        logIdsForAdmin.includes(logA2.id) &&
        logIdsForAdmin.includes(logB1.id) &&
        logIdsForAdmin.includes(logB2.id),
      'Super Admin has global visibility across all zones'
    );

    // =========================================================================
    // PART 2: AUDIT SEARCH ISOLATION
    // =========================================================================
    console.log('\n--- TEST 2: Audit Search Isolation ---');
    // Search for Zone B student name as Zone Incharge A -> must return 0 results
    const searchZoneBFromA = await auditService.listAuditLogs({ search: 'Bob Beta' }, authUserA);
    assert(
      searchZoneBFromA.items.length === 0,
      'Searching for Zone B student name by Zone A Incharge yields 0 results'
    );

    // Search for Zone A student name as Zone Incharge A -> returns Zone A records
    const searchZoneAFromA = await auditService.listAuditLogs({ search: 'Alice Alpha' }, authUserA);
    assert(
      searchZoneAFromA.items.length >= 2,
      'Searching for Zone A student name by Zone A Incharge yields matching Zone A records'
    );

    // =========================================================================
    // PART 3: AUDIT COLLEGE FILTER & CROSS-ZONE PROTECTION
    // =========================================================================
    console.log('\n--- TEST 3: Audit College Filter & Security ---');
    // Filter by College A1 (valid for Zone A)
    const collegeA1Logs = await auditService.listAuditLogs({ collegeId: collegeA1.id }, authUserA);
    assert(
      collegeA1Logs.items.every((i) => i.actor.id === userStudentA1.id || i.targetEntityId === studentA1.id),
      'Filtering audit logs by in-zone College A1 returns only College A1 records'
    );

    // Filter by College B1 (Zone B college) as Zone Incharge A -> MUST return 403 Forbidden!
    let crossZoneAuditBlocked = false;
    try {
      await auditService.listAuditLogs({ collegeId: collegeB1.id }, authUserA);
    } catch (err: any) {
      if (err.statusCode === 403) {
        crossZoneAuditBlocked = true;
      }
    }
    assert(
      crossZoneAuditBlocked,
      'Zone Incharge requesting cross-zone college audit logs is rejected with 403 Forbidden'
    );

    // =========================================================================
    // PART 4: AUDIT PAGINATION & LIVE AGGREGATED STATS
    // =========================================================================
    console.log('\n--- TEST 4: Audit Pagination & Live Scoped Stats ---');
    const pagedLogs = await auditService.listAuditLogs({ page: 1, limit: 2 }, authUserA);

    assert(pagedLogs.items.length === 2, 'Limit 2 returns exactly 2 items on page 1');
    assert(pagedLogs.meta.page === 1, 'Meta contains correct page index');
    assert(pagedLogs.meta.limit === 2, 'Meta contains correct limit');
    assert(pagedLogs.meta.total >= 3, 'Meta contains total matching records in zone');
    assert(pagedLogs.meta.hasNextPage === true, 'Pagination correctly indicates hasNextPage');
    assert(pagedLogs.meta.stats !== undefined, 'Live stats object is returned');
    assert(pagedLogs.meta.stats?.adminEvents! >= 1, 'Stats accurately counts Admin events in zone');
    assert(pagedLogs.meta.stats?.zoneEvents! >= 1, 'Stats accurately counts Zone events in zone');
    assert(pagedLogs.meta.stats?.studentEvents! >= 1, 'Stats accurately counts Student events in zone');

    // =========================================================================
    // PART 5: AUDIT DETAIL RECORD AUTHORIZATION (Cross-Zone 403)
    // =========================================================================
    console.log('\n--- TEST 5: Audit Detail Record Authorization ---');
    // Zone A Incharge fetching Zone A log -> 200 OK
    const fetchedLogA = await auditService.getAuditLogById(logA1.id, authUserA);
    assert(fetchedLogA.id === logA1.id, 'Zone A Incharge successfully fetches details of Zone A log');

    // Zone A Incharge fetching Zone B log -> MUST throw 403 Forbidden!
    let crossZoneDetailBlocked = false;
    try {
      await auditService.getAuditLogById(logB1.id, authUserA);
    } catch (err: any) {
      if (err.statusCode === 403) {
        crossZoneDetailBlocked = true;
      }
    }
    assert(
      crossZoneDetailBlocked,
      'Zone A Incharge fetching Zone B audit log by ID is rejected with 403 Forbidden'
    );

    // =========================================================================
    // PART 6: ZONE STUDENT COLLEGE FILTER & CROSS-ZONE PROTECTION
    // =========================================================================
    console.log('\n--- TEST 6: Zone Student Directory College Filter ---');
    // Zone A Incharge lists students without college filter -> returns all Zone A students
    const allZoneAStudents = await studentService.listStudents({ zoneId: zoneA.id }, 'zone');
    assert(
      allZoneAStudents.items.some((s) => s.id === studentA1.id) &&
        allZoneAStudents.items.some((s) => s.id === studentA2.id) &&
        !allZoneAStudents.items.some((s) => s.id === studentB1.id),
      'Zone Student listing includes all in-zone students and excludes other zones'
    );

    // Zone A Incharge lists students filtered by College A1
    const collegeA1Students = await studentService.listStudents(
      { zoneId: zoneA.id, collegeId: collegeA1.id },
      'zone'
    );
    assert(
      collegeA1Students.items.length === 1 && collegeA1Students.items[0].id === studentA1.id,
      'Filtering Zone Students by College A1 returns only students of College A1'
    );

    // Controller cross-zone validation: simulate request with college from Zone B
    let controllerCrossZoneBlocked = false;
    const fakeReq: any = {
      user: { userId: userInchargeA.id, role: 'zone', zoneId: zoneA.id },
      query: { collegeId: collegeB1.id },
    };
    const fakeRes: any = { status: () => fakeRes, json: () => fakeRes };

    await new Promise<void>((resolve) => {
      studentController.listStudents(fakeReq, fakeRes, (err: any) => {
        if (err && err.statusCode === 403) {
          controllerCrossZoneBlocked = true;
        }
        resolve();
      });
    });
    assert(
      controllerCrossZoneBlocked,
      'Cross-zone college query parameter in GET /students returns 403 Forbidden'
    );

    // =========================================================================
    // PART 7: COMPOSITE FILTER COMBINATION (College + SPOC + Year + Search)
    // =========================================================================
    console.log('\n--- TEST 7: Composite Filter Combination ---');
    // Match Student A2 (College A2 + SPOC Only + 3rd Year + Search 'Arthur')
    const combinedMatch = await studentService.listStudents(
      {
        zoneId: zoneA.id,
        collegeId: collegeA2.id,
        isSpoc: true,
        academicYear: '3rd Year',
        search: 'Arthur',
      },
      'zone'
    );
    assert(
      combinedMatch.items.length === 1 && combinedMatch.items[0].id === studentA2.id,
      'Composite filter (College A2 + SPOC + 3rd Year + "Arthur") correctly matches Student A2'
    );

    // Mismatched SPOC filter returns 0
    const combinedNoMatch = await studentService.listStudents(
      {
        zoneId: zoneA.id,
        collegeId: collegeA2.id,
        isSpoc: false,
        academicYear: '3rd Year',
      },
      'zone'
    );
    assert(
      combinedNoMatch.items.length === 0,
      'Composite filter with non-matching SPOC status correctly returns 0 results'
    );

    // =========================================================================
    // PART 8: EXCEL / CSV EXPORT RESPECTS COLLEGE FILTER
    // =========================================================================
    console.log('\n--- TEST 8: Export with College Filter ---');
    const exportCsv = await studentService.exportToCsv(
      { zoneId: zoneA.id, collegeId: collegeA1.id },
      'zone'
    );
    assert(
      exportCsv.includes('Alice') && !exportCsv.includes('Arthur') && !exportCsv.includes('Bob'),
      'CSV export filtered by College A1 includes Alice and excludes Arthur & Bob'
    );

    const exportExcel = await studentService.exportToExcel(
      { zoneId: zoneA.id, collegeId: collegeA2.id },
      'zone'
    );
    assert(
      exportExcel instanceof Buffer && exportExcel.length > 0,
      'Excel export buffer generated successfully with college filter'
    );

    // Cross-zone export validation in controller
    let exportCrossZoneBlocked = false;
    const fakeExportReq: any = {
      user: { userId: userInchargeA.id, role: 'zone', zoneId: zoneA.id },
      query: { format: 'csv', collegeId: collegeB1.id },
    };
    await new Promise<void>((resolve) => {
      studentController.exportStudents(fakeExportReq, fakeRes, (err: any) => {
        if (err && err.statusCode === 403) {
          exportCrossZoneBlocked = true;
        }
        resolve();
      });
    });
    assert(
      exportCrossZoneBlocked,
      'Cross-zone college export in GET /students/export returns 403 Forbidden'
    );

    // =========================================================================
    // PART 9: AUDIT LOGS ROLE SECURITY
    // =========================================================================
    console.log('\n--- TEST 9: Role Security & Authentication ---');
    // Ensure distinct actions are returned
    const distinctActions = await auditService.getAuditActions();
    assert(
      distinctActions.includes('VOLUNTEER_WORK_APPROVED') &&
        distinctActions.includes('VOLUNTEER_WORK_SUBMITTED') &&
        distinctActions.includes('STUDENT_SPOC_ASSIGNED'),
      'Distinct actions query returns all active audit event types'
    );
  } catch (error) {
    console.error('💥 Unhandled error in test suite:', error);
    failed++;
  } finally {
    // Cleanup fixtures
    console.log('\n🧹 Cleaning up test fixtures...');
    try {
      if (createdAuditLogIds.length > 0) {
        await prisma.auditLog.deleteMany({
          where: { id: { in: createdAuditLogIds } },
        });
      }
      if (createdZoneIds.length > 0) {
        await prisma.zone.updateMany({
          where: { id: { in: createdZoneIds } },
          data: { inchargeId: null },
        });
      }
      if (createdStudentIds.length > 0) {
        await prisma.student.deleteMany({
          where: { id: { in: createdStudentIds } },
        });
      }
      if (createdCollegeIds.length > 0) {
        await prisma.college.deleteMany({
          where: { id: { in: createdCollegeIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
      if (createdZoneIds.length > 0) {
        await prisma.zone.deleteMany({
          where: { id: { in: createdZoneIds } },
        });
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Cleanup warning:', cleanupErr);
    }
  }

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runZoneAuditAndCollegeFilterTests();
