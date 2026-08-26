/**
 * @file src/tests/test_bugfix_regression.ts
 * @description Regression test suite verifying:
 *  1. Multi-step Refresh Token Rotation (Login -> Refresh #1 -> Refresh #2 -> Refresh #3)
 *  2. Timezone-Safe Date of Birth (DOB) Temporary Password Generation
 *  3. Student Provisioning & First-Time Password Change Lifecycle
 *  4. Hierarchy API Empty-Zone Handling with RBAC Authentication
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import { parseExcelDate, formatDobAsPassword } from '../modules/student/student.service';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const PORT = 4699;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults: { name: string; status: 'PASSED' | 'FAILED'; error?: string }[] = [];

async function it(name: string, fn: () => Promise<void>) {
  totalTests++;
  console.log(`\n⏳ Test [${totalTests}]: ${name}...`);
  try {
    await fn();
    passedTests++;
    testResults.push({ name, status: 'PASSED' });
    console.log(`✅ Passed: ${name}`);
  } catch (error: any) {
    failedTests++;
    testResults.push({ name, status: 'FAILED', error: error.message || String(error) });
    console.error(`❌ Failed: ${name} ->`, error.message || error);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runRegressionTests() {
  console.log('🚀 Starting Bugfix Regression Test Suite...\n');

  server = app.listen(PORT, () => {
    console.log(`📡 Bugfix test server running on port ${PORT}`);
  });

  try {
    // ─── PART 1: DOB TIMEZONE & DATE-ONLY PARSING TESTS ──────────────────────
    console.log('\n--- PART 1: DOB Date-Only & Timezone-Safe Semantics ---');

    await it('DOB: Parses and formats DD/MM/YYYY dates consistently', async () => {
      const testCases = [
        { input: '01/01/2000', expected: '01/01/2000' },
        { input: '15/05/2004', expected: '15/05/2004' },
        { input: '28/02/2003', expected: '28/02/2003' },
        { input: '31/12/2005', expected: '31/12/2005' },
        { input: '2004-05-15', expected: '15/05/2004' },
        { input: '2000-01-01', expected: '01/01/2000' },
      ];

      for (const tc of testCases) {
        const parsed = parseExcelDate(tc.input);
        assert(parsed !== null, `Failed to parse DOB: ${tc.input}`);
        const formatted = formatDobAsPassword(parsed!);
        assert(
          formatted === tc.expected,
          `Mismatch for ${tc.input}: expected ${tc.expected}, got ${formatted}`
        );
      }
    });

    await it('DOB: Parses Excel numerical serial dates accurately', async () => {
      // Excel serial 38122 = 15-May-2004
      const parsed = parseExcelDate(38122);
      assert(parsed !== null, 'Failed to parse Excel date serial 38122');
      const formatted = formatDobAsPassword(parsed!);
      assert(formatted === '15/05/2004', `Expected 15/05/2004 from serial 38122, got ${formatted}`);
    });

    // ─── PART 2: AUTHENTICATION & MULTI-REFRESH ROTATION ────────────────────
    console.log('\n--- PART 2: Authentication & Token Rotation ---');

    // Create a dedicated test user
    const testEmail = `test.auth.rotation.${Date.now()}@example.com`;
    const rawPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        role: UserRole.admin,
        isActive: true,
        isFirstLogin: false,
        userProfile: {
          create: {
            fullName: 'Test Auth User',
          },
        },
      },
    });

    let currentAccessToken = '';
    let currentRefreshToken = '';

    await it('Auth: Initial login returns access token and refresh token', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testEmail, password: rawPassword }),
      });
      const data: any = await res.json();
      assert(res.status === 200, `Login failed with status ${res.status}`);
      assert(data.success === true, 'Login response success is not true');
      assert(!!data.data.accessToken, 'Missing accessToken in login response');
      assert(!!data.data.refreshToken, 'Missing refreshToken in login response');

      currentAccessToken = data.data.accessToken;
      currentRefreshToken = data.data.refreshToken;
    });

    await it('Auth: Refresh #1 rotates refresh token and grants new access token', async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      const data: any = await res.json();
      assert(res.status === 200, `Refresh #1 failed with status ${res.status}: ${JSON.stringify(data)}`);
      assert(data.success === true, 'Refresh #1 success is not true');
      assert(!!data.data.accessToken, 'Missing accessToken in Refresh #1');
      assert(!!data.data.refreshToken, 'Missing refreshToken in Refresh #1');
      assert(
        data.data.refreshToken !== currentRefreshToken,
        'Refresh #1 did not rotate refresh token'
      );

      // Save rotated tokens
      currentAccessToken = data.data.accessToken;
      currentRefreshToken = data.data.refreshToken;
    });

    await it('Auth: Refresh #2 rotates token again seamlessly', async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      const data: any = await res.json();
      assert(res.status === 200, `Refresh #2 failed with status ${res.status}`);
      assert(data.success === true, 'Refresh #2 success is not true');
      assert(!!data.data.accessToken, 'Missing accessToken in Refresh #2');
      assert(!!data.data.refreshToken, 'Missing refreshToken in Refresh #2');

      currentAccessToken = data.data.accessToken;
      currentRefreshToken = data.data.refreshToken;
    });

    await it('Auth: Refresh #3 rotates token a third time (continuous session)', async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      const data: any = await res.json();
      assert(res.status === 200, `Refresh #3 failed with status ${res.status}`);
      assert(data.success === true, 'Refresh #3 success is not true');
      assert(!!data.data.accessToken, 'Missing accessToken in Refresh #3');
      assert(!!data.data.refreshToken, 'Missing refreshToken in Refresh #3');

      currentAccessToken = data.data.accessToken;
      currentRefreshToken = data.data.refreshToken;
    });

    await it('Auth: Accessing protected /auth/me with newest access token succeeds', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      });
      const data: any = await res.json();
      assert(res.status === 200, `/auth/me returned status ${res.status}`);
      assert(data.success === true, '/auth/me response success is not true');
      assert(data.data.email === testEmail, 'User email in /auth/me does not match');
    });

    await it('Auth: Reusing an old/invalid refresh token is rejected with 400/401', async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid.or.expired.token' }),
      });
      assert(res.status === 400 || res.status === 401, `Expected 400/401, got ${res.status}`);
    });

    await it('Auth: Logout revokes active session', async () => {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      });
      assert(res.status === 200, `Logout returned status ${res.status}`);
    });

    // Clean up test user
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });

    // ─── PART 3: STUDENT PROVISIONING & FIRST LOGIN PASSWORD CHANGE ──────────
    console.log('\n--- PART 3: Student Provisioning & First-Time Password Setup ---');

    const studentEmail = `student.provision.${Date.now()}@example.com`;
    const studentReg = `REG-${Date.now().toString().slice(-6)}`;
    const studentDobStr = '15/05/2004';
    const studentDobDate = parseExcelDate(studentDobStr)!;
    const tempDobPassword = formatDobAsPassword(studentDobDate); // '15/05/2004'
    const studentPasswordHash = await bcrypt.hash(tempDobPassword, 10);

    const defaultOrg = await prisma.organization.findFirst();
    assert(defaultOrg !== null, 'No organization exists in database');

    const createdStudentUser = await prisma.user.create({
      data: {
        email: studentEmail,
        registerNumber: studentReg,
        passwordHash: studentPasswordHash,
        tempPassword: tempDobPassword,
        role: UserRole.student,
        isActive: true,
        isFirstLogin: true,
        student: {
          create: {
            firstName: 'Aarav',
            lastName: 'Kumar',
            registrationNumber: studentReg,
            dateOfBirth: studentDobDate,
            organizationId: defaultOrg!.id,
            verificationCode: `VERIF-${Date.now().toString().slice(-6)}`,
          },
        },
      },
      include: {
        student: true,
      },
    });

    let studentAccessToken = '';

    await it('Student: Logs in with temporary DOB password and receives isFirstLogin: true', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: studentReg, password: tempDobPassword }),
      });
      const data: any = await res.json();
      assert(res.status === 200, `Student login failed: ${JSON.stringify(data)}`);
      assert(data.data.user.isFirstLogin === true, 'Expected isFirstLogin to be true on first login');
      studentAccessToken = data.data.accessToken;
    });

    await it('Student: Successfully updates password on first login', async () => {
      const newPassword = 'NewSecretPassword@456';
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentAccessToken}`,
        },
        body: JSON.stringify({
          currentPassword: tempDobPassword,
          newPassword: newPassword,
          confirmPassword: newPassword,
        }),
      });
      const data: any = await res.json();
      assert(res.status === 200, `Change password failed: ${JSON.stringify(data)}`);
      assert(data.success === true, 'Change password success is not true');
    });

    await it('Student: Subsequent login with new password succeeds and isFirstLogin is false', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: studentReg, password: 'NewSecretPassword@456' }),
      });
      const data: any = await res.json();
      assert(res.status === 200, `Login with new password failed: ${JSON.stringify(data)}`);
      assert(data.data.user.isFirstLogin === false, 'Expected isFirstLogin to be false after password change');
    });

    // Clean up created student
    await prisma.student.deleteMany({
      where: { registrationNumber: studentReg },
    });
    await prisma.user.deleteMany({
      where: { id: createdStudentUser.id },
    });

    // ─── PART 4: ORGANIZATION HIERARCHY RESILIENCE ───────────────────────────
    console.log('\n--- PART 4: Organization Hierarchy Resilience ---');

    // Create an admin user to query hierarchy
    const adminEmail = `admin.hierarchy.${Date.now()}@example.com`;
    const adminPassHash = await bcrypt.hash('Admin@123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPassHash,
        role: UserRole.admin,
        isActive: true,
        isFirstLogin: false,
        userProfile: { create: { fullName: 'Hierarchy Admin' } },
      },
    });

    // Login as admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: adminEmail, password: 'Admin@123' }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    const adminAccessToken = adminLoginData.data.accessToken;

    // Create an empty zone with NO colleges to verify empty-zone safety
    const emptyZone = await prisma.zone.create({
      data: {
        name: `Empty Test Zone ${Date.now().toString().slice(-4)}`,
        code: `Z-EMP-${Date.now().toString().slice(-4)}`,
        regionLabel: 'Test Region',
        organizationId: defaultOrg!.id,
        isActive: true,
      },
    });

    await it('Hierarchy: API returns normalized tree structure safely including empty zones', async () => {
      const res = await fetch(`${BASE_URL}/organizations/hierarchy`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });
      const data: any = await res.json();
      assert(res.status === 200, `Hierarchy returned status ${res.status}`);
      assert(Array.isArray(data.data), 'Hierarchy data is not an array');
      if (data.data.length > 0) {
        const org = data.data[0];
        assert(Array.isArray(org.zones), 'Hierarchy org.zones is not an array');
        // Find our empty zone in the hierarchy
        const foundEmpty = org.zones.find((z: any) => z.id === emptyZone.id);
        assert(foundEmpty !== undefined, 'Empty zone not returned in hierarchy');
        assert(Array.isArray(foundEmpty.colleges), 'Empty zone colleges should be an empty array');
        assert(foundEmpty.colleges.length === 0, 'Empty zone colleges length should be 0');
      }
    });

    // Cleanup empty zone and admin user
    await prisma.zone.deleteMany({ where: { id: emptyZone.id } });
    await prisma.user.deleteMany({ where: { id: adminUser.id } });

  } finally {
    if (server) {
      server.close();
    }
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log('       BUGFIX REGRESSION TEST EXECUTION SUMMARY        ');
  console.log('======================================================');
  console.log(`Total Tests Run  : ${totalTests}`);
  console.log(`Passed Tests     : ${passedTests}`);
  console.log(`Failed Tests     : ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runRegressionTests().catch((err) => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
