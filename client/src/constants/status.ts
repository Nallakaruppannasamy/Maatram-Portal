export const VOLUNTEER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type VolunteerStatus = (typeof VOLUNTEER_STATUS)[keyof typeof VOLUNTEER_STATUS]

export const ACCOUNT_STATUS = {
  PENDING_FIRST_LOGIN: 'pending_first_login',
  ACTIVATED: 'activated',
  PASSWORD_CHANGED: 'password_changed',
} as const

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS]
