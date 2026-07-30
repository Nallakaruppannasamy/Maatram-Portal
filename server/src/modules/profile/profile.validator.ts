/**
 * @file src/modules/profile/profile.validator.ts
 * @description Zod schema definitions for Profile update requests.
 */

import { z } from 'zod';

export const updateProfileValidator = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(3, 'Full name must be at least 3 characters long')
      .max(100)
      .trim()
      .optional(),
    mobile: z
      .string()
      .regex(/^\d{10,15}$/, 'Mobile number must contain between 10 and 15 digits')
      .optional(),
    designation: z.string().max(100).optional(),
    profileImage: z.string().max(255).optional(),
    bio: z.string().max(1000).optional(),
  }),
});
