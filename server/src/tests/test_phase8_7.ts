/**
 * @file src/tests/test_phase8_7.ts
 * @description Master System Regression Test Suite for Version 1.1 Final Production Hardening.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const PORT = 4697;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let zoneToken = '';
let studentToken = '';
let testZoneId = '';
let testStudentId = '';

async function runMasterRegressionTests() {
  console.log('🚀 Starting Phase 8.7 Master System Regression Test Suite (Version 1.1)...\n');

  // Start test server
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // ─── 1. AUTHENTICATION & TOKEN ROTATION ──────────────────────────────────
    console.log('🔐 [Auth] Logging in as Admin...');
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
    console.log('  ✅ Admin authentication successful.');

    console.log('🔐 [Auth] Logging in as Zone Incharge...');
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
    console.log('  ✅ Zone Incharge authentication successful.');

    console.log('🔐 [Auth] Resolving/creating Student test account...');
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
      console.log('  ✅ Student authentication successful.');

      // Resolve student record ID
      const stRecord = await prisma.student.findUnique({ where: { userId: studentUser.id } });
      if (stRecord) testStudentId = stRecord.id;
    }

    // Resolve test zone ID (ZONE-1)
    const zone1 = await prisma.zone.findFirst({ where: { code: 'ZONE-1' } });
    if (!zone1) throw new Error('ZONE-1 record not found in database');
    testZoneId = zone1.id;

    console.log('🔐 [Auth] Testing Forgot Password endpoint...');
    const forgotPwRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'ramesh.kumar@zone1.maatram.org' }),
    });
    if (forgotPwRes.status !== 200) throw new Error(`Forgot password endpoint failed: ${forgotPwRes.status}`);
    console.log('  ✅ Forgot password endpoint verified.');

    // ─── 2. PROFILE MODULE TESTS ─────────────────────────────────────────────
    console.log('\n👤 [Profile Module] Fetching self profile for Zone Incharge...');
    const profileRes = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (profileRes.status !== 200) throw new Error(`Fetch profile failed with status ${profileRes.status}`);
    console.log('  ✅ Profile fetched successfully.');

    console.log('👤 [Profile Module] Updating Zone Incharge self profile...');
    const updateProfileRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zoneToken}`,
      },
      body: JSON.stringify({
        fullName: 'Ramesh Kumar',
        mobile: '9876543210',
        designation: 'Master Zone Coordinator',
        bio: 'Overseeing scholarship student development & volunteering across Zone 1.',
      }),
    });
    if (updateProfileRes.status !== 200) throw new Error(`Update profile failed with status ${updateProfileRes.status}`);
    console.log('  ✅ Self profile updated successfully.');

    // ─── 3. RESUME GENERATION MODULE ─────────────────────────────────────────
    if (testStudentId) {
      console.log('\n📄 [Resume Module] Fetching Student Resume portfolio data...');
      const resumeRes = await fetch(`${BASE_URL}/students/${testStudentId}/resume`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (resumeRes.status !== 200) throw new Error(`Fetch student resume failed with status ${resumeRes.status}`);
      const resumeData = (await resumeRes.json()) as any;
      if (!resumeData.data || !resumeData.data.registrationNumber) {
        throw new Error('Resume data format is invalid');
      }
      console.log(`  ✅ Student resume fetched for student ID: ${testStudentId} (${resumeData.data.fullName})`);
    }

    // ─── 4. VOLUNTEER WORKFLOW MODULE ────────────────────────────────────────
    console.log('\n🤝 [Volunteer Module] Listing pending submissions...');
    const volunteersRes = await fetch(`${BASE_URL}/volunteers?status=PENDING`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (volunteersRes.status !== 200) throw new Error(`List volunteers failed with status ${volunteersRes.status}`);
    const volunteersData = (await volunteersRes.json()) as any;
    console.log(`  ✅ Volunteers list retrieved. Total entries: ${volunteersData.data.length}`);

    // ─── 5. ORGANIZATION HIERARCHY & ZONE COLLEGES ──────────────────────────
    console.log('\n🌳 [Organization Module] Fetching Organization Hierarchy tree...');
    const hierarchyRes = await fetch(`${BASE_URL}/organizations/hierarchy`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (hierarchyRes.status !== 200) throw new Error(`Hierarchy fetch failed with status ${hierarchyRes.status}`);
    console.log('  ✅ Organization Hierarchy tree fetched successfully.');

    console.log('🏫 [Zone Module] Fetching Assigned Colleges for Zone 1...');
    const zoneCollegesRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (zoneCollegesRes.status !== 200) throw new Error(`Zone colleges fetch failed with status ${zoneCollegesRes.status}`);
    console.log('  ✅ Zone colleges retrieved successfully.');

    console.log('📊 [Zone Module] Exporting Zone Colleges (Excel)...');
    const exportCollegesRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (exportCollegesRes.status !== 200) throw new Error(`Export zone colleges failed with status ${exportCollegesRes.status}`);
    console.log('  ✅ Exported zone colleges Excel buffer successfully.');

    // ─── 6. SUPER ADMIN DIRECTORY & USERS ────────────────────────────────────
    console.log('\n👥 [User Module] Fetching system users list...');
    const usersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (usersRes.status !== 200) throw new Error(`Fetch users failed with status ${usersRes.status}`);
    const usersData = (await usersRes.json()) as any;
    console.log(`  ✅ Users list fetched. Total users: ${usersData.data.length}`);

    console.log('📊 [Student Directory] Exporting Student Directory (Excel)...');
    const exportStudentsRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (exportStudentsRes.status !== 200) throw new Error(`Export student directory failed with status ${exportStudentsRes.status}`);
    console.log('  ✅ Student directory Excel exported successfully.');

    // ─── 7. RBAC & ISOLATION SECURITY AUDIT ──────────────────────────────────
    if (studentToken) {
      console.log('\n🛡️ [Security Audit] Verifying Student role restrictions...');

      const studentZoneRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (studentZoneRes.status !== 403 && studentZoneRes.status !== 401) {
        throw new Error(`Security breach: Student accessed zone endpoint with status ${studentZoneRes.status}`);
      }

      const studentUsersRes = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (studentUsersRes.status !== 403 && studentUsersRes.status !== 401) {
        throw new Error(`Security breach: Student accessed users endpoint with status ${studentUsersRes.status}`);
      }

      console.log('  ✅ Student access control verified (All restricted endpoints returned 403 Forbidden).');
    }

    console.log('\n🎉 MASTER SYSTEM REGRESSION TEST SUITE PASSED (VERSION 1.1 READY)!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Master Regression Test Suite Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runMasterRegressionTests();
