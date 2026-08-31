/**
 * @file src/modules/analytics/analytics.service.ts
 * @description Service layer executing live aggregations for Super Admin Volunteering Analytics.
 */

import { prisma } from '@/config/database';
import { ApiError } from '@/common/exceptions/apiError';
import { StudentStatus, VolunteerCategory, VolunteerStatus, Prisma } from '@prisma/client';
import {
  VolunteeringAnalyticsQueryDTO,
  VolunteeringAnalyticsResponse,
  TopStudentItem,
  CollegePerformanceItem,
  ZonePerformanceItem,
  CollegeDrillDownResponse,
  ZoneDrillDownResponse,
  StudentYearFilter,
} from './analytics.types';

export class AnalyticsService {
  /**
   * Computes points for an approved volunteer submission based on category and count.
   */
  private calculatePoints(category: VolunteerCategory, count?: number | null): number {
    const countCategories: VolunteerCategory[] = [
      VolunteerCategory.PHYSICAL_VERIFICATION,
      VolunteerCategory.TELE_VERIFICATION,
      VolunteerCategory.SCHOOL_VISIT,
    ];

    if (countCategories.includes(category)) {
      const parsed = Number(count);
      return !isNaN(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
    }

    return 1;
  }

  /**
   * Resolves start and end Date boundaries for the selected analytics period.
   */
  private resolveDateRange(dto: VolunteeringAnalyticsQueryDTO): {
    startDate?: Date;
    endDate?: Date;
  } {
    if (dto.period === 'academicYear' && dto.academicYear) {
      const match = dto.academicYear.match(/^(\d{4})-(\d{4})$/);
      if (match) {
        const startYear = parseInt(match[1], 10);
        const endYear = parseInt(match[2], 10);
        return {
          startDate: new Date(Date.UTC(startYear, 5, 1, 0, 0, 0, 0)), // June 1
          endDate: new Date(Date.UTC(endYear, 4, 31, 23, 59, 59, 999)), // May 31
        };
      }
    } else if (dto.period === 'custom') {
      const startDate = dto.fromDate ? new Date(`${dto.fromDate}T00:00:00.000Z`) : undefined;
      const endDate = dto.toDate ? new Date(`${dto.toDate}T23:59:59.999Z`) : undefined;
      return { startDate, endDate };
    }

    return {};
  }

  /**
   * Checks if a student belongs to the requested student year.
   */
  private matchesStudentYear(
    student: { academicYear?: string | null; semester?: string | null; batch?: string | null },
    targetYear: StudentYearFilter
  ): boolean {
    if (!targetYear || targetYear === 'all') return true;

    const targetNum = parseInt(targetYear, 10);
    const ay = (student.academicYear || '').trim().toLowerCase();
    if (ay === targetYear || ay === `${targetYear}st year` || ay === `${targetYear}nd year` || ay === `${targetYear}rd year` || ay === `${targetYear}th year`) {
      return true;
    }

    const sem = (student.semester || '').trim();
    if (sem) {
      const semNum = parseInt(sem, 10);
      if (!isNaN(semNum)) {
        const calculatedYear = Math.ceil(semNum / 2);
        if (calculatedYear === targetNum) return true;
      }
    }

    return false;
  }

  /**
   * Formats student year display string (e.g. "3rd Year").
   */
  private formatStudentYearDisplay(academicYear?: string | null, semester?: string | null): string {
    const raw = (academicYear || '').trim();
    if (raw === '1' || raw.toLowerCase().includes('1st')) return '1st Year';
    if (raw === '2' || raw.toLowerCase().includes('2nd')) return '2nd Year';
    if (raw === '3' || raw.toLowerCase().includes('3rd')) return '3rd Year';
    if (raw === '4' || raw.toLowerCase().includes('4th')) return '4th Year';

    if (semester) {
      const semNum = parseInt(semester, 10);
      if (!isNaN(semNum)) {
        const yr = Math.ceil(semNum / 2);
        if (yr === 1) return '1st Year';
        if (yr === 2) return '2nd Year';
        if (yr === 3) return '3rd Year';
        if (yr === 4) return '4th Year';
      }
    }

    return 'N/A';
  }

  /**
   * Generates standard available academic years list dynamically.
   */
  private getAvailableAcademicYears(): string[] {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const activeStartYear = currentMonth >= 5 ? currentYear : currentYear - 1;

    const years: string[] = [];
    for (let i = 0; i < 5; i++) {
      const start = activeStartYear - i;
      years.push(`${start}-${start + 1}`);
    }
    return years;
  }

  /**
   * Main aggregation query for Super Admin Volunteering Analytics.
   */
  async getVolunteeringAnalytics(
    dto: VolunteeringAnalyticsQueryDTO
  ): Promise<VolunteeringAnalyticsResponse> {
    const period = dto.period || 'total';
    const studentYear = dto.studentYear || 'all';
    const zoneId = dto.zoneId && dto.zoneId !== 'all' ? dto.zoneId : undefined;
    const collegeId = dto.collegeId && dto.collegeId !== 'all' ? dto.collegeId : undefined;

    const { startDate, endDate } = this.resolveDateRange(dto);

    // 1. Build Student filtering conditions (Strict Active Student Rule)
    const studentWhere: Prisma.StudentWhereInput = {
      status: StudentStatus.ACTIVE,
      user: {
        isActive: true,
      },
      ...(zoneId && { zoneId }),
      ...(collegeId && { collegeId }),
    };

    // 2. Build Submission filtering conditions (Strict Approved status & date boundaries)
    const submissionWhere: Prisma.VolunteerSubmissionWhereInput = {
      status: VolunteerStatus.approved,
      student: {
        status: StudentStatus.ACTIVE,
        user: {
          isActive: true,
        },
        ...(zoneId && { zoneId }),
        ...(collegeId && { collegeId }),
      },
      ...(startDate || endDate
        ? {
            eventDate: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    // 3. Parallel fetch of core active students, submissions, zones, and colleges
    const [allActiveStudents, approvedSubmissions, allZones, allColleges] = await Promise.all([
      prisma.student.findMany({
        where: studentWhere,
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          registrationNumber: true,
          academicYear: true,
          semester: true,
          batch: true,
          collegeId: true,
          zoneId: true,
          profileImage: true,
          user: {
            select: {
              userProfile: {
                select: {
                  profileImage: true,
                },
              },
            },
          },
          college: {
            select: {
              id: true,
              name: true,
              code: true,
              location: true,
            },
          },
          zone: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.volunteerSubmission.findMany({
        where: submissionWhere,
        select: {
          id: true,
          studentId: true,
          zoneId: true,
          category: true,
          count: true,
          eventDate: true,
          student: {
            select: {
              id: true,
              academicYear: true,
              semester: true,
              batch: true,
              collegeId: true,
              zoneId: true,
            },
          },
        },
      }),
      prisma.zone.findMany({
        where: {
          isActive: true,
          ...(zoneId && { id: zoneId }),
        },
        include: {
          incharge: {
            include: {
              userProfile: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.college.findMany({
        where: {
          isActive: true,
          ...(zoneId && { zoneId }),
          ...(collegeId && { id: collegeId }),
        },
        include: {
          zone: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // 4. In-memory filtering for Student Year
    const filteredActiveStudents = allActiveStudents.filter((s) =>
      this.matchesStudentYear(s, studentYear)
    );

    const activeStudentIdSet = new Set(filteredActiveStudents.map((s) => s.id));

    // Filter submissions strictly to active students in the filtered year set
    const filteredSubmissions = approvedSubmissions.filter((sub) =>
      activeStudentIdSet.has(sub.studentId)
    );

    // 5. Aggregate per Student
    const studentPointsMap = new Map<
      string,
      {
        student: (typeof filteredActiveStudents)[0];
        points: number;
        activitiesCount: number;
      }
    >();

    // Initialize all filtered active students
    for (const student of filteredActiveStudents) {
      studentPointsMap.set(student.id, {
        student,
        points: 0,
        activitiesCount: 0,
      });
    }

    // Accumulate points and activity counts from approved submissions
    for (const sub of filteredSubmissions) {
      const entry = studentPointsMap.get(sub.studentId);
      if (entry) {
        const pts = this.calculatePoints(sub.category, sub.count);
        entry.points += pts;
        entry.activitiesCount += 1;
      }
    }

    // 6. Compute TOP 5 Students with Tie-Aware Ranking
    const rankedStudentsList = Array.from(studentPointsMap.values())
      .filter((item) => item.points > 0) // Only students with approved points
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.student.registrationNumber.localeCompare(b.student.registrationNumber);
      });

    const topStudents: TopStudentItem[] = [];
    let currentRank = 1;
    for (let i = 0; i < rankedStudentsList.length; i++) {
      if (i >= 5) break; // Limit to top 5 entries
      const curr = rankedStudentsList[i];
      if (i > 0) {
        const prev = rankedStudentsList[i - 1];
        if (curr.points === prev.points) {
          currentRank = topStudents[i - 1].rank;
        } else {
          currentRank = i + 1;
        }
      }

      const fullName = [curr.student.firstName, curr.student.middleName, curr.student.lastName]
        .filter(Boolean)
        .join(' ');

      topStudents.push({
        rank: currentRank,
        studentId: curr.student.id,
        studentName: fullName,
        registrationNumber: curr.student.registrationNumber,
        collegeName: curr.student.college?.name || 'Unassigned',
        collegeCode: curr.student.college?.code || 'N/A',
        zoneName: curr.student.zone?.name || 'Unassigned',
        zoneCode: curr.student.zone?.code || 'N/A',
        studentYear: this.formatStudentYearDisplay(curr.student.academicYear, curr.student.semester),
        points: curr.points,
        activitiesCount: curr.activitiesCount,
        profileImage:
          curr.student.profileImage ||
          curr.student.user?.userProfile?.profileImage ||
          null,
      });
    }

    // 7. Aggregate College Performance
    const collegeMetricsMap = new Map<
      string,
      {
        college: (typeof allColleges)[0];
        activeStudents: number;
        volunteeringStudentIds: Set<string>;
        activities: number;
        points: number;
      }
    >();

    for (const college of allColleges) {
      collegeMetricsMap.set(college.id, {
        college,
        activeStudents: 0,
        volunteeringStudentIds: new Set(),
        activities: 0,
        points: 0,
      });
    }

    // Count active students per college
    for (const student of filteredActiveStudents) {
      if (student.collegeId && collegeMetricsMap.has(student.collegeId)) {
        collegeMetricsMap.get(student.collegeId)!.activeStudents += 1;
      }
    }

    // Accumulate activities, points, and distinct volunteering students
    for (const sub of filteredSubmissions) {
      const collegeId = sub.student.collegeId;
      if (collegeId && collegeMetricsMap.has(collegeId)) {
        const colEntry = collegeMetricsMap.get(collegeId)!;
        const pts = this.calculatePoints(sub.category, sub.count);
        colEntry.points += pts;
        colEntry.activities += 1;
        colEntry.volunteeringStudentIds.add(sub.studentId);
      }
    }

    const collegePerformanceList = Array.from(collegeMetricsMap.values())
      .map((entry) => {
        const activeCount = entry.activeStudents;
        const volCount = entry.volunteeringStudentIds.size;
        const participationPct =
          activeCount > 0 ? Math.round((volCount / activeCount) * 10000) / 100 : 0;

        return {
          collegeId: entry.college.id,
          collegeName: entry.college.name,
          collegeCode: entry.college.code,
          zoneId: entry.college.zoneId,
          zoneName: entry.college.zone?.name || 'Unassigned',
          zoneCode: entry.college.zone?.code || 'N/A',
          activeStudents: activeCount,
          volunteeringStudents: volCount,
          participationPercentage: participationPct,
          activities: entry.activities,
          points: entry.points,
        };
      })
      .sort((a, b) => {
        if (b.participationPercentage !== a.participationPercentage) {
          return b.participationPercentage - a.participationPercentage;
        }
        if (b.points !== a.points) return b.points - a.points;
        return a.collegeName.localeCompare(b.collegeName);
      });

    // Assign tie-aware ranks to colleges
    const collegePerformance: CollegePerformanceItem[] = [];
    let collegeRank = 1;
    for (let i = 0; i < collegePerformanceList.length; i++) {
      const curr = collegePerformanceList[i];
      if (i > 0) {
        const prev = collegePerformanceList[i - 1];
        if (
          curr.participationPercentage === prev.participationPercentage &&
          curr.points === prev.points
        ) {
          collegeRank = collegePerformance[i - 1].rank;
        } else {
          collegeRank = i + 1;
        }
      }
      collegePerformance.push({
        rank: collegeRank,
        ...curr,
      });
    }

    // 8. Aggregate Zone Performance
    const zoneMetricsMap = new Map<
      string,
      {
        zone: (typeof allZones)[0];
        activeStudents: number;
        volunteeringStudentIds: Set<string>;
        activities: number;
        points: number;
      }
    >();

    for (const zone of allZones) {
      zoneMetricsMap.set(zone.id, {
        zone,
        activeStudents: 0,
        volunteeringStudentIds: new Set(),
        activities: 0,
        points: 0,
      });
    }

    // Count active students per zone
    for (const student of filteredActiveStudents) {
      if (student.zoneId && zoneMetricsMap.has(student.zoneId)) {
        zoneMetricsMap.get(student.zoneId)!.activeStudents += 1;
      }
    }

    // Accumulate activities, points, and distinct volunteering students per zone
    for (const sub of filteredSubmissions) {
      const zoneId = sub.student.zoneId;
      if (zoneId && zoneMetricsMap.has(zoneId)) {
        const zEntry = zoneMetricsMap.get(zoneId)!;
        const pts = this.calculatePoints(sub.category, sub.count);
        zEntry.points += pts;
        zEntry.activities += 1;
        zEntry.volunteeringStudentIds.add(sub.studentId);
      }
    }

    const zonePerformanceList = Array.from(zoneMetricsMap.values())
      .map((entry) => {
        const activeCount = entry.activeStudents;
        const volCount = entry.volunteeringStudentIds.size;
        const participationPct =
          activeCount > 0 ? Math.round((volCount / activeCount) * 10000) / 100 : 0;

        const inchargeName =
          entry.zone.incharge?.userProfile?.fullName || 'No Incharge Assigned';

        return {
          zoneId: entry.zone.id,
          zoneName: entry.zone.name,
          zoneCode: entry.zone.code,
          inchargeName,
          activeStudents: activeCount,
          volunteeringStudents: volCount,
          participationPercentage: participationPct,
          activities: entry.activities,
          points: entry.points,
        };
      })
      .sort((a, b) => {
        if (b.participationPercentage !== a.participationPercentage) {
          return b.participationPercentage - a.participationPercentage;
        }
        if (b.points !== a.points) return b.points - a.points;
        return a.zoneName.localeCompare(b.zoneName);
      });

    // Assign tie-aware ranks to zones
    const zonePerformance: ZonePerformanceItem[] = [];
    let zoneRank = 1;
    for (let i = 0; i < zonePerformanceList.length; i++) {
      const curr = zonePerformanceList[i];
      if (i > 0) {
        const prev = zonePerformanceList[i - 1];
        if (
          curr.participationPercentage === prev.participationPercentage &&
          curr.points === prev.points
        ) {
          zoneRank = zonePerformance[i - 1].rank;
        } else {
          zoneRank = i + 1;
        }
      }
      zonePerformance.push({
        rank: zoneRank,
        ...curr,
      });
    }

    // 9. Overall Summary Metrics
    const totalActiveStudents = filteredActiveStudents.length;
    const globalVolunteeringStudentIds = new Set(filteredSubmissions.map((s) => s.studentId));
    const totalVolunteeringStudents = globalVolunteeringStudentIds.size;
    const overallParticipationPercentage =
      totalActiveStudents > 0
        ? Math.round((totalVolunteeringStudents / totalActiveStudents) * 10000) / 100
        : 0;

    let totalPoints = 0;
    for (const sub of filteredSubmissions) {
      totalPoints += this.calculatePoints(sub.category, sub.count);
    }

    return {
      summary: {
        totalActiveStudents,
        totalVolunteeringStudents,
        overallParticipationPercentage,
        totalActivities: filteredSubmissions.length,
        totalPoints,
      },
      topStudents,
      collegePerformance,
      zonePerformance,
      appliedFilters: {
        period,
        academicYear: dto.academicYear,
        fromDate: dto.fromDate,
        toDate: dto.toDate,
        studentYear,
        zoneId: dto.zoneId || 'all',
        collegeId: dto.collegeId || 'all',
      },
      availableAcademicYears: this.getAvailableAcademicYears(),
    };
  }

  /**
   * College Drill-Down: College Overview + Top 5 Students in this College.
   */
  async getCollegeDrillDown(
    collegeId: string,
    dto: VolunteeringAnalyticsQueryDTO
  ): Promise<CollegeDrillDownResponse> {
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      include: {
        zone: true,
      },
    });

    if (!college) {
      throw ApiError.notFound('College not found');
    }

    // Run analytics scoped to this specific college
    const collegeAnalytics = await this.getVolunteeringAnalytics({
      ...dto,
      collegeId: college.id,
      zoneId: college.zoneId,
    });

    const perf = collegeAnalytics.collegePerformance.find((c) => c.collegeId === college.id) || {
      activeStudents: 0,
      volunteeringStudents: 0,
      participationPercentage: 0,
      activities: 0,
      points: 0,
    };

    return {
      college: {
        id: college.id,
        name: college.name,
        code: college.code,
        location: college.location,
        zoneName: college.zone?.name || 'Unassigned',
        zoneCode: college.zone?.code || 'N/A',
      },
      metrics: {
        activeStudents: perf.activeStudents,
        volunteeringStudents: perf.volunteeringStudents,
        participationPercentage: perf.participationPercentage,
        activities: perf.activities,
        points: perf.points,
      },
      topStudents: collegeAnalytics.topStudents,
    };
  }

  /**
   * Zone Drill-Down: Zone Overview + List of Colleges inside this Zone.
   */
  async getZoneDrillDown(
    zoneId: string,
    dto: VolunteeringAnalyticsQueryDTO
  ): Promise<ZoneDrillDownResponse> {
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        incharge: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    if (!zone) {
      throw ApiError.notFound('Zone not found');
    }

    // Run analytics scoped to this specific zone
    const zoneAnalytics = await this.getVolunteeringAnalytics({
      ...dto,
      zoneId: zone.id,
    });

    const perf = zoneAnalytics.zonePerformance.find((z) => z.zoneId === zone.id) || {
      activeStudents: 0,
      volunteeringStudents: 0,
      participationPercentage: 0,
      activities: 0,
      points: 0,
    };

    const inchargeName = zone.incharge?.userProfile?.fullName || 'No Incharge Assigned';

    return {
      zone: {
        id: zone.id,
        name: zone.name,
        code: zone.code,
        regionLabel: zone.regionLabel,
        inchargeName,
      },
      metrics: {
        activeStudents: perf.activeStudents,
        volunteeringStudents: perf.volunteeringStudents,
        participationPercentage: perf.participationPercentage,
        activities: perf.activities,
        points: perf.points,
      },
      colleges: zoneAnalytics.collegePerformance,
    };
  }
}

export const analyticsService = new AnalyticsService();
