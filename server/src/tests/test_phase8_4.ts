/**
 * @file src/tests/test_phase8_4.ts
 * @description Programmatic integration tests for Phase 8.4 Resume Builder & Student Directory.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';

const PORT = 4690;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let studentToken = '';
let zoneToken = '';
let anotherStudentId = '';
let ownStudentId = '';
let otherZoneStudentId = '';

async function runTests() {
  console.log('🚀 Starting Phase 8.4 Resume Builder & Directory Integration Tests...');

  // Start server
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // 1. Authenticate users
    console.log('\n🔐 [Authentication] Logging in as Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'arun.s@maatram.org',
        password: 'Admin@123',
      }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    adminToken = adminLoginData.data.accessToken;

    console.log('🔐 [Authentication] Logging in as Student...');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '2024CS1092',
        password: 'Student@123',
      }),
    });
    const studentLoginData = (await studentLoginRes.json()) as any;
    if (!studentLoginRes.ok) throw new Error(`Student login failed: ${JSON.stringify(studentLoginData)}`);
    studentToken = studentLoginData.data.accessToken;

    console.log('🔐 [Authentication] Logging in as Zone Incharge...');
    const zoneLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ramesh.kumar@zone1.maatram.org',
        password: 'Zone@123',
      }),
    });
    const zoneLoginData = (await zoneLoginRes.json()) as any;
    if (!zoneLoginRes.ok) throw new Error(`Zone login failed: ${JSON.stringify(zoneLoginData)}`);
    zoneToken = zoneLoginData.data.accessToken;

    // 2. Resolve target IDs
    // Find Student 2024CS1092 (ownStudentId)
    const ownStudent = await prisma.student.findFirst({
      where: { registrationNumber: '2024CS1092' }
    });
    if (!ownStudent) throw new Error('Test Student 2024CS1092 not found in DB');
    ownStudentId = ownStudent.id;

    // Find student in a different zone than Ramesh (Ramesh is in Zone 1)
    // Find Zone 2 or another zone in DB
    const defaultOrg = await prisma.organization.findFirst();
    const targetZone1 = await prisma.zone.findFirst({ where: { code: 'ZONE-1' } });
    
    // Find or create Zone 2
    let zone2 = await prisma.zone.findFirst({
      where: { code: { not: 'ZONE-1' } }
    });
    if (!zone2) {
      zone2 = await prisma.zone.create({
        data: {
          name: 'Test Zone 2',
          code: 'ZONE-2-TEST',
          regionLabel: 'Test region',
          organizationId: defaultOrg!.id
        }
      });
    }

    // Create a temporary student in Zone 2
    const tempUserOutsideZone = await prisma.user.create({
      data: {
        email: 'temp.outside@student.maatram.org',
        role: 'student',
        passwordHash: 'hashed',
        organizationId: defaultOrg!.id,
        zoneId: zone2.id
      }
    });

    const tempStudentOutsideZone = await prisma.student.create({
      data: {
        userId: tempUserOutsideZone.id,
        registrationNumber: 'SYS-TEMP-OUTSIDE',
        firstName: 'Temp Outside',
        lastName: 'Student',
        dateOfBirth: new Date('2004-01-01'),
        organizationId: defaultOrg!.id,
        zoneId: zone2.id,
        verificationCode: 'MTM-2024-TEMP-OUTSIDE'
      }
    });

    otherZoneStudentId = tempStudentOutsideZone.id;

    // Find another student ID for student-to-student forbidden test
    const anotherStudentObj = await prisma.student.findFirst({
      where: { id: { not: ownStudentId } }
    });
    anotherStudentId = anotherStudentObj?.id || ownStudentId;

    // ─── 3. RESUME PERMISSION TESTS ───────────────────────────────────────────
    console.log('\n🔒 [Permissions] Testing student accessing own resume...');
    const ownResumeRes = await fetch(`${BASE_URL}/students/${ownStudentId}/resume`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`Status: ${ownResumeRes.status}`);
    if (ownResumeRes.status !== 200) {
      throw new Error(`Student could not view own resume. Got status ${ownResumeRes.status}`);
    }
    console.log('✅ Access allowed.');

    if (anotherStudentId !== ownStudentId) {
      console.log('🔒 [Permissions] Testing student accessing another student\'s resume...');
      const otherResumeRes = await fetch(`${BASE_URL}/students/${anotherStudentId}/resume`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      console.log(`Status: ${otherResumeRes.status}`);
      if (otherResumeRes.status !== 403) {
        throw new Error(`Expected 403 when student views another resume, got ${otherResumeRes.status}`);
      }
      console.log('✅ Access correctly denied (403).');
    }

    console.log('🔒 [Permissions] Testing Zone Incharge accessing resume within their zone...');
    // Zone 1 incharge Ramesh accessing student in Zone 1
    const zoneStudent = await prisma.student.findFirst({
      where: { zone: { code: 'ZONE-1' } }
    });
    if (zoneStudent) {
      const zoneStudentRes = await fetch(`${BASE_URL}/students/${zoneStudent.id}/resume`, {
        headers: { Authorization: `Bearer ${zoneToken}` },
      });
      console.log(`Status: ${zoneStudentRes.status}`);
      if (zoneStudentRes.status !== 200) {
        throw new Error(`Zone Incharge could not view resume of student in their zone. Status: ${zoneStudentRes.status}`);
      }
      console.log('✅ Access allowed.');
    }

    if (otherZoneStudentId && otherZoneStudentId !== ownStudentId) {
      console.log('🔒 [Permissions] Testing Zone Incharge accessing resume outside their zone...');
      const otherZoneStudentRes = await fetch(`${BASE_URL}/students/${otherZoneStudentId}/resume`, {
        headers: { Authorization: `Bearer ${zoneToken}` },
      });
      console.log(`Status: ${otherZoneStudentRes.status}`);
      if (otherZoneStudentRes.status !== 403) {
        throw new Error(`Expected 403 when Zone Incharge views student outside zone, got ${otherZoneStudentRes.status}`);
      }
      console.log('✅ Access correctly denied (403).');
    }

    console.log('🔒 [Permissions] Testing Super Admin accessing any resume...');
    const adminResumeRes = await fetch(`${BASE_URL}/students/${ownStudentId}/resume`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Status: ${adminResumeRes.status}`);
    if (adminResumeRes.status !== 200) {
      throw new Error(`Super Admin could not view student resume. Status: ${adminResumeRes.status}`);
    }
    console.log('✅ Access allowed.');

    // ─── 4. SORTING AND FILTERS TESTING ───────────────────────────────────────
    console.log('\n🔍 [Directory & Sorting] Testing sorting by Name (firstName)...');
    const sortNameRes = await fetch(`${BASE_URL}/students?sortBy=name&sortOrder=asc&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sortNameData = (await sortNameRes.json()) as any;
    if (!sortNameRes.ok) throw new Error('Failed to sort by name');
    console.log('✅ Name sorting returned 200.');

    console.log('🔍 [Directory & Sorting] Testing sorting by CGPA...');
    const sortCgpaRes = await fetch(`${BASE_URL}/students?sortBy=cgpa&sortOrder=desc&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sortCgpaData = (await sortCgpaRes.json()) as any;
    if (!sortCgpaRes.ok) throw new Error('Failed to sort by cgpa');
    console.log('✅ CGPA sorting returned 200.');

    // ─── 5. EXPORT WITH FILTERS AND LIMITS ────────────────────────────────────
    console.log('\n📊 [Export] Testing export with sorting, pagination and filters...');
    const exportRes = await fetch(`${BASE_URL}/students/export?format=xlsx&sortBy=cgpa&sortOrder=desc&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Status: ${exportRes.status}`);
    if (exportRes.status !== 200) {
      throw new Error(`Expected 200 for export status, got ${exportRes.status}`);
    }
    console.log('✅ Export endpoint returned 200 for Excel download.');

    console.log('\n🎉 All Phase 8.4 Integration Tests Passed Successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Phase 8.4 Integration Tests Failed:', error.message || error);
    process.exit(1);
  } finally {
    console.log('🧹 Cleaning up temporary test student outside zone...');
    try {
      await prisma.student.deleteMany({
        where: { registrationNumber: 'SYS-TEMP-OUTSIDE' }
      });
      await prisma.user.deleteMany({
        where: { email: 'temp.outside@student.maatram.org' }
      });
    } catch (cleanupErr) {
      console.error('⚠️ Cleanup failed:', cleanupErr);
    }
    if (server) {
      server.close();
    }
  }
}

runTests();
