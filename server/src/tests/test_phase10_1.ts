/**
 * @file src/tests/test_phase10_1.ts
 * @description Programmatic integration tests for Phase 10.1 Zone Operational Framework Revamp.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';

const PORT = 4699;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let testZoneId = '';

async function runTests() {
  console.log('🚀 Starting Phase 10.1 Zone Operational Framework Integration Tests...');

  // Start server
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // 1. Authenticate users
    console.log('\n🔐 [Authentication] Logging in as Admin...');
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

    // Resolve test zone ID (Coimbatore Zone 2)
    const zone = await prisma.zone.findFirst({
      where: { code: 'ZONE-2' },
    });
    if (!zone) throw new Error('ZONE-2 not found in database. Please run seeds.');
    testZoneId = zone.id;

    // Create a temporary user with role "zone" to test assignment
    console.log('\n👥 [User creation] Creating test incharge user...');
    const tempEmail = `test.incharge.${Date.now()}@maatram.org`;
    const userCreateRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: tempEmail,
        fullName: 'Test Incharge User',
        role: 'zone',
        employeeId: `EMP-T-${Date.now()}`,
        mobile: '9876543233',
        designation: 'Test Field Manager',
      }),
    });
    const userCreateData = (await userCreateRes.json()) as any;
    if (!userCreateRes.ok) throw new Error(`User creation failed: ${JSON.stringify(userCreateData)}`);
    const tempInchargeId = userCreateData.data.id;
    console.log(`✅ Incharge user created: ${tempEmail} (ID: ${tempInchargeId})`);

    // ─── 2. TEST BIDIRECTIONAL SYNC ───
    console.log('\n🔄 [Incharge Sync] Assigning incharge to zone...');
    const assignRes = await fetch(`${BASE_URL}/zones/${testZoneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        inchargeId: tempInchargeId,
      }),
    });
    const assignData = (await assignRes.json()) as any;
    if (!assignRes.ok) throw new Error(`Assignment failed: ${JSON.stringify(assignData)}`);
    console.log('✅ Incharge assigned to zone successfully');

    // Verify database links
    const verifyZone = await prisma.zone.findUnique({
      where: { id: testZoneId },
      select: { inchargeId: true }
    });
    const verifyUser = await prisma.user.findUnique({
      where: { id: tempInchargeId },
      select: { zoneId: true }
    });
    if (verifyZone?.inchargeId !== tempInchargeId || verifyUser?.zoneId !== testZoneId) {
      throw new Error(`Inconsistent bidirectional sync: Zone.inchargeId=${verifyZone?.inchargeId}, User.zoneId=${verifyUser?.zoneId}`);
    }
    console.log('✅ Bidirectional link validated inside DB successfully');

    // ─── 3. COLLEGE CRUD TESTS ───
    console.log('\n🏫 [College CRUD] Adding new college under zone...');
    const colCode = `COL-${Date.now().toString().slice(-4)}`;
    const addColRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Test University College',
        code: colCode,
        location: 'Coimbatore Campus',
      }),
    });
    const addColData = (await addColRes.json()) as any;
    if (!addColRes.ok) throw new Error(`Adding college failed: ${JSON.stringify(addColData)}`);
    const testCollegeId = addColData.data.id;
    console.log(`✅ College added successfully: ID=${testCollegeId}`);

    console.log('🏫 [College CRUD] Updating college...');
    const updateColRes = await fetch(`${BASE_URL}/zones/colleges/${testCollegeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Updated University College Name',
        location: 'Updated Campus Address',
      }),
    });
    const updateColData = (await updateColRes.json()) as any;
    if (!updateColRes.ok) throw new Error(`Updating college failed: ${JSON.stringify(updateColData)}`);
    console.log('✅ College updated successfully');

    // ─── 4. DEPARTMENT CRUD TESTS ───
    console.log('\n📚 [Department CRUD] Adding department...');
    const addDeptRes = await fetch(`${BASE_URL}/zones/colleges/${testCollegeId}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'IT Department',
      }),
    });
    const addDeptData = (await addDeptRes.json()) as any;
    if (!addDeptRes.ok) throw new Error(`Adding department failed: ${JSON.stringify(addDeptData)}`);
    const testDeptId = addDeptData.data.id;
    console.log(`✅ Department added successfully: ID=${testDeptId}`);

    // ─── 5. PROGRAM CRUD TESTS ───
    console.log('\n🎓 [Program CRUD] Adding program...');
    const addProgRes = await fetch(`${BASE_URL}/zones/departments/${testDeptId}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'B.Tech IT',
        durationYears: 4,
      }),
    });
    const addProgData = (await addProgRes.json()) as any;
    if (!addProgRes.ok) throw new Error(`Adding program failed: ${JSON.stringify(addProgData)}`);
    const testProgId = addProgData.data.id;
    console.log(`✅ Degree Program added successfully: ID=${testProgId}`);

    // ─── 6. CLEAN UP CRUD DATA ───
    console.log('\n🧹 [Cleanup] Cleaning up created CRUD elements...');
    // Delete program
    await fetch(`${BASE_URL}/zones/programs/${testProgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Delete department
    await fetch(`${BASE_URL}/zones/departments/${testDeptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Delete college
    await fetch(`${BASE_URL}/zones/colleges/${testCollegeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Remove incharge association from zone
    await fetch(`${BASE_URL}/zones/${testZoneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ inchargeId: null }),
    });
    // Clean up temporary user profiles and user records
    await prisma.userProfile.deleteMany({ where: { userId: tempInchargeId } });
    await prisma.user.delete({ where: { id: tempInchargeId } });
    console.log('✅ Created integration data cleaned up successfully');

    console.log('\n🎉 All Phase 10.1 operational framework tests passed successfully!');
    cleanup(0);
  } catch (error: any) {
    console.error(`\n❌ Test suite failed: ${error.message}`);
    cleanup(1);
  }
}

function cleanup(exitCode: number) {
  if (server) {
    server.close(() => {
      console.log('📡 Test server stopped.');
      process.exit(exitCode);
    });
  } else {
    process.exit(exitCode);
  }
}

runTests();
