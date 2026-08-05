/**
 * @file src/tests/test_phase10_3.ts
 * @description Programmatic integration tests for Phase 10.3 Team Management Statistics, Pagination & Dashboard.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';

const PORT = 4712;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';

async function runTests() {
  console.log('🚀 Starting Phase 10.3 Team Management Statistics & Pagination Integration Tests...');

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

    // 2. Fetch User list
    console.log('\n👥 [User list] Fetching paginated users...');
    const listRes = await fetch(`${BASE_URL}/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = (await listRes.json()) as any;
    if (!listRes.ok) throw new Error(`Fetch users failed: ${JSON.stringify(listData)}`);

    const payload = listData.data;
    if (!payload.items || !payload.pagination || !payload.stats) {
      throw new Error(`Invalid response structure: expected items, pagination, and stats. Got: ${JSON.stringify(payload)}`);
    }

    console.log('✅ Response structure verified successfully.');

    // 3. Verify pagination details
    const pag = payload.pagination;
    console.log(`\n📄 [Pagination Details] Page: ${pag.page}, Limit: ${pag.limit}, TotalItems: ${pag.totalItems}, TotalPages: ${pag.totalPages}`);
    if (pag.page !== 1 || pag.limit !== 5) {
      throw new Error(`Pagination params mismatch: expected page=1, limit=5. Got: page=${pag.page}, limit=${pag.limit}`);
    }
    if (payload.items.length > 5) {
      throw new Error(`Items length ${payload.items.length} exceeded limit 5`);
    }
    console.log('✅ Pagination details validated successfully.');

    // 4. Verify Database-level counts
    console.log('\n📊 [Database Counts Verification] Verifying stats...');
    const totalMembersDb = await prisma.user.count();
    const superAdminsDb = await prisma.user.count({ where: { role: 'admin' } });
    const zoneInchargesDb = await prisma.user.count({ where: { role: 'zone' } });
    const activeAccountsDb = await prisma.user.count({ where: { isActive: true } });

    const stats = payload.stats;
    console.log(`  - Total Members: API=${stats.totalMembers}, DB=${totalMembersDb}`);
    console.log(`  - Super Admins: API=${stats.superAdmins}, DB=${superAdminsDb}`);
    console.log(`  - Zone Incharges: API=${stats.zoneIncharges}, DB=${zoneInchargesDb}`);
    console.log(`  - Active Accounts: API=${stats.activeAccounts}, DB=${activeAccountsDb}`);

    if (stats.totalMembers !== totalMembersDb ||
        stats.superAdmins !== superAdminsDb ||
        stats.zoneIncharges !== zoneInchargesDb ||
        stats.activeAccounts !== activeAccountsDb) {
      throw new Error('API Statistics do not match Database-level counts');
    }
    console.log('✅ All counts matched perfectly with Database.');

    console.log('\n🎉 All Phase 10.3 Team Management statistics & pagination tests passed successfully!');
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
