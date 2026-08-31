import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse } from '@/types/api'

export interface TopStudentItem {
  rank: number
  studentId: string
  studentName: string
  registrationNumber: string
  collegeName: string
  collegeCode: string
  zoneName: string
  zoneCode: string
  studentYear: string
  points: number
  activitiesCount: number
}

export interface CollegePerformanceItem {
  rank: number
  collegeId: string
  collegeName: string
  collegeCode: string
  zoneId: string
  zoneName: string
  zoneCode: string
  activeStudents: number
  volunteeringStudents: number
  participationPercentage: number
  activities: number
  points: number
}

export interface ZonePerformanceItem {
  rank: number
  zoneId: string
  zoneName: string
  zoneCode: string
  inchargeName: string
  activeStudents: number
  volunteeringStudents: number
  participationPercentage: number
  activities: number
  points: number
}

export interface AnalyticsSummaryCards {
  totalActiveStudents: number
  totalVolunteeringStudents: number
  overallParticipationPercentage: number
  totalActivities: number
  totalPoints: number
}

export interface VolunteeringAnalyticsResponse {
  summary: AnalyticsSummaryCards
  topStudents: TopStudentItem[]
  collegePerformance: CollegePerformanceItem[]
  zonePerformance: ZonePerformanceItem[]
  appliedFilters: {
    period: 'total' | 'academicYear' | 'custom'
    academicYear?: string
    fromDate?: string
    toDate?: string
    studentYear: 'all' | '1' | '2' | '3' | '4'
    zoneId: string
    collegeId: string
  }
  availableAcademicYears: string[]
}

export interface CollegeDrillDownResponse {
  college: {
    id: string
    name: string
    code: string
    location: string
    zoneName: string
    zoneCode: string
  }
  metrics: {
    activeStudents: number
    volunteeringStudents: number
    participationPercentage: number
    activities: number
    points: number
  }
  topStudents: TopStudentItem[]
}

export interface ZoneDrillDownResponse {
  zone: {
    id: string
    name: string
    code: string
    regionLabel: string
    inchargeName: string
  }
  metrics: {
    activeStudents: number
    volunteeringStudents: number
    participationPercentage: number
    activities: number
    points: number
  }
  colleges: CollegePerformanceItem[]
}

export interface AnalyticsQueryParams {
  period?: 'total' | 'academicYear' | 'custom'
  academicYear?: string
  fromDate?: string
  toDate?: string
  studentYear?: 'all' | '1' | '2' | '3' | '4'
  zoneId?: string
  collegeId?: string
}

export const analyticsApi = {
  getVolunteeringAnalytics: async (
    params?: AnalyticsQueryParams
  ): Promise<ApiResponse<VolunteeringAnalyticsResponse>> => {
    const res = await apiInstance.get<ApiResponse<VolunteeringAnalyticsResponse>>(
      API_ROUTES.ANALYTICS.VOLUNTEERING,
      { params }
    )
    return res.data
  },

  getCollegeDrillDown: async (
    collegeId: string,
    params?: AnalyticsQueryParams
  ): Promise<ApiResponse<CollegeDrillDownResponse>> => {
    const res = await apiInstance.get<ApiResponse<CollegeDrillDownResponse>>(
      API_ROUTES.ANALYTICS.COLLEGE_DRILLDOWN(collegeId),
      { params }
    )
    return res.data
  },

  getZoneDrillDown: async (
    zoneId: string,
    params?: AnalyticsQueryParams
  ): Promise<ApiResponse<ZoneDrillDownResponse>> => {
    const res = await apiInstance.get<ApiResponse<ZoneDrillDownResponse>>(
      API_ROUTES.ANALYTICS.ZONE_DRILLDOWN(zoneId),
      { params }
    )
    return res.data
  },
}
