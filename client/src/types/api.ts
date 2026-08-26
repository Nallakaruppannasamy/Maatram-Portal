import { UserRole } from '@/constants/roles'
import { AccountStatus, VolunteerStatus } from '@/constants/status'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: ApiError
  meta?: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export interface PaginatedResponse<T> {
  success: boolean
  message?: string
  data: T[]
  meta?: PaginationMeta
  pagination?: PaginationMeta
}

export interface ApiError {
  statusCode?: number
  message: string
  errors?: Record<string, string[]> | string[]
  code?: string
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  rollNumber?: string
  zoneName?: string
  profilePhotoUrl?: string
  isActive?: boolean
  isFirstLogin?: boolean
  isFirstTimeUser?: boolean
  accountStatus?: AccountStatus | string
  createdAt?: string
  updatedAt?: string
  profile?: Profile
  fullName?: string
  name?: string
  regNumber?: string
  registrationNumber?: string
  employeeId?: string
  tempPassword?: string
  zoneId?: string
}

export interface Organization {
  id: string
  name: string
  code: string
  description?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Zone {
  id: string
  name: string
  code: string
  regionLabel?: string
  organizationId?: string
  organization?: Organization
  inchargeId?: string
  incharge?: AuthUser
  createdAt?: string
  updatedAt?: string
}

export interface Profile {
  id?: string
  userId?: string
  fullName?: string
  firstName?: string
  lastName?: string
  mobile?: string
  parentMobile?: string
  gender?: string
  dob?: string
  dateOfBirth?: string
  address?: string
  photoUrl?: string
  profilePic?: string
  careerObjective?: string
}

export interface Student {
  id: string
  userId?: string
  user?: AuthUser
  registrationNumber: string
  regNumber?: string
  firstName?: string
  lastName?: string
  fullName: string
  collegeName?: string
  collegeId?: string
  college?: any
  department?: string | any
  departmentId?: string
  batch?: string
  academicYear?: string
  currentYear?: string
  semester?: number | string
  degree?: string
  course?: string
  cgpa?: number | string
  accommodationType?: string
  accommodation?: string
  operationalZone?: string
  zoneId?: string
  zone?: Zone
  hours?: number
  totalVolunteerHours?: number
  accountStatus?: AccountStatus | string
  status?: string
  profileImage?: string | null
  isSpoc?: boolean
  isFirstLogin?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Volunteer {
  id: string
  studentId: string
  student?: Student
  title: string
  category: string
  organization: string
  hours: number
  eventDate: string
  description: string
  proofUrl?: string
  status: VolunteerStatus | string
  reviewerId?: string
  reviewer?: AuthUser
  reviewerComment?: string
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedUsers {
  items: AuthUser[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  stats: {
    totalMembers: number
    superAdmins: number
    zoneIncharges: number
    activeAccounts: number
  }
}

export interface AuditActor {
  id: string
  email: string | null
  registerNumber: string | null
  employeeId: string | null
  role: string
  zoneId: string | null
  fullName: string
  zoneName?: string | null
}

export interface AuditLog {
  id: string
  logCode: string
  actorId: string
  actorRole: 'admin' | 'zone' | 'student' | 'system' | string
  action: string
  targetEntityType: string
  targetEntityId: string | null
  targetLabel: string
  details: string
  ipAddress: string
  userAgent: string | null
  createdAt: string
  actor: AuditActor
  zone?: {
    id: string
    name: string
    code: string
  } | null
}

export interface AuditLogQueryParams {
  page?: number
  limit?: number
  search?: string
  action?: string
  actorRole?: string
  zoneId?: string
  from?: string
  to?: string
  targetEntityType?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}


