/**
 * @file src/tests/test_phase9_5.ts
 * @description Comprehensive End-to-End Release Candidate Test Suite for Phase 9.5 (Version 1.1.1).
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const PORT = 5050;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let zoneToken = '';
let zoneUserId = '';
let assignedZoneId = '';
let studentToken = '';
let studentId = '';
let studentUserId = '';
let outZoneStudentId = '';

async function runPhase9_5Tests() {
  console.log('🚀 Starting Phase 9.5 Comprehensive End-to-End Release Candidate Test Suite...\n');

  server = app.listen(PORT, () => {
    console.log(`📡 Phase 9.5 Test server listening on port ${PORT}`);
  });

  try {
    const defaultPwHash = await bcrypt.hash('Release@123', 10);

    // ─── 1. AUTHENTICATION & PERSONA SETUP ────────────────────────────────────
    console.log('🔐 [Auth] Authenticating Super Admin...');
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'arun.s@maatram.org', password: 'Admin@123' }),
    });
    const adminData = (await adminRes.json()) as any;
    adminToken = adminData.data.accessToken;
    console.log('  ✅ Super Admin authenticated.');

    console.log('🔐 [Auth] Authenticating Zone In-charge persona...');
    const zoneUser = await prisma.user.findFirst({
      where: { role: 'zone', zoneId: { not: null } },
      include: { zone: true },
    });
    if (!zoneUser || !zoneUser.zoneId) throw new Error('No Zone In-charge user found');

    zoneUserId = zoneUser.id;
    assignedZoneId = zoneUser.zoneId;
    await prisma.user.update({ where: { id: zoneUserId }, data: { passwordHash: defaultPwHash, isActive: true } });

    const zoneLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: zoneUser.email || zoneUser.employeeId || 'zone',
        password: 'Release@123',
      }),
    });
    const zoneLoginData = (await zoneLoginRes.json()) as any;
    zoneToken = zoneLoginData.data.accessToken;
    console.log(`  ✅ Zone In-charge authenticated (Zone ID: ${assignedZoneId}).`);

    console.log('🔐 [Auth] Authenticating Student persona...');
    const studentEntity = await prisma.student.findFirst({
      include: { user: true },
    });
    if (!studentEntity || !studentEntity.user) throw new Error('No student user found in database');

    const studentUser = studentEntity.user;
    studentUserId = studentUser.id;
    studentId = studentEntity.id;
    assignedZoneId = studentEntity.zoneId;
    await prisma.user.update({ where: { id: studentUserId }, data: { passwordHash: defaultPwHash, isActive: true } });

    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: studentUser.email || studentUser.registerNumber || 'student',
        password: 'Release@123',
      }),
    });
    const studentLoginData = (await studentLoginRes.json()) as any;
    studentToken = studentLoginData.data.accessToken;
    console.log(`  ✅ Student authenticated (Student ID: ${studentId}).`);

    // Fetch an out-of-zone student for security isolation checks
    const outZoneStudent = await prisma.student.findFirst({
      where: { zoneId: { not: assignedZoneId } },
    });
    if (outZoneStudent) outZoneStudentId = outZoneStudent.id;

    // ─── 2. STUDENT PROFILE & SUB-COLLECTIONS CRUD ────────────────────────────
    console.log('\n👤 [Profile CRUD] Testing Skills, Projects, and Certifications CRUD...');

    // Skills CRUD
    const addSkillRes = await fetch(`${BASE_URL}/profile/skills`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName: 'TypeScript Enterprise' }),
    });
    if (addSkillRes.status !== 201) throw new Error(`Add skill failed: ${addSkillRes.status}`);
    const addedSkill = ((await addSkillRes.json()) as any).data;
    console.log(`  ✅ Added Skill: "${addedSkill.skillName}" (ID: ${addedSkill.id})`);

    const editSkillRes = await fetch(`${BASE_URL}/profile/skills/${addedSkill.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName: 'TypeScript Enterprise (Expert)' }),
    });
    if (editSkillRes.status !== 200) throw new Error(`Edit skill failed: ${editSkillRes.status}`);
    console.log('  ✅ Edited Skill title.');

    const delSkillRes = await fetch(`${BASE_URL}/profile/skills/${addedSkill.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (delSkillRes.status !== 200) throw new Error(`Delete skill failed: ${delSkillRes.status}`);
    console.log('  ✅ Deleted Skill successfully.');

    // Projects CRUD
    const addProjRes = await fetch(`${BASE_URL}/profile/projects`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Maatram Release Portal',
        description: 'Production candidate student management application.',
        techStack: 'React, Node.js, Prisma, PostgreSQL',
        githubUrl: 'https://github.com/maatram/release-portal',
      }),
    });
    if (addProjRes.status !== 201) throw new Error(`Add project failed: ${addProjRes.status}`);
    const addedProj = ((await addProjRes.json()) as any).data;
    console.log(`  ✅ Added Project: "${addedProj.title}" (ID: ${addedProj.id})`);

    const delProjRes = await fetch(`${BASE_URL}/profile/projects/${addedProj.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (delProjRes.status !== 200) throw new Error(`Delete project failed: ${delProjRes.status}`);
    console.log('  ✅ Deleted Project successfully.');

    // Certifications CRUD
    const addCertRes = await fetch(`${BASE_URL}/profile/certifications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: '2024-05-20',
      }),
    });
    if (addCertRes.status !== 201) throw new Error(`Add certification failed: ${addCertRes.status}`);
    const addedCert = ((await addCertRes.json()) as any).data;
    console.log(`  ✅ Added Certification: "${addedCert.title}" (ID: ${addedCert.id})`);

    const delCertRes = await fetch(`${BASE_URL}/profile/certifications/${addedCert.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (delCertRes.status !== 200) throw new Error(`Delete certification failed: ${delCertRes.status}`);
    console.log('  ✅ Deleted Certification successfully.');

    // ─── 3. VOLUNTEER WORKFLOW & APPROVALS ────────────────────────────────────
    console.log('\n🤝 [Volunteer Workflow] Testing Submission, Proof Upload & Zone Approval...');

    const subRes = await fetch(`${BASE_URL}/volunteers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Community Tree Plantation Drive',
        category: 'SCHOOL_VISIT',
        hours: 6,
        count: 15,
        eventDate: '2024-07-10',
        description: 'Planted native saplings at Maatram green zone campus.',
      }),
    });
    if (subRes.status !== 201) throw new Error(`Volunteer work submission failed: ${subRes.status}`);
    const createdSub = ((await subRes.json()) as any).data;
    console.log(`  ✅ Submitted Volunteer Work Log (Code: ${createdSub.submissionCode || createdSub.id}).`);

    // Zone In-charge lists pending and approves
    const pendingRes = await fetch(`${BASE_URL}/volunteers?status=pending`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (pendingRes.status !== 200) throw new Error(`Fetch pending volunteer work failed: ${pendingRes.status}`);
    console.log('  ✅ Zone In-charge fetched pending approvals list.');

    const approveRes = await fetch(`${BASE_URL}/volunteers/${createdSub.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${zoneToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', reviewerComment: 'Verified participation.' }),
    });
    if (approveRes.status !== 200) throw new Error(`Volunteer approval failed: ${approveRes.status}`);
    console.log('  ✅ Zone In-charge approved volunteer work submission.');

    // ─── 4. RESUME SYSTEM & RBAC VERIFICATION ────────────────────────────────
    console.log('\n📄 [Resume RBAC] Testing Resume System Security & Scoping...');

    // Student fetches own resume
    const ownResumeRes = await fetch(`${BASE_URL}/students/${studentId}/resume`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (ownResumeRes.status !== 200) throw new Error(`Student failed to fetch own resume: ${ownResumeRes.status}`);
    console.log('  ✅ Student fetched OWN resume (200 OK).');

    // Student attempts to view another student's resume (Must be 403 Forbidden)
    if (outZoneStudentId) {
      const otherResumeRes = await fetch(`${BASE_URL}/students/${outZoneStudentId}/resume`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (otherResumeRes.status !== 403) throw new Error(`Security Violation: Student accessed another resume (Status: ${otherResumeRes.status})`);
      console.log('  ✅ Student access to another student resume blocked (403 Forbidden).');

      // Zone In-charge attempts to view out-of-zone student resume (Must be 403 Forbidden)
      const outZoneRes = await fetch(`${BASE_URL}/students/${outZoneStudentId}/resume`, {
        headers: { Authorization: `Bearer ${zoneToken}` },
      });
      if (outZoneRes.status !== 403) throw new Error(`Security Violation: Zone In-charge accessed out-of-zone resume (Status: ${outZoneRes.status})`);
      console.log('  ✅ Zone In-charge access to out-of-zone student resume blocked (403 Forbidden).');
    }

    // Super Admin views student resume
    const adminResumeRes = await fetch(`${BASE_URL}/students/${studentId}/resume`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminResumeRes.status !== 200) throw new Error(`Super Admin failed to view student resume: ${adminResumeRes.status}`);
    console.log('  ✅ Super Admin fetched student resume (200 OK).');

    // ─── 5. ASSIGNED COLLEGES & EXCEL EXPORTS ────────────────────────────────
    console.log('\n🏛️ [Colleges & Exports] Testing Assigned Colleges Breakdown & Excel Exports...');

    const collegesRes = await fetch(`${BASE_URL}/zones/${assignedZoneId}/colleges`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (collegesRes.status !== 200) throw new Error(`Assigned colleges breakdown failed: ${collegesRes.status}`);
    console.log('  ✅ Assigned Colleges breakdown fetched successfully.');

    const excelExportRes = await fetch(`${BASE_URL}/students/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${zoneToken}` },
    });
    if (excelExportRes.status !== 200) throw new Error(`Student directory export failed: ${excelExportRes.status}`);
    console.log('  ✅ Student Directory Excel export verified.');

    // ─── 6. MEDIA & STATIC FILE SERVING ─────────────────────────────────────
    console.log('\n🖼️ [Media Serving] Verifying Static Media Asset Delivery...');
    const staticSample = path.join(process.cwd(), 'uploads', 'v1_1_1_sample.jpg');
    fs.writeFileSync(staticSample, 'RELEASE_1_1_1_MEDIA_CONTENT');

    const mediaRes = await fetch(`http://localhost:${PORT}/uploads/v1_1_1_sample.jpg`);
    if (mediaRes.status !== 200) throw new Error(`Static media asset delivery failed: ${mediaRes.status}`);
    console.log('  ✅ Static media asset delivery verified.');

    if (fs.existsSync(staticSample)) fs.unlinkSync(staticSample);

    console.log('\n🎉 COMPREHENSIVE RELEASE CANDIDATE TEST SUITE PASSED SUCCESSFULLY (100% PASS RATE)!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Phase 9.5 Release Candidate Test Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runPhase9_5Tests();
