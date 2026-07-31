/**
 * @file src/modules/auth/auth.types.ts
 * @description Type definitions for the Authentication module request payloads and responses.
 */

import { UserRole } from '@/types';

export interface UserAuthProfile {
  id: string;
  email: string | null;
  registerNumber: string | null;
  role: UserRole;
  isFirstLogin: boolean;
  fullName: string;
  mobile: string | null;
  zone?: {
    id: string;
    name: string;
    code: string;
  } | null;
  college?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: UserAuthProfile;
}
