/**
 * @file src/tests/test_phase8_5.ts
 * @description Programmatic integration tests for Phase 8.5 Organization Hierarchy & Assigned Colleges.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';

const PORT = 4695;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let zoneToken = '';
let testZoneId = '';

async function runTests() {
  console.log('🚀 Starting Phase 8.5 Organization Hierarchy Integration Tests...');

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

    console.log('🔐 [Authentication] Logging in as Zone Incharge...');
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

    // Resolve test zone ID (Zone 1)
    const zone1 = await prisma.zone.findFirst({
      where: { code: 'ZONE-1' },
    });
    if (!zone1) throw new Error('ZONE-1 not found in database');
    testZoneId = zone1.id;

    // ─── 2. HIERARCHY TESTS ───────────────────────────────────────────────────
    console.log('\n🌳 [Hierarchy] Fetching organization hierarchy...');
    const hierarchyRes = await fetch(`${BASE_URL}/organizations/hierarchy`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Status: ${hierarchyRes.status}`);
    if (hierarchyRes.status !== 200) {
      throw new Error(`Failed to fetch hierarchy. Status: ${hierarchyRes.status}`);
    }
    const hierarchyData = (await hierarchyRes.json()) as any;
    if (!hierarchyData.success || !Array.isArray(hierarchyData.data)) {
      throw new Error('Hierarchy response data is invalid');
    }
    console.log(`✅ Hierarchy fetched successfully. Found ${hierarchyData.data.length} organization nodes.`);

    // Check structure of first node
    const firstOrg = hierarchyData.data[0];
    if (firstOrg) {
      console.log(`  - Org: ${firstOrg.name} (${firstOrg.code})`);
      if (Array.isArray(firstOrg.zones) && firstOrg.zones.length > 0) {
        const firstZone = firstOrg.zones[0];
        console.log(`  - Zone: ${firstZone.name} (Code: ${firstZone.code}, Incharge: ${firstZone.inchargeName})`);
        console.log(`    Total Students: ${firstZone.totalStudents}, Total Departments: ${firstZone.totalDepartments}, Total Programs: ${firstZone.totalPrograms}`);
        if (firstZone.colleges.length > 0) {
          const firstCol = firstZone.colleges[0];
          console.log(`  - College: ${firstCol.name} (Student Count: ${firstCol.studentCount}, Department Count: ${firstCol.departmentCount}, Program Count: ${firstCol.programCount})`);
        }
      }
    }

    console.log('\n📊 [Hierarchy Export] Exporting hierarchy (format=xlsx)...');
    const hierarchyExportRes = await fetch(`${BASE_URL}/organizations/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Status: ${hierarchyExportRes.status}`);
    if (hierarchyExportRes.status !== 200) {
      throw new Error(`Failed to export hierarchy. Status: ${hierarchyExportRes.status}`);
    }
    console.log('✅ Exported organization hierarchy successfully.');

    // ─── 3. ZONE COLLEGES TESTS ───────────────────────────────────────────────
    console.log('\n🏫 [Zone Colleges] Fetching colleges for Zone...');
    const zoneCollegesRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    console.log(`Status: ${zoneCollegesRes.status}`);
    if (zoneCollegesRes.status !== 200) {
      throw new Error(`Failed to fetch zone colleges. Status: ${zoneCollegesRes.status}`);
    }
    const zoneCollegesData = (await zoneCollegesRes.json()) as any;
    if (!zoneCollegesData.success || !Array.isArray(zoneCollegesData.data)) {
      throw new Error('Zone colleges response data is invalid');
    }
    console.log(`✅ Zone colleges fetched successfully. Found ${zoneCollegesData.data.length} colleges.`);
    if (zoneCollegesData.data.length > 0) {
      const col = zoneCollegesData.data[0];
      console.log(`  - First College: ${col.name} (Student Count: ${col.studentCount}, Active Students: ${col.activeStudents})`);
      console.log(`    Departments: ${col.departmentList.join(', ')}`);
      console.log(`    Programs: ${col.programList.join(', ')}`);
      console.log(`    Batch Dist: ${JSON.stringify(col.batchDistribution)}`);
    }

    console.log('\n📊 [Zone Colleges Export] Exporting zone colleges (format=xlsx)...');
    const zoneCollegesExportRes = await fetch(`${BASE_URL}/zones/${testZoneId}/colleges/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    console.log(`Status: ${zoneCollegesExportRes.status}`);
    if (zoneCollegesExportRes.status !== 200) {
      throw new Error(`Failed to export zone colleges. Status: ${zoneCollegesExportRes.status}`);
    }
    console.log('✅ Exported zone colleges successfully.');

    console.log('\n🎉 All Phase 8.5 Integration Tests Passed Successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Phase 8.5 Integration Tests Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
