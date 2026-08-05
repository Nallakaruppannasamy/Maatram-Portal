/**
 * @file src/tests/test_phase8_8.ts
 * @description Version 1.1 Release Candidate End-to-End Master QA & Regression Test Suite.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const PORT = 4698;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let zoneToken = '';
let studentToken = '';
let testZoneId = '';
let testStudentId = '';

async function runReleaseCandidateQATests() {
  console.log('🏆 Starting Phase 8.8 — Version 1.1 Release Candidate Master QA Test Suite...\n');

  // Start test server instance
  server = app.listen(PORT, () => {
    console.log(`📡 QA Test Server listening on port ${PORT}`);
  });

  try {
    // ─── 1. AUTHENTICATION & PERSONA INITIALIZATION ──────────────────────────
    console.log('🔐 [QA - Auth] Authenticating Super Admin (Arun S)...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'arun.s@maatram.org',
        password: 'Admin@123',
      }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    if (!adminLoginRes.ok) throw new Error(`Super Admin login failed: ${JSON.stringify(adminLoginData)}`);
    adminToken = adminLoginData.data.accessToken;
    console.log('  ✅ Super Admin authenticated successfully.');

    console.log('🔐 [QA - Auth] Authenticating Zone Incharge (Ramesh Kumar)...');
    const zoneLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ramesh.kumar@zone1.maatram.org',
        password: 'Zone@123',
      }),
    });
    const zoneLoginData = (await zoneLoginRes.json()) as any;
    if (!zoneLoginRes.ok) throw new Error(`Zone Incharge login failed: ${JSON.stringify(zoneLoginData)}`);
    zoneToken = zoneLoginData.data.accessToken;
    console.log('  ✅ Zone Incharge authenticated successfully.');

    console.log('🔐 [QA - Auth] Authenticating Student persona...');
    let studentUser = await prisma.user.findFirst({ where: { role: 'student' } });
    if (!studentUser) {
      const st = await prisma.student.findFirst({ include: { user: true } });
      if (st && st.user) studentUser = st.user;
    }

    if (studentUser) {
      const pwHash = await bcrypt.hash('Student@123', 10);
      await prisma.user.update({
        where: { id: studentUser.id },
        data: { passwordHash: pwHash, isActive: true },
      });

      const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: studentUser.email || studentUser.registerNumber || 'student',
          password: 'Student@123',
        }),
      });
      const studentLoginData = (await studentLoginRes.json()) as any;
      if (!studentLoginRes.ok) throw new Error(`Student login failed: ${JSON.stringify(studentLoginData)}`);
      studentToken = studentLoginData.data.accessToken;
      console.log('  ✅ Student persona authenticated successfully.');

      const stRecord = await prisma.student.findUnique({ where: { userId: studentUser.id } });
      if (stRecord) testStudentId = stRecord.id;
    }

    const zone1 = await prisma.zone.findFirst({ where: { code: 'ZONE-1' } });
    if (!zone1) throw new Error('ZONE-1 database record missing');
    testZoneId = zone1.id;

    // ─── 2. STUDENT PORTAL QA ────────────────────────────────────────────────
    console.log('\n🎓 [QA - Student Portal] Fetching Student profile...');
    const profileRes = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (profileRes.status !== 200) throw new Error(`Student profile fetch failed with status ${profileRes.status}`);
    console.log('  ✅ Student profile fetched successfully.');

    if (testStudentId) {
      console.log('🎓 [QA - Resume Engine] Generating student resume data payload...');
      const resumeRes = await fetch(`${BASE_URL}/students/${testStudentId}/resume`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (resumeRes.status !== 200) throw new Error(`Resume fetch failed with status ${resumeRes.status}`);
      const resumeData = (await resumeRes.json()) as any;
      if (!resumeData.data || !resumeData.data.registrationNumber) {
        throw new Error('Resume data format invalid');
      }
      console.log(`  ✅ Student resume payload validated for ${resumeData.data.fullName}.`);
    }

    // ─── 3. ZONE PORTAL QA ───────────────────────────────────────────────────
    console.log('\n🏛️ [QA - Zone Portal] Fetching assigned colleges for Zone 1...');
    const zoneCollegesRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (zoneCollegesRes.status !== 200) throw new Error(`Zone colleges fetch failed: ${zoneCollegesRes.status}`);
    console.log('  ✅ Zone colleges list retrieved.');

    console.log('🏛️ [QA - Zone Portal] Exporting Assigned Colleges Excel spreadsheet...');
    const exportCollegesRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (exportCollegesRes.status !== 200) throw new Error(`Colleges export failed: ${exportCollegesRes.status}`);
    console.log('  ✅ Zone colleges Excel export buffer received successfully.');

    console.log('🤝 [QA - Volunteer Module] Fetching pending approvals queue...');
    const pendingVolRes = await fetch(`${BASE_URL}/volunteers?status=PENDING`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (pendingVolRes.status !== 200) throw new Error(`Pending volunteers fetch failed: ${pendingVolRes.status}`);
    console.log('  ✅ Pending volunteer queue fetched successfully.');

    // ─── 4. SUPER ADMIN PORTAL QA ─────────────────────────────────────────────
    console.log('\n👑 [QA - Super Admin] Fetching Organization Hierarchy tree...');
    const hierarchyRes = await fetch(`${BASE_URL}/organizations/hierarchy`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (hierarchyRes.status !== 200) throw new Error(`Hierarchy fetch failed: ${hierarchyRes.status}`);
    console.log('  ✅ Organization Hierarchy tree retrieved.');

    console.log('👑 [QA - Super Admin] Exporting global Student Directory (Excel)...');
    const exportStudentsRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (exportStudentsRes.status !== 200) throw new Error(`Student export failed: ${exportStudentsRes.status}`);
    console.log('  ✅ Global Student Directory Excel export buffer received.');

    console.log('👥 [QA - Super Admin] Fetching system Users directory...');
    const usersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (usersRes.status !== 200) throw new Error(`Fetch users failed: ${usersRes.status}`);
    console.log('  ✅ System users directory fetched.');

    // ─── 5. SECURITY & RBAC ISOLATION QA ─────────────────────────────────────
    console.log('\n🛡️ [QA - Security Audit] Testing Student RBAC restrictions...');
    const studentBlockedRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentBlockedRes.status !== 403) {
      throw new Error(`Security breach: Student accessed /api/v1/users with status ${studentBlockedRes.status}`);
    }
    console.log('  ✅ Student access to Admin resources correctly rejected with 403 Forbidden.');

    console.log('\n🏆 ALL RELEASE CANDIDATE QA TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Release Candidate QA Test Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runReleaseCandidateQATests();
