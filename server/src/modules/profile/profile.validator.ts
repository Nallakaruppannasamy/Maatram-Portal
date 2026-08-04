/**
 * @file src/modules/profile/profile.validator.ts
 * @description Zod schema definitions for Profile update requests.
 */

import { z } from 'zod';
import { Gender, BloodGroup } from '@prisma/client';

export const updateProfileValidator = z.object({
  body: z.object({
    // Staff/Common fields
    fullName: z
      .string()
      .max(100)
      .trim()
      .optional(),
    mobile: z
      .string()
      .regex(/^\d{10,15}$/, 'Mobile number must contain between 10 and 15 digits')
      .optional(),
    designation: z.string().max(100).optional(),
    profileImage: z.string().max(255).optional().nullable(),
    bio: z.string().max(1000).optional(),

    // Student personal fields
    firstName: z.string().min(1, 'First name is required').max(100).trim().optional(),
    middleName: z.string().max(100).trim().optional().nullable(),
    lastName: z.string().min(1, 'Last name is required').max(100).trim().optional(),
    gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'Invalid gender' }) }).optional(),
    bloodGroup: z.nativeEnum(BloodGroup, { errorMap: () => ({ message: 'Invalid blood group' }) }).optional().nullable(),
    nationality: z.string().max(50).trim().optional().nullable(),
    community: z.string().max(50).trim().optional().nullable(),
    religion: z.string().max(50).trim().optional().nullable(),

    // Contact
    alternateMobile: z
      .string()
      .regex(/^\d{10,15}$/, 'Alternate mobile number must contain between 10 and 15 digits')
      .optional()
      .nullable(),

    // Parent/Guardian
    parentName: z.string().max(100).trim().optional(),
    parentMobile: z
      .string()
      .regex(/^\d{10,15}$/, 'Parent mobile number must contain between 10 and 15 digits')
      .optional(),
    parentOccupation: z.string().max(100).trim().optional().nullable(),
    guardianName: z.string().max(100).trim().optional().nullable(),
    guardianMobile: z
      .string()
      .regex(/^\d{10,15}$/, 'Guardian mobile number must contain between 10 and 15 digits')
      .optional()
      .nullable(),

    // Address
    addressLine1: z.string().max(255).trim().optional(),
    addressLine2: z.string().max(255).trim().optional().nullable(),
    city: z.string().max(100).trim().optional(),
    district: z.string().max(100).trim().optional(),
    state: z.string().max(100).trim().optional(),
    country: z.string().max(100).trim().optional(),
    pincode: z.string().regex(/^\d{5,10}$/, 'Pincode must be between 5 and 10 digits').optional(),

    // Academic
    collegeId: z.string().uuid('Invalid College ID').optional(),
    departmentId: z.string().uuid('Invalid Department ID').optional(),
    programId: z.string().uuid('Invalid Program ID').optional(),
    batch: z.string().regex(/^\d{4}-\d{4}$/, 'Batch must be in format YYYY-YYYY (e.g. 2024-2028)').optional(),
    course: z.string().max(100).optional(),

    // Performance
    cgpa: z.number().min(0).max(10).optional().nullable(),
    semesterGrades: z
      .array(
        z.object({
          semesterNumber: z.number().int().min(1).max(10),
          gpa: z.number().min(0).max(10),
        })
      )
      .optional(),

    // Career
    careerObjective: z.string().max(2000).optional().nullable(),
  }),
});
export type UpdateProfileInput = z.infer<typeof updateProfileValidator>;
