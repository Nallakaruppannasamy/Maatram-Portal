/**
 * @file src/modules/profile/profile.types.ts
 * @description Types and DTO mappings for the Profile module.
 */

export interface UpdateProfileDTO {
  fullName?: string;
  mobile?: string;
  designation?: string;
  profileImage?: string;
  bio?: string;
}
