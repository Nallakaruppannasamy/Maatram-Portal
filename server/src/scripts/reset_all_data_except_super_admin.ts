/**
 * @file src/scripts/reset_all_data_except_super_admin.ts
 * @description Full database reset script that purges all student, zone incharge,
 * zone, college, academic hierarchy, volunteering, and operational data while
 * strictly protecting and preserving the Super Admin account (admin@maatram.com).
 *
 * Usage:
 *   Dry Run (default):
 *     npx tsx src/scripts/reset_all_data_except_super_admin.ts --dry-run
 *
 *   Execute:
 *     npx tsx src/scripts/reset_all_data_except_super_admin.ts --execute --force
 */

import { prisma } from '../config/database';
import readline from 'readline';

const SUPER_ADMIN_EMAIL = 'admin@maatram.com';

interface ResetPlan {
  protectedAdmin: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    fullName?: string;
  };
  counts: {
    usersToDelete: number;
    studentsToDelete: number;
    zoneInchargesToDelete: number;
    zonesToDelete: number;
    collegesToDelete: number;
    departmentsToDelete: number;
    programsToDelete: number;
    organizationsToDelete: number;
    volunteerSubmissionsToDelete: number;
    volunteerAssignmentsToDelete: number;
    volunteersToDelete: number;
    skillsToDelete: number;
    projectsToDelete: number;
    certificationsToDelete: number;
    resumesToDelete: number;
    placementsToDelete: number;
    semesterGradesToDelete: number;
    mentoringSessionsToDelete: number;
    eventVolunteersToDelete: number;
    activityLogsToDelete: number;
    resumeReviewsToDelete: number;
    mockInterviewsToDelete: number;
    notificationsToDelete: number;
    auditLogsToDelete: number;
    refreshTokensToDelete: number;
    passwordResetTokensToDelete: number;
    enrollmentImportsToDelete: number;
    userProfilesToDelete: number;
  };
  deletedUserIds: string[];
}

async function prepareResetPlan(): Promise<ResetPlan> {
  // 1. Verify Super Admin exists, is unique, has role 'admin', and isActive = true
  const superAdmins = await prisma.user.findMany({
    where: { email: { equals: SUPER_ADMIN_EMAIL, mode: 'insensitive' } },
    include: { userProfile: true },
  });

  if (superAdmins.length === 0) {
    throw new Error(`CRITICAL ABORT: Super Admin (${SUPER_ADMIN_EMAIL}) not found in database!`);
  }
  if (superAdmins.length > 1) {
    throw new Error(`CRITICAL ABORT: Multiple Super Admin accounts found with email ${SUPER_ADMIN_EMAIL}!`);
  }

  const superAdmin = superAdmins[0];

  if (superAdmin.role !== 'admin') {
    throw new Error(`CRITICAL ABORT: ${SUPER_ADMIN_EMAIL} has role '${superAdmin.role}' instead of 'admin'!`);
  }
  if (!superAdmin.isActive) {
    throw new Error(`CRITICAL ABORT: ${SUPER_ADMIN_EMAIL} is inactive!`);
  }

  const protectedUserId = superAdmin.id;

  // 2. Identify all users to delete (all users except protected Super Admin)
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });

  const deletedUserIds = allUsers
    .filter((u) => u.id !== protectedUserId)
    .map((u) => u.id);

  // Safety Assertion
  if (deletedUserIds.includes(protectedUserId)) {
    throw new Error('CRITICAL SAFETY VIOLATION: deletedUserIds contains protected Super Admin ID! ABORTING.');
  }

  // Count entities
  const [
    studentsCount,
    zoneInchargesCount,
    zonesCount,
    collegesCount,
    departmentsCount,
    programsCount,
    organizationsCount,
    volunteerSubmissionsCount,
    volunteerAssignmentsCount,
    volunteersCount,
    skillsCount,
    projectsCount,
    certificationsCount,
    resumesCount,
    placementsCount,
    semesterGradesCount,
    mentoringCount,
    eventVolunteersCount,
    activityLogsCount,
    resumeReviewsCount,
    mockInterviewsCount,
    notificationsCount,
    auditLogsCount,
    refreshTokensCount,
    passwordResetTokensCount,
    enrollmentImportsCount,
    userProfilesCount,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.user.count({ where: { role: 'zone', id: { not: protectedUserId } } }),
    prisma.zone.count(),
    prisma.college.count(),
    prisma.department.count(),
    prisma.program.count(),
    prisma.organization.count(),
    prisma.volunteerSubmission.count(),
    prisma.volunteerAssignment.count(),
    prisma.volunteer.count(),
    prisma.skill.count(),
    prisma.project.count(),
    prisma.certification.count(),
    prisma.resume.count(),
    prisma.placement.count(),
    prisma.semesterGrade.count(),
    prisma.studentMentoring.count(),
    prisma.eventVolunteer.count(),
    prisma.activityLog.count(),
    prisma.resumeReview.count(),
    prisma.mockInterview.count(),
    prisma.notification.count({ where: { recipientId: { not: protectedUserId } } }),
    prisma.auditLog.count({ where: { actorId: { not: protectedUserId } } }),
    prisma.refreshToken.count({ where: { userId: { not: protectedUserId } } }),
    prisma.passwordResetToken.count({ where: { userId: { not: protectedUserId } } }),
    prisma.enrollmentImport.count({ where: { importedById: { not: protectedUserId } } }),
    prisma.userProfile.count({ where: { userId: { not: protectedUserId } } }),
  ]);

  return {
    protectedAdmin: {
      id: protectedUserId,
      email: superAdmin.email!,
      role: superAdmin.role,
      isActive: superAdmin.isActive,
      fullName: superAdmin.userProfile?.fullName,
    },
    counts: {
      usersToDelete: deletedUserIds.length,
      studentsToDelete: studentsCount,
      zoneInchargesToDelete: zoneInchargesCount,
      zonesToDelete: zonesCount,
      collegesToDelete: collegesCount,
      departmentsToDelete: departmentsCount,
      programsToDelete: programsCount,
      organizationsToDelete: organizationsCount,
      volunteerSubmissionsToDelete: volunteerSubmissionsCount,
      volunteerAssignmentsToDelete: volunteerAssignmentsCount,
      volunteersToDelete: volunteersCount,
      skillsToDelete: skillsCount,
      projectsToDelete: projectsCount,
      certificationsToDelete: certificationsCount,
      resumesToDelete: resumesCount,
      placementsToDelete: placementsCount,
      semesterGradesToDelete: semesterGradesCount,
      mentoringSessionsToDelete: mentoringCount,
      eventVolunteersToDelete: eventVolunteersCount,
      activityLogsToDelete: activityLogsCount,
      resumeReviewsToDelete: resumeReviewsCount,
      mockInterviewsToDelete: mockInterviewsCount,
      notificationsToDelete: notificationsCount,
      auditLogsToDelete: auditLogsCount,
      refreshTokensToDelete: refreshTokensCount,
      passwordResetTokensToDelete: passwordResetTokensCount,
      enrollmentImportsToDelete: enrollmentImportsCount,
      userProfilesToDelete: userProfilesCount,
    },
    deletedUserIds,
  };
}

function displayPlan(plan: ResetPlan) {
  console.log('==================================================');
  console.log('🛡️ PROTECTED SUPER ADMIN (WILL BE PRESERVED 100%)');
  console.log('==================================================');
  console.log(`  ID        : ${plan.protectedAdmin.id}`);
  console.log(`  Email     : ${plan.protectedAdmin.email}`);
  console.log(`  Role      : ${plan.protectedAdmin.role}`);
  console.log(`  Status    : ${plan.protectedAdmin.isActive ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`  Full Name : ${plan.protectedAdmin.fullName || 'N/A'}`);
  console.log('==================================================');

  console.log('\n==================================================');
  console.log('🗑️ RECORDS SCHEDULED FOR PURGE');
  console.log('==================================================');
  console.log(`  - Users to delete             : ${plan.counts.usersToDelete}`);
  console.log(`  - Students to delete          : ${plan.counts.studentsToDelete}`);
  console.log(`  - Zone Incharges to delete    : ${plan.counts.zoneInchargesToDelete}`);
  console.log(`  - Zones to delete             : ${plan.counts.zonesToDelete}`);
  console.log(`  - Colleges to delete          : ${plan.counts.collegesToDelete}`);
  console.log(`  - Departments to delete       : ${plan.counts.departmentsToDelete}`);
  console.log(`  - Programs to delete          : ${plan.counts.programsToDelete}`);
  console.log(`  - Organizations to delete     : ${plan.counts.organizationsToDelete}`);
  console.log(`  - Volunteer Submissions       : ${plan.counts.volunteerSubmissionsToDelete}`);
  console.log(`  - Volunteer Assignments       : ${plan.counts.volunteerAssignmentsToDelete}`);
  console.log(`  - Volunteer Profiles          : ${plan.counts.volunteersToDelete}`);
  console.log(`  - Student Skills              : ${plan.counts.skillsToDelete}`);
  console.log(`  - Student Projects            : ${plan.counts.projectsToDelete}`);
  console.log(`  - Student Certifications      : ${plan.counts.certificationsToDelete}`);
  console.log(`  - Student Resumes             : ${plan.counts.resumesToDelete}`);
  console.log(`  - Student Placements          : ${plan.counts.placementsToDelete}`);
  console.log(`  - Semester Grades             : ${plan.counts.semesterGradesToDelete}`);
  console.log(`  - Mentoring / Interviews / Logs: ${plan.counts.mentoringSessionsToDelete + plan.counts.eventVolunteersToDelete + plan.counts.activityLogsToDelete + plan.counts.resumeReviewsToDelete + plan.counts.mockInterviewsToDelete}`);
  console.log(`  - Non-Admin Notifications     : ${plan.counts.notificationsToDelete}`);
  console.log(`  - Non-Admin Audit Logs        : ${plan.counts.auditLogsToDelete}`);
  console.log(`  - Non-Admin Refresh Tokens    : ${plan.counts.refreshTokensToDelete}`);
  console.log(`  - Non-Admin Reset Tokens      : ${plan.counts.passwordResetTokensToDelete}`);
  console.log(`  - Enrollment Imports          : ${plan.counts.enrollmentImportsToDelete}`);
  console.log(`  - Non-Admin User Profiles     : ${plan.counts.userProfilesToDelete}`);
  console.log('==================================================\n');
}

async function executeReset(plan: ResetPlan) {
  const protectedUserId = plan.protectedAdmin.id;
  const deletedUserIds = plan.deletedUserIds;

  console.log('🚀 Executing database reset in foreign-key safe order within transaction...');

  await prisma.$transaction(
    async (tx) => {
      // 1. Sanity assertion
      if (deletedUserIds.includes(protectedUserId)) {
        throw new Error('TRANSACTION ABORT: protectedUserId detected in deletion set!');
      }

      // 2. Clear student future & dependent records
      await tx.mockInterview.deleteMany();
      await tx.resumeReview.deleteMany();
      await tx.studentMentoring.deleteMany();
      await tx.eventVolunteer.deleteMany();
      await tx.activityLog.deleteMany();
      await tx.volunteerSkill.deleteMany();
      await tx.volunteerAssignment.deleteMany();
      await tx.placement.deleteMany();
      await tx.resume.deleteMany();
      await tx.certification.deleteMany();
      await tx.project.deleteMany();
      await tx.skill.deleteMany();
      await tx.semesterGrade.deleteMany();
      await tx.volunteerSubmission.deleteMany();
      await tx.volunteer.deleteMany();

      // 3. Clear non-admin tokens, imports, notifications, and non-admin audit logs
      if (deletedUserIds.length > 0) {
        await tx.passwordResetToken.deleteMany({ where: { userId: { in: deletedUserIds } } });
        await tx.refreshToken.deleteMany({ where: { userId: { in: deletedUserIds } } });
        await tx.notification.deleteMany({ where: { recipientId: { in: deletedUserIds } } });
        await tx.enrollmentImport.deleteMany({ where: { importedById: { in: deletedUserIds } } });
        await tx.auditLog.deleteMany({
          where: {
            OR: [
              { actorId: { in: deletedUserIds } },
              { targetEntityType: { in: ['student', 'zone', 'college', 'department', 'program', 'organization'] } },
            ],
          },
        });
      }

      // 4. Delete all students
      await tx.student.deleteMany();

      // 5. Delete academic hierarchy: Programs -> Departments -> Colleges
      await tx.program.deleteMany();
      await tx.department.deleteMany();

      // 6. Break zone <-> user circular references
      await tx.zone.updateMany({ data: { inchargeId: null } });
      await tx.user.updateMany({
        where: { id: protectedUserId },
        data: { zoneId: null, organizationId: null },
      });

      // Delete colleges & zones
      await tx.college.deleteMany();
      await tx.zone.deleteMany();

      // Delete organizations
      await tx.organization.deleteMany();

      // 7. Delete non-admin UserProfiles & Users
      if (deletedUserIds.length > 0) {
        await tx.userProfile.deleteMany({ where: { userId: { in: deletedUserIds } } });
        await tx.user.deleteMany({ where: { id: { in: deletedUserIds } } });
      }

      // 8. Final verification inside transaction
      const remainingUsers = await tx.user.findMany({ select: { id: true, email: true, role: true } });
      if (remainingUsers.length !== 1 || remainingUsers[0].id !== protectedUserId) {
        throw new Error(`TRANSACTION ABORT: Final user count is ${remainingUsers.length} instead of 1!`);
      }
    },
    { timeout: 60000 }
  );

  console.log('✅ Database reset transaction committed successfully.');
}

async function verifyPostReset() {
  console.log('\n🔍 Verifying post-reset database state...');

  const [
    users,
    studentsCount,
    zonesCount,
    collegesCount,
    departmentsCount,
    programsCount,
    organizationsCount,
    submissionsCount,
    volunteersCount,
  ] = await Promise.all([
    prisma.user.findMany({ include: { userProfile: true } }),
    prisma.student.count(),
    prisma.zone.count(),
    prisma.college.count(),
    prisma.department.count(),
    prisma.program.count(),
    prisma.organization.count(),
    prisma.volunteerSubmission.count(),
    prisma.volunteer.count(),
  ]);

  console.log('==================================================');
  console.log('📊 POST-RESET DATABASE INVENTORY');
  console.log('==================================================');
  console.log(`  Users Total          : ${users.length} (Expected: 1)`);
  if (users.length === 1) {
    const admin = users[0];
    console.log(`    - ID               : ${admin.id}`);
    console.log(`    - Email            : ${admin.email}`);
    console.log(`    - Role             : ${admin.role}`);
    console.log(`    - Active           : ${admin.isActive}`);
    console.log(`    - First Login      : ${admin.isFirstLogin}`);
    console.log(`    - Full Name        : ${admin.userProfile?.fullName}`);
  }
  console.log(`  Students Total       : ${studentsCount} (Expected: 0)`);
  console.log(`  Zones Total          : ${zonesCount} (Expected: 0)`);
  console.log(`  Colleges Total       : ${collegesCount} (Expected: 0)`);
  console.log(`  Departments Total    : ${departmentsCount} (Expected: 0)`);
  console.log(`  Programs Total       : ${programsCount} (Expected: 0)`);
  console.log(`  Organizations Total  : ${organizationsCount} (Expected: 0)`);
  console.log(`  Volunteer Submissions: ${submissionsCount} (Expected: 0)`);
  console.log(`  Volunteer Profiles   : ${volunteersCount} (Expected: 0)`);
  console.log('==================================================');

  if (
    users.length !== 1 ||
    users[0].email !== SUPER_ADMIN_EMAIL ||
    studentsCount !== 0 ||
    zonesCount !== 0 ||
    collegesCount !== 0 ||
    departmentsCount !== 0 ||
    programsCount !== 0 ||
    organizationsCount !== 0 ||
    submissionsCount !== 0 ||
    volunteersCount !== 0
  ) {
    throw new Error('Post-reset verification FAILED! State does not match required final state.');
  }

  console.log('✨ ALL POST-RESET VERIFICATIONS PASSED 100% SUCCESSFUL!');
}

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const isForce = args.includes('--force');

  try {
    const plan = await prepareResetPlan();
    displayPlan(plan);

    if (!isExecute) {
      console.log('ℹ️ Dry-run completed with zero database mutations.');
      console.log('To execute the reset, pass --execute --force');
      process.exit(0);
    }

    if (!isForce) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>((resolve) => {
        rl.question('⚠️ DANGER: Full database reset. Type YES to confirm: ', (ans) => {
          rl.close();
          resolve(ans.trim());
        });
      });

      if (answer !== 'YES') {
        console.log('❌ Reset aborted by user.');
        process.exit(0);
      }
    }

    await executeReset(plan);
    await verifyPostReset();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Reset Script Error:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
