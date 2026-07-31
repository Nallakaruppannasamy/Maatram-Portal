/**
 * @file src/modules/organization/organization.types.ts
 * @description Types and DTO mappings for the Organization module.
 */

export interface CreateOrganizationDTO {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}
