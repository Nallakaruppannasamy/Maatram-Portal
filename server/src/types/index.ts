/**
 * @file src/types/index.ts
 * @description Global TypeScript type definitions and Express Request extension.
 * Extends the Express Request interface to carry the decoded JWT payload
 * after authentication middleware has run.
 */

// ─── User Roles ────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'zone' | 'admin';

// ─── JWT Token Payload ─────────────────────────────────────────────────────────
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  zoneId?: string;
  registerNumber?: string;
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Express Request Extension ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
