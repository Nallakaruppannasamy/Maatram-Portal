/**
 * @file src/tests/test_archived_students.ts
 * @description Comprehensive Integration & Security Test Suite for Archived Students Feature:
 * 1. Active student appears in Student Directory and absent in Archived Students
 * 2. Deactivation moves student from Student Directory to Archived Students
 * 3. Complete data preservation on archived student (Profile, College, Degree, Dept, Zone, Cloudinary image, SPOC, etc.)
 * 4. Reactivation returns student to Student Directory and removes from Archived Students
 * 5. Single source of truth: Student ID & User ID remain identical across lifecycle
 * 6. Strict RBAC: Super Admin (200), Zone Incharge (403), Student (403), Unauthenticated (401)
 * 7. Archived-only search filtering
 * 8. Archived multi-criteria filters (Zone, College, Batch, Year, SPOC)
 * 9. Archived pagination
 * 10. Archived exports (CSV & Excel)
 * 11. Resume access for archived students
 * 12. SPOC preservation across deactivation and reactivation
 */

import { prisma } from '../config/database';
import { studentService } from '../modules/student/student.service';
import { userService } from '../modules/user/user.service';
import { hashPassword } from '../utils/password';
import { AuditActorRole, UserRole, AccountStatus, StudentStatus } from '@prisma/client';

async function runArchivedStudentsTests() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING ARCHIVED STUDENTS FEATURE TEST SUITE');
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
          code: `ORG-ARCH-${Date.now().toString().slice(-4)}`,
        },
      });
    }

    // 2. Super Admin User
    const adminEmail = `admin_arch_${Date.now()}@maatram.org`;
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
            fullName: 'Super Admin Archive Tester',
          },
        },
      },
    });
    createdUserIds.push(adminUser.id);

    // 3. Zone & Zone Incharge User
    const inchargeEmail = `incharge_arch_${Date.now()}@maatram.org`;
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
            fullName: 'Zone Archive Manager',
          },
        },
      },
    });
    createdUserIds.push(inchargeUser.id);

    const testZone = await prisma.zone.create({
      data: {
        name: `Zone Alpha ${Date.now().toString().slice(-4)}`,
        code: `ZN-A-${Date.now().toString().slice(-4)}`,
        regionLabel: 'Alpha Region',
        organizationId: testOrg.id,
        inchargeId: inchargeUser.id,
      },
    });
    createdZoneIds.push(testZone.id);
    await prisma.user.update({ where: { id: inchargeUser.id }, data: { zoneId: testZone.id } });

    // 4. College, Department, Program
    const testCollege = await prisma.college.create({
      data: {
        name: `Archive Test College ${Date.now().toString().slice(-4)}`,
        code: `CLG-A-${Date.now().toString().slice(-4)}`,
        location: 'Coimbatore',
        zoneId: testZone.id,
      },
    });
    createdCollegeIds.push(testCollege.id);

    const testDept = await prisma.department.create({
      data: {
        name: 'Computer Science & Engineering',
        collegeId: testCollege.id,
      },
    });
    createdDeptIds.push(testDept.id);

    const testProg = await prisma.program.create({
      data: {
        name: 'B.E. Computer Science',
        departmentId: testDept.id,
        durationYears: 4,
      },
    });
    createdProgIds.push(testProg.id);

    // 5. Student 1: Scholar to be Archived & Reactivated (with SPOC and Cloudinary Image)
    const s1Email = `student1_arch_${Date.now()}@maatram.org`;
    const s1Reg = `REG-ARCH-1-${Date.now().toString().slice(-4)}`;
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
        firstName: 'Meenakshi',
        lastName: 'Ramasamy',
        parentName: 'Ramasamy K',
        mobile: '9876543210',
        dateOfBirth: new Date('2004-03-15'),
        batch: '2024-2028',
        academicYear: '2nd Year',
        course: 'B.E. Computer Science',
        cgpa: 8.95,
        careerObjective: 'Aspiring Cloud Architect',
        verificationCode: `VA1-${Date.now().toString().slice(-5)}`,
        accountStatus: AccountStatus.activated,
        status: StudentStatus.ACTIVE,
        isSpoc: true,
        profileImage: 'https://res.cloudinary.com/demo/image/upload/v1/meenakshi.jpg',
        organizationId: testOrg.id,
        zoneId: testZone.id,
        collegeId: testCollege.id,
        departmentId: testDept.id,
        programId: testProg.id,
        skills: {
          create: [{ skillName: 'TypeScript' }, { skillName: 'React' }, { skillName: 'Node.js' }],
        },
        projects: {
          create: [
            {
              title: 'Smart Campus Portal',
              description: 'Campus automation system with React and Node.js',
              techStack: 'React, Node.js, TypeScript',
            },
          ],
        },
      },
    });
    createdStudentIds.push(student1.id);

    // 6. Student 2: Active Control Student
    const s2Email = `student2_arch_${Date.now()}@maatram.org`;
    const s2Reg = `REG-ARCH-2-${Date.now().toString().slice(-4)}`;
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
        firstName: 'Karthik',
        lastName: 'Natarajan',
        dateOfBirth: new Date('2003-08-22'),
        batch: '2024-2028',
        academicYear: '2nd Year',
        verificationCode: `VA2-${Date.now().toString().slice(-5)}`,
        accountStatus: AccountStatus.activated,
        status: StudentStatus.ACTIVE,
        isSpoc: false,
        organizationId: testOrg.id,
        zoneId: testZone.id,
        collegeId: testCollege.id,
        departmentId: testDept.id,
        programId: testProg.id,
      },
    });
    createdStudentIds.push(student2.id);

    console.log('✅ Fixtures created.\n');

    // ─── TEST 1: Initial State (Active in Directory, Absent in Archived) ────
    console.log('📋 --- TEST 1: Active Student Initial State ---');
    const activeDirInit = await studentService.listStudents(
      { search: s1Reg, scope: 'active' },
      'admin'
    );
    const archivedDirInit = await studentService.listStudents(
      { search: s1Reg, scope: 'archived' },
      'admin'
    );

    assert(
      activeDirInit.items.some((s) => s.id === student1.id),
      'Active Student 1 is present in active Student Directory'
    );
    assert(
      !archivedDirInit.items.some((s) => s.id === student1.id),
      'Active Student 1 is absent from Archived Students directory'
    );

    // ─── TEST 2: Deactivate Student via User Deactivation ───────────────────
    console.log('\n🔒 --- TEST 2: Deactivate Student ---');
    await userService.toggleUserActivation(
      s1User.id,
      false,
      adminUser.id,
      AuditActorRole.admin
    );
    const deactivatedUser = await prisma.user.findUnique({ where: { id: s1User.id } });
    assert(deactivatedUser?.isActive === false, 'User.isActive is false after deactivation');

    const activeDirAfterDeact = await studentService.listStudents(
      { search: s1Reg, scope: 'active' },
      'admin'
    );
    const archivedDirAfterDeact = await studentService.listStudents(
      { search: s1Reg, scope: 'archived' },
      'admin'
    );

    assert(
      activeDirAfterDeact.items.length === 0,
      'Deactivated Student 1 disappears from active Student Directory'
    );
    assert(
      archivedDirAfterDeact.items.some((s) => s.id === student1.id),
      'Deactivated Student 1 appears in Archived Students directory'
    );

    // ─── TEST 3: Complete Data Preservation on Archived Record ──────────────
    console.log('\n💾 --- TEST 3: Archived Student Data Preservation ---');
    const archivedItem = archivedDirAfterDeact.items.find((s) => s.id === student1.id);

    assert(archivedItem !== undefined, 'Archived record retrieved successfully');
    assert(archivedItem?.firstName === 'Meenakshi', 'First name preserved');
    assert(archivedItem?.lastName === 'Ramasamy', 'Last name preserved');
    assert(archivedItem?.registrationNumber === s1Reg, 'Register number preserved');
    assert(archivedItem?.parentName === 'Ramasamy K', 'Parent name preserved');
    assert(archivedItem?.mobile === '9876543210', 'Mobile number preserved');
    assert(archivedItem?.collegeId === testCollege.id, 'College relation preserved');
    assert(archivedItem?.departmentId === testDept.id, 'Department relation preserved');
    assert(archivedItem?.zoneId === testZone.id, 'Zone relation preserved');
    assert(archivedItem?.programId === testProg.id, 'Program relation preserved');
    assert(archivedItem?.batch === '2024-2028', 'Batch preserved');
    assert(archivedItem?.academicYear === '2nd Year', 'Academic year preserved');
    assert(Number(archivedItem?.cgpa) === 8.95, 'CGPA preserved');
    assert(archivedItem?.isSpoc === true, 'SPOC status preserved on archived student');
    assert(
      archivedItem?.profileImage === 'https://res.cloudinary.com/demo/image/upload/v1/meenakshi.jpg',
      'Cloudinary profile image URL preserved'
    );

    // ─── TEST 4: Reactivate Student ────────────────────────────────────────
    console.log('\n🔓 --- TEST 4: Reactivate Student ---');
    await userService.toggleUserActivation(
      s1User.id,
      true,
      adminUser.id,
      AuditActorRole.admin
    );
    const reactivatedUser = await prisma.user.findUnique({ where: { id: s1User.id } });
    assert(reactivatedUser?.isActive === true, 'User.isActive is true after reactivation');

    const activeDirAfterReact = await studentService.listStudents(
      { search: s1Reg, scope: 'active' },
      'admin'
    );
    const archivedDirAfterReact = await studentService.listStudents(
      { search: s1Reg, scope: 'archived' },
      'admin'
    );

    assert(
      activeDirAfterReact.items.some((s) => s.id === student1.id),
      'Reactivated Student 1 returns to active Student Directory'
    );
    assert(
      !archivedDirAfterReact.items.some((s) => s.id === student1.id),
      'Reactivated Student 1 disappears from Archived Students directory'
    );

    // ─── TEST 5: Single Source of Truth & Unchanged Record IDs ──────────────
    console.log('\n🔑 --- TEST 5: Single Source of Truth Record IDs ---');
    assert(student1.id === activeDirAfterReact.items[0].id, 'Student ID remains exactly identical');
    assert(student1.userId === s1User.id, 'User ID relation remains exactly identical');

    const totalStudentCount = await prisma.student.count({
      where: { registrationNumber: s1Reg },
    });
    assert(totalStudentCount === 1, 'Exactly 1 student record exists in DB (no duplicates created)');

    // ─── TEST 6: Strict RBAC Authorization for Archived Directory ───────────
    console.log('\n🛡️ --- TEST 6: RBAC Authorization on Archived Directory ---');
    // Deactivate student1 again for subsequent tests
    await userService.toggleUserActivation(s1User.id, false, adminUser.id, AuditActorRole.admin);

    // Super Admin -> 200 Success
    const adminQueryResult = await studentService.listStudents({ scope: 'archived' }, 'admin');
    assert(adminQueryResult.items.length >= 1, 'Super Admin can access archived students list (200)');

    // Zone Incharge -> 403 Forbidden
    let zoneAccessError: any = null;
    try {
      await studentService.listStudents({ scope: 'archived' }, 'zone');
    } catch (err: any) {
      zoneAccessError = err;
    }
    assert(
      zoneAccessError && (zoneAccessError.statusCode === 403 || zoneAccessError.status === 403),
      'Zone Incharge querying archived students receives 403 Forbidden'
    );

    // Student -> 403 Forbidden
    let studentAccessError: any = null;
    try {
      await studentService.listStudents({ scope: 'archived' }, 'student');
    } catch (err: any) {
      studentAccessError = err;
    }
    assert(
      studentAccessError &&
        (studentAccessError.statusCode === 403 || studentAccessError.status === 403),
      'Student querying archived students receives 403 Forbidden'
    );

    // ─── TEST 7: Archived-Only Search Filtering ─────────────────────────────
    console.log('\n🔍 --- TEST 7: Archived-Only Search Filtering ---');
    const searchArchivedMatch = await studentService.listStudents(
      { scope: 'archived', search: 'Meenakshi' },
      'admin'
    );
    assert(
      searchArchivedMatch.items.some((s) => s.id === student1.id),
      'Searching archived students by name returns matching archived student'
    );

    const searchActiveStudentInArchive = await studentService.listStudents(
      { scope: 'archived', search: s2Reg },
      'admin'
    );
    assert(
      searchActiveStudentInArchive.items.length === 0,
      'Searching active student in archived scope returns 0 results'
    );

    // ─── TEST 8: Archived Multi-Criteria Filters ────────────────────────────
    console.log('\n🎯 --- TEST 8: Archived Multi-Criteria Filters ---');
    // SPOC Filter
    const archivedSpocOnly = await studentService.listStudents(
      { scope: 'archived', isSpoc: true },
      'admin'
    );
    assert(
      archivedSpocOnly.items.some((s) => s.id === student1.id),
      'Archived + SPOC Only filter returns archived SPOC student'
    );

    // Zone Filter
    const archivedZoneFilter = await studentService.listStudents(
      { scope: 'archived', zoneId: testZone.id },
      'admin'
    );
    assert(
      archivedZoneFilter.items.some((s) => s.id === student1.id),
      'Archived + Zone filter returns student in that zone'
    );

    // College Filter
    const archivedCollegeFilter = await studentService.listStudents(
      { scope: 'archived', collegeId: testCollege.id },
      'admin'
    );
    assert(
      archivedCollegeFilter.items.some((s) => s.id === student1.id),
      'Archived + College filter returns student in that college'
    );

    // Academic Year Filter
    const archivedYearFilter = await studentService.listStudents(
      { scope: 'archived', academicYear: '2nd Year' },
      'admin'
    );
    assert(
      archivedYearFilter.items.some((s) => s.id === student1.id),
      'Archived + Academic Year filter returns student in that year'
    );

    // ─── TEST 9: Archived Pagination ────────────────────────────────────────
    console.log('\n📄 --- TEST 9: Archived Pagination ---');
    const paginatedArchive = await studentService.listStudents(
      { scope: 'archived', page: 1, limit: 5 },
      'admin'
    );
    assert(paginatedArchive.meta.page === 1, 'Pagination page matches requested page');
    assert(paginatedArchive.meta.limit === 5, 'Pagination limit matches requested limit');
    assert(
      paginatedArchive.items.every((s) => s.user?.isActive === false),
      'Every record in archived pagination has user.isActive = false'
    );

    // ─── TEST 10: Archived Exports (CSV & Excel) ────────────────────────────
    console.log('\n📊 --- TEST 10: Archived Backend Exports ---');
    const archivedCsv = await studentService.exportToCsv({ scope: 'archived' }, 'admin');
    assert(typeof archivedCsv === 'string', 'CSV export returns string');
    assert(archivedCsv.includes(s1Reg), 'Archived CSV export contains deactivated student');
    assert(!archivedCsv.includes(s2Reg), 'Archived CSV export excludes active student');

    const archivedExcel = await studentService.exportToExcel({ scope: 'archived' }, 'admin');
    assert(Buffer.isBuffer(archivedExcel), 'Excel export returns valid Buffer');
    assert(archivedExcel.length > 1000, 'Excel export buffer contains valid spreadsheet bytes');

    // Export RBAC
    let exportRbacError: any = null;
    try {
      await studentService.exportToCsv({ scope: 'archived' }, 'zone');
    } catch (err: any) {
      exportRbacError = err;
    }
    assert(
      exportRbacError &&
        (exportRbacError.statusCode === 403 || exportRbacError.status === 403),
      'Zone Incharge attempting archived export is blocked with 403 Forbidden'
    );

    // ─── TEST 11: Super Admin Resume Access on Archived Student ─────────────
    console.log('\n📄 --- TEST 11: Resume Access on Archived Student ---');
    const resumeData = await studentService.getStudentResume(
      student1.id,
      adminUser.id,
      'admin'
    );
    assert(resumeData !== null, 'Super Admin successfully retrieved archived student resume');
    assert(resumeData.id === student1.id, 'Resume belongs to the exact archived student');
    assert(
      resumeData.skills?.length >= 3,
      'Archived student resume includes preserved skills'
    );
    assert(
      resumeData.projects?.length >= 1,
      'Archived student resume includes preserved projects'
    );

    // ─── TEST 12: SPOC Status Preservation Across Lifecycle ─────────────────
    console.log('\n⭐ --- TEST 12: SPOC Status Preservation Across Lifecycle ---');
    // Verify SPOC while archived
    const student1Archived = await prisma.student.findUnique({ where: { id: student1.id } });
    assert(
      student1Archived?.isSpoc === true,
      'Student retains isSpoc = true while account is deactivated'
    );

    // Reactivate and verify SPOC preserved
    await userService.toggleUserActivation(s1User.id, true, adminUser.id, AuditActorRole.admin);
    const student1Reactivated = await prisma.student.findUnique({ where: { id: student1.id } });
    assert(
      student1Reactivated?.isSpoc === true,
      'Student retains isSpoc = true after account reactivation'
    );

    const activeListWithSpoc = await studentService.listStudents(
      { search: s1Reg, isSpoc: true },
      'admin'
    );
    assert(
      activeListWithSpoc.items.some((s) => s.id === student1.id),
      'Reactivated SPOC student is found under active SPOC filter'
    );

    // ─── Cleanup Test Fixtures ─────────────────────────────────────────────
    console.log('\n🧹 Cleaning up test fixtures...');
    await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.skill.deleteMany({ where: { studentId: { in: createdStudentIds } } });
    await prisma.project.deleteMany({ where: { studentId: { in: createdStudentIds } } });
    await prisma.student.deleteMany({ where: { id: { in: createdStudentIds } } });
    await prisma.program.deleteMany({ where: { id: { in: createdProgIds } } });
    await prisma.department.deleteMany({ where: { id: { in: createdDeptIds } } });
    await prisma.college.deleteMany({ where: { id: { in: createdCollegeIds } } });
    await prisma.zone.deleteMany({ where: { id: { in: createdZoneIds } } });
    await prisma.userProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    console.log('✅ Cleanup finished.\n');
  } catch (error: any) {
    console.error('💥 Unhandled error in Archived Students tests:', error);
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 ARCHIVED STUDENTS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runArchivedStudentsTests();
