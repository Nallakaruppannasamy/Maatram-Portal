/**
 * @file src/tests/test_phase4.ts
 * @description Comprehensive programmatic integration tests for Phase 4.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const PORT = 4567;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminAccessToken = '';
let staffAccessToken = '';
let testOrgId = '';
let testZoneId = '';
let testUserId = '';
let tempPassword = '';
const newPassword = 'NewSecretPassword@123';

async function runTests() {
  console.log('🚀 Starting Phase 4 Integration Tests...');

  // Start Express server on ephemeral port
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // Clean up any leftovers from previous failed test runs
    console.log('🧼 Cleaning up previous test records...');
    await prisma.user.deleteMany({
      where: { email: 'p4.test.user@maatram.org' },
    });
    await prisma.zone.deleteMany({
      where: { code: 'P4-ZONE' },
    });
    await prisma.organization.deleteMany({
      where: { code: 'P4-ORG' },
    });
    console.log('🧼 Cleanup completed.');

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

    // ─── 2. ORGANIZATION CRUD ────────────────────────────────────────────────
    console.log('\n🏢 [Organization] Testing Organization CRUD...');

    // Create Organization
    const createOrgRes = await fetch(`${BASE_URL}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: 'Phase 4 Testing Organization',
        code: 'P4-ORG',
        description: 'Temporary organization for integration testing',
      }),
    });

    const createOrgData = (await createOrgRes.json()) as any;
    if (!createOrgRes.ok) {
      throw new Error(`Create Organization failed: ${JSON.stringify(createOrgData)}`);
    }
    testOrgId = createOrgData.data.id;
    console.log(`✅ Organization created successfully. ID: ${testOrgId}`);

    // Read Organization
    const getOrgRes = await fetch(`${BASE_URL}/organizations/${testOrgId}`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const getOrgData = (await getOrgRes.json()) as any;
    if (!getOrgRes.ok || getOrgData.data.code !== 'P4-ORG') {
      throw new Error(`Read Organization failed: ${JSON.stringify(getOrgData)}`);
    }
    console.log('✅ Organization retrieval validated.');

    // List Organizations with search & pagination
    const listOrgsRes = await fetch(`${BASE_URL}/organizations?search=Phase&limit=5`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const listOrgsData = (await listOrgsRes.json()) as any;
    if (!listOrgsRes.ok || listOrgsData.data.length === 0 || !listOrgsData.meta) {
      throw new Error(`List Organizations failed: ${JSON.stringify(listOrgsData)}`);
    }
    console.log(
      `✅ Organization pagination & search validated (totalCount: ${listOrgsData.meta.totalCount}).`
    );

    // Update Organization
    const updateOrgRes = await fetch(`${BASE_URL}/organizations/${testOrgId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: 'Phase 4 Testing Org - Updated Name',
        description: 'Updated description details',
      }),
    });
    const updateOrgData = (await updateOrgRes.json()) as any;
    if (!updateOrgRes.ok || updateOrgData.data.name !== 'Phase 4 Testing Org - Updated Name') {
      throw new Error(`Update Organization failed: ${JSON.stringify(updateOrgData)}`);
    }
    console.log('✅ Organization update validated.');

    // ─── 3. ZONE CRUD ────────────────────────────────────────────────────────
    console.log('\n📍 [Zone] Testing Zone CRUD...');

    // Create Zone
    const createZoneRes = await fetch(`${BASE_URL}/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: 'Phase 4 Test Zone',
        code: 'P4-ZONE',
        regionLabel: 'Chennai Central Region',
        organizationId: testOrgId,
      }),
    });
    const createZoneData = (await createZoneRes.json()) as any;
    if (!createZoneRes.ok) {
      throw new Error(`Create Zone failed: ${JSON.stringify(createZoneData)}`);
    }
    testZoneId = createZoneData.data.id;
    console.log(`✅ Zone created successfully. ID: ${testZoneId}`);

    // Read Zone
    const getZoneRes = await fetch(`${BASE_URL}/zones/${testZoneId}`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const getZoneData = (await getZoneRes.json()) as any;
    if (!getZoneRes.ok || getZoneData.data.code !== 'P4-ZONE') {
      throw new Error(`Read Zone failed: ${JSON.stringify(getZoneData)}`);
    }
    console.log('✅ Zone retrieval validated.');

    // List Zones
    const listZonesRes = await fetch(`${BASE_URL}/zones?organizationId=${testOrgId}`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const listZonesData = (await listZonesRes.json()) as any;
    if (!listZonesRes.ok || listZonesData.data.length === 0) {
      throw new Error(`List Zones failed: ${JSON.stringify(listZonesData)}`);
    }
    console.log('✅ Zone filtering by Organization ID validated.');

    // ─── 4. USER ADMINISTRATIVE MANAGEMENT ───────────────────────────────────
    console.log('\n👥 [User Management] Testing User Provisioning and Status Actions...');

    // Create User (with auto-generated temp password)
    const createUserRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        email: 'p4.test.user@maatram.org',
        role: 'zone',
        employeeId: 'P4-EMP-99',
        fullName: 'Phase 4 Test Staff User',
        mobile: '9988776655',
        designation: 'Temporary Incharge',
        organizationId: testOrgId,
        zoneId: testZoneId,
      }),
    });
    const createUserData = (await createUserRes.json()) as any;
    if (!createUserRes.ok) {
      throw new Error(`Create User failed: ${JSON.stringify(createUserData)}`);
    }
    testUserId = createUserData.data.id;
    // For integration testing of first-time login, set a test password hash in DB
    tempPassword = 'TempPassword@123';
    await prisma.user.update({
      where: { id: testUserId },
      data: { passwordHash: await bcrypt.hash(tempPassword, 10) },
    });
    console.log(`✅ User created and provisioned successfully.`);
    console.log(`   User ID: ${testUserId}`);

    // List Users & Search
    const listUsersRes = await fetch(`${BASE_URL}/users?search=Phase&organizationId=${testOrgId}`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const listUsersData = (await listUsersRes.json()) as any;
    if (!listUsersRes.ok || listUsersData.data.length === 0) {
      throw new Error(`List Users/Search failed: ${JSON.stringify(listUsersData)}`);
    }
    console.log('✅ User search & organization filtering validated.');

    // Deactivate User
    const deactivateRes = await fetch(`${BASE_URL}/users/${testUserId}/deactivate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    if (!deactivateRes.ok) {
      throw new Error('Deactivating user failed');
    }
    console.log('✅ User account deactivation validated.');

    // Try logging in with deactivated user
    const loginFailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'p4.test.user@maatram.org',
        password: tempPassword,
      }),
    });
    if (loginFailRes.ok) {
      throw new Error('Deactivated user was allowed to login');
    }
    console.log('✅ Login blocking for deactivated user validated.');

    // Reactivate User
    const activateRes = await fetch(`${BASE_URL}/users/${testUserId}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    if (!activateRes.ok) {
      throw new Error('Activating user failed');
    }
    console.log('✅ User account activation validated.');

    // ─── 5. USER FIRST-LOGIN & PASSWORD CHANGE ──────────────────────────────
    console.log('\n🔑 [Auth Transition] Logging in with temp password & changing it...');

    // Login with temp password
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'p4.test.user@maatram.org',
        password: tempPassword,
      }),
    });
    const staffLoginData = (await staffLoginRes.json()) as any;
    if (!staffLoginRes.ok || !staffLoginData.data.user.isFirstLogin) {
      throw new Error(`Staff login with temp password failed: ${JSON.stringify(staffLoginData)}`);
    }
    staffAccessToken = staffLoginData.data.accessToken;
    console.log('✅ Staff logged in successfully (first login flagged).');

    // Change Password
    const changePwRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: tempPassword,
        newPassword: newPassword,
        confirmPassword: newPassword,
      }),
    });
    const changePwData = (await changePwRes.json()) as any;
    if (!changePwRes.ok) {
      throw new Error(`Password change failed: ${JSON.stringify(changePwData)}`);
    }
    console.log('✅ Password successfully changed from temp password.');

    // ─── 6. PROFILE SELF-SERVICE ────────────────────────────────────────────
    console.log('\n🧑 [Profile] Testing Profile Self-Service...');

    // Read Profile
    const getProfileRes = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${staffAccessToken}` },
    });
    const getProfileData = (await getProfileRes.json()) as any;
    if (!getProfileRes.ok || getProfileData.data.fullName !== 'Phase 4 Test Staff User') {
      throw new Error(`Read Profile failed: ${JSON.stringify(getProfileData)}`);
    }
    console.log('✅ Self-service profile retrieval validated.');

    // Update Profile
    const updateProfileRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffAccessToken}`,
      },
      body: JSON.stringify({
        fullName: 'Phase 4 Test Staff User - Updated Name',
        mobile: '9988776611',
        designation: 'Senior Coordinator',
        bio: 'Just another test volunteer helping children.',
      }),
    });
    const updateProfileData = (await updateProfileRes.json()) as any;
    if (
      !updateProfileRes.ok ||
      updateProfileData.data.fullName !== 'Phase 4 Test Staff User - Updated Name'
    ) {
      throw new Error(`Update Profile failed: ${JSON.stringify(updateProfileData)}`);
    }
    console.log('✅ Self-service profile update validated.');

    // ─── 7. AUDIT LOGGING VERIFICATION ───────────────────────────────────────
    console.log('\n🛡️ [Audit Log] Checking administrative audit logs in Database...');
    const logs = await prisma.auditLog.findMany({
      where: {
        targetEntityType: { in: ['organization', 'zone', 'user', 'profile'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (logs.length === 0) {
      throw new Error('No audit logs found for administrative actions');
    }

    console.log(`✅ Audit Logs found in database: ${logs.length} entries.`);
    logs.slice(0, 5).forEach((log) => {
      console.log(`   - [${log.action}] Target: ${log.targetLabel} | Code: ${log.logCode}`);
    });

    console.log('\n🎉 ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error: any) {
    console.error('\n❌ Test execution failed with error:');
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    // Stop server
    if (server) {
      server.close(() => {
        console.log('🔌 Test server shut down.');
      });
    }
    await prisma.$disconnect();
  }
}

runTests();
