# Security Hardening Phase 1 Report

## Overview

This report documents the security remediation implementation for Phase 1 of the Maatram Portal security hardening program. All six scoped Critical and High severity findings (**SEC-001** through **SEC-006**) from [`docs/SECURITY-AUDIT-REPORT.md`](file:///c:/Users/Logesh/New%20Maatram/Maatram-Portal/docs/SECURITY-AUDIT-REPORT.md) have been remediated on the dedicated branch `security/hardening`.

---

## SEC-001 — Password Hash / Temporary Password Leakage

### What Was Vulnerable
- `user.repository.ts` queried `prisma.user` without explicit field projections, allowing `passwordHash` and `tempPassword` to be fetched and propagated into user management API responses (`GET /api/v1/users`, `GET /api/v1/users/:id`).
- `student.repository.ts` queried `user: true`, exposing the nested `user.passwordHash` and `user.tempPassword` objects to student endpoints.
- `student.service.ts` included `tempPassword` in public student DTO lists and in CSV/Excel exports (`exportToCsv`, `exportToExcel`).

### What Changed
- **User Repository (`user.repository.ts`)**: Introduced `SAFE_USER_SELECT` which explicitly selects only non-sensitive columns (`id`, `email`, `registerNumber`, `employeeId`, `role`, `isFirstLogin`, `isActive`, `lastLoginAt`, `organizationId`, `zoneId`, `createdAt`, `updatedAt`, `userProfile`, `organization`, `zone`). Applied `SAFE_USER_SELECT` across `create`, `update`, `findById`, `findByEmail`, and `list` operations.
- **Student Repository (`student.repository.ts`)**: Introduced `SAFE_STUDENT_USER_SELECT` explicitly excluding `passwordHash`, `tempPassword`, and tokens. Replaced `user: true` relations with explicit projections across `findById`, `findByIdWithResumeData`, `createStudent`, `updateStudent`, `changeStatus`, `updateSpoc`, `listStudents`, `exportStudents`, `provisionStudent`, and `provisionStudentsBulk`.
- **Student Service (`student.service.ts`)**: Stripped `tempPassword` from the `listStudents` response mapping. Removed the `Temp Password` column and value mappings from `exportToCsv` and `exportToExcel`.
- **Authentication Preservation**: Maintained internal credential access strictly in `auth.repository.ts` for credential verification (`findForAuth`, `comparePassword`).

### Why It Is Secure
Database queries now use compile-time and runtime Prisma projections (`select`) ensuring `passwordHash` and `tempPassword` are never fetched from PostgreSQL into application memory for normal API operations, eliminating exposure via serialization, logging, or unintended re-exports.

### Tests
- `GET /api/v1/users` verified: 0 occurrences of `passwordHash`, `tempPassword`, or tokens.
- `GET /api/v1/users/:id` verified: 0 occurrences of `passwordHash` or `tempPassword`.
- `GET /api/v1/students` verified: 0 occurrences of `tempPassword` or nested `user.passwordHash`.
- Validated via `server/src/tests/test_security_hardening_phase1.ts`.

---

## SEC-002 — Zone Isolation / BOLA Protection

### What Was Vulnerable
- `GET /api/v1/students/:id` relied on route middleware with no service-layer check validating that a requested student's `zoneId` matched the Zone Incharge's assigned zone. A Zone Incharge could query or manipulate any student across Tamil Nadu by guessing or enumerating their UUID.
- Related student endpoints (`/:id/resume`, `/:id/spoc`, `/:id/status`, `/export`) lacked consistent multi-tier zone boundary enforcement.

### What Changed
- **Defense-in-Depth Zone Verification**:
  - `student.service.ts` (`getStudentById`): Added authorization parameters `requesterRole` and `requesterZoneId`. When `requesterRole === 'zone'`, the service validates `student.zoneId === requesterZoneId`. If mismatched or missing, an `ApiError.forbidden('Access denied: You can only view student profiles within your assigned zone')` is thrown.
  - `student.controller.ts` (`getStudentById`, `getResume`, `changeStatus`): Extracts authenticated user credentials directly from `req.user` (never from `params`, `body`, or `query`). Resolves the authoritative zone using `zoneService.getAssignedZoneIdForUser(req.user.userId)`.
  - `student.service.ts` (`getStudentResume`): Strictly rejects zone incharges attempting to view student resumes outside their zone.
  - `student.service.ts` (`updateSpocStatus`): Verified and maintained strict zone boundary checks.
  - `student.controller.ts` (`changeStatus`): Enforces zone matching before permitting student status transitions.

### Zone Isolation Model
```
[Zone Incharge Request]
         │
         ▼
[Authenticated JWT Identity] ──> req.user.userId
         │
         ▼
[Authoritative Zone Resolution] ──> zoneService.getAssignedZoneIdForUser(userId)
         │
         ▼
[Target Student Query] ──> student.zoneId
         │
         ├── Matches: Allow Operation (200 OK)
         └── Mismatches / Not Found: Deny with 403 Forbidden
```

### Tests
- Zone A Incharge accessing Zone A Student -> `200 OK` (Allowed).
- Zone A Incharge accessing Zone B Student (`GET /students/:id`) -> `403 Forbidden` (Denied).
- Zone A Incharge accessing Zone B Student Resume (`GET /students/:id/resume`) -> `403 Forbidden` (Denied).
- Zone A Incharge updating Zone B Student SPOC status (`PATCH /students/:id/spoc`) -> `403 Forbidden` (Denied).
- Zone A Incharge updating Zone B Student Account Status (`PATCH /students/:id/status`) -> `403 Forbidden` (Denied).

---

## SEC-003 — Strict CORS Configuration

### What Was Vulnerable
`server/src/app.ts` contained permissive wildcard regular expressions:
- `/^https:\/\/.*\.onrender\.com$/`
- `/^https:\/\/.*\.vercel\.app$/`

Any rogue, attacker-controlled service hosted on Render or Vercel could make authenticated cross-origin requests with credentials.

### What Changed
- **Removed Wildcard Regexes**: Deleted both `.onrender.com` and `.vercel.app` regex patterns.
- **Explicit Allowlist**: Constructed an explicit origin allowlist composed exclusively of:
  - `env.FRONTEND_URL` (supports comma-separated URLs)
  - `https://maatram-portal.onrender.com` (official production frontend)
  - `http://localhost:3000` and `http://localhost:5173` strictly when `env.NODE_ENV !== 'production'`.
- **Validation**:
  - `server/src/config/env.ts`: Updated `FRONTEND_URL` Zod schema to support multiple comma-delimited URLs.
  - In production (`NODE_ENV === 'production'`), `localhost` origins are excluded.
  - Credentials remain enabled (`credentials: true`), with `Access-Control-Allow-Origin` strictly mirroring only valid allowlisted origins. Disallowed origins are rejected.

### Tests
- Configured frontend origin (`http://localhost:5173`) -> CORS allowed (`Access-Control-Allow-Origin` present).
- Rogue Vercel domain (`https://attacker-app.vercel.app`) -> Rejected (no matching CORS header).
- Rogue Render domain (`https://attacker-service.onrender.com`) -> Rejected (no matching CORS header).

---

## SEC-004 — Disable Swagger in Production

### What Was Vulnerable
Swagger UI was mounted unconditionally at `/api-docs`, exposing internal API schema details and endpoints in production.

### What Changed
- **Production Guard (`server/src/config/swagger.ts`)**:
  - If `env.NODE_ENV === 'production'`, all requests matching `/api-docs*` (`/api-docs`, `/api-docs/`, `/api-docs/swagger.json`, etc.) immediately return `404 Not Found` with `{ success: false, message: 'API documentation is disabled in production' }`.
  - Non-production environments retain full Swagger UI and also expose `/api-docs/swagger.json`.
  - Startup logger in `server/src/index.ts` only announces `/api-docs` when `NODE_ENV !== 'production'`.

### Tests
- Production mode mock app: `GET /api-docs` returns `404 Not Found`.
- Production mode mock app: `GET /api-docs/swagger.json` returns `404 Not Found`.
- Non-production mode: Swagger routes function normally for development.

---

## SEC-005 — Upload Security & Access Control

### What Was Vulnerable
`server/src/app.ts` mounted `/uploads` directly as `express.static(uploadsDir)` without authentication, access control, or path traversal checks.

### What Changed
- **Removed `express.static`**: Replaced static folder exposure with a dedicated `secureUploadsHandler` middleware ([`server/src/common/middleware/secureUploads.ts`](file:///c:/Users/Logesh/New%20Maatram/Maatram-Portal/server/src/common/middleware/secureUploads.ts)).
- **Traversal & Injection Protection**:
  - Rejects null bytes (`\0`, `%00`), malformed URI encodings, backwards slashes (`\`), and relative segments (`..`, `%2e%2e`).
  - Verifies normalized absolute path starts with `uploadsDir + path.sep`.
- **Directory Discovery Prevention**:
  - Directory requests (`/uploads`, `/uploads/`, subfolders) return `404 Not Found`. Directory indexing is completely disabled.
- **Public vs. Private Classification**:
  - Public files (`/public/*`, designated sample assets) served with `X-Content-Type-Options: nosniff`.
  - All other assets (student resumes, profiles, private documents) require authentication (`requireAuth`).
- **Resource Ownership & Zone Isolation**:
  - Super Admins (`admin`) have global authorization.
  - Students (`student`) can only access private files matching their own `id` or `userId`. Cross-student requests return `403 Forbidden`.
  - Zone Incharges (`zone`) can only access files of students in their assigned zone. Cross-zone file access returns `403 Forbidden`.

### Tests
- Anonymous request to private file -> `401 Unauthorized`.
- Student A accessing own file -> `200 OK`.
- Student A accessing Student B file -> `403 Forbidden`.
- Zone A Incharge accessing Zone A student file -> `200 OK`.
- Zone A Incharge accessing Zone B student file -> `403 Forbidden`.
- Super Admin accessing any private file -> `200 OK`.
- Path traversal attack (`/uploads/..%2Fpackage.json`) -> `403 Forbidden`.
- Directory listing request (`/uploads/`) -> `404 Not Found`.

---

## SEC-006 — Dependency Security Upgrades

### Advisories and Version Changes

| Package | Audited Version | Upgraded Version | Vulnerabilities Addressed | Severity |
|---|---|---|---|---|
| `multer` | `^2.2.0` | `^2.3.0` | GHSA-wc9g-mqfw-jrwm (DoS via field names)<br>GHSA-qfvm-cv95-jqjf (File descriptor leak)<br>GHSA-qvfw-j98x-7q72 (File size limit bypass)<br>GHSA-535w-7cp7-47q4 (DoS via array index) | High |
| `nodemailer` | `^9.0.3` | `^10.0.6` | GHSA-8m3c-c648-2xjj (disableFileAccess bypass)<br>GHSA-wmmp-3585-3rmp (IDN/Punycode domain bypass)<br>GHSA-2x7j-588g-ccc2 (O(n²) ReDoS in addressparser)<br>GHSA-cc9r-2j5m-2m83 (RFC 5322 recipient domain bypass) | High |
| `xlsx` | `^0.18.5` | `^0.18.5` *(Documented Limitation)* | GHSA-4r6h-8v6p-xvw6 (Prototype Pollution)<br>GHSA-5pgg-2g8v-p4x9 (ReDoS) | High |

### `xlsx` Analysis & Limitation
- **Status**: The SheetJS authors ceased publishing updates to the public npm registry after version `0.18.5`. Newer versions (0.19.x+) are only distributed via their private CDN (`cdn.sheetjs.com`).
- **Mitigation in Maatram Portal**:
  1. Excel imports are restricted to authenticated Super Admins only (`requireRole('admin')`).
  2. Strict file-type validation and 5MB upload size limits are enforced.
  3. No untrusted public users can submit files to the SheetJS parser.
  4. Complete migration to an actively maintained alternative (such as `exceljs`) is documented for Phase 2.

### `npm audit` Results
After upgrading `multer` and `nodemailer`:
- `multer` high vulnerabilities: **0**
- `nodemailer` high vulnerabilities: **0**
- Server workspace vulnerabilities: reduced to only `qs` (transitive express dependency) and `xlsx` (upstream limitation).

---

## Functional Regression Verification

| Feature / Domain | Test Suite | Result |
|---|---|---|
| Admin Authentication (Login, /me, Token verify) | `test_admin_auth.ts` | Passed (100%) |
| Student Authentication & First Login | `test_admin_auth.ts` | Passed (100%) |
| Zone Management & Protected Routes | `test_admin_auth.ts` | Passed (100%) |
| Student Directory & Relations Projections | `test_security_hardening_phase1.ts` | Passed (100%) |
| Student Status Transitions & Deactivation | `test_security_hardening_phase1.ts` | Passed (100%) |
| SPOC Assignment & Zone Verification | `test_security_hardening_phase1.ts` | Passed (100%) |
| Secure File Serving & Traversal Prevention | `test_security_hardening_phase1.ts` | Passed (100%) |
| Full TypeScript Server Build | `npm run build --workspace server` | Passed (0 errors) |
| Full TypeScript Client Build | `npm run build --workspace client` | Passed (0 errors) |

---

## Remaining Security Findings (Phase 2 Roadmap)

The following findings from the Security Audit Report remain open for subsequent phases:

1. **SEC-007 — Missing Rate Limiting on High-Sensitivity Endpoints**:
   - Status: Open. Global rate limiter is active; endpoint-specific rate limiters for `/auth/login`, `/auth/forgot-password`, and file uploads to be tuned.
2. **SEC-008 — Insufficient Session Revocation / Refresh Token Rotation Edge Cases**:
   - Status: Open. Scheduled for Phase 2.
3. **SEC-009 — Refresh Token Storage (HttpOnly Cookie Migration)**:
   - Status: Deferred intentionally to Phase 2 due to client architecture coordination requirements.
4. **SEC-010 — Content Security Policy & Security Headers Hardening**:
   - Status: Open. Helmet is active; strict CSP directives to be tailored to Cloudinary and client assets in Phase 2.
5. **SheetJS (`xlsx`) Migration**:
   - Migrate Excel parsing and generation to `exceljs` to eliminate GHSA-4r6h-8v6p-xvw6.

---

## Deployment Readiness

Branch `security/hardening` is ready for deployment to the **separate security testing environment**.

> [!NOTE]
> This branch is NOT marked "production ready". Final production promotion will occur only after isolated security environment verification, second security audit verification, Phase 2 remediation, and final administrative approval.
