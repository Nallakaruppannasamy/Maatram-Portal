/**
 * @file src/utils/pagination.ts
 * @description Reusable utility functions for building Prisma-compatible
 * pagination arguments and computing response meta objects.
 */

import { PaginationMeta, PaginationParams } from '@/types';
import { PAGINATION } from '@/constants';

export interface PaginationArgs {
  skip: number;
  take: number;
}

/**
 * Parses and sanitizes raw page/limit query parameters.
 * Falls back to configured defaults if values are missing or invalid.
 */
export const parsePagination = (
  rawPage?: string | number,
  rawLimit?: string | number
): PaginationParams => {
  const page = Math.max(1, parseInt(String(rawPage ?? PAGINATION.DEFAULT_PAGE), 10) || 1);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(
      1,
      parseInt(String(rawLimit ?? PAGINATION.DEFAULT_LIMIT), 10) || PAGINATION.DEFAULT_LIMIT
    )
  );
  return { page, limit };
};

/**
 * Converts page/limit into Prisma skip/take arguments.
 */
export const toPrismaArgs = ({ page, limit }: PaginationParams): PaginationArgs => ({
  skip: (page - 1) * limit,
  take: limit,
});

/**
 * Builds the pagination meta object for the API response envelope.
 */
export const buildPaginationMeta = (
  total: number,
  { page, limit }: PaginationParams
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
