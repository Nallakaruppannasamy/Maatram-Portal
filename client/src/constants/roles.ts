export const ROLES = {
  ADMIN: 'admin',
  ZONE: 'zone',
  STUDENT: 'student',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]
