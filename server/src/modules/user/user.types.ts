/**
 * @file src/modules/user/user.types.ts
 * @description Types and DTO mappings for the User module.
 */

import { UserRole } from '@prisma/client';

export interface CreateUserDTO {
  email: string;
  role: UserRole;
  employeeId?: string;
  fullName: string;
  mobile?: string;
  designation?: string;
  organizationId?: string;
  zoneId?: string;
}

export interface UpdateUserDTO {
  email?: string;
  role?: UserRole;
  employeeId?: string;
  fullName?: string;
  mobile?: string;
  designation?: string;
  organizationId?: string;
  zoneId?: string;
  isActive?: boolean;
}
