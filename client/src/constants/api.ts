export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  ORGANIZATIONS: {
    BASE: '/organizations',
    BY_ID: (id: string) => `/organizations/${id}`,
  },
  ZONES: {
    BASE: '/zones',
    BY_ID: (id: string) => `/zones/${id}`,
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    ACTIVATE: (id: string) => `/users/${id}/activate`,
    DEACTIVATE: (id: string) => `/users/${id}/deactivate`,
  },
  PROFILE: {
    BASE: '/profile',
  },
  STUDENTS: {
    BASE: '/students',
    BY_ID: (id: string) => `/students/${id}`,
    STATUS: (id: string) => `/students/${id}/status`,
    IMPORT: '/students/import',
    EXPORT: '/students/export',
  },
  VOLUNTEERS: {
    BASE: '/volunteers',
    BY_ID: (id: string) => `/volunteers/${id}`,
    STATUS: (id: string) => `/volunteers/${id}/status`,
  },
} as const
