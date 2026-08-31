/**
 * @file src/modules/analytics/analytics.types.ts
 * @description Type definitions for Volunteering Analytics.
 */

export type AnalyticsPeriodType = 'total' | 'academicYear' | 'custom';

export type StudentYearFilter = 'all' | '1' | '2' | '3' | '4';

export interface VolunteeringAnalyticsQueryDTO {
  period?: AnalyticsPeriodType;
  academicYear?: string; // e.g. "2025-2026"
  fromDate?: string;     // YYYY-MM-DD
  toDate?: string;       // YYYY-MM-DD
  studentYear?: StudentYearFilter;
  zoneId?: string;       // "all" or UUID
  collegeId?: string;    // "all" or UUID
}

export interface TopStudentItem {
  rank: number;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  collegeName: string;
  collegeCode: string;
  zoneName: string;
  zoneCode: string;
  studentYear: string;
  points: number;
  activitiesCount: number;
  profileImage?: string | null;
}

export interface CollegePerformanceItem {
  rank: number;
  collegeId: string;
  collegeName: string;
  collegeCode: string;
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  activeStudents: number;
  volunteeringStudents: number;
  participationPercentage: number;
  activities: number;
  points: number;
}

export interface ZonePerformanceItem {
  rank: number;
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  inchargeName: string;
  activeStudents: number;
  volunteeringStudents: number;
  participationPercentage: number;
  activities: number;
  points: number;
}

export interface AnalyticsSummaryCards {
  totalActiveStudents: number;
  totalVolunteeringStudents: number;
  overallParticipationPercentage: number;
  totalActivities: number;
  totalPoints: number;
}

export interface VolunteeringAnalyticsResponse {
  summary: AnalyticsSummaryCards;
  topStudents: TopStudentItem[];
  collegePerformance: CollegePerformanceItem[];
  zonePerformance: ZonePerformanceItem[];
  appliedFilters: {
    period: AnalyticsPeriodType;
    academicYear?: string;
    fromDate?: string;
    toDate?: string;
    studentYear: StudentYearFilter;
    zoneId: string;
    collegeId: string;
  };
  availableAcademicYears: string[];
}

export interface CollegeDrillDownResponse {
  college: {
    id: string;
    name: string;
    code: string;
    location: string;
    zoneName: string;
    zoneCode: string;
  };
  metrics: {
    activeStudents: number;
    volunteeringStudents: number;
    participationPercentage: number;
    activities: number;
    points: number;
  };
  topStudents: TopStudentItem[];
}

export interface ZoneDrillDownResponse {
  zone: {
    id: string;
    name: string;
    code: string;
    regionLabel: string;
    inchargeName: string;
  };
  metrics: {
    activeStudents: number;
    volunteeringStudents: number;
    participationPercentage: number;
    activities: number;
    points: number;
  };
  colleges: CollegePerformanceItem[];
}
