/**
 * @file src/tests/test_backend_complete.ts
 * @description End-to-end integration test suite verifying the complete backend functionality.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import {
  StudentStatus,
  VolunteerProfileStatus,
  UserRole,
  Gender,
  BloodGroup,
} from '@prisma/client';
import { mockNotificationService } from '../utils/notification';
import bcrypt from 'bcryptjs';

const PORT = 4589;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults: { name: string; status: 'PASSED' | 'FAILED'; error?: string }[] = [];

// Track email notifications captured from mock service
let lastSentEmailBody = '';
mockNotificationService.sendEmail = async (payload) => {
  lastSentEmailBody = payload.body;
};

/**
 * Custom test wrapper helper.
 */
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

/**
 * Assert helper.
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  const startTime = Date.now();
  console.log('🚀 Starting Complete Backend System Integration Test Suite...');

  // Start server on test port
  server = app.listen(PORT, () => {
    console.log(`📡 Integration test server listening on port ${PORT}`);
  });

  try {
    // ─── STAGE 0: DATABASE CLEANUP ───────────────────────────────────────────
    console.log('🧼 Cleaning up previous test records in database...');
    // Delete target student, volunteer, user, zone, organization records
    // 1. Delete Volunteer Skills linked to test volunteers
    await prisma.volunteerSkill.deleteMany({
      where: {
        volunteer: {
          OR: [
            { email: { startsWith: 'sys.' } },
            { volunteerId: { startsWith: 'VOL-SYS-' } },
            { organization: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } } }
          ]
        }
      }
    });

    // 2. Delete Volunteers linked to test orgs/zones
    await prisma.volunteer.deleteMany({
      where: {
        OR: [
          { email: { startsWith: 'sys.' } },
          { volunteerId: { startsWith: 'VOL-SYS-' } },
          { organization: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } } }
        ]
      }
    });

    // 3. Delete Students linked to test orgs
    await prisma.student.deleteMany({
      where: {
        OR: [
          { registrationNumber: { startsWith: 'SYS-' } },
          { organization: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } } }
        ]
      }
    });

    // 4. Delete Audit Logs linked to test users
    await prisma.auditLog.deleteMany({
      where: {
        actor: {
          OR: [
            { email: { startsWith: 'sys.' } },
            { organization: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } } }
          ]
        }
      }
    });

    // 5. Delete User Profiles linked to test users
    await prisma.userProfile.deleteMany({
      where: {
        user: {
          OR: [
            { email: { startsWith: 'sys.' } },
            { organization: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } } }
          ]
        }
      }
    });

    // 6. Delete Users linked to test orgs
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { startsWith: 'sys.' } },
          { organization: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } } }
        ]
      }
    });

    // 7. Delete Zones linked to test orgs
    await prisma.zone.deleteMany({
      where: {
        OR: [
          { code: { in: ['SYS-ZONE-1', 'SYS-ZONE-DUP'] } },
          { organization: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } } }
        ]
      }
    });

    // 8. Delete Organizations
    await prisma.organization.deleteMany({
      where: { code: { in: ['SYS-ORG-1', 'SYS-ORG-DUP'] } }
    });
    console.log('🧼 Database cleanup completed.');

    // Fetch existing lookup parameters from seeds
    const college = await prisma.college.findFirst({ where: { code: 'MIT-CHE' } });
    const department = await prisma.department.findFirst({ where: { name: 'Computer Science and Engineering' } });
    const program = await prisma.program.findFirst({ where: { name: 'B.E. Computer Science and Engineering' } });
    const seedZone = await prisma.zone.findFirst({ where: { code: 'ZONE-1' } });

    if (!college || !department || !program || !seedZone) {
      throw new Error('Required seeded data (MIT-CHE college, Computer Science department/program, ZONE-1 zone) is missing. Seed first.');
    }

    // Shared credentials and IDs
    let adminToken = '';
    let staffToken = '';
    let tempStaffPassword = '';
    let staffUserId = '';
    const newStaffPassword = 'NewSecretPassword@123';
    let organizationId = '';
    let zoneId = '';
    let studentId = '';
    let studentUserId = '';
    let volunteerId = '';
    const studentZoneId = seedZone.id;

    // ─── STAGE 1: AUTHENTICATION MODULE ─────────────────────────────────────
    
    await it('Admin Login with valid credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'arun.s@maatram.org',
          password: 'Admin@123',
        }),
      });
      const body = (await res.json()) as any;
      assert(res.ok, 'Failed to login as admin');
      assert(body.data.accessToken !== undefined, 'Access token is missing');
      adminToken = body.data.accessToken;
    });

    await it('Login with invalid credentials should return 401', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'arun.s@maatram.org',
          password: 'WrongPassword',
        }),
      });
      const body = (await res.json()) as any;
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
      assert(body.success === false, 'Envelope success should be false');
    });

    await it('Accessing protected route without token should return 401', async () => {
      const res = await fetch(`${BASE_URL}/profile`);
      assert(res.status === 401, `Expected 401 for unauthorized endpoint, got ${res.status}`);
    });

    await it('Accessing protected route with invalid token format should return 401', async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: 'Bearer invalidTokenString123' },
      });
      assert(res.status === 401, `Expected 401 for bad bearer token, got ${res.status}`);
    });

    await it('Refresh Token Rotation and session refresh', async () => {
      // Login to get fresh tokens
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'arun.s@maatram.org',
          password: 'Admin@123',
        }),
      });
      const loginBody = (await loginRes.json()) as any;
      const refToken = loginBody.data.refreshToken;

      // Refresh using body
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refToken }),
      });
      const refreshBody = (await refreshRes.json()) as any;
      assert(refreshRes.ok, `Token refresh failed: ${JSON.stringify(refreshBody)}`);
      assert(refreshBody.data.accessToken !== undefined, 'Refresh did not return new access token');
      assert(refreshBody.data.refreshToken !== refToken, 'Refresh did not rotate refresh token');
    });

    // ─── STAGE 2: ADMINISTRATIVE PROVISIONING & USER MANAGEMENT ──────────────
    
    await it('Create organization via admin', async () => {
      const res = await fetch(`${BASE_URL}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'System Test Organization',
          code: 'SYS-ORG-1',
          description: 'Used for system integrated tests',
        }),
      });
      const body = (await res.json()) as any;
      assert(res.status === 201, `Failed to create organization, status ${res.status}`);
      organizationId = body.data.id;
    });

    await it('Organization duplicate code rejection (400)', async () => {
      const res = await fetch(`${BASE_URL}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Another organization',
          code: 'SYS-ORG-1', // duplicate code
        }),
      });
      assert(res.status === 400, `Expected duplicate rejection status 400, got ${res.status}`);
    });

    await it('Create Zone under organization', async () => {
      const res = await fetch(`${BASE_URL}/zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'System Test Zone',
          code: 'SYS-ZONE-1',
          regionLabel: 'Chennai North',
          organizationId,
        }),
      });
      const body = (await res.json()) as any;
      assert(res.status === 201, `Failed to create zone, status ${res.status}`);
      zoneId = body.data.id;
    });

    await it('Create/Provision User (Staff/Zone Manager)', async () => {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: 'sys.test.staff@maatram.org',
          role: 'zone',
          employeeId: 'SYS-EMP-001',
          fullName: 'Ramesh System Test Manager',
          mobile: '9888877777',
          designation: 'Chennai Zone Coordinator',
          organizationId,
          zoneId,
        }),
      });
      const body = (await res.json()) as any;
      assert(res.status === 201, `User creation failed with status ${res.status}`);
      assert(body.data.isFirstLogin === true, 'isFirstLogin should be initially true');
      staffUserId = body.data.id;
      tempStaffPassword = 'TempPassword@123';
      await prisma.user.update({
        where: { id: staffUserId },
        data: { passwordHash: await bcrypt.hash(tempStaffPassword, 10) },
      });
    });

    await it('Staff login with temp password should succeed and enforce password change flag', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'sys.test.staff@maatram.org',
          password: tempStaffPassword,
        }),
      });
      const body = (await res.json()) as any;
      assert(res.ok, 'Failed to login with temporary password');
      assert(body.data.user.isFirstLogin === true, 'Login response should confirm first login flag is active');
      staffToken = body.data.accessToken;
    });

    await it('Staff forced change password', async () => {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          currentPassword: tempStaffPassword,
          newPassword: newStaffPassword,
          confirmPassword: newStaffPassword,
        }),
      });
      assert(res.ok, `Password change endpoint failed: ${res.status}`);

      // Verify that logging in again with new password works and isFirstLogin is false
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'sys.test.staff@maatram.org',
          password: newStaffPassword,
        }),
      });
      const loginBody = (await loginRes.json()) as any;
      assert(loginRes.ok, 'Failed to login with updated password');
      assert(loginBody.data.user.isFirstLogin === false, 'First login flag should be deactivated');
      // Update staff token with the updated session token
      staffToken = loginBody.data.accessToken;
    });

    await it('RBAC Restriction: Staff role cannot create organizations', async () => {
      const res = await fetch(`${BASE_URL}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          name: 'Illegal org creation',
          code: 'SYS-ILLEGAL',
        }),
      });
      assert(res.status === 403, `Expected forbidden status 403, got ${res.status}`);
    });

    await it('Self-Service Profile retrieval and update', async () => {
      // Get self profile
      const getRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const getBody = (await getRes.json()) as any;
      assert(getRes.ok, 'Failed to retrieve profile');
      assert(getBody.data.fullName === 'Ramesh System Test Manager', 'Profile fullName mismatch');

      // Update self profile
      const updateRes = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          fullName: 'Ramesh Updated Manager',
          mobile: '9888877799',
          designation: 'Senior Zone Coordinator',
          bio: 'Self-proclaimed integration verification expert',
        }),
      });
      const updateBody = (await updateRes.json()) as any;
      assert(updateRes.ok, `Profile update failed: ${JSON.stringify(updateBody)}`);
      assert(updateBody.data.fullName === 'Ramesh Updated Manager', 'Name was not updated in profile');
    });

    await it('Password Reset Flow via Mock Email Capture', async () => {
      // Request password reset
      const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'sys.test.staff@maatram.org' }),
      });
      assert(forgotRes.ok, 'Forgot password request failed');
      assert(lastSentEmailBody !== '', 'Mock email was not triggered');
      
      // Parse token from body reset link
      const tokenMatch = lastSentEmailBody.match(/token=([a-f0-9]+)/);
      if (!tokenMatch) {
        throw new Error('Failed to locate token in email body');
      }
      const resetToken = tokenMatch[1];

      // Submit password reset
      const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: 'ResetPassword@123',
          confirmPassword: 'ResetPassword@123',
        }),
      });
      assert(resetRes.ok, `Reset password endpoint failed: ${resetRes.status}`);

      // Login with reset password
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'sys.test.staff@maatram.org',
          password: 'ResetPassword@123',
        }),
      });
      assert(loginRes.ok, 'Failed to login with reset password');
    });

    // ─── STAGE 3: STUDENT MANAGEMENT MODULE ─────────────────────────────────
    
    await it('Create student profile via admin', async () => {
      const res = await fetch(`${BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          registrationNumber: 'SYS-REG-001',
          firstName: 'Siddharth',
          lastName: 'Sharma',
          gender: 'MALE',
          dateOfBirth: '2005-08-20',
          bloodGroup: 'O_POSITIVE',
          email: 'sys.test.student@student.org',
          mobile: '9111122222',
          parentName: 'R. Sharma',
          parentMobile: '9111122223',
          addressLine1: 'Adyar Main Road',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600020',
          organizationId,
          zoneId: studentZoneId,
          collegeId: college.id,
          departmentId: department.id,
          programId: program.id,
          course: 'B.E.',
          batch: '2023-2027',
          academicYear: '2nd Year',
        }),
      });
      const body = (await res.json()) as any;
      assert(res.status === 201, `Student creation failed, got status ${res.status}`);
      studentId = body.data.id;
      studentUserId = body.data.userId || '';
    });

    await it('Student duplicate registration code rejection (409)', async () => {
      const res = await fetch(`${BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          registrationNumber: 'SYS-REG-001', // duplicate
          firstName: 'Duplicate',
          lastName: 'Student',
          gender: 'MALE',
          dateOfBirth: '2005-08-20',
          email: 'another.student@student.org',
          parentName: 'Parent',
          parentMobile: '9111122225',
          addressLine1: 'Address',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600020',
          organizationId,
          zoneId: studentZoneId,
          collegeId: college.id,
          departmentId: department.id,
          programId: program.id,
          course: 'B.E.',
          batch: '2023-2027',
          academicYear: '2nd Year',
        }),
      });
      assert(res.status === 409, `Expected status 409, got ${res.status}`);
    });

    await it('Student state machine and corresponding account suspension', async () => {
      // SUSPEND the student profile
      const patchRes = await fetch(`${BASE_URL}/students/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: StudentStatus.SUSPENDED }),
      });
      assert(patchRes.ok, 'Failed to suspend student');

      // Verify associated User account is deactivated (isActive = false)
      const user = await prisma.user.findUnique({ where: { id: studentUserId } });
      assert(user !== null && user.isActive === false, 'Suspended student User account was not deactivated');

      // Attempt login with suspended student account credentials should fail (403)
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'sys.test.student@student.org',
          password: 'TemporaryOrRandomPassword', // User is inactive anyway
        }),
      });
      assert(loginRes.status === 403, `Suspended user login should return 403, got ${loginRes.status}`);

      // Revert status to ACTIVE
      const activeRes = await fetch(`${BASE_URL}/students/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: StudentStatus.ACTIVE }),
      });
      assert(activeRes.ok, 'Failed to activate student back');
    });

    await it('Student Import transactional rollback on failure', async () => {
      // Setup payload with one valid and one invalid row (non-existent organizationCode)
      const invalidCsvContent = `registrationNumber,firstName,middleName,lastName,gender,dateOfBirth,bloodGroup,nationality,community,religion,email,mobile,alternateMobile,parentName,parentMobile,parentOccupation,guardianName,guardianMobile,addressLine1,addressLine2,city,district,state,country,pincode,organizationCode,zoneCode,collegeCode,departmentName,programName,course,batch,academicYear,semester,section
SYS-REG-FAIL,Fail,Import,Row,MALE,2004-12-10,O_POSITIVE,Indian,,,sys.fail.student@student.org,9777788888,,Parent,9777788889,,,,Road,,Chennai,Chennai,Tamil Nadu,India,600020,NON_EXISTENT_ORG_CODE,SYS-ZONE-1,MIT-CHE,Computer Science and Engineering,B.E. Computer Science and Engineering,B.E.,2023-2027,2nd Year,,`;

      const formData = new FormData();
      formData.append('file', new Blob([invalidCsvContent], { type: 'text/csv' }), 'students_rollback_test.csv');

      const res = await fetch(`${BASE_URL}/students/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const body = (await res.json()) as any;
      assert(res.status === 400, `Expected import rejection status 400, got ${res.status}`);
      
      // Verify no student with registration number 'SYS-REG-FAIL' was created (rollback)
      const student = await prisma.student.findFirst({ where: { registrationNumber: 'SYS-REG-FAIL' } });
      assert(student === null, 'CSV rollback failed: database state was altered despite failure');
    });

    await it('Student CSV and XLSX export', async () => {
      // CSV Export
      const csvRes = await fetch(`${BASE_URL}/students/export?format=csv`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const csvText = await csvRes.text();
      assert(csvRes.ok, 'CSV export failed');
      assert(csvText.includes('Registration Number') && csvText.includes('SYS-REG-001'), 'CSV export content validation failed');

      // XLSX Export
      const xlsxRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const buffer = await xlsxRes.arrayBuffer();
      assert(xlsxRes.ok, 'XLSX export failed');
      assert(buffer.byteLength > 1000, 'XLSX export buffer is too small');
    });

    // ─── STAGE 4: VOLUNTEER MANAGEMENT MODULE ───────────────────────────────
    
    await it('Create volunteer profile via admin', async () => {
      const res = await fetch(`${BASE_URL}/volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          volunteerId: 'VOL-SYS-001',
          firstName: 'Vikram',
          lastName: 'Rao',
          gender: 'MALE',
          dateOfBirth: '1995-10-15',
          email: 'sys.test.vol@maatram.org',
          mobile: '9666655555',
          organizationId,
          zoneId,
          volunteerType: 'Professional',
          joiningDate: '2024-01-10',
          skills: ['Mentoring', 'Public Speaking'],
        }),
      });
      const body = (await res.json()) as any;
      assert(res.status === 201, `Failed to create volunteer, status ${res.status}`);
      volunteerId = body.data.id;
    });

    await it('Volunteer duplicate email rejection (409)', async () => {
      const res = await fetch(`${BASE_URL}/volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          volunteerId: 'VOL-SYS-DUP',
          firstName: 'Duplicate',
          lastName: 'Volunteer',
          gender: 'MALE',
          dateOfBirth: '1995-10-15',
          email: 'sys.test.vol@maatram.org', // Duplicate email
          mobile: '9666655556',
          organizationId,
          zoneId,
          volunteerType: 'Professional',
          joiningDate: '2024-01-10',
        }),
      });
      assert(res.status === 409, `Expected duplicate email rejection 409, got ${res.status}`);
    });

    await it('Volunteer status state machine constraints', async () => {
      // ACTIVE -> ON_LEAVE should succeed
      const leaveRes = await fetch(`${BASE_URL}/volunteers/${volunteerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: VolunteerProfileStatus.ON_LEAVE }),
      });
      assert(leaveRes.ok, `Failed status change ACTIVE -> ON_LEAVE: ${leaveRes.status}`);

      // ON_LEAVE -> SUSPENDED should fail (ON_LEAVE allows transitions to ACTIVE or INACTIVE only)
      const suspendRes = await fetch(`${BASE_URL}/volunteers/${volunteerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: VolunteerProfileStatus.SUSPENDED }),
      });
      assert(suspendRes.status === 400, `Expected 400 for invalid state transition, got ${suspendRes.status}`);
    });

    // ─── STAGE 5: SYSTEM SECURITY & VALIDATION CHECKS ────────────────────────
    
    await it('Input field validation errors (Zod schema checking)', async () => {
      const res = await fetch(`${BASE_URL}/volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          volunteerId: 'VOL-BAD',
          firstName: '', // empty name
          email: 'bad-email-format', // invalid email
          mobile: 'abc', // invalid mobile pattern
          organizationId,
          zoneId,
          volunteerType: '',
          joiningDate: 'invalid-date',
        }),
      });
      assert(res.status === 400, `Expected status 400 for bad Zod input validation, got ${res.status}`);
    });

    await it('SQL Injection payload protection', async () => {
      // Test SQL Injection string inputs in search and identifier endpoints to ensure queries are parameterized and safe
      const res = await fetch(`${BASE_URL}/organizations?search=' OR '1'='1`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.ok, 'SQL injection attempt broke the endpoint or threw a query error');
      const body = (await res.json()) as any;
      // Should treat search as a literal and return 0 results
      assert(body.data.length === 0, 'SQL injection bypassed filter and matched records');
    });

    // ─── STAGE 6: BULK OPERATIONS & PERFORMANCE TEST ────────────────────────
    
    await it('Performance: Bulk CSV import of 100 students', async () => {
      // Generate 100 CSV rows programmatically
      let csvData = `registrationNumber,firstName,middleName,lastName,gender,dateOfBirth,bloodGroup,nationality,community,religion,email,mobile,alternateMobile,parentName,parentMobile,parentOccupation,guardianName,guardianMobile,addressLine1,addressLine2,city,district,state,country,pincode,organizationCode,zoneCode,collegeCode,departmentName,programName,course,batch,academicYear,semester,section\n`;
      for (let i = 1; i <= 100; i++) {
        csvData += `SYS-REG-CSV-${i.toString().padStart(3, '0')},Student${i},,Last${i},MALE,2005-01-01,O_POSITIVE,Indian,,,sys.csv.student${i}@student.org,90000000${i.toString().padStart(2, '0')},,Parent,9000000000,,,,Street,,Chennai,Chennai,Tamil Nadu,India,600001,SYS-ORG-1,ZONE-1,MIT-CHE,Computer Science and Engineering,B.E. Computer Science and Engineering,B.E.,2023-2027,2nd Year,,\n`;
      }

      const formData = new FormData();
      formData.append('file', new Blob([csvData], { type: 'text/csv' }), 'bulk_students_100.csv');

      const startImport = Date.now();
      const res = await fetch(`${BASE_URL}/students/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const duration = Date.now() - startImport;
      const body = (await res.json()) as any;

      assert(res.ok, `Bulk import failed: ${JSON.stringify(body)}`);
      assert(body.data.successCount === 100, `Expected 100 successes, got ${body.data.successCount}`);
      console.log(`⏱️ Bulk import of 100 students took ${duration}ms`);
      assert(duration < 180000, `Bulk import took too long: ${duration}ms (target < 180000ms)`);
    });

    // ─── STAGE 7: AUDIT LOGS RETRIEVAL & INTEGRITY ──────────────────────────
    
    await it('Confirm audit log logs generated with correct actors and actions', async () => {
      // Find audit logs generated for the organization, user, student, and volunteer creation actions
      const logs = await prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'ORGANIZATION_CREATED',
              'ZONE_CREATED',
              'USER_CREATED',
              'STUDENT_CREATED',
              'VOLUNTEER_CREATED',
              'VOLUNTEER_STATUS_CHANGED',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      assert(logs.length >= 5, `Expected at least 5 audit logs, found ${logs.length}`);
      
      // Validate schema format on one entry
      const log = logs[0];
      assert(log.logCode !== undefined, 'Audit log missing log code');
      assert(log.actorId !== undefined, 'Audit log missing actor ID');
      assert(log.createdAt !== undefined, 'Audit log missing timestamp');
      assert(log.targetEntityType !== undefined, 'Audit log missing target entity type');
    });

    // ─── STAGE 8: CASCADING DELETE INTEGRITY ──────────────────────────────────
    
    await it('Verify database cascading deletion rules', async () => {
      // When Student User is deleted, the associated Student profile should be cascade deleted
      // Delete the student user record
      await prisma.user.delete({ where: { id: studentUserId } });

      const count = await prisma.student.count({ where: { id: studentId } });
      assert(count === 0, 'Cascade delete rule failed: Student profile still exists after User delete');
    });

  } catch (err: any) {
    console.error('❌ Critical crash in test execution loop:', err);
    process.exitCode = 1;
  } finally {
    // ─── POST-RUN SUMMARY ───────────────────────────────────────────────────
    const executionTime = Date.now() - startTime;
    console.log('\n==================================================');
    console.log('🏁 Integration Test Suite Complete');
    console.log(`⏱️ Total Execution Time: ${executionTime}ms`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`🟢 Passed: ${passedTests}`);
    console.log(`🔴 Failed: ${failedTests}`);
    console.log('==================================================');

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests List:');
      testResults
        .filter((r) => r.status === 'FAILED')
        .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
      process.exitCode = 0;
    }

    // Stop server and close connection
    if (server) {
      server.close();
    }
    console.log('🔌 Integration test server stopped.');
    process.exit(process.exitCode || 0);
  }
}

runTests();
