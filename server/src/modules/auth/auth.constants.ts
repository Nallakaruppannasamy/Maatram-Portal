/**
 * @file src/modules/auth/auth.constants.ts
 * @description Constants and logging labels specific to the Authentication module.
 */

export const AUTH_LOGS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  REFRESH_TOKEN_ROTATED: 'REFRESH_TOKEN_ROTATED',
} as const;

export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 72,
} as const;
