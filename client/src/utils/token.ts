import { AuthUser } from '@/types/api'

const TOKEN_KEY = 'svms_token'
const REFRESH_TOKEN_KEY = 'svms_refresh_token'
const USER_KEY = 'svms_user'

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setAccessToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * SEC-009 Migration:
 * Refresh tokens are stored strictly in HttpOnly, Secure cookies by the server.
 * JavaScript CANNOT and MUST NOT access or store refresh tokens in localStorage,
 * sessionStorage, or client-side state.
 */
export const getRefreshToken = (): string | null => {
  return null
}

export const setRefreshToken = (_token?: string): void => {
  // No-op: Refresh token is strictly managed via HttpOnly cookies
  // Ensure any stale legacy token in localStorage is purged
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const getStoredUser = (): AuthUser | null => {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export const setStoredUser = (user: AuthUser): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY)
}

export const clearAuthStorage = (): void => {
  removeAccessToken()
  removeRefreshToken()
  removeStoredUser()
}
