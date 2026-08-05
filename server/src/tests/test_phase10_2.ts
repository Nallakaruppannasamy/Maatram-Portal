/**
 * @file src/tests/test_phase10_2.ts
 * @description Programmatic integration tests for Phase 10.2 Cloudinary Media Migration.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';

const PORT = 4705;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminToken = '';
let studentToken = '';

async function runTests() {
  console.log('🚀 Starting Phase 10.2 Cloudinary Media Migration Integration Tests...');

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

    console.log('🔐 [Authentication] Logging in as Student...');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'logesh090707@gmail.com',
        password: 'Student@123',
      }),
    });
    const studentLoginData = (await studentLoginRes.json()) as any;
    if (!studentLoginRes.ok) throw new Error(`Student login failed: ${JSON.stringify(studentLoginData)}`);
    studentToken = studentLoginData.data.accessToken;

    // Create a dummy image file buffer
    const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(dummyPngBase64, 'base64');

    // ─── 2. TEST PROFILE IMAGE UPLOAD ───
    console.log('\n🖼️ [Profile Upload] Uploading profile image...');
    const profileFormData = new FormData();
    const profileBlob = new Blob([imageBuffer], { type: 'image/png' });
    profileFormData.append('file', profileBlob, 'profile_test.png');

        const profileUploadRes = await fetch(`${BASE_URL}/profile/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
      body: profileFormData,
    });
    const profileUploadData = (await profileUploadRes.json()) as any;
    console.log('Response:', JSON.stringify(profileUploadData));
    if (!profileUploadRes.ok) {
      throw new Error(`Profile image upload failed with status ${profileUploadRes.status}`);
    }
    const fileUrl = profileUploadData.data.fileUrl;
    if (!fileUrl.includes('cloudinary.com')) {
      throw new Error(`Expected Cloudinary URL, got: ${fileUrl}`);
    }
    console.log(`✅ Profile upload verified. URL: ${fileUrl}`);

    // ─── 3. TEST VOLUNTEER PROOF UPLOAD ───
    console.log('\n📄 [Volunteer Upload] Uploading volunteer proof...');
    const volunteerFormData = new FormData();
    const volunteerBlob = new Blob([imageBuffer], { type: 'image/png' });
    volunteerFormData.append('file', volunteerBlob, 'volunteer_test.png');

    const volunteerUploadRes = await fetch(`${BASE_URL}/volunteers/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
      body: volunteerFormData,
    });
    const volunteerUploadData = (await volunteerUploadRes.json()) as any;
    console.log('Response:', JSON.stringify(volunteerUploadData));
    if (!volunteerUploadRes.ok) {
      throw new Error(`Volunteer proof upload failed with status ${volunteerUploadRes.status}`);
    }
    const volunteerUrl = volunteerUploadData.data.url;
    if (!volunteerUrl.includes('cloudinary.com')) {
      throw new Error(`Expected Cloudinary URL, got: ${volunteerUrl}`);
    }
    console.log(`✅ Volunteer proof upload verified. URL: ${volunteerUrl}`);

    console.log('\n🎉 All Phase 10.2 Cloudinary integration tests passed successfully!');
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
