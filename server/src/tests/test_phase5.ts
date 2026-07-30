/**
 * @file src/tests/test_phase5.ts
 * @description Comprehensive programmatic integration tests for Phase 5 Student Management.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import { StudentStatus } from '@prisma/client';

const PORT = 4568;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminAccessToken = '';
let testStudentId = '';
let testStudentUserId = '';
let testOrgId = '';
let testZoneId = '';
let testCollegeId = '';
let testDepartmentId = '';
let testProgramId = '';

async function runTests() {
  console.log('🚀 Starting Phase 5 Student Management Integration Tests...');

  // Start Express server on ephemeral port
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // ─── CLEANUP LEFTOVERS ──────────────────────────────────────────────────
    console.log('🧼 Cleaning up previous test records...');
    await prisma.student.deleteMany({
      where: {
        registrationNumber: { in: ['T5-REG-001', 'MTM-REG-001', 'MTM-REG-002', 'MTM-REG-FAIL'] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            't5.student@student.org',
            'raj.singh@student.org',
            'priya.patel@student.org',
            'fail.singh@student.org',
          ],
        },
      },
    });
    console.log('🧼 Cleanup completed.');

    // Fetch seeded Organization & Zone IDs
    const org = await prisma.organization.findFirst({ where: { code: 'MTM-ORG' } });
    const zone = await prisma.zone.findFirst({ where: { code: 'ZONE-1' } });
    const college = await prisma.college.findFirst({ where: { code: 'MIT-CHE' } });
    const department = await prisma.department.findFirst({
      where: { name: 'Computer Science and Engineering' },
    });
    const program = await prisma.program.findFirst({
      where: { name: 'B.E. Computer Science and Engineering' },
    });

    if (!org || !zone || !college || !department || !program) {
      throw new Error('Required seeded data is missing. Please run database seed first.');
    }

    testOrgId = org.id;
    testZoneId = zone.id;
    testCollegeId = college.id;
    testDepartmentId = department.id;
    testProgramId = program.id;

    // ─── 1. AUTHENTICATE ADMIN ──────────────────────────────────────────────
    console.log('\n🔐 [Authentication] Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'arun.s@maatram.org',
        password: 'Admin@123',
      }),
    });

    const loginData = (await loginRes.json()) as any;
    if (!loginRes.ok) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }

    adminAccessToken = loginData.data.accessToken;
    console.log('✅ Admin authenticated successfully.');

    // ─── 2. STUDENT CREATION ─────────────────────────────────────────────────
    console.log('\n👨‍🎓 [Student CRUD] Testing Student Creation...');
    const createRes = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        registrationNumber: 'T5-REG-001',
        firstName: 'Amit',
        lastName: 'Patel',
        gender: 'MALE',
        dateOfBirth: '2004-04-12',
        bloodGroup: 'B_POSITIVE',
        email: 't5.student@student.org',
        mobile: '9876543220',
        parentName: 'R. Patel',
        parentMobile: '9876543221',
        addressLine1: 'Flat 102, Green Apartments',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        pincode: '600028',
        organizationId: testOrgId,
        zoneId: testZoneId,
        collegeId: testCollegeId,
        departmentId: testDepartmentId,
        programId: testProgramId,
        course: 'B.E.',
        batch: '2022-2026',
        academicYear: '3rd Year',
      }),
    });

    const createData = (await createRes.json()) as any;
    if (!createRes.ok) {
      throw new Error(`Student creation failed: ${JSON.stringify(createData)}`);
    }

    testStudentId = createData.data.id;
    testStudentUserId = createData.data.userId;
    console.log(`✅ Student created successfully. Student ID: ${testStudentId}`);

    // Verify computed fullName is correct
    if (createData.data.fullName !== 'Amit Patel') {
      throw new Error(
        `Computed fullName is incorrect: Expected "Amit Patel", got "${createData.data.fullName}"`
      );
    }
    console.log('✅ Computed fullName verified.');

    // ─── 3. DUPLICATE REJECTION ──────────────────────────────────────────────
    console.log('\n🚫 [Student CRUD] Testing Duplicate Rejection...');

    // Duplicate Registration Number
    const dupRegRes = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        registrationNumber: 'T5-REG-001', // Duplicate!
        firstName: 'Duplicate',
        lastName: 'User',
        gender: 'MALE',
        dateOfBirth: '2004-04-12',
        email: 'unique.email@student.org',
        parentName: 'Parent',
        parentMobile: '9876543222',
        addressLine1: 'Address',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        pincode: '600028',
        organizationId: testOrgId,
        zoneId: testZoneId,
        collegeId: testCollegeId,
        departmentId: testDepartmentId,
        programId: testProgramId,
        course: 'B.E.',
        batch: '2022-2026',
        academicYear: '3rd Year',
      }),
    });

    const dupRegData = (await dupRegRes.json()) as any;
    if (dupRegRes.status !== 409) {
      throw new Error(
        `Expected status 409 for duplicate registration number, got ${dupRegRes.status}. Body: ${JSON.stringify(dupRegData)}`
      );
    }
    console.log('✅ Duplicate registration number rejected with status 409.');

    // Duplicate Email
    const dupEmailRes = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        registrationNumber: 'T5-REG-DUP',
        firstName: 'Duplicate',
        lastName: 'User',
        gender: 'MALE',
        dateOfBirth: '2004-04-12',
        email: 't5.student@student.org', // Duplicate!
        parentName: 'Parent',
        parentMobile: '9876543222',
        addressLine1: 'Address',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        pincode: '600028',
        organizationId: testOrgId,
        zoneId: testZoneId,
        collegeId: testCollegeId,
        departmentId: testDepartmentId,
        programId: testProgramId,
        course: 'B.E.',
        batch: '2022-2026',
        academicYear: '3rd Year',
      }),
    });

    const dupEmailData = (await dupEmailRes.json()) as any;
    if (dupEmailRes.status !== 409) {
      throw new Error(
        `Expected status 409 for duplicate email, got ${dupEmailRes.status}. Body: ${JSON.stringify(dupEmailData)}`
      );
    }
    console.log('✅ Duplicate email rejected with status 409.');

    // ─── 4. STUDENT UPDATE ───────────────────────────────────────────────────
    console.log('\n📝 [Student CRUD] Testing Student Update...');
    const updateRes = await fetch(`${BASE_URL}/students/${testStudentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        firstName: 'AmitKumar',
        lastName: 'Patel',
        mobile: '9876543299',
      }),
    });

    const updateData = (await updateRes.json()) as any;
    if (!updateRes.ok) {
      throw new Error(`Update Student failed: ${JSON.stringify(updateData)}`);
    }

    if (updateData.data.mobile !== '9876543299' || updateData.data.firstName !== 'AmitKumar') {
      throw new Error(`Updated student properties did not match: ${JSON.stringify(updateData)}`);
    }
    console.log('✅ Student update successfully validated.');

    // ─── 5. STATUS TRANSITION CHECKS ─────────────────────────────────────────
    console.log('\n🔄 [Student CRUD] Testing Status Change & Transitions...');

    // Valid transition: ACTIVE -> SUSPENDED
    const statusChange1 = await fetch(`${BASE_URL}/students/${testStudentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ status: StudentStatus.SUSPENDED }),
    });

    const statusData1 = (await statusChange1.json()) as any;
    if (!statusChange1.ok) {
      throw new Error(
        `Valid status transition ACTIVE -> SUSPENDED failed: ${JSON.stringify(statusData1)}`
      );
    }
    console.log('✅ Valid transition ACTIVE -> SUSPENDED succeeded.');

    // Verify corresponding user is deactivated (isActive = false)
    const dbUser = await prisma.user.findUnique({ where: { id: testStudentUserId } });
    if (!dbUser || dbUser.isActive !== false) {
      throw new Error(
        `User account was not deactivated on student suspension status change: ${JSON.stringify(dbUser)}`
      );
    }
    console.log('✅ User account deactivation verified.');

    // Invalid transition: SUSPENDED -> ALUMNI
    const statusChange2 = await fetch(`${BASE_URL}/students/${testStudentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ status: StudentStatus.ALUMNI }),
    });

    const statusData2 = (await statusChange2.json()) as any;
    if (statusChange2.status !== 400) {
      throw new Error(
        `Expected status 400 for invalid status transition SUSPENDED -> ALUMNI, got ${statusChange2.status}. Body: ${JSON.stringify(statusData2)}`
      );
    }
    console.log('✅ Invalid transition SUSPENDED -> ALUMNI successfully blocked.');

    // Revert status to ACTIVE for subsequent tests
    await fetch(`${BASE_URL}/students/${testStudentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ status: StudentStatus.ACTIVE }),
    });

    // ─── 6. SEARCH AND PAGINATION ────────────────────────────────────────────
    console.log('\n🔍 [Student CRUD] Testing search & pagination...');
    const searchRes = await fetch(`${BASE_URL}/students?search=Amit&limit=5`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });

    const searchData = (await searchRes.json()) as any;
    if (!searchRes.ok || !searchData.data || searchData.data.length === 0) {
      throw new Error(`Search failed to locate the student. Body: ${JSON.stringify(searchData)}`);
    }
    console.log(`✅ Search verified. Found student: ${searchData.data[0].fullName}`);

    // ─── 7. EXPORTS (.csv & .xlsx) ──────────────────────────────────────────
    console.log('\n📥 [Student CRUD] Testing Exports...');

    // CSV Format
    const csvExportRes = await fetch(`${BASE_URL}/students/export?format=csv`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const csvText = await csvExportRes.text();
    if (
      !csvExportRes.ok ||
      !csvText.includes('Registration Number') ||
      !csvText.includes('T5-REG-001')
    ) {
      throw new Error(`CSV Export failed or returned empty content: status=${csvExportRes.status}`);
    }
    console.log('✅ CSV Export verified.');

    // XLSX Format
    const xlsxExportRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const xlsxBuffer = await xlsxExportRes.arrayBuffer();
    if (!xlsxExportRes.ok || xlsxBuffer.byteLength < 5000) {
      throw new Error(
        `XLSX Export failed or buffer too small: status=${xlsxExportRes.status}, size=${xlsxBuffer.byteLength}`
      );
    }
    console.log('✅ XLSX Export verified.');

    // ─── 8. TRANSACTIONAL CSV IMPORT ─────────────────────────────────────────
    console.log('\n📤 [Student Import] Testing Bulk Import...');

    const validCsv = `registrationNumber,firstName,middleName,lastName,gender,dateOfBirth,bloodGroup,nationality,community,religion,email,mobile,alternateMobile,parentName,parentMobile,parentOccupation,guardianName,guardianMobile,addressLine1,addressLine2,city,district,state,country,pincode,organizationCode,zoneCode,collegeCode,departmentName,programName,course,batch,academicYear,semester,section
MTM-REG-001,Raj,Kumar,Singh,MALE,2002-05-15,O_POSITIVE,Indian,,,raj.singh@student.org,9876543210,,Surender Singh,9876543212,,,,123 Main Road,,Chennai,Chennai,Tamil Nadu,India,600001,MTM-ORG,ZONE-1,MIT-CHE,Computer Science and Engineering,B.E. Computer Science and Engineering,B.E.,2022-2026,4th Year,Semester 7,A
MTM-REG-002,Priya,,Patel,FEMALE,2003-09-20,A_POSITIVE,Indian,,,priya.patel@student.org,9876543211,,Amit Patel,9876543213,,,,45 West Mada St,,Chennai,Chennai,Tamil Nadu,India,600004,MTM-ORG,ZONE-1,MIT-CHE,Computer Science and Engineering,B.E. Computer Science and Engineering,B.E.,2022-2026,4th Year,Semester 7,A`;

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([validCsv], { type: 'text/csv' }),
      'students_import_valid.csv'
    );

    const importRes = await fetch(`${BASE_URL}/students/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: formData,
    });

    const importData = (await importRes.json()) as any;
    if (!importRes.ok || importData.data.successCount !== 2) {
      throw new Error(`Valid CSV import failed: ${JSON.stringify(importData)}`);
    }
    console.log(`✅ Valid CSV Import verified. Imported ${importData.data.successCount} students.`);

    // ─── 9. IMPORT ROLLBACK ON ERROR ─────────────────────────────────────────
    console.log('\n↩️ [Student Import] Testing Import Rollback on Failure...');

    // One valid row, one invalid row (e.g. invalid organization code)
    const invalidCsv = `registrationNumber,firstName,middleName,lastName,gender,dateOfBirth,bloodGroup,nationality,community,religion,email,mobile,alternateMobile,parentName,parentMobile,parentOccupation,guardianName,guardianMobile,addressLine1,addressLine2,city,district,state,country,pincode,organizationCode,zoneCode,collegeCode,departmentName,programName,course,batch,academicYear,semester,section
MTM-REG-FAIL,Fail,Kumar,Singh,MALE,2002-05-15,O_POSITIVE,Indian,,,fail.singh@student.org,9876543210,,Surender Singh,9876543212,,,,123 Main Road,,Chennai,Chennai,Tamil Nadu,India,600001,INVALID-ORG-CODE,ZONE-1,MIT-CHE,Computer Science and Engineering,B.E. Computer Science and Engineering,B.E.,2022-2026,4th Year,Semester 7,A`;

    const formDataFail = new FormData();
    formDataFail.append(
      'file',
      new Blob([invalidCsv], { type: 'text/csv' }),
      'students_import_invalid.csv'
    );

    const importFailRes = await fetch(`${BASE_URL}/students/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: formDataFail,
    });

    const importFailData = (await importFailRes.json()) as any;
    if (importFailRes.ok || importFailData.data.errorCount === 0) {
      throw new Error(
        `Expected import failure, but got success: ${JSON.stringify(importFailData)}`
      );
    }
    console.log('✅ Invalid row detected. Import properly rejected with validation errors.');

    // Verify rollback: student with registrationNumber 'MTM-REG-FAIL' should NOT exist
    const rolledBackStudent = await prisma.student.findFirst({
      where: { registrationNumber: 'MTM-REG-FAIL' },
    });
    if (rolledBackStudent) {
      throw new Error('Rollback failed! Student record was created despite import failure.');
    }
    console.log('✅ Rollback verified. Database state left unchanged.');

    // ─── 10. AUDIT LOG VALIDATION ────────────────────────────────────────────
    console.log('\n📋 [Audit Logs] Verifying Audit Logs generation...');
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'STUDENT_CREATED',
            'STUDENT_UPDATED',
            'STUDENT_IMPORTED',
            'STUDENT_STATUS_CHANGED',
            'STUDENT_ACTIVATED',
            'STUDENT_DEACTIVATED',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (auditLogs.length === 0) {
      throw new Error('No audit log entries were found for student actions.');
    }
    console.log(
      `✅ Audit logs verified. Found ${auditLogs.length} matching student audit records.`
    );

    // All tests passed successfully!
    console.log('\n🎉 All Phase 5 Student Management Integration Tests PASSED successfully!');
  } catch (error) {
    console.error('\n❌ Tests FAILED:', error);
    process.exit(1);
  } finally {
    // Shutdown server
    if (server) {
      server.close(() => {
        console.log('📡 Test server stopped.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

runTests();
