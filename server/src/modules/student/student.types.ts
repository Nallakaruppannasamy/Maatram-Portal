/**
 * @file src/modules/student/student.types.ts
 * @description Type definitions for the Student Management module.
 */

import {
  Student,
  User,
  Organization,
  Zone,
  College,
  Department,
  Program,
  StudentStatus,
  Gender,
  BloodGroup,
} from '@prisma/client';

export interface StudentWithRelations extends Student {
  user: User;
  organization: Organization;
  zone: Zone;
  college: College;
  department: Department;
  program: Program;
  fullName?: string;
}

export interface CreateStudentDTO {
  registrationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string; // ISO date string
  bloodGroup?: BloodGroup;
  nationality?: string;
  community?: string;
  religion?: string;
  mobile?: string;
  alternateMobile?: string;
  parentName: string;
  parentMobile: string;
  parentOccupation?: string;
  guardianName?: string;
  guardianMobile?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  organizationId: string;
  zoneId: string;
  collegeId: string;
  departmentId: string;
  programId: string;
  course: string;
  batch: string;
  academicYear: string;
  semester?: string;
  section?: string;
  email: string;
}

export interface UpdateStudentDTO {
  registrationNumber?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
  nationality?: string;
  community?: string;
  religion?: string;
  mobile?: string;
  alternateMobile?: string;
  parentName?: string;
  parentMobile?: string;
  parentOccupation?: string;
  guardianName?: string;
  guardianMobile?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  organizationId?: string;
  zoneId?: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  course?: string;
  batch?: string;
  academicYear?: string;
  semester?: string;
  section?: string;
}

export interface StudentQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  organizationId?: string;
  zoneId?: string;
  collegeId?: string;
  departmentId?: string;
  status?: StudentStatus;
  stream?: string;
  accountStatus?: string;
  batch?: string;
  academicYear?: string;
  isSpoc?: boolean;
  scope?: 'active' | 'archived' | 'all';
  isActive?: boolean;
  [key: string]: unknown;
}

export interface StudentImportRow {
  registrationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  nationality?: string;
  community?: string;
  religion?: string;
  email: string;
  mobile?: string;
  alternateMobile?: string;
  parentName: string;
  parentMobile: string;
  parentOccupation?: string;
  guardianName?: string;
  guardianMobile?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  organizationCode: string;
  zoneCode: string;
  collegeCode: string;
  departmentName: string;
  programName: string;
  course: string;
  batch: string;
  academicYear: string;
  semester?: string;
  section?: string;
}

export interface StudentImportReport {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: { row: number; error: string }[];
}
