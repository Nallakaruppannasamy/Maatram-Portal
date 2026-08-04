/**
 * @file src/modules/profile/profile.types.ts
 * @description Types and DTO mappings for the Profile module.
 */

export interface UpdateProfileDTO {
  // Staff/Common
  fullName?: string;
  mobile?: string;
  designation?: string;
  profileImage?: string | null;
  bio?: string;

  // Student specific personal
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  gender?: any;
  bloodGroup?: any;
  nationality?: string | null;
  community?: string | null;
  religion?: string | null;

  // Contact
  alternateMobile?: string | null;

  // Parents / Guardian
  parentName?: string;
  parentMobile?: string;
  parentOccupation?: string | null;
  guardianName?: string | null;
  guardianMobile?: string | null;

  // Address
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Academic
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  batch?: string;
  course?: string;

  // Performance
  cgpa?: number | any | null;
  semesterGrades?: Array<{ semesterNumber: number; gpa: number | any }>;

  // Career
  careerObjective?: string | null;
}
