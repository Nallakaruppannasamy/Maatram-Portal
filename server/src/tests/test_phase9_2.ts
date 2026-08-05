/**
 * @file src/tests/test_phase9_2.ts
 * @description Integration & Regression Test Suite for Phase 9.2 Student Portal Enhancement & Resume System.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const PORT = 4700;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let studentToken = '';
let studentId = '';
let studentUserId = '';
let adminToken = '';
let zoneToken = '';
let zoneInchargeZoneId = '';

async function runPhase9_2Tests() {
  console.log('🚀 Starting Phase 9.2 Student Portal & Resume Integration Test Suite...\n');

  server = app.listen(PORT, () => {
    console.log(`📡 Phase 9.2 Test server listening on port ${PORT}`);
  });

  try {
    // ─── 1. SETUP & AUTHENTICATION ──────────────────────────────────────────
    console.log('🔐 [Auth] Authenticating Super Admin...');
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'arun.s@maatram.org', password: 'Admin@123' }),
    });
    const adminData = (await adminRes.json()) as any;
    adminToken = adminData.data.accessToken;
    console.log('  ✅ Super Admin authenticated.');

    console.log('🔐 [Auth] Authenticating Student persona...');
    const studentUser = await prisma.user.findFirst({
      where: { role: 'student' },
      include: { student: true },
    });
    if (!studentUser || !studentUser.student) throw new Error('No student found in DB for testing');
    
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

    // ─── 2. TASK 1: SKILLS CRUD ──────────────────────────────────────────────
    console.log('\n🛠️ [Task 1] Testing Skill CRUD endpoints...');
    
    // Add Skill
    const addSkillRes = await fetch(`${BASE_URL}/profile/skills`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName: 'React.js' }),
    });
    if (addSkillRes.status !== 201) throw new Error(`Add skill failed with status ${addSkillRes.status}`);
    const addedSkillData = (await addSkillRes.json()) as any;
    const createdSkillId = addedSkillData.data.id;
    console.log(`  ✅ Added Skill: "React.js" (ID: ${createdSkillId})`);

    // Edit Skill
    const editSkillRes = await fetch(`${BASE_URL}/profile/skills/${createdSkillId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName: 'React.js (Advanced)' }),
    });
    if (editSkillRes.status !== 200) throw new Error(`Edit skill failed with status ${editSkillRes.status}`);
    console.log('  ✅ Edited Skill: "React.js (Advanced)"');

    // Verify Skill in Profile
    const profileRes = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const profileData = (await profileRes.json()) as any;
    const hasSkill = profileData.data.skills?.some((s: any) => s.id === createdSkillId);
    if (!hasSkill) throw new Error('Skill not reflected in profile GET endpoint');
    console.log('  ✅ Skill verified in Student Profile response.');

    // Delete Skill
    const delSkillRes = await fetch(`${BASE_URL}/profile/skills/${createdSkillId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (delSkillRes.status !== 200) throw new Error(`Delete skill failed with status ${delSkillRes.status}`);
    console.log('  ✅ Deleted Skill successfully.');

    // ─── 3. TASK 2: PROJECTS CRUD ────────────────────────────────────────────
    console.log('\n📁 [Task 2] Testing Project CRUD endpoints...');

    // Add Project
    const addProjRes = await fetch(`${BASE_URL}/profile/projects`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Maatram Portal Enterprise',
        description: 'Full stack student & volunteer portal build.',
        techStack: 'React, TypeScript, Node.js, Prisma',
        githubUrl: 'https://github.com/maatram/portal',
        demoUrl: 'https://maatram-demo.org',
      }),
    });
    if (addProjRes.status !== 201) throw new Error(`Add project failed with status ${addProjRes.status}`);
    const addedProjData = (await addProjRes.json()) as any;
    const createdProjId = addedProjData.data.id;
    console.log(`  ✅ Added Project: "${addedProjData.data.title}" (ID: ${createdProjId})`);

    // Edit Project
    const editProjRes = await fetch(`${BASE_URL}/profile/projects/${createdProjId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Maatram Portal v1.1.1' }),
    });
    if (editProjRes.status !== 200) throw new Error(`Edit project failed with status ${editProjRes.status}`);
    console.log('  ✅ Edited Project title to "Maatram Portal v1.1.1"');

    // Delete Project
    const delProjRes = await fetch(`${BASE_URL}/profile/projects/${createdProjId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (delProjRes.status !== 200) throw new Error(`Delete project failed with status ${delProjRes.status}`);
    console.log('  ✅ Deleted Project successfully.');

    // ─── 4. TASK 3: CERTIFICATIONS CRUD ─────────────────────────────────────
    console.log('\n📜 [Task 3] Testing Certification CRUD endpoints...');

    // Add Certification
    const addCertRes = await fetch(`${BASE_URL}/profile/certifications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: '2024-06-15',
        certificateUrl: 'https://aws.amazon.com/verify/12345',
      }),
    });
    if (addCertRes.status !== 201) throw new Error(`Add certification failed: ${addCertRes.status}`);
    const addedCertData = (await addCertRes.json()) as any;
    const createdCertId = addedCertData.data.id;
    console.log(`  ✅ Added Certification: "${addedCertData.data.title}" (ID: ${createdCertId})`);

    // Edit Certification
    const editCertRes = await fetch(`${BASE_URL}/profile/certifications/${createdCertId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'AWS Certified Solutions Architect Professional' }),
    });
    if (editCertRes.status !== 200) throw new Error(`Edit certification failed: ${editCertRes.status}`);
    console.log('  ✅ Edited Certification title.');

    // Delete Certification
    const delCertRes = await fetch(`${BASE_URL}/profile/certifications/${createdCertId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (delCertRes.status !== 200) throw new Error(`Delete certification failed: ${delCertRes.status}`);
    console.log('  ✅ Deleted Certification successfully.');

    // ─── 5. TASK 4 & 5: RESUME RBAC & DATA AUDIT ─────────────────────────────
    console.log('\n📄 [Task 4 & 5] Auditing Resume System RBAC & Data Delivery...');

    // Student fetches OWN resume
    const ownResumeRes = await fetch(`${BASE_URL}/students/${studentId}/resume`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (ownResumeRes.status !== 200) throw new Error(`Student failed to fetch own resume: ${ownResumeRes.status}`);
    const ownResumeData = (await ownResumeRes.json()) as any;
    if (ownResumeData.data.id !== studentId) throw new Error('Returned resume ID does not match student ID');
    console.log('  ✅ Student successfully fetched OWN resume.');

    // Student fetches OTHER student's resume (must be 403 Forbidden)
    const otherStudent = await prisma.student.findFirst({
      where: { id: { not: studentId } },
    });
    if (otherStudent) {
      const otherResumeRes = await fetch(`${BASE_URL}/students/${otherStudent.id}/resume`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (otherResumeRes.status !== 403) {
        throw new Error(`Security Violation: Student accessed another student resume (Status: ${otherResumeRes.status})`);
      }
      console.log('  ✅ Student access to another student\'s resume correctly blocked (403 Forbidden).');
    }

    // Super Admin fetches ANY student resume
    const adminResumeRes = await fetch(`${BASE_URL}/students/${studentId}/resume`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminResumeRes.status !== 200) throw new Error(`Admin failed to fetch student resume: ${adminResumeRes.status}`);
    console.log('  ✅ Super Admin successfully fetched student resume.');

    console.log('\n🎉 ALL PHASE 9.2 STUDENT PORTAL & RESUME TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Phase 9.2 Integration Test Failed:', error.message || error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runPhase9_2Tests();
