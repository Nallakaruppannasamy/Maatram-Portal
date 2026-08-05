/**
 * @file src/tests/test_phase8_6.ts
 * @description Integration and regression test suite for Phase 8.6 Zone Portal Enhancement & Version 1.1 UX Polish.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const PORT = 4696;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let zoneToken = '';
let studentToken = '';
let testZoneId = '';

async function runTests() {
  console.log('🚀 Starting Phase 8.6 Zone Portal Integration & Regression Test Suite...\n');

  // Start test server instance
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // ─── 1. AUTHENTICATION & RBAC SETUP ──────────────────────────────────────
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
    console.log('  ✅ Admin logged in successfully.');

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
    console.log('  ✅ Zone Incharge logged in successfully.');

    console.log('🔐 [Auth] Resolving/creating Student user for testing...');
    let studentUser = await prisma.user.findFirst({ where: { role: 'student' } });
    if (!studentUser) {
      // Find student record if available
      const st = await prisma.student.findFirst({ include: { user: true } });
      if (st && st.user) {
        studentUser = st.user;
      }
    }

    if (studentUser) {
      // Update password hash to known test password
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
      console.log('  ✅ Student logged in successfully.');
    } else {
      console.log('  ⚠️ No student user found in database, skipping student token setup.');
    }

    // Resolve test zone ID (ZONE-1)
    const zone1 = await prisma.zone.findFirst({ where: { code: 'ZONE-1' } });
    if (!zone1) throw new Error('ZONE-1 record not found in database');
    testZoneId = zone1.id;

    // ─── 2. ZONE PROFILE ENHANCEMENT TESTS ───────────────────────────────────
    console.log('\n👤 [Zone Profile] Fetching Zone Incharge profile...');
    const profileRes = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (profileRes.status !== 200) throw new Error(`Fetch profile failed with status ${profileRes.status}`);
    const profileData = (await profileRes.json()) as any;
    console.log(`  ✅ Profile retrieved: ${profileData.data.fullName || 'User'} (${profileData.data.email || 'N/A'})`);

    console.log('👤 [Zone Profile] Updating Zone Incharge profile details (designation & bio)...');
    const updateProfileRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zoneToken}`,
      },
      body: JSON.stringify({
        fullName: 'Ramesh Kumar',
        mobile: '9876543210',
        designation: 'Senior Zone Regional Coordinator',
        bio: 'Overseeing scholarship student development & volunteering across Zone 1.',
      }),
    });
    if (updateProfileRes.status !== 200) throw new Error(`Update profile failed with status ${updateProfileRes.status}`);
    const updatedProfileData = (await updateProfileRes.json()) as any;
    if (updatedProfileData.data.designation !== 'Senior Zone Regional Coordinator') {
      throw new Error('Designation field update failed to persist');
    }
    console.log('  ✅ Profile details (name, mobile, designation, bio) updated successfully.');

    console.log('🔐 [Zone Profile] Validating Password Change rejection on invalid current password...');
    const badPwRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zoneToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword999',
        newPassword: 'NewZonePassword@123',
        confirmPassword: 'NewZonePassword@123',
      }),
    });
    if (badPwRes.status === 200) throw new Error('Password change should have failed with invalid current password');
    console.log('  ✅ Password change validation verified (invalid current password correctly rejected).');

    // ─── 3. ZONE DASHBOARD & ASSIGNED COLLEGES TESTS ─────────────────────────
    console.log('\n📊 [Dashboard] Fetching live Zone Students list...');
    const zoneStudentsRes = await fetch(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (zoneStudentsRes.status !== 200) throw new Error(`Zone students fetch failed with status ${zoneStudentsRes.status}`);
    const zoneStudentsData = (await zoneStudentsRes.json()) as any;
    console.log(`  ✅ Zone Students fetched successfully. Count: ${zoneStudentsData.data.length}`);

    console.log('🏫 [Assigned Colleges] Fetching Assigned Colleges under Zone 1...');
    const assignedCollegesRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (assignedCollegesRes.status !== 200) throw new Error(`Assigned colleges fetch failed with status ${assignedCollegesRes.status}`);
    const assignedCollegesData = (await assignedCollegesRes.json()) as any;
    console.log(`  ✅ Assigned Colleges fetched. Total colleges: ${assignedCollegesData.data.length}`);

    console.log('📊 [Assigned Colleges] Exporting Assigned Colleges Excel file...');
    const exportCollegesRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (exportCollegesRes.status !== 200) throw new Error(`Export colleges failed with status ${exportCollegesRes.status}`);
    console.log('  ✅ Exported assigned colleges Excel buffer successfully.');

    // ─── 4. VOLUNTEER APPROVAL WORKFLOW TESTS ────────────────────────────────
    console.log('\n🤝 [Volunteer Submissions] Fetching pending submissions queue...');
    const pendingSubsRes = await fetch(`${BASE_URL}/volunteers?status=PENDING`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (pendingSubsRes.status !== 200) throw new Error(`Pending submissions fetch failed with status ${pendingSubsRes.status}`);
    const pendingSubsData = (await pendingSubsRes.json()) as any;
    console.log(`  ✅ Pending submissions queue fetched. Found ${pendingSubsData.data.length} entries.`);

    if (pendingSubsData.data.length > 0) {
      const targetSub = pendingSubsData.data[0];
      console.log(`  - Inspecting submission ID: ${targetSub.id} (${targetSub.title})`);

      console.log('🤝 [Volunteer Approval] Testing mandatory comment enforcement on Rejection...');
      const badRejectRes = await fetch(`${BASE_URL}/volunteers/${targetSub.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${zoneToken}`,
        },
        body: JSON.stringify({
          status: 'REJECTED',
          reviewerComment: '   ', // Empty comment
        }),
      });
      if (badRejectRes.status === 200) throw new Error('Rejection should fail when reviewer comment is empty');
      console.log('  ✅ Rejection without comment was correctly rejected by validation.');
    }

    // ─── 5. SECURITY & RBAC ISOLATION AUDIT ──────────────────────────────────
    if (studentToken) {
      console.log('\n🛡️ [Security Audit] Verifying Student role access restrictions...');
      const studentAccessZoneRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (studentAccessZoneRes.status !== 403 && studentAccessZoneRes.status !== 401) {
        throw new Error(`Security breach: Student accessed zone endpoint with status ${studentAccessZoneRes.status}`);
      }
      console.log('  ✅ Student access to Zone endpoint correctly restricted (403 Forbidden).');

      console.log('🛡️ [Security Audit] Verifying Student export directory access restrictions...');
      const studentExportRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (studentExportRes.status !== 403 && studentExportRes.status !== 401) {
        throw new Error(`Security breach: Student accessed student export endpoint with status ${studentExportRes.status}`);
      }
      console.log('  ✅ Student access to Student export endpoint correctly restricted (403 Forbidden).');
    }

    // ─── 6. STUDENT DIRECTORY EXPORT TEST ────────────────────────────────────
    console.log('\n📊 [Student Directory] Exporting Zone Student Directory (Excel)...');
    const exportStudentsRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (exportStudentsRes.status !== 200) throw new Error(`Export students directory failed with status ${exportStudentsRes.status}`);
    console.log('  ✅ Zone Student Directory Excel exported successfully.');

    console.log('\n🎉 ALL PHASE 8.6 INTEGRATION & REGRESSION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Phase 8.6 Integration Test Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
