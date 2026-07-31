/**
 * @file src/modules/zone/zone.types.ts
 * @description Types and DTO mappings for the Zone module.
 */

export interface CreateZoneDTO {
  name: string;
  code: string;
  regionLabel: string;
  organizationId: string;
  inchargeId?: string;
}

export interface UpdateZoneDTO {
  name?: string;
  regionLabel?: string;
  isActive?: boolean;
  inchargeId?: string;
  organizationId?: string;
}
