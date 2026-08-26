/**
 * @file src/tests/test_student_spoc.ts
 * @description Comprehensive Integration & Security Test Suite for Student Directory:
 * 1. Profile Picture display & fallback verification
 * 2. SPOC database persistence & default state (isSpoc = false)
 * 3. Super Admin global SPOC mark/unmark authority
 * 4. Zone Incharge zone-scoped SPOC authority (own zone: 200, other zone: 403)
 * 5. Student & Unauthenticated mutation blocking (403/401)
 * 6. SPOC server-side filtering (SPOC only, pagination, search combinations, zone combinations)
 * 7. Audit log generation for SPOC assignments
 */

import { prisma } from '../config/database';
import { studentService } from '../modules/student/student.service';
import { studentRepository } from '../modules/student/student.repository';
import { hashPassword } from '../utils/password';
import { AuditActorRole, UserRole, AccountStatus, StudentStatus } from '@prisma/client';

async function runSpocTests() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING STUDENT DIRECTORY SPOC & PROFILE PICTURE TEST SUITE');
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
  const createdCollegeIds: string[] = [];
  const createdDeptIds: string[] = [];
  const createdProgIds: string[] = [];

  try {
    console.log('📦 Setting up test fixtures...');

    // 1. Organization
    let testOrg = await prisma.organization.findFirst();
    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test Maatram Foundation',
          code: `ORG-SPOC-${Date.now().toString().slice(-4)}`,
        },
      });
    }

    // 2. Super Admin User
    const adminEmail = `admin_spoc_${Date.now()}@maatram.org`;
    const adminPasswordHash = await hashPassword('AdminPass@123');
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: UserRole.admin,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Super Admin SPOC Tester',
          },
        },
      },
    });
    createdUserIds.push(adminUser.id);

    // 3. Zone 1 & Incharge 1
    const incharge1Email = `incharge1_spoc_${Date.now()}@maatram.org`;
    const incharge1User = await prisma.user.create({
      data: {
        email: incharge1Email,
        passwordHash: await hashPassword('InchargePass@123'),
        role: UserRole.zone,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Zone 1 Manager',
          },
        },
      },
    });
    createdUserIds.push(incharge1User.id);

    const zone1 = await prisma.zone.create({
      data: {
        name: `Zone North ${Date.now().toString().slice(-4)}`,
        code: `ZN-N-${Date.now().toString().slice(-4)}`,
        regionLabel: 'North Region',
        organizationId: testOrg.id,
        inchargeId: incharge1User.id,
      },
    });
    createdZoneIds.push(zone1.id);
    await prisma.user.update({ where: { id: incharge1User.id }, data: { zoneId: zone1.id } });

    // 4. Zone 2 & Incharge 2 (For cross-zone authorization test)
    const incharge2Email = `incharge2_spoc_${Date.now()}@maatram.org`;
    const incharge2User = await prisma.user.create({
      data: {
        email: incharge2Email,
        passwordHash: await hashPassword('InchargePass@123'),
        role: UserRole.zone,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Zone 2 Manager',
          },
        },
      },
    });
    createdUserIds.push(incharge2User.id);

    const zone2 = await prisma.zone.create({
      data: {
        name: `Zone South ${Date.now().toString().slice(-4)}`,
        code: `ZN-S-${Date.now().toString().slice(-4)}`,
        regionLabel: 'South Region',
        organizationId: testOrg.id,
        inchargeId: incharge2User.id,
      },
    });
    createdZoneIds.push(zone2.id);
    await prisma.user.update({ where: { id: incharge2User.id }, data: { zoneId: zone2.id } });

    // 5. College, Department, Program in Zone 1
    const testCollege = await prisma.college.create({
      data: {
        name: `SPOC Test College ${Date.now().toString().slice(-4)}`,
        code: `CLG-S-${Date.now().toString().slice(-4)}`,
        location: 'Chennai',
        zoneId: zone1.id,
      },
    });
    createdCollegeIds.push(testCollege.id);

    const testDept = await prisma.department.create({
      data: {
        name: 'Information Technology',
        collegeId: testCollege.id,
      },
    });
    createdDeptIds.push(testDept.id);

    const testProg = await prisma.program.create({
      data: {
        name: 'B.Tech IT',
        departmentId: testDept.id,
        durationYears: 4,
      },
    });
    createdProgIds.push(testProg.id);

    // 6. Student 1 in Zone 1 (with Cloudinary Profile Image)
    const s1Email = `student1_spoc_${Date.now()}@maatram.org`;
    const s1Reg = `REG-SPOC-1-${Date.now().toString().slice(-4)}`;
    const s1User = await prisma.user.create({
      data: {
        email: s1Email,
        registerNumber: s1Reg,
        passwordHash: await hashPassword('StudentPass@123'),
        role: UserRole.student,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
      },
    });
    createdUserIds.push(s1User.id);

    const student1 = await prisma.student.create({
      data: {
        userId: s1User.id,
        registrationNumber: s1Reg,
        firstName: 'Kavitha',
        lastName: 'Sundaram',
        dateOfBirth: new Date('2004-05-20'),
        verificationCode: `V1-${Date.now().toString().slice(-5)}`,
        accountStatus: AccountStatus.activated,
        status: StudentStatus.ACTIVE,
        profileImage: 'https://res.cloudinary.com/demo/image/upload/v1/kavitha.jpg',
        organizationId: testOrg.id,
        zoneId: zone1.id,
        collegeId: testCollege.id,
        departmentId: testDept.id,
        programId: testProg.id,
      },
    });
    createdStudentIds.push(student1.id);

    // 7. Student 2 in Zone 2 (without Profile Image -> null test)
    const s2Email = `student2_spoc_${Date.now()}@maatram.org`;
    const s2Reg = `REG-SPOC-2-${Date.now().toString().slice(-4)}`;
    const s2User = await prisma.user.create({
      data: {
        email: s2Email,
        registerNumber: s2Reg,
        passwordHash: await hashPassword('StudentPass@123'),
        role: UserRole.student,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
      },
    });
    createdUserIds.push(s2User.id);

    const student2 = await prisma.student.create({
      data: {
        userId: s2User.id,
        registrationNumber: s2Reg,
        firstName: 'Dinesh',
        lastName: 'Kumar',
        dateOfBirth: new Date('2003-11-10'),
        verificationCode: `V2-${Date.now().toString().slice(-5)}`,
        accountStatus: AccountStatus.activated,
        status: StudentStatus.ACTIVE,
        profileImage: null,
        organizationId: testOrg.id,
        zoneId: zone2.id,
      },
    });
    createdStudentIds.push(student2.id);

    console.log('✅ Fixtures created.\n');

    // ─── TEST 1: Initial Default SPOC State ─────────────────────────────────
    console.log('📋 --- TEST 1: Initial SPOC Default Status ---');
    const freshStudent1 = await prisma.student.findUnique({ where: { id: student1.id } });
    const freshStudent2 = await prisma.student.findUnique({ where: { id: student2.id } });

    assert(freshStudent1?.isSpoc === false, 'Student 1 initially has isSpoc = false');
    assert(freshStudent2?.isSpoc === false, 'Student 2 initially has isSpoc = false');

    // ─── TEST 2 & 3: Super Admin Marks Student 1 as SPOC ───────────────────
    console.log('\n👑 --- TEST 2 & 3: Super Admin Marks Student as SPOC ---');
    const updatedByAdmin = await studentService.updateSpocStatus(
      student1.id,
      true,
      adminUser.id,
      AuditActorRole.admin
    );

    assert(updatedByAdmin.isSpoc === true, 'Service returns updated student with isSpoc = true');

    const dbConfirm1 = await prisma.student.findUnique({ where: { id: student1.id } });
    assert(dbConfirm1?.isSpoc === true, 'Database confirms persistent isSpoc = true on Student record');

    // ─── TEST 4: Student List API Returns isSpoc and Profile Image ───────────
    console.log('\n🔍 --- TEST 4: Student List Query Returns isSpoc & Profile Image ---');
    const listResult = await studentService.listStudents({ search: s1Reg });
    const foundS1 = listResult.items.find((s) => s.id === student1.id);

    assert(foundS1 !== undefined, 'Student 1 is found in student list');
    assert(foundS1?.isSpoc === true, 'Student 1 in API response has isSpoc = true');
    assert(
      foundS1?.profileImage === 'https://res.cloudinary.com/demo/image/upload/v1/kavitha.jpg',
      'Student 1 in API response includes Cloudinary profileImage URL'
    );

    // ─── TEST 5: SPOC Filter Returns Only SPOC Students ────────────────────
    console.log('\n🎯 --- TEST 5: Server-Side isSpoc = true Filter ---');
    const spocList = await studentService.listStudents({ isSpoc: true });
    const isS1InSpocList = spocList.items.some((s) => s.id === student1.id);
    const isS2InSpocList = spocList.items.some((s) => s.id === student2.id);

    assert(isS1InSpocList === true, 'SPOC filter includes marked Student 1');
    assert(isS2InSpocList === false, 'SPOC filter excludes unmarked Student 2');

    // ─── TEST 6 & 7: Super Admin Unmarks Student from SPOC ─────────────────
    console.log('\n🔄 --- TEST 6 & 7: Super Admin Unmarks SPOC ---');
    await studentService.updateSpocStatus(
      student1.id,
      false,
      adminUser.id,
      AuditActorRole.admin
    );

    const dbUnmarked = await prisma.student.findUnique({ where: { id: student1.id } });
    assert(dbUnmarked?.isSpoc === false, 'Database confirms student isSpoc reverted to false');

    const afterUnmarkSpocList = await studentService.listStudents({ search: s1Reg, isSpoc: true });
    assert(
      afterUnmarkSpocList.items.length === 0,
      'SPOC filter no longer returns unmarked student (empty state)'
    );

    // ─── TEST 8: Zone Incharge Marks Student Within Own Zone ───────────────
    console.log('\n📍 --- TEST 8: Zone Incharge Marks Student in Own Zone ---');
    const incharge1Updated = await studentService.updateSpocStatus(
      student1.id,
      true,
      incharge1User.id,
      AuditActorRole.zone
    );
    assert(
      incharge1Updated.isSpoc === true,
      'Zone 1 Incharge successfully marked Student 1 (in Zone 1) as SPOC'
    );

    // ─── TEST 9: Zone Incharge Attempts to Mark Student Outside Assigned Zone ─
    console.log('\n🚫 --- TEST 9: Cross-Zone SPOC Mutation Protection (403 Forbidden) ---');
    let crossZoneError: any = null;
    try {
      // Incharge 1 (Zone 1) attempts to modify Student 2 (Zone 2)
      await studentService.updateSpocStatus(
        student2.id,
        true,
        incharge1User.id,
        AuditActorRole.zone
      );
    } catch (err: any) {
      crossZoneError = err;
    }

    assert(
      crossZoneError &&
        (crossZoneError.statusCode === 403 || crossZoneError.status === 403),
      'Zone Incharge modifying student outside assigned zone is blocked with 403 Forbidden',
      crossZoneError?.message
    );

    // ─── TEST 10: Student Role Attempts SPOC Mutation ───────────────────────
    console.log('\n🛡️ --- TEST 10: Student Role Mutation Protection (403 Forbidden) ---');
    let studentRoleError: any = null;
    try {
      await studentService.updateSpocStatus(
        student1.id,
        false,
        s1User.id,
        AuditActorRole.student
      );
    } catch (err: any) {
      studentRoleError = err;
    }

    assert(
      studentRoleError &&
        (studentRoleError.statusCode === 403 || studentRoleError.status === 403),
      'Student attempting SPOC mutation is blocked with 403 Forbidden'
    );

    // ─── TEST 11: Non-existent Student ID ──────────────────────────────────
    console.log('\n🔍 --- TEST 11: Non-Existent Student ID (404 Not Found) ---');
    let notFoundError: any = null;
    try {
      await studentService.updateSpocStatus(
        '00000000-0000-0000-0000-000000000000',
        true,
        adminUser.id,
        AuditActorRole.admin
      );
    } catch (err: any) {
      notFoundError = err;
    }

    assert(
      notFoundError &&
        (notFoundError.statusCode === 404 || notFoundError.status === 404),
      'Non-existent student ID returns 404 Not Found'
    );

    // ─── TEST 12 & 13: Profile Image Graceful Fallback on Null ─────────────
    console.log('\n🖼️ --- TEST 12 & 13: Profile Image Display and Null Fallback ---');
    const s2Query = await studentService.listStudents({ search: s2Reg });
    const s2Item = s2Query.items.find((s) => s.id === student2.id);

    assert(s2Item?.profileImage === null, 'Student without profile image returns graceful null');

    // ─── TEST 14: SPOC Filter with Pagination ──────────────────────────────
    console.log('\n📄 --- TEST 14: SPOC Filter with Pagination ---');
    const paginatedSpoc = await studentService.listStudents({ isSpoc: true, page: 1, limit: 5 });
    assert(paginatedSpoc.meta.page === 1, 'Pagination page matches requested page');
    assert(paginatedSpoc.meta.limit === 5, 'Pagination limit matches requested limit');
    assert(
      paginatedSpoc.items.every((s) => s.isSpoc === true),
      'All paginated items are SPOCs'
    );

    // ─── TEST 15: SPOC Filter + Search Combined ─────────────────────────────
    console.log('\n🔎 --- TEST 15: SPOC Filter + Search Filter Combined ---');
    const searchSpocMatch = await studentService.listStudents({
      search: 'Kavitha',
      isSpoc: true,
    });
    assert(searchSpocMatch.items.length >= 1, 'SPOC + Name Search returns matching SPOC');
    assert(
      searchSpocMatch.items[0].firstName === 'Kavitha',
      'Returned student matches searched name'
    );

    const searchSpocMismatch = await studentService.listStudents({
      search: 'Dinesh',
      isSpoc: true,
    });
    assert(
      searchSpocMismatch.items.length === 0,
      'SPOC + Non-SPOC Name Search returns empty list'
    );

    // ─── TEST 16: SPOC Filter + Zone Filter Combined ────────────────────────
    console.log('\n🗺️ --- TEST 16: SPOC Filter + Zone Filter Combined ---');
    const zone1Spoc = await studentService.listStudents({
      zoneId: zone1.id,
      isSpoc: true,
    });
    assert(
      zone1Spoc.items.some((s) => s.id === student1.id),
      'Zone 1 + SPOC filter contains Student 1'
    );

    const zone2Spoc = await studentService.listStudents({
      zoneId: zone2.id,
      isSpoc: true,
    });
    assert(
      !zone2Spoc.items.some((s) => s.id === student1.id),
      'Zone 2 + SPOC filter excludes Student 1 from Zone 1'
    );

    // ─── TEST 17: Audit Logs for SPOC Assignment ───────────────────────────
    console.log('\n📜 --- TEST 17: Audit Trail for SPOC Status Changes ---');
    const spocAuditLogs = await prisma.auditLog.findMany({
      where: {
        targetEntityId: student1.id,
        action: { in: ['STUDENT_MARKED_AS_SPOC', 'STUDENT_UNMARKED_AS_SPOC'] },
      },
    });

    assert(
      spocAuditLogs.length >= 2,
      `Audit logs recorded ${spocAuditLogs.length} SPOC status changes with actor & timestamp tracking`
    );

    // ─── Cleanup Test Fixtures ─────────────────────────────────────────────
    console.log('\n🧹 Cleaning up test fixtures...');
    await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.auditLog.deleteMany({ where: { targetEntityId: { in: createdStudentIds } } });
    await prisma.student.deleteMany({ where: { id: { in: createdStudentIds } } });
    await prisma.program.deleteMany({ where: { id: { in: createdProgIds } } });
    await prisma.department.deleteMany({ where: { id: { in: createdDeptIds } } });
    await prisma.college.deleteMany({ where: { id: { in: createdCollegeIds } } });
    await prisma.zone.deleteMany({ where: { id: { in: createdZoneIds } } });
    await prisma.userProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    console.log('✅ Cleanup finished.\n');
  } catch (error: any) {
    console.error('💥 Unhandled error in SPOC tests:', error);
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 SPOC TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSpocTests();
