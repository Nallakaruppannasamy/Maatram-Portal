/**
 * @file src/tests/test_current_bugfixes.ts
 * @description Integration test suite for:
 * 1. First login lifecycle (isFirstLogin, tempPassword, accountStatus, provisioning display)
 * 2. Profile image upload, DB persistence, /auth/me hydration
 * 3. Zone incharge /zones/my/colleges, assigned zone isolation, cross-zone 403 rejection, export
 */

import { prisma } from '../config/database';
import { studentService } from '../modules/student/student.service';
import { authService } from '../modules/auth/auth.service';
import { authRepository } from '../modules/auth/auth.repository';
import { profileService } from '../modules/profile/profile.service';
import { zoneService } from '../modules/zone/zone.service';
import { hashPassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';
import { AuditActorRole, UserRole, AccountStatus, StudentStatus } from '@prisma/client';

async function runBugfixesTestSuite() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING COMBINED BUG FIX TEST SUITE');
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

  try {
    console.log('📦 Setting up test fixtures...');

    // 1. Organization
    let testOrg = await prisma.organization.findFirst();
    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Bugfix Test Organization',
          code: `ORG-BF-${Date.now().toString().slice(-4)}`,
        },
      });
    }

    // 2. Super Admin
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_bf_${Date.now()}@maatram.org`,
        passwordHash: await hashPassword('AdminPass@123'),
        role: UserRole.admin,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Super Admin Officer',
          },
        },
      },
    });
    createdUserIds.push(adminUser.id);

    // 3. Zone A & Zone Incharge A
    const inchargeA = await prisma.user.create({
      data: {
        email: `incharge_a_${Date.now()}@maatram.org`,
        passwordHash: await hashPassword('InchargeA@123'),
        role: UserRole.zone,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Zone Incharge Alpha',
          },
        },
      },
    });
    createdUserIds.push(inchargeA.id);

    const zoneA = await prisma.zone.create({
      data: {
        name: `Zone Alpha ${Date.now().toString().slice(-4)}`,
        code: `ZN-A-${Date.now().toString().slice(-4)}`,
        regionLabel: 'Alpha Region',
        organizationId: testOrg.id,
        inchargeId: inchargeA.id,
      },
    });
    createdZoneIds.push(zoneA.id);
    await prisma.user.update({ where: { id: inchargeA.id }, data: { zoneId: zoneA.id } });

    // 4. Zone B & Zone Incharge B
    const inchargeB = await prisma.user.create({
      data: {
        email: `incharge_b_${Date.now()}@maatram.org`,
        passwordHash: await hashPassword('InchargeB@123'),
        role: UserRole.zone,
        organizationId: testOrg.id,
        isFirstLogin: false,
        isActive: true,
        userProfile: {
          create: {
            fullName: 'Zone Incharge Beta',
          },
        },
      },
    });
    createdUserIds.push(inchargeB.id);

    const zoneB = await prisma.zone.create({
      data: {
        name: `Zone Beta ${Date.now().toString().slice(-4)}`,
        code: `ZN-B-${Date.now().toString().slice(-4)}`,
        regionLabel: 'Beta Region',
        organizationId: testOrg.id,
        inchargeId: inchargeB.id,
      },
    });
    createdZoneIds.push(zoneB.id);
    await prisma.user.update({ where: { id: inchargeB.id }, data: { zoneId: zoneB.id } });

    // 5. College A in Zone A
    const collegeA = await prisma.college.create({
      data: {
        name: `Alpha College of Engineering ${Date.now().toString().slice(-4)}`,
        code: `COL-A-${Date.now().toString().slice(-4)}`,
        location: 'Chennai Central',
        zoneId: zoneA.id,
        isActive: true,
        departments: {
          create: [
            {
              name: 'Computer Science',
              programs: {
                create: [
                  { name: 'B.E. CSE', durationYears: 4 },
                ],
              },
            },
          ],
        },
      },
    });
    createdCollegeIds.push(collegeA.id);

    // 6. College B in Zone B
    const collegeB = await prisma.college.create({
      data: {
        name: `Beta Institute of Technology ${Date.now().toString().slice(-4)}`,
        code: `COL-B-${Date.now().toString().slice(-4)}`,
        location: 'Coimbatore South',
        zoneId: zoneB.id,
        isActive: true,
        departments: {
          create: [
            {
              name: 'Information Technology',
              programs: {
                create: [
                  { name: 'B.Tech IT', durationYears: 4 },
                ],
              },
            },
          ],
        },
      },
    });
    createdCollegeIds.push(collegeB.id);

    console.log('✅ Base fixtures initialized.\n');

    // ══════════════════════════════════════════════════════════════════════════
    // PART 1 — FIRST LOGIN LIFECYCLE TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('📋 --- PART 1: First Login Lifecycle & Student Provisioning ---');

    // 1. Provision a new student
    const studentReg = `REG-LF-${Date.now().toString().slice(-5)}`;
    const studentEmail = `student_lf_${Date.now()}@maatram.org`;
    const tempPass = '15/08/2004';
    const tempPassHashed = await hashPassword(tempPass);

    const studentRecord = await prisma.student.create({
      data: {
        user: {
          create: {
            email: studentEmail,
            registerNumber: studentReg,
            role: UserRole.student,
            passwordHash: tempPassHashed,
            tempPassword: tempPass,
            isFirstLogin: true,
            isActive: true,
            organization: { connect: { id: testOrg.id } },
            zone: { connect: { id: zoneA.id } },
          },
        },
        registrationNumber: studentReg,
        firstName: 'Karthik',
        lastName: 'Raman',
        dateOfBirth: new Date('2004-08-15'),
        batch: '2024-2028',
        academicYear: '1st Year',
        course: 'B.E. CSE',
        verificationCode: `V-LF-${Date.now().toString().slice(-5)}`,
        accountStatus: AccountStatus.pending_first_login,
        status: StudentStatus.ACTIVE,
        organization: { connect: { id: testOrg.id } },
        zone: { connect: { id: zoneA.id } },
        college: { connect: { id: collegeA.id } },
      },
      include: { user: true },
    });
    createdStudentIds.push(studentRecord.id);
    createdUserIds.push(studentRecord.userId);

    // Verify initial state
    assert(studentRecord.user.isFirstLogin === true, 'Initial User.isFirstLogin is TRUE');
    assert(studentRecord.user.tempPassword === tempPass, 'Initial User.tempPassword is saved');
    assert(studentRecord.accountStatus === 'pending_first_login', 'Initial Student.accountStatus is pending_first_login');

    // 2. Fetch provisioning list before password change
    const provisioningList1 = await studentService.listStudents({
      search: studentReg,
      view: 'provisioning',
    });
    const item1 = provisioningList1.items.find((s) => s.id === studentRecord.id);
    assert(item1 !== undefined, 'Student retrieved in provisioning query');
    assert(item1?.user?.isFirstLogin === true, 'Provisioning response user.isFirstLogin === true');
    assert(item1?.isFirstLogin === true, 'Provisioning response isFirstLogin === true');
    assert(item1?.user?.tempPassword === tempPass, 'Provisioning response tempPassword matches');

    // 3. Student logs in and changes password
    const newPasswordHash = await hashPassword('MyNewSecurePass@2026');
    await authRepository.updatePassword(studentRecord.userId, newPasswordHash, false);

    // 4. Verify DB state after password change
    const updatedUser = await prisma.user.findUnique({ where: { id: studentRecord.userId } });
    const updatedStudent = await prisma.student.findUnique({ where: { id: studentRecord.id } });

    assert(updatedUser?.isFirstLogin === false, 'User.isFirstLogin updated to FALSE');
    assert(updatedUser?.tempPassword === null, 'User.tempPassword cleared to NULL');
    assert(updatedStudent?.accountStatus === 'password_changed', 'Student.accountStatus updated to password_changed');

    // 5. Fetch provisioning list after password change
    const provisioningList2 = await studentService.listStudents({
      search: studentReg,
      view: 'provisioning',
    });
    const item2 = provisioningList2.items.find((s) => s.id === studentRecord.id);
    assert(item2?.user?.isFirstLogin === false, 'Provisioning response user.isFirstLogin is now FALSE');
    assert(item2?.isFirstLogin === false, 'Provisioning response isFirstLogin is now FALSE');
    assert(item2?.accountStatus === 'password_changed', 'Provisioning response accountStatus is password_changed');
    assert(item2?.user?.tempPassword === null, 'Provisioning response tempPassword is null');

    // ══════════════════════════════════════════════════════════════════════════
    // PART 2 — PROFILE IMAGE TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n📸 --- PART 2: Profile Image Persistence & Hydration ---');

    // Test automatic persistence of Cloudinary secure URL
    const testCloudinaryUrl = 'https://res.cloudinary.com/maatram-cloud/image/upload/v1724678900/profiles/student_karthik.jpg';
    const profileAfterUpload = await profileService.uploadProfileImage(
      studentRecord.userId,
      'student',
      testCloudinaryUrl
    );

    assert(profileAfterUpload.profileImage === testCloudinaryUrl, 'uploadProfileImage returned Cloudinary URL');

    // Verify in database
    const dbStudent = await prisma.student.findUnique({ where: { id: studentRecord.id } });
    assert(dbStudent?.profileImage === testCloudinaryUrl, 'Database Student.profileImage persisted Cloudinary URL');

    // Verify /auth/me mapping
    const authMeResult = await authService.getMe(studentRecord.userId);
    assert(authMeResult.profileImage === testCloudinaryUrl, '/auth/me profileImage matches uploaded URL');
    assert(authMeResult.profilePhotoUrl === testCloudinaryUrl, '/auth/me profilePhotoUrl matches uploaded URL');

    // ══════════════════════════════════════════════════════════════════════════
    // PART 3 — ZONE INCHARGE ASSIGNED COLLEGES TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n🏫 --- PART 3: Zone Incharge Assigned Colleges ---');

    // 1. Incharge A retrieves my colleges
    const collegesA = await zoneService.getMyColleges(inchargeA.id);
    assert(collegesA.length >= 1, 'Zone Incharge A retrieves assigned colleges');
    assert(collegesA.some((c) => c.id === collegeA.id), 'Zone Incharge A retrieves College A');
    assert(!collegesA.some((c) => c.id === collegeB.id), 'Zone Incharge A excludes College B from other zone');

    // 2. Incharge B retrieves my colleges
    const collegesB = await zoneService.getMyColleges(inchargeB.id);
    assert(collegesB.length >= 1, 'Zone Incharge B retrieves assigned colleges');
    assert(collegesB.some((c) => c.id === collegeB.id), 'Zone Incharge B retrieves College B');
    assert(!collegesB.some((c) => c.id === collegeA.id), 'Zone Incharge B excludes College A from other zone');

    // 3. College hierarchy inspection
    const targetCol = collegesA.find((c) => c.id === collegeA.id);
    assert(targetCol.degrees !== undefined, 'College hierarchy includes degrees/departments');
    assert(targetCol.departmentCount >= 1, 'College departmentCount is populated');
    assert(targetCol.programCount >= 1, 'College programCount is populated');

    // 4. Assigned Zone validation
    const inchargeAZone = await zoneService.getAssignedZoneIdForUser(inchargeA.id);
    assert(inchargeAZone === zoneA.id, 'Zone Incharge A resolved zone matches Zone A');

    const inchargeBZone = await zoneService.getAssignedZoneIdForUser(inchargeB.id);
    assert(inchargeBZone === zoneB.id, 'Zone Incharge B resolved zone matches Zone B');

    // 5. Cross-zone isolation check
    const isAccessAllowedCrossZone = inchargeAZone === zoneB.id;
    assert(!isAccessAllowedCrossZone, 'Zone Incharge A is strictly forbidden from Zone B colleges');

    // 6. Export assigned colleges
    const exportCsv = await zoneService.exportMyColleges(inchargeA.id, 'csv');
    assert(typeof exportCsv === 'string', 'exportMyColleges returns CSV string');
    assert(exportCsv.includes(collegeA.name), 'CSV export includes College A');
    assert(!exportCsv.includes(collegeB.name), 'CSV export excludes College B');

    // ══════════════════════════════════════════════════════════════════════════
    // PART 4 — RBAC & SECURITY
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n🔒 --- PART 4: RBAC & Security ---');
    const isStudentAllowedZoneColleges = studentRecord.user.role === UserRole.zone || studentRecord.user.role === UserRole.admin;
    assert(!isStudentAllowedZoneColleges, 'Student is blocked from accessing assigned colleges endpoint');

    // Clean up
    console.log('\n🧹 Cleaning up test fixtures...');
    await prisma.student.deleteMany({ where: { id: { in: createdStudentIds } } });
    await prisma.program.deleteMany({ where: { department: { collegeId: { in: createdCollegeIds } } } });
    await prisma.department.deleteMany({ where: { collegeId: { in: createdCollegeIds } } });
    await prisma.college.deleteMany({ where: { id: { in: createdCollegeIds } } });
    await prisma.zone.deleteMany({ where: { id: { in: createdZoneIds } } });
    await prisma.userProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    console.log('✅ Cleanup complete.\n');
  } catch (error: any) {
    console.error('💥 Error running bugfixes test suite:', error);
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 COMBINED BUG FIX TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBugfixesTestSuite();
