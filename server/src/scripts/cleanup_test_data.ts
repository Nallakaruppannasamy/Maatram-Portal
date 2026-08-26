/**
 * @file src/scripts/cleanup_test_data.ts
 * @description Safe, controlled script to clean up synthetic test data while strictly preserving real owner data.
 *
 * Usage:
 *   npx tsx src/scripts/cleanup_test_data.ts --dry-run   (Default - inspection only)
 *   npx tsx src/scripts/cleanup_test_data.ts --execute   (Executes deletion inside a transaction)
 */

import { prisma } from '../config/database';

// ─── PROTECTED REAL DATA IDENTIFIERS ──────────────────────────────────────────
const PROTECTED_STAFF_EMAILS = [
  'admin@maatram.com',
  'rnksamy007@gmail.com',
  'sec24it045@sairamtap.edu.in',
].map((e) => e.toLowerCase());

const PROTECTED_STUDENT_REG_NUMBERS = [
  '44130738', // Siva sakthi
  '44130720', // umayhani
  '44130748', // Vaishnavi V
  '44130742', // Shivani sree
  '44130725', // Saai Varshan
  '44130733', // saamy
];

const PROTECTED_ZONE_CODES = ['ZONE-1', 'ZONE-2', 'ZONE-3', 'ZONE-4'];

const PROTECTED_COLLEGE_CODES = [
  'AMS-NTH',
  'CEG-CHE',
  'MGR-NTH',
  'HITS-OMR',
  'JCE-NTH',
  'MIT-CHE',
  'PEC-WST',
  'REC-OMR',
  'SIST-CHE',
  'SVEC-CHE',
  'SVCE-WST',
  'SRM-OMR',
  'SSN-OMR',
  'SJCE-WST',
  'VTRS-NTH',
  'VEC-WST',
];

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const mode = isExecute ? 'EXECUTE (DESTRUCTIVE WITH TRANSACTION)' : 'DRY-RUN (READ-ONLY)';

  console.log(`=======================================================`);
  console.log(`🧹 MAATRAM PORTAL — TEST DATA CLEANUP TOOL`);
  console.log(`Mode: ${mode}`);
  console.log(`=======================================================\n`);

  // 1. Identify Synthetic Users
  const allUsers = await prisma.user.findMany({
    include: { student: true, userProfile: true },
  });

  const syntheticUsers = allUsers.filter((u) => {
    const email = (u.email || '').toLowerCase();
    const regNo = u.student?.registrationNumber || u.registerNumber || '';

    // Check if protected
    if (PROTECTED_STAFF_EMAILS.includes(email)) return false;
    if (PROTECTED_STUDENT_REG_NUMBERS.includes(regNo)) return false;

    // Check if synthetic pattern
    const isSyntheticEmail =
      email.includes('@maatram.test') ||
      email.startsWith('test_') ||
      email.includes('_arch_') ||
      email.includes('_bf_') ||
      /student[0-9]*_178776/i.test(email) ||
      /incharge_[ab]_178776/i.test(email) ||
      /incharge\.[ab]/i.test(email) ||
      /superadmin\.test/i.test(email) ||
      /student\.[ab]/i.test(email);

    const isSyntheticReg =
      regNo.startsWith('REG-ARCH') ||
      regNo.startsWith('REG-A') ||
      regNo.startsWith('REG-B') ||
      regNo.startsWith('REG1_') ||
      regNo.startsWith('REG2_') ||
      regNo.startsWith('REG3_') ||
      regNo === 'REG-87715';

    return isSyntheticEmail || isSyntheticReg;
  });

  const syntheticUserIds = syntheticUsers.map((u) => u.id);

  // 2. Identify Synthetic Students
  const allStudents = await prisma.student.findMany();
  const syntheticStudents = allStudents.filter((s) => {
    if (PROTECTED_STUDENT_REG_NUMBERS.includes(s.registrationNumber)) return false;
    const isSyntheticReg =
      s.registrationNumber.startsWith('REG-ARCH') ||
      s.registrationNumber.startsWith('REG-A') ||
      s.registrationNumber.startsWith('REG-B') ||
      s.registrationNumber.startsWith('REG1_') ||
      s.registrationNumber.startsWith('REG2_') ||
      s.registrationNumber.startsWith('REG3_') ||
      s.registrationNumber === 'REG-87715';
    return isSyntheticReg || syntheticUserIds.includes(s.userId);
  });
  const syntheticStudentIds = syntheticStudents.map((s) => s.id);

  // 3. Identify Synthetic Colleges
  const allColleges = await prisma.college.findMany({
    include: { departments: { include: { programs: true } } },
  });
  const syntheticColleges = allColleges.filter((c) => {
    if (PROTECTED_COLLEGE_CODES.includes(c.code)) return false;
    const isSyntheticCode =
      c.code.startsWith('COL-A') ||
      c.code.startsWith('COL-B') ||
      c.code.startsWith('CLG-A') ||
      c.code.startsWith('CA1_') ||
      c.code.startsWith('CA2_') ||
      c.code.startsWith('CB1_') ||
      c.code.startsWith('ECA_');
    const isSyntheticName =
      c.name.includes('Archive Test College') ||
      c.name.includes('Alpha College of Engineering') ||
      c.name.includes('Beta Institute of Technology') ||
      c.name.includes('College Alpha') ||
      c.name.includes('College Beta') ||
      c.name.includes('Engineering College A');
    return isSyntheticCode || isSyntheticName;
  });
  const syntheticCollegeIds = syntheticColleges.map((c) => c.id);

  // 4. Identify Synthetic Zones
  const allZones = await prisma.zone.findMany();
  const syntheticZones = allZones.filter((z) => {
    if (PROTECTED_ZONE_CODES.includes(z.code)) return false;
    const isSyntheticCode =
      z.code.startsWith('ZN-A') ||
      z.code.startsWith('ZN-B') ||
      z.code.startsWith('ZA_') ||
      z.code.startsWith('ZB_');
    const isSyntheticName =
      z.name.includes('Zone Alpha') ||
      z.name.includes('Zone Beta');
    return isSyntheticCode || isSyntheticName;
  });
  const syntheticZoneIds = syntheticZones.map((z) => z.id);

  // 5. Dependent Synthetic Records
  const syntheticSubmissions = await prisma.volunteerSubmission.findMany({
    where: {
      OR: [
        { studentId: { in: syntheticStudentIds } },
        { title: { contains: 'VLOG_178776' } },
      ],
    },
  });

  const syntheticResetTokens = await prisma.passwordResetToken.findMany({
    where: { userId: { in: syntheticUserIds } },
  });

  const syntheticRefreshTokens = await prisma.refreshToken.findMany({
    where: { userId: { in: syntheticUserIds } },
  });

  const syntheticAuditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { actorId: { in: syntheticUserIds } },
        { targetEntityId: { in: [...syntheticUserIds, ...syntheticStudentIds, ...syntheticCollegeIds, ...syntheticZoneIds] } },
      ],
    },
  });

  // ─── OUTPUT SUMMARY ───────────────────────────────────────────────────────
  console.log(`📋 [IDENTIFIED TEST RECORDS FOR CLEANUP]:`);
  console.log(`  - Users:                ${syntheticUsers.length}`);
  console.log(`  - Students:             ${syntheticStudents.length}`);
  console.log(`  - Colleges:             ${syntheticColleges.length}`);
  console.log(`  - Zones:                ${syntheticZones.length}`);
  console.log(`  - Volunteer Submissions:${syntheticSubmissions.length}`);
  console.log(`  - Password Reset Tokens:${syntheticResetTokens.length}`);
  console.log(`  - Refresh Tokens:       ${syntheticRefreshTokens.length}`);
  console.log(`  - Synthetic Audit Logs: ${syntheticAuditLogs.length}`);

  console.log(`\n🛡️ [PROTECTED REAL RECORDS — PRESERVED 100%]:`);
  console.log(`  - Real Staff:           ${PROTECTED_STAFF_EMAILS.length} accounts (${PROTECTED_STAFF_EMAILS.join(', ')})`);
  console.log(`  - Real Students:        ${PROTECTED_STUDENT_REG_NUMBERS.length} scholars (${PROTECTED_STUDENT_REG_NUMBERS.join(', ')})`);
  console.log(`  - Real Zones:           ${PROTECTED_ZONE_CODES.length} zones (${PROTECTED_ZONE_CODES.join(', ')})`);
  console.log(`  - Real Colleges:        ${PROTECTED_COLLEGE_CODES.length} colleges`);

  // ─── EXECUTION SAFETY GUARDS ──────────────────────────────────────────────
  for (const u of syntheticUsers) {
    if (PROTECTED_STAFF_EMAILS.includes((u.email || '').toLowerCase())) {
      throw new Error(`CRITICAL SAFETY ERROR: Protected staff user ${u.email} was flagged as synthetic! Aborting.`);
    }
  }
  for (const s of syntheticStudents) {
    if (PROTECTED_STUDENT_REG_NUMBERS.includes(s.registrationNumber)) {
      throw new Error(`CRITICAL SAFETY ERROR: Protected student ${s.registrationNumber} was flagged as synthetic! Aborting.`);
    }
  }
  for (const z of syntheticZones) {
    if (PROTECTED_ZONE_CODES.includes(z.code)) {
      throw new Error(`CRITICAL SAFETY ERROR: Protected zone ${z.code} was flagged as synthetic! Aborting.`);
    }
  }
  for (const c of syntheticColleges) {
    if (PROTECTED_COLLEGE_CODES.includes(c.code)) {
      throw new Error(`CRITICAL SAFETY ERROR: Protected college ${c.code} was flagged as synthetic! Aborting.`);
    }
  }

  if (!isExecute) {
    console.log(`\n✅ Dry run completed successfully with zero mutations. Pass --execute to perform safe cleanup.`);
    await prisma.$disconnect();
    return;
  }

  // ─── TRANSACTIONAL EXECUTION ──────────────────────────────────────────────
  console.log(`\n🚀 Executing transactional cleanup...`);

  await prisma.$transaction(
    async (tx) => {
      // 1. Delete synthetic volunteer submissions
      if (syntheticSubmissions.length > 0) {
        const deleted = await tx.volunteerSubmission.deleteMany({
          where: { id: { in: syntheticSubmissions.map((s) => s.id) } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic volunteer submissions`);
      }

      // 2. Delete synthetic tokens
      if (syntheticResetTokens.length > 0) {
        const deleted = await tx.passwordResetToken.deleteMany({
          where: { id: { in: syntheticResetTokens.map((t) => t.id) } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic password reset tokens`);
      }
      if (syntheticRefreshTokens.length > 0) {
        const deleted = await tx.refreshToken.deleteMany({
          where: { id: { in: syntheticRefreshTokens.map((t) => t.id) } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic refresh tokens`);
      }

      // 3. Delete synthetic audit logs
      if (syntheticAuditLogs.length > 0) {
        const deleted = await tx.auditLog.deleteMany({
          where: { id: { in: syntheticAuditLogs.map((l) => l.id) } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic audit logs`);
      }

      // 4. Delete synthetic students
      if (syntheticStudents.length > 0) {
        const deleted = await tx.student.deleteMany({
          where: { id: { in: syntheticStudentIds } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic students`);
      }

      // 5. Delete synthetic academic programs & departments
      if (syntheticCollegeIds.length > 0) {
        const depts = await tx.department.findMany({
          where: { collegeId: { in: syntheticCollegeIds } },
          select: { id: true },
        });
        const deptIds = depts.map((d) => d.id);
        if (deptIds.length > 0) {
          await tx.program.deleteMany({ where: { departmentId: { in: deptIds } } });
          await tx.department.deleteMany({ where: { id: { in: deptIds } } });
        }
        const deleted = await tx.college.deleteMany({
          where: { id: { in: syntheticCollegeIds } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic colleges`);
      }

      // 6. Delete synthetic zones
      if (syntheticZoneIds.length > 0) {
        const deleted = await tx.zone.deleteMany({
          where: { id: { in: syntheticZoneIds } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic zones`);
      }

      // 7. Delete synthetic user profiles and users
      if (syntheticUserIds.length > 0) {
        await tx.userProfile.deleteMany({
          where: { userId: { in: syntheticUserIds } },
        });
        const deleted = await tx.user.deleteMany({
          where: { id: { in: syntheticUserIds } },
        });
        console.log(`  ✓ Deleted ${deleted.count} synthetic users & profiles`);
      }
    },
    { timeout: 30000 }
  );

  // ─── POST-CLEANUP INTEGRITY VERIFICATION ──────────────────────────────────
  console.log(`\n🔍 Verifying real data post-cleanup integrity...`);
  const remainingZones = await prisma.zone.count();
  const remainingColleges = await prisma.college.count();
  const remainingStudents = await prisma.student.count();
  const remainingStaff = await prisma.user.count({
    where: { email: { in: PROTECTED_STAFF_EMAILS } },
  });

  console.log(`  - Remaining Zones:    ${remainingZones} (Expected: 4)`);
  console.log(`  - Remaining Colleges: ${remainingColleges} (Expected: 16)`);
  console.log(`  - Remaining Students: ${remainingStudents} (Expected: 6)`);
  console.log(`  - Remaining Staff:    ${remainingStaff} (Expected: 3)`);

  if (remainingZones !== 4 || remainingColleges !== 16 || remainingStudents !== 6 || remainingStaff !== 3) {
    console.error(`⚠️ Warning: Post-cleanup counts differ from baseline expected numbers!`);
  } else {
    console.log(`\n✨ ALL REAL DATA VERIFIED 100% INTACT AND PRESERVED.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`❌ Cleanup failed:`, err);
  process.exit(1);
});
