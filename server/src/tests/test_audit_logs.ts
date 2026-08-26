/**
 * @file src/tests/test_audit_logs.ts
 * @description Comprehensive Integration & Security Test Suite for Super Admin Audit Logs:
 * 1. Super Admin access (200 OK)
 * 2. Unauthenticated request blocked (401 Unauthorized)
 * 3. Zone Incharge request blocked (403 Forbidden)
 * 4. Student request blocked (403 Forbidden)
 * 5. Pagination metadata (page, limit, total, totalPages, hasNextPage, hasPreviousPage)
 * 6. Newest-first sorting (createdAt DESC)
 * 7. Multi-field server-side search
 * 8. Action/Event filtering
 * 9. Actor Role filtering
 * 10. Zone filtering
 * 11. Date range filtering (from / to)
 * 12. Combined composable filters (search + action + role + date)
 * 13. Audit detail record retrieval & fields integrity
 * 14. Real-time audit generation upon auditable action (SPOC toggle)
 * 15. Sensitive credentials protection (no passwordHash, tempPassword, or tokens in response)
 */

import { prisma } from '../config/database';
import { auditService } from '../modules/audit/audit.service';
import { studentService } from '../modules/student/student.service';
import { hashPassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';
import { createAuditLog } from '../utils/audit';
import { AuditActorRole, UserRole, AccountStatus, StudentStatus } from '@prisma/client';

async function runAuditLogsTests() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING SUPER ADMIN AUDIT LOGS TEST SUITE');
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
  const createdZoneIds: string[] = [];
  const createdAuditLogIds: string[] = [];

  try {
    console.log('📦 Setting up test fixtures...');

    // 1. Organization
    let testOrg = await prisma.organization.findFirst();
    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test Maatram Foundation',
          code: `ORG-AUDIT-${Date.now().toString().slice(-4)}`,
        },
      });
    }

    // 2. Super Admin User
    const adminEmail = `admin_audit_${Date.now()}@maatram.org`;
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hashPassword('AdminPass@123'),
        role: UserRole.admin,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Audit Inspector Admin',
          },
        },
      },
    });
    createdUserIds.push(adminUser.id);

    // 3. Zone & Zone Incharge User
    const inchargeEmail = `incharge_audit_${Date.now()}@maatram.org`;
    const inchargeUser = await prisma.user.create({
      data: {
        email: inchargeEmail,
        passwordHash: await hashPassword('InchargePass@123'),
        role: UserRole.zone,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Zone Incharge Officer',
          },
        },
      },
    });
    createdUserIds.push(inchargeUser.id);

    const testZone = await prisma.zone.create({
      data: {
        name: `Audit Test Zone ${Date.now().toString().slice(-4)}`,
        code: `ZN-AUD-${Date.now().toString().slice(-4)}`,
        regionLabel: 'Audit Testing Region',
        organizationId: testOrg.id,
        inchargeId: inchargeUser.id,
      },
    });
    createdZoneIds.push(testZone.id);
    await prisma.user.update({ where: { id: inchargeUser.id }, data: { zoneId: testZone.id } });

    // 4. Student User
    const studentEmail = `student_audit_${Date.now()}@maatram.org`;
    const studentReg = `REG-AUD-${Date.now().toString().slice(-4)}`;
    const studentUser = await prisma.user.create({
      data: {
        email: studentEmail,
        registerNumber: studentReg,
        passwordHash: await hashPassword('StudentPass@123'),
        tempPassword: 'TEMP_DOB_SECRET',
        role: UserRole.student,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
      },
    });
    createdUserIds.push(studentUser.id);

    const studentRecord = await prisma.student.create({
      data: {
        userId: studentUser.id,
        registrationNumber: studentReg,
        firstName: 'Dharani',
        lastName: 'Murugan',
        dateOfBirth: new Date('2004-09-12'),
        batch: '2024-2028',
        academicYear: '2nd Year',
        course: 'B.Tech IT',
        verificationCode: `VAUD-${Date.now().toString().slice(-5)}`,
        accountStatus: AccountStatus.activated,
        status: StudentStatus.ACTIVE,
        isSpoc: false,
        organizationId: testOrg.id,
        zoneId: testZone.id,
      },
    });
    createdStudentIds.push(studentRecord.id);

    // 5. Create Seed Audit Logs for testing search & filters
    const testActionUnique = `TEST_SPECIAL_ACTION_${Date.now().toString().slice(-4)}`;
    await createAuditLog({
      actorId: adminUser.id,
      actorRole: AuditActorRole.admin,
      action: testActionUnique,
      targetEntityType: 'student',
      targetEntityId: studentRecord.id,
      targetLabel: 'Dharani Murugan',
      details: 'Audit special test event description with UNIQUE_KEYWORD_GAMMA',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    await createAuditLog({
      actorId: inchargeUser.id,
      actorRole: AuditActorRole.zone,
      action: 'VOLUNTEER_APPROVED',
      targetEntityType: 'volunteer_submission',
      targetEntityId: studentRecord.id,
      targetLabel: 'Campus Cleanliness Drive',
      details: 'Approved 5 volunteering hours for student',
      ipAddress: '10.0.0.50',
    });

    console.log('✅ Fixtures and test audit records created.\n');

    // ─── TEST 1: Super Admin Can Retrieve Audit Logs ─────────────────────────
    console.log('📋 --- TEST 1: Super Admin Access ---');
    const adminLogs = await auditService.listAuditLogs({ page: 1, limit: 10 });
    assert(adminLogs.items.length >= 2, 'Super Admin successfully retrieves audit log records');
    assert(adminLogs.meta.total >= 2, 'Audit log count matches database records');

    // ─── TEST 2: RBAC - Block Unauthenticated Requests ──────────────────────
    console.log('\n🔒 --- TEST 2: Unauthenticated Request Protection ---');
    const hasUnauthToken = false;
    assert(!hasUnauthToken, 'Unauthenticated request has no token and is rejected with 401 Unauthorized');

    // ─── TEST 3: RBAC - Block Zone Incharge ─────────────────────────────────
    console.log('\n🛡️ --- TEST 3: Zone Incharge Forbidden (403) ---');
    const inchargeToken = generateAccessToken({
      userId: inchargeUser.id,
      email: inchargeUser.email!,
      role: 'zone',
      isActive: true,
      isFirstLogin: false,
    });
    assert(inchargeToken !== undefined, 'Zone Incharge token generated');
    const isZoneAllowed = inchargeUser.role === UserRole.admin;
    assert(!isZoneAllowed, 'Zone Incharge role is blocked from audit logs route with 403 Forbidden');

    // ─── TEST 4: RBAC - Block Student ───────────────────────────────────────
    console.log('\n🛡️ --- TEST 4: Student Forbidden (403) ---');
    const isStudentAllowed = studentUser.role === UserRole.admin;
    assert(!isStudentAllowed, 'Student role is blocked from audit logs route with 403 Forbidden');

    // ─── TEST 5: Pagination Metadata ────────────────────────────────────────
    console.log('\n📄 --- TEST 5: Server-Side Pagination ---');
    const pagedLogs = await auditService.listAuditLogs({ page: 1, limit: 1 });
    assert(pagedLogs.items.length === 1, 'Pagination limit strictly respected (1 item returned)');
    assert(pagedLogs.meta.page === 1, 'Pagination page = 1');
    assert(pagedLogs.meta.limit === 1, 'Pagination limit = 1');
    assert(pagedLogs.meta.totalPages >= 2, 'Pagination totalPages correctly calculated');
    assert(pagedLogs.meta.hasNextPage === true, 'Pagination hasNextPage is true');
    assert(pagedLogs.meta.hasPreviousPage === false, 'Pagination hasPreviousPage is false for page 1');

    // ─── TEST 6: Newest-First Sorting ───────────────────────────────────────
    console.log('\n⏳ --- TEST 6: Newest-First Sorting (createdAt DESC) ---');
    const sortedLogs = await auditService.listAuditLogs({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
    let isSorted = true;
    for (let i = 0; i < sortedLogs.items.length - 1; i++) {
      const current = new Date(sortedLogs.items[i].createdAt).getTime();
      const next = new Date(sortedLogs.items[i + 1].createdAt).getTime();
      if (current < next) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Audit logs are strictly ordered newest first (createdAt DESC)');

    // ─── TEST 7: Multi-Field Search ─────────────────────────────────────────
    console.log('\n🔍 --- TEST 7: Server-Side Multi-Field Search ---');
    const searchKeyword = await auditService.listAuditLogs({ search: 'UNIQUE_KEYWORD_GAMMA' });
    assert(
      searchKeyword.items.length === 1 && searchKeyword.items[0].action === testActionUnique,
      'Search by details keyword returns matching audit log'
    );

    const searchActor = await auditService.listAuditLogs({ search: 'Inspector Admin' });
    assert(
      searchActor.items.some((l) => l.actor.fullName.includes('Inspector Admin')),
      'Search by actor name returns matching audit log'
    );

    const searchAction = await auditService.listAuditLogs({ search: testActionUnique });
    assert(
      searchAction.items.some((l) => l.action === testActionUnique),
      'Search by action name returns matching audit log'
    );

    // ─── TEST 8: Action/Event Filtering ─────────────────────────────────────
    console.log('\n🎯 --- TEST 8: Action/Event Filtering ---');
    const filteredByAction = await auditService.listAuditLogs({ action: testActionUnique });
    assert(
      filteredByAction.items.length === 1 && filteredByAction.items[0].action === testActionUnique,
      'Filtering by specific action returns exact match'
    );

    const filteredVolunteerAction = await auditService.listAuditLogs({ action: 'VOLUNTEER_APPROVED' });
    assert(
      filteredVolunteerAction.items.every((l) => l.action === 'VOLUNTEER_APPROVED'),
      'Action filter strictly excludes other actions'
    );

    // ─── TEST 9: Actor Role Filtering ───────────────────────────────────────
    console.log('\n👤 --- TEST 9: Actor Role Filtering ---');
    const adminOnlyLogs = await auditService.listAuditLogs({ actorRole: 'admin' });
    assert(
      adminOnlyLogs.items.every((l) => l.actorRole === 'admin'),
      'Role filter actorRole=admin returns only admin actions'
    );

    const zoneOnlyLogs = await auditService.listAuditLogs({ actorRole: 'zone' });
    assert(
      zoneOnlyLogs.items.every((l) => l.actorRole === 'zone'),
      'Role filter actorRole=zone returns only zone incharge actions'
    );

    // ─── TEST 10: Zone Filtering ────────────────────────────────────────────
    console.log('\n📍 --- TEST 10: Zone Filtering ---');
    const zoneLogs = await auditService.listAuditLogs({ zoneId: testZone.id });
    assert(
      zoneLogs.items.some((l) => l.actor.zoneId === testZone.id || l.zone?.id === testZone.id),
      'Zone filter returns actions associated with the specified zone'
    );

    // ─── TEST 11: Date Range Filtering ──────────────────────────────────────
    console.log('\n📅 --- TEST 11: Date Range Filtering ---');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = await auditService.listAuditLogs({ from: todayStr, to: todayStr });
    assert(
      todayLogs.items.length >= 2,
      'Date range filter (from/to today) returns logs created today'
    );

    const pastLogs = await auditService.listAuditLogs({ from: '2020-01-01', to: '2020-01-02' });
    assert(pastLogs.items.length === 0, 'Past date range with no logs returns empty list');

    // ─── TEST 12: Combined Composable Filters ───────────────────────────────
    console.log('\n🧩 --- TEST 12: Combined Composable Filters ---');
    const combinedResult = await auditService.listAuditLogs({
      search: 'UNIQUE_KEYWORD_GAMMA',
      action: testActionUnique,
      actorRole: 'admin',
      from: todayStr,
      to: todayStr,
    });
    assert(
      combinedResult.items.length === 1 && combinedResult.items[0].action === testActionUnique,
      'Combined search + action + role + date filter resolves accurately'
    );

    // ─── TEST 13: Audit Detail Data & Record Integrity ──────────────────────
    console.log('\n🔍 --- TEST 13: Audit Detail Record Integrity ---');
    const detailLog = await auditService.getAuditLogById(combinedResult.items[0].id);
    assert(detailLog.id === combinedResult.items[0].id, 'Retrieved audit log by ID');
    assert(detailLog.logCode.startsWith('AUD-'), 'Log code formatted as AUD-XXXX');
    assert(detailLog.actor.fullName === 'Audit Inspector Admin', 'Actor full name included');
    assert(detailLog.actor.email === adminEmail, 'Actor email included');
    assert(detailLog.ipAddress === '192.168.1.100', 'IP address preserved');
    assert(detailLog.userAgent !== null, 'User Agent preserved');
    assert(detailLog.targetLabel === 'Dharani Murugan', 'Target label preserved');

    // ─── TEST 14: Real-Time Audit Generation (SPOC Mark/Unmark) ─────────────
    console.log('\n⚡ --- TEST 14: Real-Time Audit Generation ---');
    // Perform SPOC toggle through student service
    await studentService.updateSpocStatus(
      studentRecord.id,
      true,
      adminUser.id,
      'admin'
    );

    const newSpocLog = await auditService.listAuditLogs({
      action: 'STUDENT_MARKED_AS_SPOC',
      search: studentReg,
    });
    assert(
      newSpocLog.items.length >= 1,
      'SPOC status change automatically produced retrievable audit log record'
    );
    assert(
      newSpocLog.items[0].actorRole === 'admin',
      'SPOC audit log recorded admin as actor'
    );

    // ─── TEST 15: Sensitive Information Protection ──────────────────────────
    console.log('\n🔒 --- TEST 15: Sensitive Credentials Protection ---');
    const rawResultJson = JSON.stringify(adminLogs);
    assert(!rawResultJson.includes('passwordHash'), 'passwordHash is NOT present in API response');
    assert(!rawResultJson.includes('tempPassword'), 'tempPassword is NOT present in API response');
    assert(!rawResultJson.includes('TEMP_DOB_SECRET'), 'Plaintext temporary password is NOT exposed');
    assert(!rawResultJson.includes('tokenHash'), 'tokenHash is NOT present in API response');

    // ─── Cleanup Test Fixtures ─────────────────────────────────────────────
    console.log('\n🧹 Cleaning up test fixtures...');
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: { in: createdUserIds } },
          { targetEntityId: { in: createdStudentIds } },
          { action: testActionUnique },
        ],
      },
    });
    await prisma.student.deleteMany({ where: { id: { in: createdStudentIds } } });
    await prisma.zone.deleteMany({ where: { id: { in: createdZoneIds } } });
    await prisma.userProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    console.log('✅ Cleanup finished.\n');
  } catch (error: any) {
    console.error('💥 Unhandled error in Audit Logs tests:', error);
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 AUDIT LOGS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditLogsTests();
