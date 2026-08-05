/**
 * @file src/tests/test_phase9_1.ts
 * @description Integration & Regression Test Suite for Phase 9.1 Super Admin Enhancements.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const PORT = 4699;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let studentToken = '';

async function runPhase9_1Tests() {
  console.log('🚀 Starting Phase 9.1 Super Admin Enhancement Integration & Regression Test Suite...\n');

  server = app.listen(PORT, () => {
    console.log(`📡 Phase 9.1 Test server listening on port ${PORT}`);
  });

  try {
    // ─── 1. AUTHENTICATION ───────────────────────────────────────────────────
    console.log('🔐 [Auth] Authenticating Super Admin (Arun S)...');
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
    console.log('  ✅ Admin authenticated successfully.');

    console.log('🔐 [Auth] Authenticating Student persona...');
    let studentUser = await prisma.user.findFirst({ where: { role: 'student' } });
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
      if (studentLoginRes.ok) {
        studentToken = studentLoginData.data.accessToken;
        console.log('  ✅ Student persona authenticated successfully.');
      }
    }

    // ─── 2. TASK 1: PROVISIONING EXCEL EXPORT ────────────────────────────────
    console.log('\n📊 [Task 1] Exporting Provisioning Roster (view=provisioning)...');
    const provExportRes = await fetch(`${BASE_URL}/students/export?format=xlsx&view=provisioning`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (provExportRes.status !== 200) throw new Error(`Provisioning export failed with status ${provExportRes.status}`);
    const provBuffer = await provExportRes.arrayBuffer();
    if (provBuffer.byteLength === 0) throw new Error('Exported provisioning buffer is empty');
    console.log(`  ✅ Tailored Provisioning Excel export generated (${provBuffer.byteLength} bytes).`);

    // ─── 3. TASK 2: DYNAMIC ZONE STATISTICS WITH STUDENT COUNTS ─────────────
    console.log('\n🏛️ [Task 2] Fetching Zones list with live student headcounts (_count.students)...');
    const zonesRes = await fetch(`${BASE_URL}/zones`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (zonesRes.status !== 200) throw new Error(`Fetch zones failed with status ${zonesRes.status}`);
    const zonesData = (await zonesRes.json()) as any;
    if (!Array.isArray(zonesData.data)) throw new Error('Zones data response is not an array');
    console.log(`  ✅ Retrieved ${zonesData.data.length} zones with live student counts:`);
    zonesData.data.forEach((z: any) => {
      console.log(`     • ${z.name} (${z.code}): ${z._count?.students ?? 0} students`);
    });

    // ─── 4. TASK 3 & 4: STUDENT DIRECTORY EXPORT & ACADEMIC YEAR FILTERING ────
    console.log('\n🎓 [Task 3 & 4] Querying Student Directory with Academic Year filter (academicYear=1st Year)...');
    const filteredStudentsRes = await fetch(`${BASE_URL}/students?academicYear=1st%20Year`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (filteredStudentsRes.status !== 200) throw new Error(`Filtered student listing failed: ${filteredStudentsRes.status}`);
    const filteredData = (await filteredStudentsRes.json()) as any;
    console.log(`  ✅ Academic Year filtered listing returned ${filteredData.data?.length || 0} students.`);

    console.log('📊 [Task 3] Exporting Student Directory with Academic Year filter...');
    const dirExportRes = await fetch(`${BASE_URL}/students/export?format=xlsx&academicYear=1st%20Year`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (dirExportRes.status !== 200) throw new Error(`Directory export failed: ${dirExportRes.status}`);
    const dirBuffer = await dirExportRes.arrayBuffer();
    if (dirBuffer.byteLength === 0) throw new Error('Directory export buffer is empty');
    console.log(`  ✅ Tailored Directory Excel export generated (${dirBuffer.byteLength} bytes).`);

    // ─── 5. TASK 6: ZONE MANAGEMENT ROUTE & SECURITY RBAC ────────────────────
    console.log('\n🛡️ [Task 6] Auditing Zone Management access control...');
    const adminZoneAccess = await fetch(`${BASE_URL}/zones`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminZoneAccess.status !== 200) throw new Error(`Admin failed to access zones endpoint: ${adminZoneAccess.status}`);
    console.log('  ✅ Super Admin allowed access to Zone Management endpoint.');

    if (studentToken) {
      const studentZoneAccess = await fetch(`${BASE_URL}/zones`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (studentZoneAccess.status !== 403 && studentZoneAccess.status !== 401) {
        throw new Error(`Security breach: Student accessed zone management with status ${studentZoneAccess.status}`);
      }
      console.log('  ✅ Student access to Zone Management correctly blocked (403 Forbidden).');
    }

    console.log('\n🎉 ALL PHASE 9.1 SUPER ADMIN ENHANCEMENT TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Phase 9.1 Integration Test Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runPhase9_1Tests();
