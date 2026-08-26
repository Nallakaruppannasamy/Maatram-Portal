/**
 * @file src/modules/student/student.validator.ts
 * @description Input validation schemas for the Student Management module.
 */

import { z } from 'zod';
import { Gender, BloodGroup, StudentStatus } from '@prisma/client';

export const createStudentSchema = z.object({
  body: z.object({
    registrationNumber: z
      .string({ required_error: 'Registration number is required' })
      .trim()
      .min(2, 'Registration number must be at least 2 characters'),
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(1, 'First name is required'),
    middleName: z.string().trim().optional(),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(1, 'Last name is required'),
    gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'Invalid gender value' }) }),
    dateOfBirth: z
      .string({ required_error: 'Date of birth is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date of birth format (must be YYYY-MM-DD)',
      }),
    bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),
    nationality: z.string().trim().optional().nullable(),
    community: z.string().trim().optional().nullable(),
    religion: z.string().trim().optional().nullable(),
    mobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format')
      .optional()
      .nullable(),
    alternateMobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid alternate mobile number format')
      .optional()
      .nullable(),
    email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email address'),
    parentName: z
      .string({ required_error: 'Parent name is required' })
      .trim()
      .min(1, 'Parent name is required'),
    parentMobile: z
      .string({ required_error: 'Parent mobile is required' })
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid parent mobile number format'),
    parentOccupation: z.string().trim().optional().nullable(),
    guardianName: z.string().trim().optional().nullable(),
    guardianMobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid guardian mobile number format')
      .optional()
      .nullable(),
    addressLine1: z
      .string({ required_error: 'Address line 1 is required' })
      .trim()
      .min(1, 'Address line 1 is required'),
    addressLine2: z.string().trim().optional().nullable(),
    city: z.string({ required_error: 'City is required' }).trim().min(1, 'City is required'),
    district: z
      .string({ required_error: 'District is required' })
      .trim()
      .min(1, 'District is required'),
    state: z.string({ required_error: 'State is required' }).trim().min(1, 'State is required'),
    country: z
      .string({ required_error: 'Country is required' })
      .trim()
      .min(1, 'Country is required'),
    pincode: z
      .string({ required_error: 'Pincode is required' })
      .trim()
      .regex(/^\d{5,10}$/, 'Pincode must be between 5 and 10 digits'),
    organizationId: z
      .string({ required_error: 'Organization ID is required' })
      .uuid('Invalid Organization ID'),
    zoneId: z.string({ required_error: 'Zone ID is required' }).uuid('Invalid Zone ID'),
    collegeId: z.string({ required_error: 'College ID is required' }).uuid('Invalid College ID'),
    departmentId: z
      .string({ required_error: 'Department ID is required' })
      .uuid('Invalid Department ID'),
    programId: z.string({ required_error: 'Program ID is required' }).uuid('Invalid Program ID'),
    course: z.string({ required_error: 'Course is required' }).trim().min(1, 'Course is required'),
    batch: z
      .string({ required_error: 'Batch is required' })
      .trim()
      .min(4, 'Batch is required (e.g. 2024)'),
    academicYear: z
      .string({ required_error: 'Academic year is required' })
      .trim()
      .min(1, 'Academic year is required'),
    semester: z.string().trim().optional().nullable(),
    section: z.string().trim().optional().nullable(),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).optional(),
    middleName: z.string().trim().optional().nullable(),
    lastName: z.string().trim().min(1).optional(),
    gender: z.nativeEnum(Gender).optional(),
    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date of birth format',
      })
      .optional(),
    bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),
    nationality: z.string().trim().optional().nullable(),
    community: z.string().trim().optional().nullable(),
    religion: z.string().trim().optional().nullable(),
    mobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format')
      .optional()
      .nullable(),
    alternateMobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid alternate mobile number format')
      .optional()
      .nullable(),
    parentName: z.string().trim().min(1).optional(),
    parentMobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid parent mobile number format')
      .optional(),
    parentOccupation: z.string().trim().optional().nullable(),
    guardianName: z.string().trim().optional().nullable(),
    guardianMobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid guardian mobile number format')
      .optional()
      .nullable(),
    addressLine1: z.string().trim().min(1).optional(),
    addressLine2: z.string().trim().optional().nullable(),
    city: z.string().trim().min(1).optional(),
    district: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    country: z.string().trim().min(1).optional(),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{5,10}$/, 'Pincode format is invalid')
      .optional(),
    organizationId: z.string().uuid('Invalid Organization ID').optional(),
    zoneId: z.string().uuid('Invalid Zone ID').optional(),
    collegeId: z.string().uuid('Invalid College ID').optional(),
    departmentId: z.string().uuid('Invalid Department ID').optional(),
    programId: z.string().uuid('Invalid Program ID').optional(),
    course: z.string().trim().min(1).optional(),
    batch: z.string().trim().min(4).optional(),
    academicYear: z.string().trim().min(1).optional(),
    semester: z.string().trim().optional().nullable(),
    section: z.string().trim().optional().nullable(),
  }),
});

export const changeStudentStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(StudentStatus, {
      errorMap: () => ({ message: 'Invalid student status' }),
    }),
  }),
});

export const manualStudentSchema = z.object({
  body: z.object({
    studentName: z
      .string({ required_error: 'Student Name is required' })
      .trim()
      .min(1, 'Student Name is required')
      .max(100),
    registrationNumber: z
      .string({ required_error: 'Registration Number is required' })
      .trim()
      .min(2, 'Registration Number must be at least 2 characters')
      .max(50),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address'),
    dateOfBirth: z
      .string({ required_error: 'Date of Birth is required' })
      .refine(
        (val) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            return !isNaN(Date.parse(val));
          }
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
            const parts = val.split('/');
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            const date = new Date(y, m, d);
            return date.getDate() === d && date.getMonth() === m && date.getFullYear() === y;
          }
          return !isNaN(Date.parse(val));
        },
        {
          message: 'Invalid date of birth format (must be YYYY-MM-DD or DD/MM/YYYY)',
        }
      ),
  }),
});

export const updateStudentSpocSchema = z.object({
  body: z.object({
    isSpoc: z.boolean({
      required_error: 'isSpoc is required and must be a boolean',
      invalid_type_error: 'isSpoc must be a boolean',
    }),
  }),
});

