/**
 * @file src/modules/volunteer/volunteer.validator.ts
 * @description Zod validation schemas for the Volunteer Management module.
 */

import { z } from 'zod';
import { Gender, VolunteerProfileStatus, VolunteerCategory } from '@prisma/client';

export const createVolunteerSchema = z.object({
  body: z.object({
    volunteerId: z
      .string({ required_error: 'Volunteer ID is required' })
      .trim()
      .min(2, 'Volunteer ID must be at least 2 characters'),
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
    email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email address'),
    mobile: z
      .string({ required_error: 'Mobile number is required' })
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format'),
    alternateMobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid alternate mobile number format')
      .optional()
      .nullable(),
    organizationId: z
      .string({ required_error: 'Organization ID is required' })
      .uuid('Invalid Organization ID'),
    zoneId: z.string({ required_error: 'Zone ID is required' }).uuid('Invalid Zone ID'),
    volunteerType: z
      .string({ required_error: 'Volunteer type is required' })
      .trim()
      .min(1, 'Volunteer type is required'),
    joiningDate: z
      .string({ required_error: 'Joining date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid joining date format (must be YYYY-MM-DD)',
      }),
    experience: z.string().trim().optional().nullable(),
    availability: z.string().trim().optional().nullable(),
    emergencyContact: z.string().trim().optional().nullable(),
    skills: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const updateVolunteerSchema = z.object({
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
    mobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format')
      .optional(),
    alternateMobile: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid alternate mobile number format')
      .optional()
      .nullable(),
    organizationId: z.string().uuid('Invalid Organization ID').optional(),
    zoneId: z.string().uuid('Invalid Zone ID').optional(),
    volunteerType: z.string().trim().min(1).optional(),
    joiningDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid joining date format',
      })
      .optional(),
    experience: z.string().trim().optional().nullable(),
    availability: z.string().trim().optional().nullable(),
    emergencyContact: z.string().trim().optional().nullable(),
    skills: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const changeVolunteerStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(VolunteerProfileStatus, {
      errorMap: () => ({ message: 'Invalid volunteer status' }),
    }),
    reason: z.string().trim().optional(),
  }),
});

export const createVolunteerSubmissionSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Activity title is required' })
      .trim()
      .min(3, 'Activity title must be at least 3 characters')
      .max(200, 'Activity title must not exceed 200 characters'),
    category: z.nativeEnum(VolunteerCategory, {
      errorMap: () => ({ message: 'Invalid volunteer activity category' }),
    }),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters'),
    eventDate: z
      .string({ required_error: 'Event date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid event date format (must be YYYY-MM-DD)',
      }),
    count: z
      .number()
      .int('Count must be an integer')
      .min(1, 'Count must be at least 1')
      .max(1000, 'Count cannot exceed 1000')
      .optional()
      .nullable(),
    imageUrl: z.string().trim().optional().nullable(),
  }),
});

export const updateSubmissionStatusSchema = z.object({
  body: z.object({
    status: z.string({ required_error: 'Status is required' }).trim(),
    reviewerComment: z.string().trim().optional().nullable(),
  }).refine(
    (data) => {
      const isRejected = String(data.status).toUpperCase() === 'REJECTED';
      return !isRejected || (data.reviewerComment && data.reviewerComment.trim().length > 0);
    },
    {
      message: 'Rejection comments are mandatory',
      path: ['reviewerComment'],
    }
  ),
});

export const addSubmissionCommentSchema = z.object({
  body: z.object({
    comment: z
      .string({ required_error: 'Comment is required' })
      .trim()
      .min(1, 'Comment cannot be empty'),
  }),
});
