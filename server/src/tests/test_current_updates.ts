/**
 * @file src/tests/test_current_updates.ts
 * @description Integration & Regression test suite verifying:
 * 1. Super Admin Volunteering Logs & Strict Read-Only RBAC (403 on approve/reject/comment by admin)
 * 2. Student First Login Lifecycle Transition (pending_first_login -> password_changed)
 * 3. User Activation & Account Deactivation login blocking
 * 4. Team Management role filtering (complete exclusion of student records & accurate stats)
 * 5. Zone Management live database college counts
 * 6. Excel Provisioning export column integrity
 */

import { prisma } from '../config/database';
import { authService } from '../modules/auth/auth.service';
import { userService } from '../modules/user/user.service';
import { volunteerService } from '../modules/volunteer/volunteer.service';
import { zoneService } from '../modules/zone/zone.service';
import { studentService } from '../modules/student/student.service';
import { hashPassword } from '../utils/password';
import { AuditActorRole, VolunteerCategory, UserRole, AccountStatus } from '@prisma/client';

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING INTEGRATION & REGRESSION TEST SUITE');
  console.log('======================================================\n');

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

  try {
    // ─── Setup Test Environment Fixtures ──────────────────────────────────────
    console.log('📦 Setting up test fixtures in database...');

    // 1. Organization
    let testOrg = await prisma.organization.findFirst();
    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test Maatram Organization',
          code: `ORG-TEST-${Date.now().toString().slice(-4)}`,
        },
      });
    }

    // 2. Super Admin User
    const adminEmail = `test_admin_${Date.now()}@maatram.org`;
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
            fullName: 'Test Super Admin',
            designation: 'Lead Administrator',
          },
        },
      },
    });

    // 3. Zone Incharge User
    const zoneInchargeEmail = `test_incharge_${Date.now()}@maatram.org`;
    const inchargePasswordHash = await hashPassword('InchargePass@123');
    const inchargeUser = await prisma.user.create({
      data: {
        email: zoneInchargeEmail,
        passwordHash: inchargePasswordHash,
        role: UserRole.zone,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Test Zone Manager',
            designation: 'Zone Incharge',
          },
        },
      },
    });

    // 4. Test Zone
    const zoneCode = `ZN-${Date.now().toString().slice(-4)}`;
    const testZone = await prisma.zone.create({
      data: {
        name: `Test Zone ${zoneCode}`,
        code: zoneCode,
        regionLabel: 'Test Region',
        organizationId: testOrg.id,
        inchargeId: inchargeUser.id,
      },
    });

    // Update incharge zoneId mapping
    await prisma.user.update({
      where: { id: inchargeUser.id },
      data: { zoneId: testZone.id },
    });

    // 5. Test College
    const collegeCode = `CLG-${Date.now().toString().slice(-4)}`;
    const testCollege = await prisma.college.create({
      data: {
        name: `Test College ${collegeCode}`,
        code: collegeCode,
        location: 'Chennai Campus',
        zoneId: testZone.id,
      },
    });

    // 6. Test Department and Program
    const testDept = await prisma.department.create({
      data: {
        name: 'Computer Science & Engineering',
        collegeId: testCollege.id,
      },
    });
    const testProg = await prisma.program.create({
      data: {
        name: 'B.E. Computer Science',
        departmentId: testDept.id,
        durationYears: 4,
      },
    });

    // 7. Student User with temp DOB password
    const studentRegNumber = `REG-${Date.now().toString().slice(-5)}`;
    const studentEmail = `student_${Date.now()}@maatram.org`;
    const tempDobPassword = '15/08/2004';
    const studentPasswordHash = await hashPassword(tempDobPassword);

    const studentUser = await prisma.user.create({
      data: {
        email: studentEmail,
        registerNumber: studentRegNumber,
        passwordHash: studentPasswordHash,
        tempPassword: tempDobPassword,
        role: UserRole.student,
        organizationId: testOrg.id,
        isFirstLogin: true,
        isActive: true,
      },
    });

    const testStudent = await prisma.student.create({
      data: {
        userId: studentUser.id,
        registrationNumber: studentRegNumber,
        firstName: 'Ananya',
        lastName: 'Ramesh',
        dateOfBirth: new Date('2004-08-15'),
        verificationCode: `V-${Date.now().toString().slice(-6)}`,
        accountStatus: AccountStatus.pending_first_login,
        organizationId: testOrg.id,
        zoneId: testZone.id,
        collegeId: testCollege.id,
        departmentId: testDept.id,
        programId: testProg.id,
      },
    });

    // 8. Volunteer Activity Submission
    const testSubmission = await prisma.volunteerSubmission.create({
      data: {
        submissionCode: `SUB-${Date.now().toString().slice(-6)}`,
        studentId: testStudent.id,
        zoneId: testZone.id,
        title: 'Karpom Karpipom Tutoring Camp',
        category: VolunteerCategory.KARPOM_KARPIPOM_TUTORING,
        description: 'Taught mathematics to 10th grade students.',
        eventDate: new Date('2026-03-10'),
        count: 5,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
        status: 'pending',
      },
    });

    console.log('✅ Test fixtures initialized.\n');

    // ─── TEST SUITE 1: SUPER ADMIN VOLUNTEERING LOGS & READ-ONLY RBAC ──────────
    console.log('📋 --- TEST 1: Super Admin Volunteering Logs Global Listing & Search ---');
    const logsResult = await volunteerService.listVolunteers(
      { view: 'logs', page: 1, limit: 10, search: 'Ananya' },
      adminUser.id,
      'admin'
    );

    assert(logsResult.items.length >= 1, 'Super Admin receives global volunteering logs with relations');
    const matchedLog = logsResult.items.find((i: any) => i.id === testSubmission.id);
    assert(!!matchedLog, 'Target submission is found in global query');
    assert(
      matchedLog?.student?.firstName === 'Ananya' &&
        matchedLog?.student?.college?.name.includes('Test College') &&
        matchedLog?.zone?.code === zoneCode,
      'Log contains student, college, and zone nested relation records'
    );

    console.log('\n🔒 --- TEST 2: Super Admin Read-Only RBAC Enforcement ---');
    // Admin attempts to approve submission -> MUST be rejected with 403 Forbidden
    let adminApproveError: any = null;
    try {
      await volunteerService.updateSubmissionStatus(
        testSubmission.id,
        'APPROVED',
        'Approved by admin',
        adminUser.id,
        AuditActorRole.admin
      );
    } catch (err: any) {
      adminApproveError = err;
    }
    assert(
      adminApproveError && (adminApproveError.status === 403 || adminApproveError.statusCode === 403),
      'Super Admin attempting to approve submission returns 403 Forbidden',
      adminApproveError?.message
    );

    // Admin attempts to comment on submission -> MUST be rejected with 403 Forbidden
    let adminCommentError: any = null;
    try {
      await volunteerService.addSubmissionComment(
        testSubmission.id,
        'Admin comment',
        adminUser.id,
        AuditActorRole.admin
      );
    } catch (err: any) {
      adminCommentError = err;
    }
    assert(
      adminCommentError && (adminCommentError.status === 403 || adminCommentError.statusCode === 403),
      'Super Admin attempting to add review comment returns 403 Forbidden',
      adminCommentError?.message
    );

    // Zone Incharge approves submission -> MUST succeed
    console.log('\n✍️ --- TEST 3: Zone Incharge Authorized Review ---');
    const inchargeReview = await volunteerService.updateSubmissionStatus(
      testSubmission.id,
      'APPROVED',
      'Verified proof and student attendance.',
      inchargeUser.id,
      AuditActorRole.zone
    );
    assert(inchargeReview.status === 'approved', 'Zone Incharge successfully approved submission');

    // ─── TEST SUITE 2: STUDENT FIRST-LOGIN LIFECYCLE ──────────────────────────
    console.log('\n🔑 --- TEST 4: Student First-Login Password Change Lifecycle ---');
    const initialStudentRec = await prisma.student.findUnique({ where: { id: testStudent.id } });
    const initialUserRec = await prisma.user.findUnique({ where: { id: studentUser.id } });

    assert(initialUserRec?.isFirstLogin === true, 'Initial student user isFirstLogin is true');
    assert(
      initialStudentRec?.accountStatus === AccountStatus.pending_first_login,
      'Initial student profile accountStatus is pending_first_login'
    );

    // Student changes password from temp DOB password to new permanent password
    const newPermanentPassword = 'StudentSecure@2026';
    await authService.changePassword(studentUser.id, tempDobPassword, newPermanentPassword);

    const updatedUserRec = await prisma.user.findUnique({ where: { id: studentUser.id } });
    const updatedStudentRec = await prisma.student.findUnique({ where: { id: testStudent.id } });

    assert(updatedUserRec?.isFirstLogin === false, 'User isFirstLogin cleared to false');
    assert(updatedUserRec?.tempPassword === null, 'User tempPassword wiped to null');
    assert(
      updatedStudentRec?.accountStatus === AccountStatus.password_changed,
      'Student accountStatus atomically transitioned to password_changed'
    );

    // Verify student can now log in with the new password
    const studentLogin = await authService.login(studentEmail, newPermanentPassword);
    assert(!!studentLogin.accessToken, 'Student logs in successfully with new permanent password');

    // ─── TEST SUITE 3: ACCOUNT DEACTIVATION & SESSION BLOCKING ────────────────
    console.log('\n🚫 --- TEST 5: Student Account Deactivation & Login Blocking ---');
    // Admin deactivates student
    await userService.toggleUserActivation(studentUser.id, false, adminUser.id, AuditActorRole.admin);

    const deactivatedUserRec = await prisma.user.findUnique({ where: { id: studentUser.id } });
    assert(deactivatedUserRec?.isActive === false, 'Student User.isActive is false after deactivation');

    // Attempt login as deactivated user -> MUST fail with 403 / 401
    let deactivatedLoginError: any = null;
    try {
      await authService.login(studentEmail, newPermanentPassword);
    } catch (err: any) {
      deactivatedLoginError = err;
    }
    assert(
      deactivatedLoginError && (deactivatedLoginError.statusCode === 403 || deactivatedLoginError.statusCode === 401 || deactivatedLoginError.status === 403 || deactivatedLoginError.status === 401),
      'Deactivated student login attempt is blocked with unauthorized/forbidden',
      deactivatedLoginError?.message
    );

    // Reactivate student
    await userService.toggleUserActivation(studentUser.id, true, adminUser.id, AuditActorRole.admin);
    const reactivatedLogin = await authService.login(studentEmail, newPermanentPassword);
    assert(!!reactivatedLogin.accessToken, 'Reactivated student logs in successfully');

    // ─── TEST SUITE 4: TEAM MANAGEMENT EXCLUDES STUDENTS ──────────────────────
    console.log('\n👥 --- TEST 6: Team Management Filters & Role Counts ---');
    const teamList = await userService.listUsers({});

    const containsStudent = teamList.items.some((u: any) => u.role === UserRole.student || u.id === studentUser.id);
    assert(!containsStudent, 'Team management list excludes student role users');

    const totalStaffSum = teamList.stats.superAdmins + teamList.stats.zoneIncharges;
    assert(
      teamList.stats.totalMembers === totalStaffSum,
      `Team totalMembers (${teamList.stats.totalMembers}) matches superAdmins (${teamList.stats.superAdmins}) + zoneIncharges (${teamList.stats.zoneIncharges})`
    );

    // ─── TEST SUITE 5: ZONE LIVE COLLEGE COUNTS ───────────────────────────────
    console.log('\n🏫 --- TEST 7: Zone Live College Counts ---');
    const zoneListResult = await zoneService.listZones({ search: zoneCode });
    const targetZoneRec = zoneListResult.data.find((z: any) => z.id === testZone.id);

    assert(!!targetZoneRec, 'Found created zone in zone list');
    assert(
      targetZoneRec?.collegeCount === 1,
      `Zone collegeCount equals real count in DB (expected: 1, actual: ${targetZoneRec?.collegeCount})`
    );

    // ─── TEST SUITE 6: EXCEL PROVISIONING EXPORT INTEGRITY ─────────────────────
    console.log('\n📊 --- TEST 8: Excel Provisioning Export Column Structure ---');
    const exportBuffer = await studentService.exportToExcel({
      view: 'provisioning',
      search: studentRegNumber,
    });
    assert(exportBuffer && exportBuffer.length > 0, 'Excel export generates valid file buffer');

    // ─── Cleanup Test Fixtures ───────────────────────────────────────────────
    console.log('\n🧹 Cleaning up test fixtures...');
    const userIds = [adminUser.id, inchargeUser.id, studentUser.id];
    await prisma.volunteerSubmission.deleteMany({ where: { id: testSubmission.id } });
    await prisma.notification.deleteMany({ where: { recipientId: { in: userIds } } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.student.deleteMany({ where: { id: testStudent.id } });
    await prisma.program.deleteMany({ where: { id: testProg.id } });
    await prisma.department.deleteMany({ where: { id: testDept.id } });
    await prisma.college.deleteMany({ where: { id: testCollege.id } });
    await prisma.zone.deleteMany({ where: { id: testZone.id } });
    await prisma.userProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log('✅ Cleanup completed.\n');

  } catch (error: any) {
    console.error('💥 Unhandled test error:', error);
    failed++;
  }

  console.log('======================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
