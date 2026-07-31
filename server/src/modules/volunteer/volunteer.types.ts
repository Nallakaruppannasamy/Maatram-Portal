/**
 * @file src/modules/volunteer/volunteer.types.ts
 * @description Type definitions for the Volunteer Management module.
 */

import {
  Volunteer,
  VolunteerSkill,
  Organization,
  Zone,
  VolunteerProfileStatus,
  Gender,
} from '@prisma/client';

export interface VolunteerWithRelations extends Volunteer {
  organization: Organization;
  zone: Zone;
  skills: VolunteerSkill[];
  fullName?: string;
}

export interface CreateVolunteerDTO {
  volunteerId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string; // ISO date string
  email: string;
  mobile: string;
  alternateMobile?: string;
  organizationId: string;
  zoneId: string;
  volunteerType: string;
  joiningDate: string; // ISO date string
  experience?: string;
  availability?: string;
  emergencyContact?: string;
  skills?: string[];
}

export interface UpdateVolunteerDTO {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  mobile?: string;
  alternateMobile?: string;
  organizationId?: string;
  zoneId?: string;
  volunteerType?: string;
  joiningDate?: string;
  experience?: string;
  availability?: string;
  emergencyContact?: string;
  skills?: string[];
}

export interface VolunteerQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  organizationId?: string;
  zoneId?: string;
  status?: VolunteerProfileStatus;
  volunteerType?: string;
  skill?: string;
  [key: string]: unknown;
}
