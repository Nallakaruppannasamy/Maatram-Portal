# Maatram Portal — End-to-End Functional Test & Regression Plan

## 1. Document Overview

This document defines the comprehensive end-to-end (E2E) functional validation and regression testing plan for the **Maatram Foundation Student & Volunteer Management System (Maatram Portal)**. This testing phase verifies that **all existing system functionality remains fully operational** following the implementation of Security Hardening Phase 1 (SEC-001 → SEC-006) and Phase 2 (SEC-007 → SEC-010, SheetJS to ExcelJS migration).

**Target Branch**: `security/hardening`  
**Execution Mode**: Non-destructive automated & manual verification against test database.

---

## 2. Feature Inventory & Architecture

### Backend Modules & Subsystems
- **Authentication**: JWT access tokens (15m), HttpOnly refresh token cookies (7d), single-use rotation, reuse detection session invalidation, bcrypt hashing, forgot/reset password.
- **Organization Management**: Organization hierarchy, CRUD, colleges, departments, programs.
- **Zone Management**: Multi-tier zones, Zone Incharge assignment, regional colleges, zone statistics.
- **Student Management**: Manual registration, Excel bulk provisioning (ExcelJS), dynamic template generator, directory, profile, SPOC designation, status transitions, archiving, bulk deactivation.
- **Volunteer Management**: Volunteer directory, volunteering opportunities, student hour submission, multi-tier review & approval/rejection, comments.
- **Academic & Profile Metadata**: Degree/College/Department resolution, skills, projects, certifications, student resume data generation.
- **Notifications**: System notifications (in-app DB records), transactional welcome & credential emails.
- **Audit Logging**: Actor tracking, action codes, IP/UserAgent logging, zero credential leakage.
- **Analytics & Dashboards**: Super Admin dashboard, Zone Incharge dashboard, Student dashboard, drill-downs.
- **File & Media Storage**: Cloudinary integration for profile images and volunteer proofs; secure upload middleware for private student documents.
- **Spreadsheet Processing**: ExcelJS workbook generation and parsing; CSV/Formula injection sanitization (`sanitizeFormula`).

### Frontend Routes & Roles
- **Public**: `/`, `/login`, `/forgot-password`, `/reset-password`
- **Authenticated Common**: `/change-password`, `/notifications`, `/resume/:studentId`
- **Student Portal**: `/student/dashboard`, `/student/profile`, `/student/volunteer-submit`, `/student/volunteer-history`, `/student/resume`
- **Zone Incharge Portal**: `/zone/dashboard`, `/zone/approvals`, `/zone/students`, `/zone/archived-students`, `/zone/colleges`, `/zone/analytics`, `/zone/profile`, `/zone/audit-logs`, `/zone/volunteering-logs`
- **Super Admin Portal**: `/admin/dashboard`, `/admin/provisioning`, `/admin/students`, `/admin/archived-students`, `/admin/hierarchy`, `/admin/zones`, `/admin/team`, `/admin/volunteering-logs`, `/admin/analytics`, `/admin/audit-logs`, `/admin/profile`

---

## 3. Test Actors & Safe Test Data

All testing utilizes strictly isolated, non-production test accounts and entities:

| Actor Role | Test Identifier / Email | Test Name | Scope / Assigned Zone |
|---|---|---|---|
| **Super Admin** | `test.superadmin@maatram.test` | Test SuperAdmin | Global (All Orgs & Zones) |
| **Zone A Incharge** | `test.zoneA@maatram.test` | Test Incharge Zone A | Zone A (`TEST-ZONE-A`) |
| **Zone B Incharge** | `test.zoneB@maatram.test` | Test Incharge Zone B | Zone B (`TEST-ZONE-B`) |
| **Student A** | `test.studentA@maatram.test` | Test Student A | Zone A (`TEST-ZONE-A`) |
| **Student B** | `test.studentB@maatram.test` | Test Student B | Zone B (`TEST-ZONE-B`) |
| **Volunteer A** | `test.volA@maatram.test` | Test Volunteer A | Zone A (`TEST-ZONE-A`) |
| **Volunteer B** | `test.volB@maatram.test` | Test Volunteer B | Zone B (`TEST-ZONE-B`) |

### Test Organizations & Zones
- **Test Organization**: `TEST-ORG-E2E` (Code: `TORG-01`)
- **Test Zone A**: `TEST-ZONE-A` (Code: `TZONE-A`, Region: `North Chennai`)
- **Test Zone B**: `TEST-ZONE-B` (Code: `TZONE-B`, Region: `South Madurai`)
- **Test College A**: `TEST-COL-A` (Code: `TCOL-A`, Zone: `TEST-ZONE-A`)
- **Test College B**: `TEST-COL-B` (Code: `TCOL-B`, Zone: `TEST-ZONE-B`)

---

## 4. Numbered Test Cases

### Category 1: Authentication & Session Lifecycle (`E2E-AUTH-xxx`)
- **E2E-AUTH-001**: Super Admin login with valid credentials (JWT issued, HttpOnly cookie set, no refreshToken in JSON).
- **E2E-AUTH-002**: Zone A Incharge login with valid credentials.
- **E2E-AUTH-003**: Student A login with valid credentials.
- **E2E-AUTH-004**: Login rejection on invalid identifier / nonexistent account (HTTP 401).
- **E2E-AUTH-005**: Login rejection on incorrect password (HTTP 401).
- **E2E-AUTH-006**: Login rejection on malformed / missing payload (HTTP 400).
- **E2E-AUTH-007**: Login rejection on deactivated account (`isActive: false` -> HTTP 401).
- **E2E-AUTH-008**: Fetch current authenticated user profile (`GET /api/v1/auth/me`).
- **E2E-AUTH-009**: Token refresh via HttpOnly cookie (`POST /api/v1/auth/refresh`).
- **E2E-AUTH-010**: Single-use token rotation (old token revoked, new token issued).
- **E2E-AUTH-011**: Revoked refresh token reuse detection (revokes all active sessions for user).
- **E2E-AUTH-012**: Logout (`POST /api/v1/auth/logout`) clears cookie and invalidates DB session.
- **E2E-AUTH-013**: Password change (`POST /api/v1/auth/change-password`) updates password and revokes all active sessions.
- **E2E-AUTH-014**: Forgot password request (`POST /api/v1/auth/forgot-password`) enumeration prevention.
- **E2E-AUTH-015**: Password reset execution (`POST /api/v1/auth/reset-password`) with token validation and session termination.

### Category 2: Super Admin Workflows (`E2E-ADMIN-xxx`)
- **E2E-ADMIN-001**: Super Admin Dashboard loads KPIs, counts, charts, and highlights.
- **E2E-ADMIN-002**: Organization hierarchy and CRUD (`POST`, `GET`, `PUT /api/v1/organizations`).
- **E2E-ADMIN-003**: Zone management and CRUD (`POST`, `GET`, `PUT /api/v1/zones`).
- **E2E-ADMIN-004**: College, department, and program management under zone.
- **E2E-ADMIN-005**: Team management (user listing, filtering, role assignment, activation/deactivation).
- **E2E-ADMIN-006**: Single student manual registration (`POST /api/v1/students/manual`).
- **E2E-ADMIN-007**: Dynamic XLSX student import template generation and download (`GET /api/v1/students/template`).
- **E2E-ADMIN-008**: Bulk student XLSX upload and async job processing (`POST /api/v1/students/import`).
- **E2E-ADMIN-009**: Bulk import error handling (duplicate emails, invalid columns, error report export).
- **E2E-ADMIN-010**: Student directory listing with multi-field filtering (stream, gender, status).
- **E2E-ADMIN-011**: Student search across registration number and name (exact, partial, case-insensitive).
- **E2E-ADMIN-012**: Student profile view with complete personal, academic, and contact details.
- **E2E-ADMIN-013**: Student details update (CGPA, career objective, academic data).
- **E2E-ADMIN-014**: Student status transition (ACTIVE -> SUSPENDED -> GRADUATED).
- **E2E-ADMIN-015**: Student SPOC designation update (`PATCH /api/v1/students/:id/spoc`).
- **E2E-ADMIN-016**: Archived students directory and query filtering.
- **E2E-ADMIN-017**: Bulk student deactivation (`POST /api/v1/students/bulk-deactivate`).
- **E2E-ADMIN-018**: Global volunteering logs view and search across all zones.
- **E2E-ADMIN-019**: Audit log viewing with action/actor filtering and credential sanitization verification.
- **E2E-ADMIN-020**: Super Admin profile view and update.

### Category 3: Zone Incharge Workflows & BOLA Isolation (`E2E-ZONE-xxx`)
- **E2E-ZONE-001**: Zone A Incharge dashboard loads metrics scoped exclusively to Zone A.
- **E2E-ZONE-002**: Zone A Incharge student directory displays Zone A students.
- **E2E-ZONE-003**: Zone A Incharge student directory hides Zone B students.
- **E2E-ZONE-004**: Zone A Incharge views Zone A student profile (`GET /api/v1/students/:id` -> 200 OK).
- **E2E-ZONE-005**: Zone A Incharge attempts to view Zone B student profile (Blocked -> 403 Forbidden).
- **E2E-ZONE-006**: Zone A Incharge updates Zone A student SPOC status (`PATCH /api/v1/students/:id/spoc` -> 200 OK).
- **E2E-ZONE-007**: Zone A Incharge attempts to update Zone B student SPOC status (Blocked -> 403 Forbidden).
- **E2E-ZONE-008**: Zone A Incharge updates Zone A student account status (`PATCH /api/v1/students/:id/status` -> 200 OK).
- **E2E-ZONE-009**: Zone A Incharge attempts to update Zone B student account status (Blocked -> 403 Forbidden).
- **E2E-ZONE-010**: Zone A Incharge views assigned colleges (`GET /api/v1/zones/my/colleges`).
- **E2E-ZONE-011**: Zone A Incharge views volunteers scoped to Zone A only.
- **E2E-ZONE-012**: Zone A Incharge reviews volunteer submission in Zone A (Approve / Reject).
- **E2E-ZONE-013**: Zone A Incharge attempts to review volunteer submission in Zone B (Blocked -> 403 Forbidden).
- **E2E-ZONE-014**: Zone A Incharge exports student list (contains strictly Zone A students).
- **E2E-ZONE-015**: Zone Incharge attempts administrative actions (Create Zone, Create Org -> Blocked: 403 Forbidden).

### Category 4: Student Portal Workflows (`E2E-STUDENT-xxx`)
- **E2E-STUDENT-001**: Student A dashboard loads personal metrics and summary cards.
- **E2E-STUDENT-002**: Student A views own profile and academic records.
- **E2E-STUDENT-003**: Student A updates profile details (bio, mobile, career objective).
- **E2E-STUDENT-004**: Student A manages skills (add, update, delete).
- **E2E-STUDENT-005**: Student A manages projects (add, update, delete).
- **E2E-STUDENT-006**: Student A manages certifications (add, update, delete).
- **E2E-STUDENT-007**: Student A retrieves resume compilation data (`GET /api/v1/students/:id/resume`).
- **E2E-STUDENT-008**: Student A views own volunteering submission history.
- **E2E-STUDENT-009**: Student A submits volunteering hours request.
- **E2E-STUDENT-010**: Student A receives in-app notification when submission is approved/rejected.
- **E2E-STUDENT-011**: Student A attempts to access Student B profile or resume (Blocked -> 403 Forbidden).
- **E2E-STUDENT-012**: Student A attempts to access admin routes (Blocked -> 403 Forbidden).

### Category 5: Volunteering End-to-End Business Flow (`E2E-VOL-xxx`)
- **E2E-VOL-001**: Student submits volunteering hours with category, title, hours, date, and description.
- **E2E-VOL-002**: Submission saved in database with `status = pending` and unique `submissionCode`.
- **E2E-VOL-003**: In-app notification generated for assigned Zone Incharge.
- **E2E-VOL-004**: Zone Incharge reviews pending submission, adds comment, and approves.
- **E2E-VOL-005**: Submission status transitions to `approved`; student receives approval notification.
- **E2E-VOL-006**: Student submits second volunteering record; Zone Incharge reviews and rejects with reason.
- **E2E-VOL-007**: Submission status transitions to `rejected`; student receives rejection notification.
- **E2E-VOL-008**: Volunteering analytics and student dashboard reflect updated approved hours.

### Category 6: File, Media & Private Storage (`E2E-MEDIA-xxx`)
- **E2E-MEDIA-001**: Profile image upload via Cloudinary/mock handler (JPEG, PNG, WEBP).
- **E2E-MEDIA-002**: Profile image upload rejects invalid MIME types (e.g. executable/text).
- **E2E-MEDIA-003**: Volunteer proof document upload.
- **E2E-MEDIA-004**: Private document access control: Student A accesses own document (200 OK).
- **E2E-MEDIA-005**: Private document access control: Student A accesses Student B document (403 Forbidden).
- **E2E-MEDIA-006**: Path traversal attempt on `/uploads` endpoint rejected (403 Forbidden).

### Category 7: Excel Import / Export & Formula Sanitization (`E2E-EXCEL-xxx`)
- **E2E-EXCEL-001**: Dynamic XLSX student import template generated via ExcelJS with exact headers.
- **E2E-EXCEL-002**: Bulk student import parses XLSX buffer and creates students in database.
- **E2E-EXCEL-003**: Bulk student import identifies duplicate records and returns structured row error report.
- **E2E-EXCEL-004**: Student export in XLSX format produces valid ExcelJS buffer with safe columns.
- **E2E-EXCEL-005**: Student export in CSV format sanitizes formulas (escapes `=`, `+`, `-`, `@`, `\t`, `\r`).
- **E2E-EXCEL-006**: Zone colleges export in XLSX format.
- **E2E-EXCEL-007**: Volunteering logs export in XLSX format.
- **E2E-EXCEL-008**: User/team export in XLSX format omits `passwordHash` and `tempPassword`.

### Category 8: Search, Filtering & Pagination (`E2E-SEARCH-xxx`)
- **E2E-SEARCH-001**: Empty query returns initial paginated dataset.
- **E2E-SEARCH-002**: Exact search by student registration number.
- **E2E-SEARCH-003**: Partial search by student first or last name.
- **E2E-SEARCH-004**: Case-insensitive search query matching.
- **E2E-SEARCH-005**: Combined filter query (status + stream + zone).
- **E2E-SEARCH-006**: Pagination parameters (`page`, `limit`, `totalPages`, `totalCount`).

### Category 9: RBAC & Zone Isolation Matrices (`E2E-RBAC-xxx` & `E2E-ZISOL-xxx`)
- **E2E-RBAC-001**: Unauthenticated request to protected endpoints rejected with HTTP 401.
- **E2E-RBAC-002**: Student accessing user management (`/api/v1/users`) rejected with HTTP 403.
- **E2E-RBAC-003**: Student accessing zone write endpoints rejected with HTTP 403.
- **E2E-RBAC-004**: Zone Incharge accessing organization write endpoints rejected with HTTP 403.
- **E2E-RBAC-005**: Zone Incharge accessing user write endpoints rejected with HTTP 403.
- **E2E-RBAC-006**: Super Admin has access across all modules.
- **E2E-ZISOL-001**: Zone A Incharge -> Zone A Student operations allowed.
- **E2E-ZISOL-002**: Zone A Incharge -> Zone B Student operations blocked (403 Forbidden).
- **E2E-ZISOL-003**: Zone B Incharge -> Zone B Student operations allowed.
- **E2E-ZISOL-004**: Zone B Incharge -> Zone A Student operations blocked (403 Forbidden).
- **E2E-ZISOL-005**: Super Admin access across Zone A and Zone B allowed.
- **E2E-ZISOL-006**: Zone Incharge export contains only students in assigned zone.

### Category 10: Audit Logging & Security Regressions (`E2E-SEC-xxx`)
- **E2E-SEC-001**: Sensitive business actions (login, student creation, status update) create audit records.
- **E2E-SEC-002**: Audit log details NEVER contain passwords, hashes, refresh tokens, or temp passwords.
- **E2E-SEC-003**: Rate limiting on sensitive endpoints returns HTTP 429 after threshold with standard headers.
- **E2E-SEC-004**: Refresh token cookies have `HttpOnly`, `Path=/api/v1/auth`, and appropriate `SameSite` policy.
- **E2E-SEC-005**: Helmet CSP and browser security headers active on all HTTP responses.
