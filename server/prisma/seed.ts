/**
 * @file prisma/seed.ts
 * @description Seeds the database with initial data matching the frontend's static datasets.
 *
 * Run with: npx prisma db seed
 *
 * This seed file populates:
 *   - Zones (2 zones)
 *   - Colleges (4 colleges under Zone 1)
 *   - Departments + Programs
 *   - Users (1 admin, 1 zone incharge, 2 students)
 *   - Students with profiles, skills, projects, certifications, semester grades
 *   - Volunteer submissions (approved, pending, rejected)
 *   - Notifications and audit logs
 */

import { PrismaClient, UserRole, AccountStatus, VolunteerCategory, VolunteerStatus, NotificationType, AuditActorRole, ImportStatus, Gender, BloodGroup, StudentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL }
  }
});

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean up existing data in reverse order of relations to prevent foreign key errors
  console.log('🧹 Cleaning up database...');
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.enrollmentImport.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.volunteerSubmission.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.semesterGrade.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.zone.updateMany({ data: { inchargeId: null } });
  await prisma.user.updateMany({ data: { zoneId: null } });
  await prisma.user.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.college.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.organization.deleteMany();
  console.log('🧹 Database cleaned.\n');

  // ─── 0. ORGANIZATIONS ──────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { code: 'MTM-ORG' },
    update: {},
    create: {
      name: 'Maatram Foundation',
      code: 'MTM-ORG',
      description: 'Educational and Volunteer NGO helping underprivileged students.',
      isActive: true,
    },
  });
  console.log('  ✅ Organization created');

  // ─── 1. ZONES ──────────────────────────────────────────────────────────────

  const zone1 = await prisma.zone.upsert({
    where: { code: 'ZONE-1' },
    update: {},
    create: {
      name: 'Chennai Zone 1',
      code: 'ZONE-1',
      regionLabel: 'Chennai & Kanchipuram Region',
      isActive: true,
      organizationId: org.id,
    },
  });

  const zone2 = await prisma.zone.upsert({
    where: { code: 'ZONE-2' },
    update: {},
    create: {
      name: 'Coimbatore Zone 2',
      code: 'ZONE-2',
      regionLabel: 'Coimbatore & Tiruppur Region',
      isActive: true,
      organizationId: org.id,
    },
  });

  console.log('  ✅ Zones created');

  // ─── 2. COLLEGES ───────────────────────────────────────────────────────────

  const collegeMIT = await prisma.college.upsert({
    where: { code: 'MIT-CHE' },
    update: {},
    create: {
      name: 'Madras Institute of Technology',
      code: 'MIT-CHE',
      location: 'Chromepet, Chennai',
      zoneId: zone1.id,
      isActive: true,
    },
  });

  const collegeCEG = await prisma.college.upsert({
    where: { code: 'CEG-CHE' },
    update: {},
    create: {
      name: 'College of Engineering Guindy',
      code: 'CEG-CHE',
      location: 'Guindy, Chennai',
      zoneId: zone1.id,
      isActive: true,
    },
  });

  const collegeSSN = await prisma.college.upsert({
    where: { code: 'SSN-CHE' },
    update: {},
    create: {
      name: 'SSN College of Engineering',
      code: 'SSN-CHE',
      location: 'Kalavakkam, Chennai',
      zoneId: zone1.id,
      isActive: true,
    },
  });

  const collegeLIT = await prisma.college.upsert({
    where: { code: 'LIT-CHE' },
    update: {},
    create: {
      name: 'Loyola Institute of Technology',
      code: 'LIT-CHE',
      location: 'Palanchur, Kanchipuram',
      zoneId: zone1.id,
      isActive: true,
    },
  });

  console.log('  ✅ Colleges created');

  // ─── 3. DEPARTMENTS ────────────────────────────────────────────────────────

  const deptCSE_MIT = await prisma.department.create({
    data: { name: 'Computer Science and Engineering', collegeId: collegeMIT.id },
  });

  const deptME_CEG = await prisma.department.create({
    data: { name: 'Mechanical Engineering', collegeId: collegeCEG.id },
  });

  const deptECE_SSN = await prisma.department.create({
    data: { name: 'Electronics and Communication Engineering', collegeId: collegeSSN.id },
  });

  console.log('  ✅ Departments created');

  // ─── 4. PROGRAMS ───────────────────────────────────────────────────────────

  const programBECSE = await prisma.program.create({
    data: {
      name: 'B.E. Computer Science and Engineering',
      departmentId: deptCSE_MIT.id,
      durationYears: 4,
    },
  });

  const programBEME = await prisma.program.create({
    data: {
      name: 'B.E. Mechanical Engineering',
      departmentId: deptME_CEG.id,
      durationYears: 4,
    },
  });

  const programBEECE = await prisma.program.create({
    data: {
      name: 'B.E. Electronics and Communication',
      departmentId: deptECE_SSN.id,
      durationYears: 4,
    },
  });

  console.log('  ✅ Programs created');

  // ─── 5. USERS ──────────────────────────────────────────────────────────────

  // Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'arun.s@maatram.org',
      role: UserRole.admin,
      passwordHash: hashPassword('Admin@123'),
      isFirstLogin: false,
      isActive: true,
      organizationId: org.id,
      employeeId: 'EMP-0001',
      userProfile: {
        create: {
          fullName: 'Arun Sundaram',
          designation: 'Super Administrator',
          mobile: '9876543219',
        },
      },
    },
  });

  // Zone Incharge — Zone 1
  const zoneUser = await prisma.user.create({
    data: {
      email: 'ramesh.kumar@zone1.maatram.org',
      role: UserRole.zone,
      passwordHash: hashPassword('Zone@123'),
      isFirstLogin: false,
      isActive: true,
      organizationId: org.id,
      zoneId: zone1.id,
      employeeId: 'EMP-0002',
      userProfile: {
        create: {
          fullName: 'Dr. Ramesh Kumar',
          designation: 'Zone Incharge',
          mobile: '9876543218',
        },
      },
    },
  });

  // Update Zone 1 to assign incharge
  await prisma.zone.update({
    where: { id: zone1.id },
    data: { inchargeId: zoneUser.id },
  });

  // Student User 1 — Ananya Sharma
  const studentUser1 = await prisma.user.create({
    data: {
      email: 'ananya.sharma@student.maatram.org',
      registerNumber: '2024CS1092',
      role: UserRole.student,
      passwordHash: hashPassword('Mtm#9021'),
      tempPassword: 'Mtm#9021',
      isFirstLogin: false,
      isActive: true,
    },
  });

  // Student User 2 — Karthik Raja
  const studentUser2 = await prisma.user.create({
    data: {
      email: 'karthik.raja@student.maatram.org',
      registerNumber: '2024ME1105',
      role: UserRole.student,
      passwordHash: hashPassword('Mtm#4412'),
      tempPassword: 'Mtm#4412',
      isFirstLogin: false,
      isActive: true,
    },
  });

  console.log('  ✅ Users created');

  // ─── 6. STUDENTS ───────────────────────────────────────────────────────────

  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      registrationNumber: '2024CS1092',
      firstName: 'Ananya',
      lastName: 'Sharma',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2003-08-15'),
      bloodGroup: BloodGroup.O_POSITIVE,
      nationality: 'Indian',
      mobile: '9876543210',
      parentName: 'Rajesh Sharma',
      parentMobile: '9876543212',
      addressLine1: '123, Main Street, T. Nagar',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600017',
      organizationId: org.id,
      zoneId: zone1.id,
      collegeId: collegeMIT.id,
      departmentId: deptCSE_MIT.id,
      programId: programBECSE.id,
      course: 'B.E.',
      batch: '2022-2026',
      academicYear: '4th Year',
      verificationCode: 'MTM-2024-CS1092',
      accountStatus: AccountStatus.password_changed,
      status: StudentStatus.ACTIVE,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      registrationNumber: '2024ME1105',
      firstName: 'Karthik',
      lastName: 'Raja',
      gender: Gender.MALE,
      dateOfBirth: new Date('2003-05-20'),
      bloodGroup: BloodGroup.A_POSITIVE,
      nationality: 'Indian',
      mobile: '9876543211',
      parentName: 'M. Raja',
      parentMobile: '9876543213',
      addressLine1: '45, West Mada Street, Mylapore',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600004',
      organizationId: org.id,
      zoneId: zone1.id,
      collegeId: collegeCEG.id,
      departmentId: deptME_CEG.id,
      programId: programBEME.id,
      course: 'B.E.',
      batch: '2022-2026',
      academicYear: '4th Year',
      verificationCode: 'MTM-2024-ME1105',
      accountStatus: AccountStatus.activated,
      status: StudentStatus.ACTIVE,
    },
  });

  console.log('  ✅ Students created');

  // ─── 7. SEMESTER GRADES ────────────────────────────────────────────────────

  const ananyaGPAs = [8.50, 8.65, 8.90, 9.10, 8.80, 8.95];
  for (let i = 0; i < ananyaGPAs.length; i++) {
    await prisma.semesterGrade.create({
      data: {
        studentId: student1.id,
        semesterNumber: i + 1,
        gpa: ananyaGPAs[i],
      },
    });
  }

  console.log('  ✅ Semester grades created');

  // ─── 8. SKILLS ─────────────────────────────────────────────────────────────

  const ananyaSkills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL',
    'Tailwind CSS', 'Git & GitHub', 'Community Leadership',
    'Event Coordination', 'Data Analysis',
  ];

  for (const skillName of ananyaSkills) {
    await prisma.skill.create({
      data: { studentId: student1.id, skillName },
    });
  }

  console.log('  ✅ Skills created');

  // ─── 9. PROJECTS ───────────────────────────────────────────────────────────

  await prisma.project.create({
    data: {
      studentId: student1.id,
      title: 'Volunteer Work Log Tracker SPA',
      description: 'A lightweight single-page application for real-time volunteering metrics and log tracking, built with modern web technologies.',
      techStack: 'React, TypeScript, Node.js, PostgreSQL',
      githubUrl: 'https://github.com/ananya/volunteer-tracker',
    },
  });

  console.log('  ✅ Projects created');

  // ─── 10. CERTIFICATIONS ────────────────────────────────────────────────────

  await prisma.certification.create({
    data: {
      studentId: student1.id,
      title: 'Full Stack Web Development',
      issuer: 'Coursera / Meta',
      issueDate: new Date('2025-06-15'),
      isVerified: true,
    },
  });

  console.log('  ✅ Certifications created');

  // ─── 11. VOLUNTEER SUBMISSIONS ─────────────────────────────────────────────

  await prisma.volunteerSubmission.create({
    data: {
      submissionCode: 'VLOG-1092-01',
      studentId: student1.id,
      zoneId: zone1.id,
      title: 'Blood Donation Drive Coordination',
      category: VolunteerCategory.Healthcare,
      organization: 'Red Cross Society / Maatram Foundation',
      hours: 6.0,
      eventDate: new Date('2026-07-20'),
      description: 'Coordinated a blood donation camp at MIT campus serving 120+ donors.',
      status: VolunteerStatus.approved,
      reviewerComment: 'Excellent coordination. Proof verified.',
      reviewedById: zoneUser.id,
      reviewedAt: new Date('2026-07-21'),
    },
  });

  await prisma.volunteerSubmission.create({
    data: {
      submissionCode: 'VLOG-1092-02',
      studentId: student1.id,
      zoneId: zone1.id,
      title: 'Rural Science Fair Mentorship',
      category: VolunteerCategory.Education,
      organization: 'Govt Higher Secondary School, Chromepet',
      hours: 12.0,
      eventDate: new Date('2026-07-14'),
      description: 'Mentored 8th grade students in a rural school science fair, guiding 3 teams.',
      status: VolunteerStatus.approved,
      reviewerComment: 'Well documented mentorship activity.',
      reviewedById: zoneUser.id,
      reviewedAt: new Date('2026-07-15'),
    },
  });

  await prisma.volunteerSubmission.create({
    data: {
      submissionCode: 'VLOG-1092-03',
      studentId: student1.id,
      zoneId: zone1.id,
      title: 'Community Cleanliness & Recycling Drive',
      category: VolunteerCategory.Environment,
      organization: 'NSS Unit 4',
      hours: 4.0,
      eventDate: new Date('2026-07-24'),
      description: 'Led a cleanliness drive covering 3 residential blocks with a team of 15 volunteers.',
      status: VolunteerStatus.pending,
    },
  });

  await prisma.volunteerSubmission.create({
    data: {
      submissionCode: 'VLOG-1092-04',
      studentId: student1.id,
      zoneId: zone1.id,
      title: 'Tree Plantation Campaign',
      category: VolunteerCategory.Environment,
      organization: 'Green Earth Trust',
      hours: 5.0,
      eventDate: new Date('2026-07-10'),
      description: 'Organized tree planting of 50 saplings in a deforested area near Vandalur.',
      status: VolunteerStatus.rejected,
      reviewerComment: 'Proof photo does not match the event date. Please resubmit with valid evidence.',
      reviewedById: zoneUser.id,
      reviewedAt: new Date('2026-07-12'),
    },
  });

  await prisma.volunteerSubmission.create({
    data: {
      submissionCode: 'VLOG-1105-01',
      studentId: student2.id,
      zoneId: zone1.id,
      title: 'Digital Literacy Workshop for Seniors',
      category: VolunteerCategory.Education,
      organization: 'HelpAge India',
      hours: 8.0,
      eventDate: new Date('2026-07-22'),
      description: 'Conducted a 2-day digital literacy workshop teaching smartphone usage to 30 senior citizens.',
      status: VolunteerStatus.pending,
    },
  });

  console.log('  ✅ Volunteer submissions created');

  // ─── 12. NOTIFICATIONS ─────────────────────────────────────────────────────

  await prisma.notification.create({
    data: {
      recipientId: studentUser1.id,
      title: 'Volunteer Log Approved!',
      message: 'Your submission "Blood Donation Drive Coordination" has been approved by Dr. Ramesh Kumar.',
      type: NotificationType.approved,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: studentUser1.id,
      title: 'Resume Completion Reminder',
      message: 'Your resume is 85% complete. Add your remaining projects and certifications to reach 100%.',
      type: NotificationType.info,
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: zoneUser.id,
      title: 'New Submission Pending Review',
      message: 'Ananya Sharma (2024CS1092) submitted a new volunteer log for "Community Cleanliness Drive".',
      type: NotificationType.pending,
      isRead: false,
    },
  });

  console.log('  ✅ Notifications created');

  // ─── 13. AUDIT LOGS ────────────────────────────────────────────────────────

  await prisma.auditLog.create({
    data: {
      logCode: 'AUD-9021',
      actorId: zoneUser.id,
      actorRole: AuditActorRole.zone,
      action: 'VOLUNTEER_LOG_APPROVED',
      targetEntityType: 'volunteer_submission',
      targetLabel: 'Ananya Sharma — Blood Donation Drive',
      details: 'Approved volunteer log VLOG-1092-01 for 6.0 hours.',
      ipAddress: '192.168.1.100',
    },
  });

  await prisma.auditLog.create({
    data: {
      logCode: 'AUD-9020',
      actorId: adminUser.id,
      actorRole: AuditActorRole.admin,
      action: 'BULK_STUDENT_IMPORT',
      targetEntityType: 'enrollment_import',
      targetLabel: 'Roster_Batch2026.xlsx',
      details: 'Imported 120 student accounts from Excel roster.',
      ipAddress: '10.0.0.1',
    },
  });

  await prisma.auditLog.create({
    data: {
      logCode: 'AUD-9019',
      actorId: studentUser1.id,
      actorRole: AuditActorRole.student,
      action: 'FIRST_LOGIN_PASSWORD_CHANGED',
      targetEntityType: 'user',
      targetLabel: 'Account Activation',
      details: 'Student changed temporary password on first login.',
      ipAddress: '192.168.1.50',
    },
  });

  await prisma.auditLog.create({
    data: {
      logCode: 'AUD-9018',
      actorId: adminUser.id,
      actorRole: AuditActorRole.admin,
      action: 'ZONE_INCHARGE_CREATED',
      targetEntityType: 'user',
      targetLabel: 'Prof. S. Lakshmi',
      details: 'Created zone incharge account for Zone 2.',
      ipAddress: '10.0.0.1',
    },
  });

  console.log('  ✅ Audit logs created');

  // ─── 14. ENROLLMENT IMPORT ─────────────────────────────────────────────────

  await prisma.enrollmentImport.create({
    data: {
      importedById: adminUser.id,
      fileName: 'Roster_Batch2026.xlsx',
      totalRows: 124,
      successCount: 120,
      duplicateCount: 3,
      errorCount: 1,
      status: ImportStatus.completed,
    },
  });

  console.log('  ✅ Enrollment imports created');

  // ─── SUMMARY ───────────────────────────────────────────────────────────────

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('  Accounts created:');
  console.log('  ┌──────────────────────────────┬──────────────────────┬─────────────┐');
  console.log('  │ Name                         │ Identifier           │ Role        │');
  console.log('  ├──────────────────────────────┼──────────────────────┼─────────────┤');
  console.log('  │ Arun Sundaram (Admin)        │ arun.s@maatram.org   │ admin       │');
  console.log('  │ Dr. Ramesh Kumar             │ ramesh.kumar@zone1…  │ zone        │');
  console.log('  │ Ananya Sharma                │ 2024CS1092           │ student     │');
  console.log('  │ Karthik Raja                 │ 2024ME1105           │ student     │');
  console.log('  └──────────────────────────────┴──────────────────────┴─────────────┘');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
