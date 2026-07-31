/**
 * @file src/constants/index.ts
 * @description Immutable application-level constants shared across all modules.
 * These values never change at runtime and are not environment-dependent.
 */

// ─── HTTP Status Codes ─────────────────────────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ─── User Roles ────────────────────────────────────────────────────────────────
export const ROLES = {
  STUDENT: 'student',
  ZONE: 'zone',
  ADMIN: 'admin',
} as const;

// ─── Volunteer Submission Status ───────────────────────────────────────────────
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// ─── Account Status ────────────────────────────────────────────────────────────
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_APPROVAL: 'pending_approval',
} as const;

// ─── Pagination Defaults ───────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ─── Cloudinary Folders ────────────────────────────────────────────────────────
export const CLOUDINARY_FOLDERS = {
  STUDENT_PHOTOS: 'maatram/students/photos',
  VOLUNTEER_PROOFS: 'maatram/volunteers/proofs',
  CERTIFICATIONS: 'maatram/students/certifications',
  RESUMES: 'maatram/students/resumes',
} as const;

// ─── Token Types ───────────────────────────────────────────────────────────────
export const TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  PASSWORD_RESET: 'password_reset',
} as const;
