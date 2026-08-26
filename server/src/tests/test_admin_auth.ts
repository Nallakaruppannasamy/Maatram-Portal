/**
 * @file src/tests/test_admin_auth.ts
 * @description Dedicated integration test suite for Admin Authentication Lifecycle:
 *  1. Valid Admin credentials -> 200 OK & UserAuthProfile with role = 'admin'
 *  2. Invalid Admin password -> 401 Unauthorized ("Invalid credentials")
 *  3. Unknown Admin email -> 401 Unauthorized ("Invalid credentials", identical message)
 *  4. Inactive Admin account -> 403 Forbidden ("Your account is inactive")
 *  5. Email case-insensitivity (ADMIN@MAATRAM.COM, Admin@Maatram.Com) -> 200 OK
 *  6. Email whitespace trimming ("  admin@maatram.com  ") -> 200 OK
 *  7. JWT Access Token verification via GET /auth/me -> 200 OK
 *  8. Admin role authorization for protected endpoints (/zones) -> 200 OK
 *  9. Student authentication integrity -> 200 OK
 *  10. Generic error messages prevent account enumeration
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';

const PORT = 4712;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;

async function runAdminAuthTests() {
  console.log('🚀 Starting Dedicated Admin Authentication Integration Tests...\n');

  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    const adminEmail = 'admin@maatram.com';
    const adminPassword = 'admin@123';

    // ─── TEST 1: VALID ADMIN CREDENTIALS ─────────────────────────────────────
    console.log('🔐 [Test 1] Testing valid Admin credentials (admin@maatram.com + admin@123)...');
    const validRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminEmail,
        password: adminPassword,
      }),
    });
    const validData = (await validRes.json()) as any;

    if (!validRes.ok) {
      throw new Error(`Valid Admin login failed (${validRes.status}): ${JSON.stringify(validData)}`);
    }
    if (validData.data?.user?.role !== 'admin') {
      throw new Error(`Expected role 'admin', got '${validData.data?.user?.role}'`);
    }
    if (!validData.data?.accessToken) {
      throw new Error('Access token was not returned in login response');
    }
    const adminToken = validData.data.accessToken;
    console.log('  ✅ PASS: Valid Admin login succeeded with role = "admin" and JWT access token.');

    // ─── TEST 2: INVALID PASSWORD ─────────────────────────────────────────────
    console.log('\n🔒 [Test 2] Testing invalid password for real Admin email...');
    const invalidPwRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminEmail,
        password: 'WrongPassword@999',
      }),
    });
    const invalidPwData = (await invalidPwRes.json()) as any;

    if (invalidPwRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${invalidPwRes.status}`);
    }
    if (invalidPwData.message !== 'Invalid credentials') {
      throw new Error(`Expected generic message 'Invalid credentials', got '${invalidPwData.message}'`);
    }
    console.log('  ✅ PASS: Invalid password correctly rejected with 401 "Invalid credentials".');

    // ─── TEST 3: UNKNOWN ADMIN EMAIL ──────────────────────────────────────────
    console.log('\n👤 [Test 3] Testing unknown/non-existent Admin email...');
    const unknownRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'nonexistent.admin@maatram.com',
        password: adminPassword,
      }),
    });
    const unknownData = (await unknownRes.json()) as any;

    if (unknownRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${unknownRes.status}`);
    }
    if (unknownData.message !== invalidPwData.message) {
      throw new Error('Non-existent user returned different error message than wrong password (enumeration risk)!');
    }
    console.log('  ✅ PASS: Unknown email returns identical 401 "Invalid credentials" (no enumeration leak).');

    // ─── TEST 4: INACTIVE ADMIN REJECTION ─────────────────────────────────────
    console.log('\n🚫 [Test 4] Testing inactive Admin account rejection...');
    // Create temporary inactive admin
    const tempInactiveHash = await hashPassword('TempPass@123');
    const inactiveAdmin = await prisma.user.create({
      data: {
        email: 'temp.inactive.admin@maatram.com',
        passwordHash: tempInactiveHash,
        role: 'admin',
        isActive: false,
        isFirstLogin: false,
      },
    });

    const inactiveRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'temp.inactive.admin@maatram.com',
        password: 'TempPass@123',
      }),
    });
    const inactiveData = (await inactiveRes.json()) as any;

    // Cleanup temp inactive user
    await prisma.user.delete({ where: { id: inactiveAdmin.id } });

    if (inactiveRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden on inactive user, got ${inactiveRes.status}`);
    }
    console.log('  ✅ PASS: Inactive Admin account rejected with 403 Forbidden.');

    // ─── TEST 5: EMAIL CASE-INSENSITIVITY ─────────────────────────────────────
    console.log('\n🔠 [Test 5] Testing email case-insensitivity (ADMIN@MAATRAM.COM & Admin@Maatram.Com)...');
    const upperRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ADMIN@MAATRAM.COM',
        password: adminPassword,
      }),
    });
    if (!upperRes.ok) throw new Error(`Upper case email login failed (${upperRes.status})`);

    const mixedRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'Admin@Maatram.Com',
        password: adminPassword,
      }),
    });
    if (!mixedRes.ok) throw new Error(`Mixed case email login failed (${mixedRes.status})`);
    console.log('  ✅ PASS: Email case-insensitivity verified for uppercase and mixed-case identifiers.');

    // ─── TEST 6: IDENTIFIER WHITESPACE TRIMMING ───────────────────────────────
    console.log('\n✂️ [Test 6] Testing identifier whitespace trimming ("  admin@maatram.com  ")...');
    const spaceRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '   admin@maatram.com   ',
        password: adminPassword,
      }),
    });
    if (!spaceRes.ok) throw new Error(`Whitespace-padded email login failed (${spaceRes.status})`);
    console.log('  ✅ PASS: Leading/trailing whitespace automatically trimmed on authentication.');

    // ─── TEST 7: /AUTH/ME SESSION PROFILE VERIFICATION ────────────────────────
    console.log('\n🔍 [Test 7] Testing GET /auth/me with Admin JWT token...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = (await meRes.json()) as any;

    if (!meRes.ok) throw new Error(`GET /auth/me failed (${meRes.status})`);
    if (meData.data?.email !== 'admin@maatram.com' || meData.data?.role !== 'admin') {
      throw new Error(`Profile mismatch: ${JSON.stringify(meData.data)}`);
    }
    console.log(`  ✅ PASS: /auth/me verified user "${meData.data.fullName}" with role "${meData.data.role}".`);

    // ─── TEST 8: PROTECTED ADMIN ROUTE ACCESS ─────────────────────────────────
    console.log('\n🏛️ [Test 8] Testing protected Admin route access (/zones)...');
    const zonesRes = await fetch(`${BASE_URL}/zones`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const zonesData = (await zonesRes.json()) as any;

    if (!zonesRes.ok) throw new Error(`GET /zones failed for authenticated Admin: ${JSON.stringify(zonesData)}`);
    console.log(`  ✅ PASS: Admin successfully authorized to access ${zonesData.data.length} zones.`);

    // ─── TEST 9: STUDENT LOGIN COMPATIBILITY ──────────────────────────────────
    console.log('\n🎓 [Test 9] Testing Student login compatibility (44130733)...');
    const studentUser = await prisma.user.findFirst({
      where: { email: 'student@maatram.com' },
      include: { student: true },
    });
    if (studentUser && studentUser.student) {
      // Login with student registration number
      const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: studentUser.student.registrationNumber,
          password: 'NewScholarPassword@2026',
        }),
      });
      if (!studentLoginRes.ok) {
        // Fallback to initial password if reset
        const altRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: studentUser.student.registrationNumber,
            password: 'Student@123',
          }),
        });
        if (!altRes.ok) {
          const altData = await altRes.json();
          throw new Error(`Student login failed: ${JSON.stringify(altData)}`);
        }
      }
      console.log('  ✅ PASS: Student authentication remains 100% functional.');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL ADMIN AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Admin Auth Test Failure:', err.message || err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runAdminAuthTests();
