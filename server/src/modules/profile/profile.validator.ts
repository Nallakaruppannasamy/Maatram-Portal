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

const isValidPhone = (val: unknown): boolean => {
  if (val === undefined || val === null || val === '') return true;
  if (typeof val !== 'string') return false;
  const digits = val.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 && /^\+?[0-9\s\-()]+$/.test(val.trim());
};

const phoneSchema = (fieldName: string) =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .refine(isValidPhone, {
        message: `${fieldName} must contain between 10 and 15 digits (e.g. +91 9876543210 or 9876543210)`,
      })
      .optional()
      .nullable()
  );

export const updateProfileValidator = z.object({
  body: z.object({
    // Staff/Common fields
    fullName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    mobile: phoneSchema('Mobile number'),
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
    alternateMobile: phoneSchema('Alternate mobile number'),

    // Parent/Guardian
    parentName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    parentMobile: phoneSchema('Parent mobile number'),
    parentOccupation: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    guardianName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
    guardianMobile: phoneSchema('Guardian mobile number'),

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
