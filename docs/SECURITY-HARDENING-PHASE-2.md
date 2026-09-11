# Security Hardening Phase 2 Report

## Overview

This report documents the security remediation implementation for Phase 2 of the Maatram Portal security hardening program. All scoped Critical, High, and Medium severity findings (**SEC-007** through **SEC-010**), along with the complete replacement of the vulnerable **SheetJS (`xlsx`)** dependency with **`exceljs`**, have been successfully implemented and verified on branch `security/hardening`.

---

## SEC-007 — Sensitive Endpoint Rate Limiting

### What Was Vulnerable
- Prior to Phase 2, the application had only a coarse global rate limiter (100 requests / 15 minutes) mounted at the top of the Express pipeline.
- Sensitive, high-impact endpoints—including authentication credentials checking, password resets, token refreshing, file uploads, and bulk data imports/exports—did not possess dedicated, granular throttling.
- Attackers could attempt distributed brute-force attacks against user credentials, flood email services via password reset abuse, or trigger denial-of-service via resource-intensive export or upload pipelines.

### What Changed
- **Modular Rate Limiting Engine (`server/src/common/middleware/rateLimiter.ts`)**:
  Created dedicated rate limiters with explicit window sizes, max thresholds, standard rate-limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`), and standardized `ApiError` responses:
  1. **`loginLimiter`**: 10 requests per 15 minutes per IP.
     - Mounted on `POST /api/v1/auth/login`.
     - Neutralizes credential stuffing and brute-force password guessing.
  2. **`forgotPasswordLimiter`**: 5 requests per 15 minutes per IP.
     - Mounted on `POST /api/v1/auth/forgot-password`.
     - Prevents SMTP/Resend API quota exhaustion and email spamming.
  3. **`resetPasswordLimiter`**: 5 requests per 15 minutes per IP.
     - Mounted on `POST /api/v1/auth/reset-password`.
     - Prevents brute-forcing short-lived password reset tokens.
  4. **`refreshLimiter`**: 60 requests per 15 minutes per IP.
     - Mounted on `POST /api/v1/auth/refresh`.
     - Provides ample headroom for legitimate multi-tab Axios interceptor refreshes while preventing automated token farming.
  5. **`importLimiter`**: 10 requests per 15 minutes per IP.
     - Mounted on bulk Excel/CSV import endpoints across `student.routes.ts`.
  6. **`uploadLimiter`**: 30 requests per 15 minutes per IP.
     - Mounted on file upload routes (`student.routes.ts`, `profile.routes.ts`, `volunteer.routes.ts`).
  7. **`exportLimiter`**: 30 requests per 15 minutes per IP.
     - Mounted on bulk export routes across `student.routes.ts`, `zone.routes.ts`, `user.routes.ts`, `volunteer.routes.ts`, and `organization.routes.ts`.
- **Global Limiter Relaxation (`server/src/app.ts`)**:
  Increased the general limiter from 100 to 500 requests per 15 minutes to eliminate false-positive throttling during legitimate multi-tab dashboard navigation, while relying on the dedicated sensitive limiters to protect critical attack surfaces.

### Tests
- Validated `POST /api/v1/auth/login` rate limiting: 10 allowed, 11th triggers HTTP 429 Too Many Requests.
- Validated `POST /api/v1/auth/forgot-password` rate limiting: 5 allowed, 6th triggers HTTP 429.
- Verified rate limit headers returned: `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset`, and `retry-after`.
- Validated via `server/src/tests/test_security_hardening_phase2.ts`.

---

## SEC-008 — Session Revocation & Refresh Token Rotation Hardening

### What Was Vulnerable
- While refresh token hashing was introduced in earlier phases, session revocation guarantees were incomplete:
  - Tokens were not automatically invalidated upon user logout or password changes.
  - Revoked token reuse detection did not aggressively revoke all active sessions for a compromised account.
  - Deactivated accounts could potentially continue refreshing access tokens if token records remained unexpired in the database.

### What Changed
- **Single-Use Refresh Token Rotation (`server/src/modules/auth/auth.service.ts`)**:
  - Whenever a refresh token is presented at `/api/v1/auth/refresh`, the server hashes the incoming token (SHA-256) and verifies its existence in `prisma.refreshToken`.
  - The used token is immediately stamped with `revokedAt = new Date()`.
  - A brand-new cryptographically secure refresh token is generated, hashed, and stored in the database, while the plain text token is sent to the client.
- **Compromise / Reuse Detection (`auth.service.ts`)**:
  - If a refresh token presented to `/refresh` has already been revoked (`revokedAt !== null`), the system flags a token reuse attempt (indicating potential token theft).
  - The service immediately invalidates the entire session family by revoking **all** active refresh tokens for that user ID:
    ```typescript
    await this.authRepository.revokeAllUserRefreshTokens(existingToken.userId);
    ```
  - An audit warning log `[REFRESH_TOKEN_REUSE_DETECTED]` is recorded.
- **Session Revocation on Password Reset & Password Change**:
  - In `auth.service.ts` (`resetPassword` and `changePassword`), all active refresh tokens for the user are immediately revoked, instantly terminating any active sessions on other browsers or devices.
- **Session Revocation on Logout**:
  - `auth.service.ts` (`logout`) explicitly revokes the presented refresh token record in the database before clearing the cookie.
- **Account Deactivation Enforcement**:
  - `auth.service.ts` (`refreshAccessToken`) validates `user.isActive`. If the account is deactivated, all refresh tokens for that user are immediately revoked and the request is rejected with `ApiError.unauthorized('Account has been deactivated')`.

### Tests
- Refresh token rotation verifies that the old token is revoked and cannot be reused.
- Attempting to reuse a revoked token triggers token family revocation: all active tokens for that user are invalidated.
- Logging out revokes the token in the database.
- Refreshing tokens for a deactivated account is rejected with HTTP 401.
- Validated via `server/src/tests/test_security_hardening_phase2.ts`.

---

## SEC-009 — Refresh Token HttpOnly Cookie Migration & CSRF Defense

### What Was Vulnerable
- Previously, the client stored the refresh token in `localStorage` under the key `svms_refresh_token`.
- Any Cross-Site Scripting (XSS) vulnerability or rogue third-party dependency executing in the browser context could read the refresh token and maintain indefinite persistent access to the victim's account.

### What Changed
- **Server Cookie Management (`server/src/modules/auth/auth.controller.ts`)**:
  - The server now sets the refresh token in an `HttpOnly` cookie named `refreshToken`:
    ```typescript
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    ```
  - The refresh token is **completely omitted** from the JSON response body of `POST /login` and `POST /refresh`.
  - On `POST /logout`, the cookie is cleared with identical attributes:
    ```typescript
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/auth',
    });
    ```
- **CSRF Defense on Cookie Endpoints (`server/src/common/middleware/csrfProtection.ts`)**:
  - Because `/api/v1/auth/refresh` and `/api/v1/auth/logout` accept ambient credentials (cookies), the `verifyCsrfOrigin` middleware validates that the incoming `Origin` or `Referer` matches the server's trusted origin allowlist.
  - Untrusted origins attempting cross-site POST requests are rejected with HTTP 403 Forbidden.
- **Client Storage Elimination (`client/src/utils/token.ts`)**:
  - Removed all code storing `svms_refresh_token` in `localStorage`.
  - `getRefreshToken()` strictly returns `null`.
  - `setRefreshToken()` and `removeRefreshToken()` actively purge any legacy `svms_refresh_token` keys from `localStorage`.
- **Client API & Single-Flight Mutex (`client/src/api/auth.api.ts`, `client/src/api/axios.ts`)**:
  - `authApi.refresh()` sends an empty JSON payload `{}` with `withCredentials: true`.
  - The Axios response interceptor implements a single-flight mutex queue (`isRefreshing`, `failedQueue`). When an access token expires and multiple concurrent requests receive HTTP 401, only one refresh request is initiated. All pending requests are queued and replayed once the new access token is received.
- **Auth Context Clean-Up (`client/src/context/AuthContext.tsx`)**:
  - Cleaned up token handlers so refresh tokens are never handled in React state or client storage.

### Tests
- `POST /api/v1/auth/login` sets `Set-Cookie: refreshToken=...; HttpOnly; Path=/api/v1/auth`.
- Response JSON body contains `accessToken`, but **omits** `refreshToken`.
- Direct JavaScript access to the cookie is blocked by the browser.
- Untrusted cross-origin requests to `/api/v1/auth/refresh` are rejected with HTTP 403 Forbidden.
- Validated via `server/src/tests/test_security_hardening_phase2.ts`.

---

## SEC-010 — CSP & Browser Security Headers Hardening

### What Was Vulnerable
- The server Helmet configuration lacked explicit Content Security Policy (CSP) directives, Permissions Policy, and strict frame-busting protections, leaving the application vulnerable to MIME-sniffing, clickjacking, and unauthorized browser feature exploitation.

### What Changed
- **Tailored Content Security Policy (`server/src/app.ts`)**:
  Configured Helmet with strict, granular directives:
  - `default-src 'self'`: Restricts fallback resource loading to the application origin.
  - `script-src 'self'`: Disallows unauthorized external scripts (allows `'unsafe-eval'` strictly during development for Vite HMR).
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`: Allows internal styles and Google Fonts stylesheets.
  - `font-src 'self' https://fonts.gstatic.com data:`: Restricts font loading to self and Google Fonts CDN.
  - `img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com`: Permits profile and organizational assets from Cloudinary.
  - `connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com http://localhost:* ws://localhost:* https://*.onrender.com`: Restricts XHR/WebSocket connections to known backend, cloud storage, and deployment domains.
  - `object-src 'none'`: Blocks Flash, Java, and legacy browser plugins.
  - `frame-src 'none'`: Prevents child iframes from embedding foreign sites.
  - `frame-ancestors 'none'`: Defends against clickjacking by preventing the portal from being embedded in iframes on any domain.
- **Additional Security Headers**:
  - `X-Frame-Options: DENY`: Fallback clickjacking protection for older user agents.
  - `X-Content-Type-Options: nosniff`: Prevents browser MIME-type sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Prevents referrer leakage to external sites.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`: Disables sensitive hardware browser APIs.
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`: Enforces HTTPS (enabled conditionally in production).

### Tests
- Verified HTTP response headers on `/health` and API endpoints:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` disables camera, microphone, geolocation, payment, usb.
  - `Content-Security-Policy` contains all specified directives (`default-src 'self'`, `object-src 'none'`, `frame-src 'none'`).
  - `X-Frame-Options: DENY`.
- Validated via `server/src/tests/test_security_hardening_phase2.ts`.

---

## SheetJS / xlsx Migration to ExcelJS

### What Was Vulnerable
- The server previously used `xlsx` (`0.18.5`), which contains known unpatched vulnerabilities (prototype pollution and ReDoS: CVE-2023-30533, CVE-2024-22363).
- Spreadsheets exported with unescaped formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) could execute arbitrary commands or leak data when opened in Microsoft Excel or Google Sheets (CSV/Formula Injection).

### What Changed
- **Removed `xlsx` & Installed `exceljs`**:
  - Completely uninstalled `xlsx` from `server/package.json`.
  - Installed `exceljs` (`^4.4.0`).
  - Ran `npm audit --workspace server`: confirmed **0 HIGH, 0 CRITICAL** vulnerabilities remain.
- **Created Centralized Excel Engine (`server/src/utils/excel.ts`)**:
  - `parseExcelBuffer`: Safely loads incoming spreadsheet buffers into an `ExcelJS.Workbook`, extracts column headers, and converts worksheet rows into typed JSON objects.
  - `exportToExcelBuffer`: Accepts a sheet name and array of row objects, creates a styled workbook with auto-fitted columns and bold headers, and exports a raw XLSX buffer.
  - `exportAoaToExcelBuffer`: Accepts an array-of-arrays for generating dynamic XLSX import templates.
  - `sanitizeFormula`: Neutralizes formula injection by detecting leading formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) and prepending a single quote (`'`), ensuring spreadsheet software treats the value strictly as text.
- **Migrated All 5 Service Files**:
  - `server/src/modules/student/student.service.ts` (export & dynamic template generation)
  - `server/src/modules/zone/zone.service.ts` (export)
  - `server/src/modules/volunteer/volunteer.service.ts` (export)
  - `server/src/modules/user/user.service.ts` (export)
  - `server/src/modules/organization/organization.service.ts` (export)

### Tests
- Verified formula neutralization: strings like `=SUM(A1:A10)` are exported as `'=SUM(A1:A10)`.
- Verified buffer generation and parsing round-trip with ExcelJS.
- Verified dynamic template generation and bulk student import workflows.
- Validated via `server/src/tests/test_security_hardening_phase2.ts` and `test_security_hardening_phase1.ts`.

---

## Comprehensive Test Results Summary

| Test Suite | Scope | Passed | Failed | Status |
|---|---|---|---|---|
| `test_security_hardening_phase2.ts` | SEC-007, SEC-008, SEC-009, SEC-010, ExcelJS | **46** | **0** | **100% PASS** |
| `test_security_hardening_phase1.ts` | SEC-001 through SEC-006 regressions | **40** | **0** | **100% PASS** |
| `test_admin_auth.ts` | Core authentication & credential flows | **All** | **0** | **100% PASS** |
| `npm run build --workspace server` | TypeScript & Prisma build | — | — | **EXIT 0** |
| `npm run build --workspace client` | Vite production bundle | — | — | **EXIT 0** |
| `npm audit --workspace server` | Dependency vulnerability scan | 0 High, 0 Critical | — | **CLEAN** |

---

## Deployment & Operational Considerations

1. **Reverse Proxy Configuration (Render / Nginx)**:
   The server includes `app.set('trust proxy', 1)`. When running on Render or behind an AWS/Nginx reverse proxy, this setting ensures that Express accurately resolves client IP addresses for rate limiting and handles forwarded HTTPS protocol headers.
2. **Cross-Subdomain Cookies in Production**:
   In production (`NODE_ENV === 'production'`), refresh token cookies are configured with `sameSite: 'none'` and `secure: true`. This allows authenticated cross-subdomain API communication (e.g., frontend on `https://portal.maatram.org` and backend on `https://api.maatram.org`). In development, `sameSite: 'lax'` is used to facilitate local HTTP testing.
3. **Frontend Environment Variable**:
   Ensure `FRONTEND_URL` is accurately populated in the production environment variables (e.g., `https://maatram-portal.onrender.com`). Disallowed origins will be rejected by both the CORS policy and CSRF middleware.

---

## Remaining Risks & Defense Limitations

- **In-Memory Rate Limiting**: The current rate limiting implementation utilizes memory storage (`express-rate-limit` default). If the backend is horizontally scaled across multiple instances or worker containers, rate limit counters will not be shared across nodes. For multi-node production clusters, backing the rate limiters with Redis (`rate-limit-redis`) is recommended.
- **Client Access Token in Memory/Storage**: Access tokens (15-minute lifespan) remain stored in client memory/storage to authenticate standard Bearer requests. This risk is heavily mitigated by short token lifetimes, rotation, and strict CSP headers, but eliminating client storage entirely would require migrating access tokens to cookies.
- **Security Disclaimer**: While these hardening measures significantly elevate the application's defensive posture and remediate all identified audit findings, no software system can be guaranteed 100% secure. Continued monitoring, periodic dependency updates, and external penetration testing are strongly recommended prior to production release.
