/**
 * @file src/modules/profile/profile.validator.ts
 * @description Zod schema definitions for Profile update requests.
 */

import { z } from 'zod';
import { Gender, BloodGroup } from '@prisma/client';

const emptyToNull = (val: unknown) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  }
  return val;
};

const sanitizeNumberOrNull = (val: unknown) => {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

export const updateProfileValidator = z.object({
  body: z.object({
    // Staff/Common fields
    fullName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    mobile: z.preprocess(
      emptyToNull,
      z.string().regex(/^\d{10,15}$/, 'Mobile number must contain between 10 and 15 digits').optional().nullable()
    ),
    designation: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    profileImage: z.preprocess(emptyToNull, z.string().max(2048).optional().nullable()),
    bio: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),

    // Student personal fields
    firstName: z.preprocess(emptyToNull, z.string().min(1, 'First name is required').max(100).optional().nullable()),
    middleName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    lastName: z.preprocess(emptyToNull, z.string().min(1, 'Last name is required').max(100).optional().nullable()),
    gender: z.preprocess(
      emptyToNull,
      z.nativeEnum(Gender, { errorMap: () => ({ message: 'Invalid gender' }) }).optional().nullable()
    ),
    bloodGroup: z.preprocess(
      emptyToNull,
      z.nativeEnum(BloodGroup, { errorMap: () => ({ message: 'Invalid blood group' }) }).optional().nullable()
    ),
    nationality: z.preprocess(emptyToNull, z.string().max(50).optional().nullable()),
    community: z.preprocess(emptyToNull, z.string().max(50).optional().nullable()),
    religion: z.preprocess(emptyToNull, z.string().max(50).optional().nullable()),

    // Contact
    alternateMobile: z.preprocess(
      emptyToNull,
      z.string().regex(/^\d{10,15}$/, 'Alternate mobile number must contain between 10 and 15 digits').optional().nullable()
    ),

    // Parent/Guardian
    parentName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    parentMobile: z.preprocess(
      emptyToNull,
      z.string().regex(/^\d{10,15}$/, 'Parent mobile number must contain between 10 and 15 digits').optional().nullable()
    ),
    parentOccupation: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    guardianName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    guardianMobile: z.preprocess(
      emptyToNull,
      z.string().regex(/^\d{10,15}$/, 'Guardian mobile number must contain between 10 and 15 digits').optional().nullable()
    ),

    // Address
    addressLine1: z.preprocess(emptyToNull, z.string().max(255).optional().nullable()),
    addressLine2: z.preprocess(emptyToNull, z.string().max(255).optional().nullable()),
    city: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    district: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    state: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    country: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    pincode: z.preprocess(
      emptyToNull,
      z.string().regex(/^\d{5,10}$/, 'Pincode must be between 5 and 10 digits').optional().nullable()
    ),

    // Academic
    collegeId: z.preprocess(emptyToNull, z.string().uuid('Invalid College ID').optional().nullable()),
    departmentId: z.preprocess(emptyToNull, z.string().uuid('Invalid Department ID').optional().nullable()),
    programId: z.preprocess(emptyToNull, z.string().uuid('Invalid Program ID').optional().nullable()),
    batch: z.preprocess(
      emptyToNull,
      z.string().regex(/^\d{4}-\d{4}$/, 'Batch must be in format YYYY-YYYY (e.g. 2024-2028)').optional().nullable()
    ),
    course: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),

    // Performance
    cgpa: z.preprocess(sanitizeNumberOrNull, z.number().min(0).max(10).optional().nullable()),
    semesterGrades: z
      .array(
        z.object({
          semesterNumber: z.number().int().min(1).max(10),
          gpa: z.number().min(0).max(10),
        })
      )
      .optional()
      .nullable(),

    // Career
    careerObjective: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
  }),
});
export type UpdateProfileInput = z.infer<typeof updateProfileValidator>;
