/**
 * @file src/tests/test_phase8_2.ts
 * @description Programmatic integration tests for Phase 8.2 Student Provisioning & Activation Workflow.
 */

import { Server } from 'http';
import app from '../app';
import { prisma } from '../config/database';
import { ImportStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

const PORT = 4599;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server: Server;
let adminAccessToken = '';

async function runTests() {
  console.log('🚀 Starting Phase 8.2 Student Provisioning & Activation Integration Tests...');

  // Start server
  server = app.listen(PORT, () => {
    console.log(`📡 Test server listening on port ${PORT}`);
  });

  try {
    // ─── 0. CLEANUP LEFTOVERS ────────────────────────────────────────────────
    console.log('🧼 Cleaning up previous test records...');
    await prisma.student.deleteMany({
      where: {
        registrationNumber: {
          in: [
            'P82-REG-001',
            'P82-BULK-001',
            'P82-BULK-002',
            'P82-BULK-003',
            'P82-BULK-004',
          ],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'p82.student@example.com',
            'alice.bulk@example.com',
            'bob.bulk@example.com',
            'charlie.bulk@example.com',
            'david.bulk@example.com',
          ],
        },
      },
    });
    console.log('🧼 Cleanup completed.');

    // ─── 1. AUTHENTICATE ADMIN ──────────────────────────────────────────────
    console.log('\n🔐 [Authentication] Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'arun.s@maatram.org',
        password: 'Admin@123',
      }),
    });

    const loginData = (await loginRes.json()) as any;
    if (!loginRes.ok) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }

    adminAccessToken = loginData.data.accessToken;
    console.log('✅ Admin authenticated successfully.');

    // ─── 2. MANUAL REGISTRATION ──────────────────────────────────────────────
    console.log('\n👨‍🎓 [Manual Provisioning] Testing Manual Student Registration...');
    const manualRegRes = await fetch(`${BASE_URL}/students/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        studentName: 'Test Phase 8.2 Student',
        registrationNumber: 'P82-REG-001',
        email: 'p82.student@example.com',
        dateOfBirth: '2004-06-08',
      }),
    });

    const manualData = (await manualRegRes.json()) as any;
    if (manualRegRes.status !== 201) {
      throw new Error(`Manual registration failed: ${JSON.stringify(manualData)}`);
    }

    console.log('✅ Student manually provisioned.');
    const userInDb = await prisma.user.findUnique({
      where: { email: 'p82.student@example.com' },
    });

    if (!userInDb || userInDb.tempPassword !== '08/06/2004') {
      throw new Error(`Expected temporary password to be "08/06/2004", got "${userInDb?.tempPassword}"`);
    }
    console.log('✅ Temporary password matches DOB format dd/mm/yyyy.');

    // Verify Audit Logs
    const creationAudit = await prisma.auditLog.findFirst({
      where: { action: 'STUDENT_CREATED', targetLabel: 'Test Phase 8.2 Student' },
    });
    if (!creationAudit) {
      throw new Error('Audit log STUDENT_CREATED not generated.');
    }
    console.log('✅ STUDENT_CREATED audit log exists.');

    const emailAudit = await prisma.auditLog.findFirst({
      where: { action: 'WELCOME_EMAIL_SENT', targetLabel: 'Test Phase 8.2 Student' },
    });
    if (!emailAudit) {
      throw new Error('Audit log WELCOME_EMAIL_SENT not generated.');
    }
    console.log('✅ WELCOME_EMAIL_SENT audit log exists.');

    // ─── 3. DUPLICATE VALIDATION ─────────────────────────────────────────────
    console.log('\n🚫 [Validation] Testing Duplicate Rejections...');
    const duplicateEmailRes = await fetch(`${BASE_URL}/students/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        studentName: 'Other Student Name',
        registrationNumber: 'P82-REG-999',
        email: 'p82.student@example.com', // Duplicate
        dateOfBirth: '2004-06-08',
      }),
    });

    if (duplicateEmailRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for duplicate email, got ${duplicateEmailRes.status}`);
    }
    console.log('✅ Duplicate email rejected successfully.');

    const duplicateRegRes = await fetch(`${BASE_URL}/students/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        studentName: 'Other Student Name',
        registrationNumber: 'P82-REG-001', // Duplicate
        email: 'other.student@example.com',
        dateOfBirth: '2004-06-08',
      }),
    });

    if (duplicateRegRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for duplicate register number, got ${duplicateRegRes.status}`);
    }
    console.log('✅ Duplicate Register Number rejected successfully.');

    // ─── 4. TEMPLATE DOWNLOAD ────────────────────────────────────────────────
    console.log('\n📥 [Download Template] Testing XLSX Import Template Download...');
    const templateRes = await fetch(`${BASE_URL}/students/template`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });

    if (templateRes.status !== 200) {
      throw new Error(`Template download failed with status ${templateRes.status}`);
    }

    const templateArrayBuffer = await templateRes.arrayBuffer();
    const templateWorkbook = XLSX.read(new Uint8Array(templateArrayBuffer), { type: 'array' });
    const templateSheet = templateWorkbook.Sheets[templateWorkbook.SheetNames[0]];
    const templateRows = XLSX.utils.sheet_to_json<any>(templateSheet);

    if (templateRows.length === 0) {
      throw new Error('Template is empty');
    }

    const templateHeaders = Object.keys(templateRows[0]);
    if (
      !templateHeaders.includes('Student Name') ||
      !templateHeaders.includes('Register Number') ||
      !templateHeaders.includes('Email') ||
      !templateHeaders.includes('Date Of Birth')
    ) {
      throw new Error(`Template columns are incorrect. Found: ${templateHeaders.join(', ')}`);
    }
    console.log('✅ Dynamic XLSX template verified successfully.');

    // ─── 5. BULK TRANSACTIONAL EXCEL IMPORT ──────────────────────────────────
    console.log('\n📥 [Bulk Import] Testing Bulk Excel Import with Valid Data...');

    // Construct valid workbook
    const validData = [
      {
        'Student Name': 'Alice Bulk',
        'Register Number': 'P82-BULK-001',
        Email: 'alice.bulk@example.com',
        'Date Of Birth': '20/12/2005',
      },
      {
        'Student Name': 'Bob Bulk',
        'Register Number': 'P82-BULK-002',
        Email: 'bob.bulk@example.com',
        'Date Of Birth': '14/02/2006',
      },
    ];

    const validWb = XLSX.utils.book_new();
    const validWs = XLSX.utils.json_to_sheet(validData);
    XLSX.utils.book_append_sheet(validWb, validWs, 'Import Sheet');
    const validBuffer = XLSX.write(validWb, { type: 'buffer', bookType: 'xlsx' });

    // Prepare multipart form upload
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = 'valid_students.xlsx';

    const reqBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
      Buffer.from('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n'),
      validBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const importRes = await fetch(`${BASE_URL}/students/import`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: reqBody,
    });

    const importData = (await importRes.json()) as any;
    if (importRes.status !== 200 || !importData.success) {
      throw new Error(`Bulk import failed: ${JSON.stringify(importData)}`);
    }
    console.log('✅ Bulk import created students successfully.');

    const alice = await prisma.student.findUnique({
      where: { registrationNumber: 'P82-BULK-001' },
    });
    const bob = await prisma.student.findUnique({
      where: { registrationNumber: 'P82-BULK-002' },
    });
    if (!alice || !bob) {
      throw new Error('Alice or Bob bulk student records not found in database.');
    }
    console.log('✅ Bulk imported students verified in database.');

    // ─── 6. TRANSACTIONAL IMPORT ROLLBACK ON SINGLE ROW FAILURE ───────────────
    console.log('\n⚠️ [Bulk Rollback] Testing Transactional Rollback on Single Failure...');

    const invalidData = [
      {
        'Student Name': 'Charlie Bulk',
        'Register Number': 'P82-BULK-003',
        Email: 'charlie.bulk@example.com',
        'Date Of Birth': '11/11/2005',
      },
      {
        'Student Name': 'David Bulk',
        'Register Number': 'P82-BULK-004',
        Email: 'alice.bulk@example.com', // Duplicate Email! Should fail import.
        'Date Of Birth': '12/12/2005',
      },
    ];

    const invalidWb = XLSX.utils.book_new();
    const invalidWs = XLSX.utils.json_to_sheet(invalidData);
    XLSX.utils.book_append_sheet(invalidWb, invalidWs, 'Import Sheet');
    const invalidBuffer = XLSX.write(invalidWb, { type: 'buffer', bookType: 'xlsx' });

    const reqBodyInvalid = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="invalid_students.xlsx"\r\n`),
      Buffer.from('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n'),
      invalidBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const importFailRes = await fetch(`${BASE_URL}/students/import`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: reqBodyInvalid,
    });

    const importFailData = (await importFailRes.json()) as any;
    if (importFailRes.status !== 400 || importFailData.success !== false) {
      throw new Error(`Expected HTTP 400 for invalid sheet upload, got ${importFailRes.status}`);
    }

    console.log('✅ Bulk import failed and returned detailed report.');
    if (!importFailData.data?.errors || importFailData.data.errors.length === 0) {
      throw new Error(`Expected row errors list, got: ${JSON.stringify(importFailData)}`);
    }
    console.log(`✅ Detailed errors: ${JSON.stringify(importFailData.data.errors)}`);

    // Verify Rollback
    const charlie = await prisma.student.findUnique({
      where: { registrationNumber: 'P82-BULK-003' },
    });
    if (charlie) {
      throw new Error('Charlie Bulk was created in DB. Transaction failed to roll back!');
    }
    console.log('✅ Transaction rolled back successfully: Charlie Bulk does not exist.');

    // ─── 7. EXPORT PROVISIONING LIST ──────────────────────────────────────────
    console.log('\n📤 [Export] Testing Provisioning Table Export...');
    const exportRes = await fetch(`${BASE_URL}/students/export?search=P82-REG-001&format=csv`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });

    if (exportRes.status !== 200) {
      throw new Error(`Export failed with status ${exportRes.status}`);
    }

    const exportText = await exportRes.text();
    if (!exportText.includes('P82-REG-001') || exportText.includes('P82-BULK-001')) {
      throw new Error(`Export should only include search matched student. Found:\n${exportText}`);
    }
    console.log('✅ Export respects search query and returns matched provisioning table only.');

    // ─── 8. FIRST LOGIN CREDENTIALS & CHANGE PASSWORD ────────────────────────
    console.log('\n🔐 [Student Activation] Testing Student Login & Password Update...');

    // Login with temp password
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'P82-REG-001',
        password: '08/06/2004', // DOB temp password
      }),
    });

    const studentLoginData = (await studentLoginRes.json()) as any;
    if (studentLoginRes.status !== 200) {
      throw new Error(`Student temp login failed: ${JSON.stringify(studentLoginData)}`);
    }

    const studentToken = studentLoginData.data.accessToken;
    if (!studentLoginData.data.user.isFirstLogin) {
      throw new Error('Expected isFirstLogin to be true for newly provisioned student');
    }
    console.log('✅ Logged in successfully with temporary DOB password.');

    // Update password
    const changePasswordRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: '08/06/2004',
        newPassword: 'Student@Activated123',
        confirmPassword: 'Student@Activated123',
      }),
    });

    const changeData = (await changePasswordRes.json()) as any;
    if (changePasswordRes.status !== 200 || !changeData.success) {
      throw new Error(`Password change failed: ${JSON.stringify(changeData)}`);
    }
    console.log('✅ Password changed successfully on first login.');

    // Login with new password
    const secondLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'P82-REG-001',
        password: 'Student@Activated123',
      }),
    });

    const secondLoginData = (await secondLoginRes.json()) as any;
    if (secondLoginRes.status !== 200) {
      throw new Error(`Login with new password failed: ${JSON.stringify(secondLoginData)}`);
    }

    if (secondLoginData.data.user.isFirstLogin) {
      throw new Error('Expected isFirstLogin to be false after password change');
    }
    console.log('✅ Student logged in successfully with new activated password.');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! Phase 8.2 is verified.');
  } catch (err: any) {
    console.error(`\n❌ TEST FAILURE: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close(() => {
        console.log('📡 Test server closed.');
      });
    }
  }
}

runTests();
