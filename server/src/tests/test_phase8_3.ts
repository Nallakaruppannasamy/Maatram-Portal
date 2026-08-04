/**
 * @file src/tests/test_phase8_3.ts
 * @description Programmatic integration tests for Phase 8.3 Volunteer Work Revamp & Approval Workflow.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import { VolunteerCategory, VolunteerStatus } from '@prisma/client';

const PORT = 4598;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let studentToken = '';
let zoneToken = '';
let testSubmissionId1 = '';
let testSubmissionId2 = '';

async function runTests() {
  console.log('🚀 Starting Phase 8.3 Volunteer Work Revamp Integration Tests...');

  // Start server
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // ─── 0. CLEANUP LEFTOVERS ────────────────────────────────────────────────
    console.log('🧼 Cleaning up previous test records...');
    await prisma.volunteerSubmission.deleteMany({
      where: {
        title: {
          in: [
            'Test Karpom Karpipom Submission',
            'Test Tele Verification Submission',
          ],
        },
      },
    });
    console.log('🧼 Cleanup completed.');

    // ─── 1. AUTHENTICATE STUDENT AND ZONE INCHARGE ────────────────────────────
    console.log('\n🔐 [Authentication] Logging in as Student...');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '2024CS1092',
        password: 'Student@123',
      }),
    });

    const studentLoginData = (await studentLoginRes.json()) as any;
    if (!studentLoginRes.ok) {
      throw new Error(`Student login failed: ${JSON.stringify(studentLoginData)}`);
    }
    studentToken = studentLoginData.data.accessToken;
    console.log('✅ Student authenticated successfully.');

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
    if (!zoneLoginRes.ok) {
      throw new Error(`Zone Incharge login failed: ${JSON.stringify(zoneLoginData)}`);
    }
    zoneToken = zoneLoginData.data.accessToken;
    console.log('✅ Zone Incharge authenticated successfully.');

    // ─── 2. SUBMISSION TESTING — KARPOM KARPIPOM (NO COUNT) ───────────────────
    console.log('\n📝 [Submission] Creating Karpom Karpipom Tutoring log (no count)...');
    const sub1Res = await fetch(`${BASE_URL}/volunteers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Test Karpom Karpipom Submission',
        category: 'KARPOM_KARPIPOM_TUTORING',
        description: 'Taught mathematics to 5th grade students for 2 weeks.',
        eventDate: '2026-08-01',
      }),
    });

    const sub1Data = (await sub1Res.json()) as any;
    if (sub1Res.status !== 201) {
      throw new Error(`Failed to create Karpom Karpipom log: ${JSON.stringify(sub1Data)}`);
    }
    testSubmissionId1 = sub1Data.data.id;
    console.log(`✅ Submission 1 created successfully with ID: ${testSubmissionId1}`);

    // ─── 3. SUBMISSION TESTING — TELE VERIFICATION VALIDATION ───────────────
    console.log('\n📝 [Validation] Attempting Tele Verification log without count (should fail)...');
    const fail1Res = await fetch(`${BASE_URL}/volunteers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Test Tele Verification Submission',
        category: 'TELE_VERIFICATION',
        description: 'Conducted background check on provisioned student candidates.',
        eventDate: '2026-08-02',
      }),
    });

    const fail1Data = (await fail1Res.json()) as any;
    if (fail1Res.status !== 400) {
      throw new Error(`Expected validation failure (400) but got ${fail1Res.status}: ${JSON.stringify(fail1Data)}`);
    }
    console.log('✅ Correctly failed submission due to missing count.');

    console.log('\n📝 [Validation] Attempting Tele Verification log with invalid count=2000 (should fail)...');
    const fail2Res = await fetch(`${BASE_URL}/volunteers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Test Tele Verification Submission',
        category: 'TELE_VERIFICATION',
        description: 'Conducted background check on provisioned student candidates.',
        eventDate: '2026-08-02',
        count: 2000,
      }),
    });

    const fail2Data = (await fail2Res.json()) as any;
    if (fail2Res.status !== 400) {
      throw new Error(`Expected validation failure (400) but got ${fail2Res.status}: ${JSON.stringify(fail2Data)}`);
    }
    console.log('✅ Correctly failed submission due to invalid count bounds (>1000).');

    // ─── 4. SUBMISSION TESTING — TELE VERIFICATION SUCCESS ───────────────────
    console.log('\n📝 [Submission] Creating Tele Verification log with count=45 & dummy image...');
    const sub2Res = await fetch(`${BASE_URL}/volunteers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Test Tele Verification Submission',
        category: 'TELE_VERIFICATION',
        description: 'Conducted background check on provisioned student candidates.',
        eventDate: '2026-08-02',
        count: 45,
        imageUrl: '/uploads/volunteer-proof-test-123.png',
      }),
    });

    const sub2Data = (await sub2Res.json()) as any;
    if (sub2Res.status !== 201) {
      throw new Error(`Failed to create Tele Verification log: ${JSON.stringify(sub2Data)}`);
    }
    testSubmissionId2 = sub2Data.data.id;
    console.log(`✅ Submission 2 created successfully with ID: ${testSubmissionId2}`);

    // ─── 5. LIST AND SCORING CHECKS ──────────────────────────────────────────
    console.log('\n🔍 [Listing] Retrieving submissions list as Zone Incharge...');
    const listRes = await fetch(`${BASE_URL}/volunteers?status=pending`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${zoneToken}` },
    });

    const listData = (await listRes.json()) as any;
    if (!listRes.ok) {
      throw new Error(`Failed to list pending submissions: ${JSON.stringify(listData)}`);
    }
    const foundSub1 = listData.data.find((x: any) => x.id === testSubmissionId1);
    const foundSub2 = listData.data.find((x: any) => x.id === testSubmissionId2);
    if (!foundSub1 || !foundSub2) {
      throw new Error('Could not find both submitted logs in the pending queue.');
    }
    console.log('✅ Both submissions found in pending queue.');

    // ─── 6. REJECTION WITH MANDATORY COMMENT VALIDATION ──────────────────────
    console.log('\n⚖️ [Approval Workflow] Rechecking rejection validation (should fail without comment)...');
    const rejectFailRes = await fetch(`${BASE_URL}/volunteers/${testSubmissionId2}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zoneToken}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
      }),
    });

    const rejectFailData = (await rejectFailRes.json()) as any;
    if (rejectFailRes.status !== 400) {
      throw new Error(`Expected rejection validation failure (400) but got ${rejectFailRes.status}: ${JSON.stringify(rejectFailData)}`);
    }
    console.log('✅ Correctly blocked rejection without feedback comment.');

    console.log('\n⚖️ [Approval Workflow] Rejecting Tele Verification submission with comment...');
    const rejectSuccessRes = await fetch(`${BASE_URL}/volunteers/${testSubmissionId2}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zoneToken}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        reviewerComment: 'Feedback: proof certificate screenshot is truncated.',
      }),
    });

    const rejectSuccessData = (await rejectSuccessRes.json()) as any;
    if (!rejectSuccessRes.ok) {
      throw new Error(`Failed to reject submission: ${JSON.stringify(rejectSuccessData)}`);
    }
    console.log('✅ Submission rejected successfully.');

    // ─── 7. APPROVAL WORKFLOW ────────────────────────────────────────────────
    console.log('\n⚖️ [Approval Workflow] Approving Karpom Karpipom submission...');
    const approveRes = await fetch(`${BASE_URL}/volunteers/${testSubmissionId1}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zoneToken}`,
      },
      body: JSON.stringify({
        status: 'APPROVED',
        reviewerComment: 'Excellent tutoring dedication.',
      }),
    });

    const approveData = (await approveRes.json()) as any;
    if (!approveRes.ok) {
      throw new Error(`Failed to approve submission: ${JSON.stringify(approveData)}`);
    }
    console.log('✅ Submission approved successfully.');

    // ─── 8. COMMENTS PATCH TESTING ───────────────────────────────────────────
    console.log('\n⚖️ [Approval Workflow] Patching a custom reviewer comment...');
    const commentRes = await fetch(`${BASE_URL}/volunteers/${testSubmissionId1}/comment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zoneToken}`,
      },
      body: JSON.stringify({
        comment: 'Tutoring log has been audited and double checked.',
      }),
    });

    const commentData = (await commentRes.json()) as any;
    if (!commentRes.ok) {
      throw new Error(`Failed to add comment: ${JSON.stringify(commentData)}`);
    }
    console.log('✅ Reviewer comment added successfully.');

    // ─── 9. AUDIT LOG VALIDATION ─────────────────────────────────────────────
    console.log('\n📋 [Audit Logs] Verifying creation of audit log entries...');
    const auditActions = ['VOLUNTEER_SUBMITTED', 'VOLUNTEER_APPROVED', 'VOLUNTEER_REJECTED', 'VOLUNTEER_COMMENT_ADDED'];
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: auditActions },
      },
    });

    for (const action of auditActions) {
      const match = auditLogs.find((l) => l.action === action);
      if (!match) {
        throw new Error(`Audit log action "${action}" not registered in database.`);
      }
      console.log(`✅ Found audit log entry for: ${action}`);
    }

    console.log('\n🎉 ALL Phase 8.3 INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test execution failed with error:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
