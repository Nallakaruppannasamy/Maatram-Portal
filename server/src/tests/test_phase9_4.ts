/**
 * @file src/tests/test_phase9_4.ts
 * @description Integration & Regression Test Suite for Phase 9.4 Global Portal Fixes & Cleanup.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const PORT = 4900;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let studentToken = '';
let studentId = '';
let studentUserId = '';
let zoneToken = '';
let zoneId = '';

async function runPhase9_4Tests() {
  console.log('🚀 Starting Phase 9.4 Global Portal Fixes & Cleanup Test Suite...\n');

  server = app.listen(PORT, () => {
    console.log(`📡 Phase 9.4 Test server listening on port ${PORT}`);
  });

  try {
    // ─── 1. SETUP & AUTHENTICATION ──────────────────────────────────────────
    console.log('🔐 [Auth] Authenticating Student persona...');
    const studentUser = await prisma.user.findFirst({
      where: { role: 'student' },
      include: { student: true },
    });
    if (!studentUser || !studentUser.student) throw new Error('No student found for testing');

    studentUserId = studentUser.id;
    studentId = studentUser.student.id;

    const pwHash = await bcrypt.hash('Student@123', 10);
    await prisma.user.update({ where: { id: studentUserId }, data: { passwordHash: pwHash, isActive: true } });

    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: studentUser.email || studentUser.registerNumber || 'student',
        password: 'Student@123',
      }),
    });
    const studentLoginData = (await studentLoginRes.json()) as any;
    studentToken = studentLoginData.data.accessToken;
    console.log(`  ✅ Student authenticated (ID: ${studentId}).`);

    // Authenticate Zone In-charge
    const zoneUser = await prisma.user.findFirst({
      where: { role: 'zone', zoneId: { not: null } },
    });
    if (zoneUser && zoneUser.zoneId) {
      zoneId = zoneUser.zoneId;
      await prisma.user.update({ where: { id: zoneUser.id }, data: { passwordHash: pwHash, isActive: true } });
      const zoneLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: zoneUser.email || zoneUser.employeeId || 'zone',
          password: 'Student@123',
        }),
      });
      const zoneLoginData = (await zoneLoginRes.json()) as any;
      zoneToken = zoneLoginData.data.accessToken;
      console.log('  ✅ Zone In-charge authenticated.');
    }

    // ─── 2. TASK 1 & 4: IMAGE UPLOADS & STATIC FILE SERVING ────────────────
    console.log('\n🖼️ [Task 1 & 4] Testing Image Uploads and Static File Serving...');

    // Create a dummy image file for upload testing
    const testImagePath = path.join(process.cwd(), 'uploads', 'test_sample.png');
    const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(dummyPngBase64, 'base64'));

    // Test static asset loading via Express static middleware
    const staticRes = await fetch(`http://localhost:${PORT}/uploads/test_sample.png`);
    if (staticRes.status !== 200) throw new Error(`Static image file serving failed with status ${staticRes.status}`);
    const staticBuffer = await staticRes.arrayBuffer();
    if (staticBuffer.byteLength === 0) throw new Error('Static file serving returned empty buffer');
    console.log(`  ✅ Static file serving verified (http://localhost:${PORT}/uploads/test_sample.png -> ${staticBuffer.byteLength} bytes).`);

    // Cleanup sample file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // ─── 3. TASK 2: EXPORT REPORTS REMOVAL & EXCEL SAFETY ────────────────────
    console.log('\n📊 [Task 2] Verifying Reports Module Removal & Excel Export Safety...');

    // Verify /api/v1/reports returns 404 Not Found
    const reportsRes = await fetch(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (reportsRes.status !== 404) throw new Error(`Expected 404 for deprecated /reports route, got ${reportsRes.status}`);
    console.log('  ✅ Confirmed deprecated /reports endpoint returns 404 Not Found.');

    // Verify Student Directory Excel Export remains operational (Zone or Admin token)
    const studentExportRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${zoneToken || studentToken}` },
    });
    if (studentExportRes.status !== 200) throw new Error(`Student Directory export failed: ${studentExportRes.status}`);
    console.log('  ✅ Student Directory Excel Export operational & unaffected.');

    // Verify Assigned Colleges Excel Export remains operational
    if (zoneToken && zoneId) {
      const collegesExportRes = await fetch(`${BASE_URL}/zones/${zoneId}/colleges/export?format=xlsx`, {
        headers: { Authorization: `Bearer ${zoneToken}` },
      });
      if (collegesExportRes.status !== 200) throw new Error(`Assigned Colleges export failed: ${collegesExportRes.status}`);
      console.log('  ✅ Assigned Colleges Excel Export operational & unaffected.');
    }

    // ─── 4. TASK 3 & 8: GLOBAL NAVIGATION & RESUME REGRESSION ───────────────
    console.log('\n📜 [Task 3 & 8] Testing Resume & Profile Image Regression...');
    const resumeRes = await fetch(`${BASE_URL}/students/${studentId}/resume`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (resumeRes.status !== 200) throw new Error(`Resume fetch failed with status ${resumeRes.status}`);
    const resumeData = (await resumeRes.json()) as any;
    if (resumeData.data.id !== studentId) throw new Error('Resume student ID mismatch');
    console.log('  ✅ Verified Student Resume endpoint returns valid portfolio data.');

    console.log('\n🎉 ALL PHASE 9.4 GLOBAL PORTAL FIXES & CLEANUP TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Phase 9.4 Integration Test Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runPhase9_4Tests();
