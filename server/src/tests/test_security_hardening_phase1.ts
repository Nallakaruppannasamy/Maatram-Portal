/**
 * @file src/tests/test_security_hardening_phase1.ts
 * @description Comprehensive test suite validating Phase 1 security hardening:
 *  - SEC-001: Password hash & tempPassword leakage prevention
 *  - SEC-002: Zone isolation & BOLA enforcement on student endpoints
 *  - SEC-003: Strict CORS allowlist (no wildcard vercel/render)
 *  - SEC-004: Swagger UI disabled in production
 *  - SEC-005: Upload security (auth, traversal protection, BOLA, directory listing denial)
 *  - SEC-006: Dependency versions verification
 */

import { Server } from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { setupSwagger } from '../config/swagger';
import { secureUploadsHandler } from '../common/middleware/secureUploads';

const PORT = 4725;
const BASE_URL = `http://localhost:${PORT}`;

let server: Server;

async function runSecurityHardeningTests() {
  console.log('🛡️  Starting Security Hardening Phase 1 Test Suite...\n');

  server = app.listen(PORT, () => {
    console.log(`📡 Security test server listening on port ${PORT}`);
  });

  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      totalFailed++;
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(message);
    } else {
      totalPassed++;
      console.log(`  ✅ PASS: ${message}`);
    }
  }

  let originalZoneIdForStudentB: string | null = null;
  let modifiedStudentBId: string | null = null;

  try {
    // ─── LOGIN ADMIN FOR AUTHENTICATED TESTS ────────────────────────────────
    console.log('\n--- Authenticating Super Admin ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@maatram.com',
        password: 'admin@123',
      }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    assert(adminLoginRes.ok, 'Admin login succeeded');
    const adminToken = adminLoginData.data.accessToken;
    const adminUserId = adminLoginData.data.user.id;

    // ─── SEC-001: PREVENT CREDENTIAL LEAKAGE ────────────────────────────────
    console.log('\n--- SEC-001: Credential Leakage Prevention ---');

    // 1. GET /api/v1/users
    const usersRes = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = (await usersRes.json()) as any;
    assert(usersRes.ok, 'GET /api/v1/users succeeded');
    const users = usersData.data?.items || (Array.isArray(usersData.data) ? usersData.data : []);
    assert(users.length > 0, 'Users returned');

    let passwordHashFound = false;
    let tempPasswordFound = false;
    let tokenFound = false;

    for (const u of users) {
      if (u.passwordHash !== undefined) passwordHashFound = true;
      if (u.tempPassword !== undefined) tempPasswordFound = true;
      if (u.refreshToken !== undefined || u.resetToken !== undefined) tokenFound = true;
    }
    assert(!passwordHashFound, 'GET /api/v1/users does not expose passwordHash');
    assert(!tempPasswordFound, 'GET /api/v1/users does not expose tempPassword');
    assert(!tokenFound, 'GET /api/v1/users does not expose refresh/reset tokens');

    // 2. GET /api/v1/users/:id
    const singleUserRes = await fetch(`${BASE_URL}/api/v1/users/${adminUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const singleUserData = (await singleUserRes.json()) as any;
    assert(singleUserRes.ok, 'GET /api/v1/users/:id succeeded');
    const userProfile = singleUserData.data;
    assert(userProfile.passwordHash === undefined, 'GET /api/v1/users/:id does not expose passwordHash');
    assert(userProfile.tempPassword === undefined, 'GET /api/v1/users/:id does not expose tempPassword');

    // 3. GET /api/v1/students
    const studentsRes = await fetch(`${BASE_URL}/api/v1/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const studentsData = (await studentsRes.json()) as any;
    assert(studentsRes.ok, 'GET /api/v1/students succeeded');
    const students = studentsData.data || [];
    assert(students.length > 0, 'Students returned');

    let studentTempPasswordFound = false;
    let studentUserHashFound = false;
    for (const s of students) {
      if (s.tempPassword !== undefined) studentTempPasswordFound = true;
      if (s.user?.passwordHash !== undefined) studentUserHashFound = true;
      if (s.user?.tempPassword !== undefined) studentTempPasswordFound = true;
    }
    assert(!studentTempPasswordFound, 'GET /api/v1/students does not expose tempPassword');
    assert(!studentUserHashFound, 'GET /api/v1/students does not expose user.passwordHash');

    // ─── SEC-002: ZONE ISOLATION / BOLA ──────────────────────────────────────
    console.log('\n--- SEC-002: Zone Isolation / BOLA Protection ---');

    // Find two students from different zones
    const studentA = await prisma.student.findFirst({
      where: { zoneId: { not: null }, status: 'ACTIVE', user: { isActive: true } },
      include: { user: true },
    });
    assert(Boolean(studentA && studentA.zoneId), 'Found Student A with assigned zone');

    let zoneB = await prisma.zone.findFirst({
      where: { id: { not: studentA!.zoneId! } },
    });
    if (!zoneB) {
      zoneB = await prisma.zone.create({
        data: {
          name: `Zone B Test ${Date.now()}`,
          code: `ZB_${Date.now()}`,
          regionLabel: 'Zone B Region',
          organizationId: studentA!.organizationId,
        },
      });
    }

    originalZoneIdForStudentB = null;
    modifiedStudentBId = null;

    let studentB = await prisma.student.findFirst({
      where: { zoneId: zoneB.id, status: 'ACTIVE' },
      include: { user: true },
    });

    if (!studentB) {
      const candidate = await prisma.student.findFirst({
        where: { id: { not: studentA!.id } },
        include: { user: true },
      });
      assert(Boolean(candidate), 'Found candidate student for Zone B test');
      originalZoneIdForStudentB = candidate!.zoneId;
      modifiedStudentBId = candidate!.id;
      studentB = await prisma.student.update({
        where: { id: candidate!.id },
        data: { zoneId: zoneB.id },
        include: { user: true },
      });
    }
    assert(Boolean(studentB && studentB.zoneId), 'Found Student B with different zone');

    const zoneA = (await prisma.zone.findUnique({ where: { id: studentA!.zoneId! } }))!;
    assert(Boolean(zoneA && zoneB), 'Resolved Zone A and Zone B records');

    // Find or assign Zone A Incharge user
    let inchargeUserA = await prisma.user.findFirst({
      where: { role: 'zone', isActive: true },
    });
    assert(Boolean(inchargeUserA), 'Found Zone Incharge user');

    await prisma.user.update({
      where: { id: inchargeUserA!.id },
      data: { zoneId: zoneA.id },
    });
    await prisma.zone.update({
      where: { id: zoneA.id },
      data: { inchargeId: inchargeUserA!.id },
    });
    assert(true, 'Configured Zone Incharge for Zone A');

    // Generate JWT token for Zone A Incharge
    const zoneAToken = jwt.sign(
      {
        userId: inchargeUserA!.id,
        email: inchargeUserA!.email,
        role: 'zone',
        zoneId: zoneA.id,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // Test: Zone A Incharge accesses Zone A student -> Allowed
    const zoneAAccessA = await fetch(`${BASE_URL}/api/v1/students/${studentA!.id}`, {
      headers: { Authorization: `Bearer ${zoneAToken}` },
    });
    assert(zoneAAccessA.status === 200, 'Zone A Incharge CAN access Zone A student (200 OK)');

    // Test: Zone A Incharge accesses Zone B student -> Forbidden (403)
    const zoneAAccessB = await fetch(`${BASE_URL}/api/v1/students/${studentB!.id}`, {
      headers: { Authorization: `Bearer ${zoneAToken}` },
    });
    assert(
      zoneAAccessB.status === 403,
      `Zone A Incharge CANNOT access Zone B student (returned ${zoneAAccessB.status} Forbidden)`
    );

    // Test: Zone A Incharge accesses Zone B student resume -> Forbidden (403)
    const zoneAResumeB = await fetch(`${BASE_URL}/api/v1/students/${studentB!.id}/resume`, {
      headers: { Authorization: `Bearer ${zoneAToken}` },
    });
    assert(
      zoneAResumeB.status === 403,
      `Zone A Incharge CANNOT access Zone B student resume (returned ${zoneAResumeB.status} Forbidden)`
    );

    // Test: Zone A Incharge attempts to change Zone B student SPOC status -> Forbidden (403)
    const zoneASpocB = await fetch(`${BASE_URL}/api/v1/students/${studentB!.id}/spoc`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${zoneAToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isSpoc: true }),
    });
    assert(
      zoneASpocB.status === 403,
      `Zone A Incharge CANNOT modify Zone B student SPOC status (returned ${zoneASpocB.status} Forbidden)`
    );

    // Test: Zone A Incharge attempts to change Zone B student status -> Forbidden (403)
    const zoneAStatusB = await fetch(`${BASE_URL}/api/v1/students/${studentB!.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${zoneAToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });
    assert(
      zoneAStatusB.status === 403,
      `Zone A Incharge CANNOT modify Zone B student account status (returned ${zoneAStatusB.status} Forbidden)`
    );

    // ─── SEC-003: STRICT CORS ────────────────────────────────────────────────
    console.log('\n--- SEC-003: Strict CORS Allowlist ---');

    // 1. Configured legitimate origin
    const configuredOrigin = env.FRONTEND_URL.split(',')[0].trim().replace(/\/+$/, '');
    const legitimateCorsRes = await fetch(`${BASE_URL}/api/v1/auth/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: configuredOrigin,
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allowOriginHeader = legitimateCorsRes.headers.get('access-control-allow-origin');
    assert(
      allowOriginHeader === configuredOrigin,
      `Configured origin (${configuredOrigin}) is allowed by CORS`
    );

    // 2. Disallowed arbitrary Vercel domain
    const rogueVercelOrigin = 'https://attacker-app.vercel.app';
    const rogueVercelRes = await fetch(`${BASE_URL}/api/v1/auth/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: rogueVercelOrigin,
        'Access-Control-Request-Method': 'GET',
      },
    });
    const vercelHeader = rogueVercelRes.headers.get('access-control-allow-origin');
    assert(
      vercelHeader !== rogueVercelOrigin && vercelHeader !== '*',
      'Arbitrary Vercel domain (attacker-app.vercel.app) is rejected by CORS'
    );

    // 3. Disallowed arbitrary Render domain
    const rogueRenderOrigin = 'https://attacker-service.onrender.com';
    const rogueRenderRes = await fetch(`${BASE_URL}/api/v1/auth/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: rogueRenderOrigin,
        'Access-Control-Request-Method': 'GET',
      },
    });
    const renderHeader = rogueRenderRes.headers.get('access-control-allow-origin');
    assert(
      renderHeader !== rogueRenderOrigin && renderHeader !== '*',
      'Arbitrary Render domain (attacker-service.onrender.com) is rejected by CORS'
    );

    // ─── SEC-004: PRODUCTION SWAGGER EXPOSURE ────────────────────────────────
    console.log('\n--- SEC-004: Swagger Production Disablement ---');

    // Create a mock app in production mode
    const prodApp = express();
    const originalNodeEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';
    setupSwagger(prodApp);
    (env as any).NODE_ENV = originalNodeEnv;

    const prodServer = prodApp.listen(PORT + 1);
    try {
      const swaggerRes = await fetch(`http://localhost:${PORT + 1}/api-docs`);
      assert(
        swaggerRes.status === 404,
        `GET /api-docs in production returns 404 (got ${swaggerRes.status})`
      );

      const swaggerJsonRes = await fetch(`http://localhost:${PORT + 1}/api-docs/swagger.json`);
      assert(
        swaggerJsonRes.status === 404,
        `GET /api-docs/swagger.json in production returns 404 (got ${swaggerJsonRes.status})`
      );
    } finally {
      prodServer.close();
    }

    // ─── SEC-005: UPLOAD SECURITY ────────────────────────────────────────────
    console.log('\n--- SEC-005: Upload Security & Access Control ---');

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Create test files
    const publicSample = path.join(uploadsDir, 'test_sample.png');
    fs.writeFileSync(publicSample, 'fake png public');

    const studentAFile = path.join(uploadsDir, `student-${studentA!.id}-resume.pdf`);
    fs.writeFileSync(studentAFile, 'private resume for student A');

    const studentBFile = path.join(uploadsDir, `student-${studentB!.id}-resume.pdf`);
    fs.writeFileSync(studentBFile, 'private resume for student B');

    // Token for Student A
    const studentAToken = jwt.sign(
      {
        userId: studentA!.userId,
        email: (studentA as any).user?.email || 'studentA@maatram.com',
        role: 'student',
        zoneId: studentA!.zoneId,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 1. Anonymous request to private file -> 401 Unauthorized
    const anonRes = await fetch(`${BASE_URL}/uploads/student-${studentA!.id}-resume.pdf`);
    assert(anonRes.status === 401, `Anonymous request to private file returns 401 (got ${anonRes.status})`);

    // 2. Student A accessing own private file -> 200 OK
    const ownRes = await fetch(`${BASE_URL}/uploads/student-${studentA!.id}-resume.pdf`, {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert(ownRes.status === 200, `Student A accessing own private file returns 200 (got ${ownRes.status})`);

    // 3. Student A accessing Student B private file -> 403 Forbidden
    const crossStudentRes = await fetch(`${BASE_URL}/uploads/student-${studentB!.id}-resume.pdf`, {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert(
      crossStudentRes.status === 403,
      `Student A accessing Student B private file returns 403 (got ${crossStudentRes.status})`
    );

    // 4. Zone A Incharge accessing Zone A student file -> 200 OK
    const zoneAAccessAFile = await fetch(`${BASE_URL}/uploads/student-${studentA!.id}-resume.pdf`, {
      headers: { Authorization: `Bearer ${zoneAToken}` },
    });
    assert(
      zoneAAccessAFile.status === 200,
      `Zone A Incharge accessing Zone A student file returns 200 (got ${zoneAAccessAFile.status})`
    );

    // 5. Zone A Incharge accessing Zone B student file -> 403 Forbidden
    const zoneAAccessBFile = await fetch(`${BASE_URL}/uploads/student-${studentB!.id}-resume.pdf`, {
      headers: { Authorization: `Bearer ${zoneAToken}` },
    });
    assert(
      zoneAAccessBFile.status === 403,
      `Zone A Incharge accessing Zone B student file returns 403 (got ${zoneAAccessBFile.status})`
    );

    // 6. Super Admin accessing Zone B student file -> 200 OK
    const adminAccessBFile = await fetch(`${BASE_URL}/uploads/student-${studentB!.id}-resume.pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminAccessBFile.status === 200,
      `Super Admin accessing any private file returns 200 (got ${adminAccessBFile.status})`
    );

    // 7. Directory traversal attack rejected
    const traversalRes = await fetch(`${BASE_URL}/uploads/..%2Fpackage.json`);
    assert(
      traversalRes.status === 400 || traversalRes.status === 403,
      `Directory traversal attempt rejected with 400/403 (got ${traversalRes.status})`
    );

    // 8. Directory listing rejected
    const dirListRes = await fetch(`${BASE_URL}/uploads/`);
    assert(dirListRes.status === 404, `Directory listing request returns 404 (got ${dirListRes.status})`);

    // Clean up temporary test files
    if (fs.existsSync(studentAFile)) fs.unlinkSync(studentAFile);
    if (fs.existsSync(studentBFile)) fs.unlinkSync(studentBFile);
    if (fs.existsSync(publicSample)) fs.unlinkSync(publicSample);

    // ─── SEC-006: VULNERABLE DEPENDENCIES ────────────────────────────────────
    console.log('\n--- SEC-006: Dependency Audit & Verification ---');
    const pkgJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
    );
    const multerVer = pkgJson.dependencies.multer;
    const nodemailerVer = pkgJson.dependencies.nodemailer;
    const xlsxVer = pkgJson.dependencies.xlsx;

    assert(
      multerVer.includes('2.3.0') || multerVer.startsWith('^2.3'),
      `multer version upgraded to >= 2.3.0 (current: ${multerVer})`
    );
    assert(
      nodemailerVer.includes('10.0.6') || nodemailerVer.startsWith('^10'),
      `nodemailer version upgraded to >= 10.0.6 (current: ${nodemailerVer})`
    );
    assert(xlsxVer === '^0.18.5', `xlsx version documented at ${xlsxVer} with known upstream limitations`);

    console.log(`\n==================================================`);
    console.log(`🎉 ALL SECURITY TESTS PASSED: ${totalPassed} Passed, ${totalFailed} Failed`);
    console.log(`==================================================\n`);
  } catch (err: any) {
    console.error('\n❌ Security Hardening Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    if (modifiedStudentBId && originalZoneIdForStudentB !== undefined) {
      await prisma.student.update({
        where: { id: modifiedStudentBId },
        data: { zoneId: originalZoneIdForStudentB },
      }).catch(() => {});
    }
    server.close();
  }
}

runSecurityHardeningTests();
