/**
 * @file src/tests/test_phase_current_updates.ts
 * @description Comprehensive automated test suite for the 4 requirements:
 * 1. Organisation Hierarchy Active Student Count
 * 2. Zone Incharge Volunteering Logs & Isolation
 * 3. Forgot Password / Reset Password Validation Contracts
 * 4. Student Profile Updates with Optional / Nullable Fields
 */

import { prisma } from '../config/database';
import { organizationService } from '../modules/organization/organization.service';
import { volunteerService } from '../modules/volunteer/volunteer.service';
import { authService } from '../modules/auth/auth.service';
import { profileService } from '../modules/profile/profile.service';
import { updateProfileValidator } from '../modules/profile/profile.validator';
import { forgotPasswordValidator, resetPasswordValidator } from '../modules/auth/auth.validator';
import { AuditActorRole, VolunteerCategory, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('\n=============================================================');
  console.log('STARTING PHASE CURRENT UPDATES AUTOMATED TEST SUITE');
  console.log('=============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition: boolean, testName: string, errorDetail?: any) => {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (errorDetail) console.error('         Error details:', errorDetail);
    }
  };

  const timestamp = Date.now();

  try {
    // ─── Setup Shared Test Fixtures ──────────────────────────────────────────
    console.log('Setting up test fixtures...');

    const org = await prisma.organization.create({
      data: {
        name: `Test Org ${timestamp}`,
        code: `ORG_${timestamp}`,
        isActive: true,
      },
    });

    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

    // Create Zone A and Incharge A
    const inchargeAUser = await prisma.user.create({
      data: {
        email: `incharge_a_${timestamp}@maatram.org`,
        passwordHash: hashedPassword,
        role: UserRole.zone,
        isActive: true,
      },
    });

    const zoneA = await prisma.zone.create({
      data: {
        name: `Zone Alpha ${timestamp}`,
        code: `ZA_${timestamp}`,
        regionLabel: 'Zone Alpha Region',
        organizationId: org.id,
        inchargeId: inchargeAUser.id,
        isActive: true,
      },
    });

    // Create Zone B and Incharge B
    const inchargeBUser = await prisma.user.create({
      data: {
        email: `incharge_b_${timestamp}@maatram.org`,
        passwordHash: hashedPassword,
        role: UserRole.zone,
        isActive: true,
      },
    });

    const zoneB = await prisma.zone.create({
      data: {
        name: `Zone Beta ${timestamp}`,
        code: `ZB_${timestamp}`,
        regionLabel: 'Zone Beta Region',
        organizationId: org.id,
        inchargeId: inchargeBUser.id,
        isActive: true,
      },
    });

    // Create College, Dept, Program in Zone A
    const collegeA = await prisma.college.create({
      data: {
        name: `Engineering College A ${timestamp}`,
        code: `ECA_${timestamp}`,
        location: 'Chennai',
        zoneId: zoneA.id,
        isActive: true,
      },
    });

    const deptA = await prisma.department.create({
      data: {
        name: `Computer Science ${timestamp}`,
        collegeId: collegeA.id,
      },
    });

    const progA = await prisma.program.create({
      data: {
        name: `B.E. CSE ${timestamp}`,
        departmentId: deptA.id,
        durationYears: 4,
      },
    });

    // Create Students in Zone A
    // Student 1 (Active)
    const studentUser1 = await prisma.user.create({
      data: {
        email: `student1_${timestamp}@maatram.org`,
        registerNumber: `REG1_${timestamp}`,
        passwordHash: hashedPassword,
        role: UserRole.student,
        isActive: true,
      },
    });

    const student1 = await prisma.student.create({
      data: {
        userId: studentUser1.id,
        registrationNumber: `REG1_${timestamp}`,
        verificationCode: `VC1_${timestamp}`,
        dateOfBirth: new Date('2003-05-15'),
        firstName: 'ActiveStudent',
        lastName: 'One',
        organizationId: org.id,
        zoneId: zoneA.id,
        collegeId: collegeA.id,
        departmentId: deptA.id,
        programId: progA.id,
        status: 'ACTIVE',
      },
    });

    // Student 2 (Deactivated User)
    const studentUser2 = await prisma.user.create({
      data: {
        email: `student2_${timestamp}@maatram.org`,
        registerNumber: `REG2_${timestamp}`,
        passwordHash: hashedPassword,
        role: UserRole.student,
        isActive: false, // DEACTIVATED ACCOUNT
      },
    });

    const student2 = await prisma.student.create({
      data: {
        userId: studentUser2.id,
        registrationNumber: `REG2_${timestamp}`,
        verificationCode: `VC2_${timestamp}`,
        dateOfBirth: new Date('2003-05-15'),
        firstName: 'DeactivatedStudent',
        lastName: 'Two',
        organizationId: org.id,
        zoneId: zoneA.id,
        collegeId: collegeA.id,
        departmentId: deptA.id,
        programId: progA.id,
        status: 'ACTIVE', // Student row might say ACTIVE, but User.isActive is false!
      },
    });

    // Student 3 in Zone B (Active)
    const studentUser3 = await prisma.user.create({
      data: {
        email: `student3_${timestamp}@maatram.org`,
        registerNumber: `REG3_${timestamp}`,
        passwordHash: hashedPassword,
        role: UserRole.student,
        isActive: true,
      },
    });

    const student3 = await prisma.student.create({
      data: {
        userId: studentUser3.id,
        registrationNumber: `REG3_${timestamp}`,
        verificationCode: `VC3_${timestamp}`,
        dateOfBirth: new Date('2003-05-15'),
        firstName: 'ZoneBStudent',
        lastName: 'Three',
        organizationId: org.id,
        zoneId: zoneB.id,
        status: 'ACTIVE',
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PART 1: TEST ORGANIZATION HIERARCHY ACTIVE STUDENT COUNT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- PART 1: Organization Hierarchy Active Student Count ---');

    const hierarchyTreeInitial = await organizationService.getHierarchy();
    const testOrgInitial = hierarchyTreeInitial.find((o) => o.id === org.id);
    const testZoneAInitial = testOrgInitial?.zones.find((z: any) => z.id === zoneA.id);
    const testCollegeAInitial = testZoneAInitial?.colleges.find((c: any) => c.id === collegeA.id);

    assert(
      testCollegeAInitial?.studentCount === 1,
      'Hierarchy College student count should be 1 (only Active student, excluding deactivated account)',
      `Got ${testCollegeAInitial?.studentCount}, expected 1`
    );

    assert(
      testZoneAInitial?.totalStudents === 1,
      'Hierarchy Zone totalStudents should be 1 (excluding deactivated account)',
      `Got ${testZoneAInitial?.totalStudents}, expected 1`
    );

    // Reactivate Student 2 and verify count increases
    await prisma.user.update({
      where: { id: studentUser2.id },
      data: { isActive: true },
    });

    const hierarchyTreeAfterReactivate = await organizationService.getHierarchy();
    const testOrgAfter = hierarchyTreeAfterReactivate.find((o) => o.id === org.id);
    const testCollegeAAfter = testOrgAfter?.zones
      .find((z: any) => z.id === zoneA.id)
      ?.colleges.find((c: any) => c.id === collegeA.id);

    assert(
      testCollegeAAfter?.studentCount === 2,
      'Reactivating deactivated student increases hierarchy student count to 2',
      `Got ${testCollegeAAfter?.studentCount}, expected 2`
    );

    // Re-deactivate Student 2 and verify count decreases back to 1
    await prisma.user.update({
      where: { id: studentUser2.id },
      data: { isActive: false },
    });

    const hierarchyTreeAfterDeactivate = await organizationService.getHierarchy();
    const testCollegeADeactivated = hierarchyTreeAfterDeactivate
      .find((o) => o.id === org.id)
      ?.zones.find((z: any) => z.id === zoneA.id)
      ?.colleges.find((c: any) => c.id === collegeA.id);

    assert(
      testCollegeADeactivated?.studentCount === 1,
      'Deactivating student decreases hierarchy student count back to 1',
      `Got ${testCollegeADeactivated?.studentCount}, expected 1`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PART 2: ZONE VOLUNTEERING LOGS & ISOLATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- PART 2: Zone Volunteering Logs & Isolation ---');

    // Create submission in Zone A
    const subA = await prisma.volunteerSubmission.create({
      data: {
        submissionCode: `VLOG_${timestamp}_A`,
        studentId: student1.id,
        zoneId: zoneA.id,
        category: VolunteerCategory.TELE_VERIFICATION,
        title: `Zone A Activity ${timestamp}`,
        description: 'Completed tele verification calls for 10 candidates',
        status: 'pending',
        eventDate: new Date(),
        count: 10,
        proofFileUrl: 'https://res.cloudinary.com/test/image/upload/v1234567890/proofA.jpg',
      },
    });

    // Create submission in Zone B
    const subB = await prisma.volunteerSubmission.create({
      data: {
        submissionCode: `VLOG_${timestamp}_B`,
        studentId: student3.id,
        zoneId: zoneB.id,
        category: VolunteerCategory.SCHOOL_VISIT,
        title: `Zone B Activity ${timestamp}`,
        description: 'Conducted school visit in Zone B',
        status: 'pending',
        eventDate: new Date(),
        count: 1,
        proofFileUrl: 'https://res.cloudinary.com/test/image/upload/v1234567890/proofB.jpg',
      },
    });

    // Zone Incharge A fetches logs
    const zoneALogs = await volunteerService.listVolunteers(
      { view: 'logs', type: 'submissions' },
      inchargeAUser.id,
      'zone'
    );

    const hasSubA = zoneALogs.items.some((item: any) => item.id === subA.id);
    const hasSubB = zoneALogs.items.some((item: any) => item.id === subB.id);

    assert(
      hasSubA && !hasSubB,
      'Zone Incharge A only sees Zone A submissions and NOT Zone B submissions in volunteering logs',
      { hasSubA, hasSubB, totalItems: zoneALogs.items.length }
    );

    // Zone Incharge A searches for Zone B student
    const zoneASearchResult = await volunteerService.listVolunteers(
      { view: 'logs', type: 'submissions', search: 'ZoneBStudent' },
      inchargeAUser.id,
      'zone'
    );

    assert(
      zoneASearchResult.items.length === 0,
      'Zone Incharge A search is strictly zone-isolated (returns 0 results for Zone B student search)',
      `Got ${zoneASearchResult.items.length} items`
    );

    // Cross-Zone Action Authorization: Zone Incharge A attempts to access Zone B submission
    let crossZoneAccessBlocked = false;
    try {
      await volunteerService.getSubmissionById(subB.id, inchargeAUser.id, 'zone');
    } catch (err: any) {
      if (err.statusCode === 403) crossZoneAccessBlocked = true;
    }
    assert(
      crossZoneAccessBlocked,
      'Zone Incharge A attempting to view Zone B submission throws 403 Forbidden'
    );

    // Cross-Zone Action Authorization: Zone Incharge A attempts to update Zone B submission
    let crossZoneUpdateBlocked = false;
    try {
      await volunteerService.updateSubmissionStatus(
        subB.id,
        'APPROVED',
        'Looks good',
        inchargeAUser.id,
        AuditActorRole.zone
      );
    } catch (err: any) {
      if (err.statusCode === 403) crossZoneUpdateBlocked = true;
    }
    assert(
      crossZoneUpdateBlocked,
      'Zone Incharge A attempting to approve Zone B submission throws 403 Forbidden'
    );

    // Authorized Action: Zone Incharge A approves Zone A submission
    const approvedSubA = await volunteerService.updateSubmissionStatus(
      subA.id,
      'APPROVED',
      'Verified successfully',
      inchargeAUser.id,
      AuditActorRole.zone
    );
    assert(
      approvedSubA.status === 'approved',
      'Zone Incharge A successfully approves Zone A submission'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PART 3: FORGOT PASSWORD & RESET PASSWORD VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- PART 3: Forgot Password & Reset Password Validation ---');

    // 1. Valid payload with identifier
    const validForgotPayload1 = forgotPasswordValidator.safeParse({
      body: { identifier: `student1_${timestamp}@maatram.org` },
    });
    assert(validForgotPayload1.success, 'forgotPasswordValidator accepts valid identifier');

    // 2. Valid payload with email
    const validForgotPayload2 = forgotPasswordValidator.safeParse({
      body: { email: `student1_${timestamp}@maatram.org` },
    });
    assert(validForgotPayload2.success, 'forgotPasswordValidator accepts valid email field');

    // 3. Invalid payload (empty)
    const invalidForgotPayload = forgotPasswordValidator.safeParse({
      body: { identifier: '   ' },
    });
    assert(!invalidForgotPayload.success, 'forgotPasswordValidator rejects empty identifier/email');

    // 4. forgotPassword service handles valid user without error
    let forgotServiceSuccess = false;
    try {
      await authService.forgotPassword(`student1_${timestamp}@maatram.org`);
      forgotServiceSuccess = true;
    } catch (e) {
      console.error(e);
    }
    assert(
      forgotServiceSuccess,
      'authService.forgotPassword processes valid user identifier cleanly'
    );

    // 5. Valid reset password payload
    const validResetPayload = resetPasswordValidator.safeParse({
      body: {
        token: 'sample-reset-token',
        newPassword: 'BrandNewPassword123!',
        confirmPassword: 'BrandNewPassword123!',
      },
    });
    assert(validResetPayload.success, 'resetPasswordValidator accepts valid token and newPassword');

    // 6. Invalid reset password (mismatch passwords)
    const invalidResetPayload = resetPasswordValidator.safeParse({
      body: {
        token: 'sample-reset-token',
        newPassword: 'BrandNewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      },
    });
    assert(
      !invalidResetPayload.success,
      'resetPasswordValidator rejects mismatched confirmation password'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PART 4: STUDENT PROFILE "VALIDATION FAILED" ERROR FIX
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- PART 4: Student Profile Updates & Schema Validation ---');

    // 1. Profile update with empty optional strings (simulating form submission)
    const formPayloadWithEmptyStrings = {
      body: {
        firstName: 'UpdatedFirst',
        middleName: '',
        lastName: 'UpdatedLast',
        gender: '',
        bloodGroup: '',
        nationality: '',
        community: '',
        religion: '',
        mobile: '9876543210',
        alternateMobile: '',
        parentName: 'Parent Name',
        parentMobile: '9123456780',
        parentOccupation: '',
        guardianName: '',
        guardianMobile: '',
        addressLine1: '123 Main Street',
        addressLine2: '',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        pincode: '600001',
        collegeId: '',
        departmentId: '',
        programId: '',
        batch: '',
        cgpa: '',
        careerObjective: '',
        profileImage:
          'https://res.cloudinary.com/dz9xxxxxx/image/upload/v1711234567/profiles/1711234567890-very-long-cloudinary-url-that-exceeds-standard-character-limits-and-must-be-supported.png',
      },
    };

    const parsedProfile = updateProfileValidator.safeParse(formPayloadWithEmptyStrings);
    assert(
      parsedProfile.success,
      'updateProfileValidator accepts form payload with empty optional strings and long Cloudinary URLs',
      parsedProfile.error?.format()
    );

    // 2. Profile update service execution
    const updatedProfile = await profileService.updateProfile(
      studentUser1.id,
      'student',
      parsedProfile.data?.body as any,
      AuditActorRole.student
    );

    assert(
      updatedProfile.firstName === 'UpdatedFirst' &&
        updatedProfile.lastName === 'UpdatedLast' &&
        updatedProfile.mobile === '9876543210',
      'profileService.updateProfile successfully persists student profile changes',
      { firstName: updatedProfile.firstName, mobile: updatedProfile.mobile }
    );

    // 3. Profile update with invalid mobile format
    const invalidMobilePayload = updateProfileValidator.safeParse({
      body: {
        firstName: 'ValidName',
        lastName: 'ValidLast',
        mobile: '123', // Too short (not 10-15 digits)
      },
    });
    assert(
      !invalidMobilePayload.success,
      'updateProfileValidator rejects invalid mobile number format'
    );

    // 4. Clean up test fixtures
    console.log('\nCleaning up test fixtures...');
    await prisma.volunteerSubmission.deleteMany({
      where: { id: { in: [subA.id, subB.id] } },
    });
    await prisma.notification.deleteMany({
      where: { recipientId: studentUser1.id },
    });
    await prisma.student.deleteMany({
      where: { id: { in: [student1.id, student2.id, student3.id] } },
    });
    await prisma.program.deleteMany({ where: { id: progA.id } });
    await prisma.department.deleteMany({ where: { id: deptA.id } });
    await prisma.college.deleteMany({ where: { id: collegeA.id } });
    await prisma.zone.deleteMany({ where: { id: { in: [zoneA.id, zoneB.id] } } });
    await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: [studentUser1.id, studentUser2.id, studentUser3.id, inchargeAUser.id, inchargeBUser.id] } },
    });
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: [studentUser1.id, studentUser2.id, studentUser3.id, inchargeAUser.id, inchargeBUser.id] } },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            inchargeAUser.id,
            inchargeBUser.id,
            studentUser1.id,
            studentUser2.id,
            studentUser3.id,
          ],
        },
      },
    });
    await prisma.organization.deleteMany({ where: { id: org.id } });
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    totalTests++;
  }

  console.log('\n=============================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('=============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
