/**
 * @file src/utils/query-helper.ts
 * @description Reusable pagination, sorting, search, and filtering utility for Prisma queries.
 */

export interface QueryParams {
  page?: string | number;
  limit?: string | number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: string | boolean;
  [key: string]: unknown;
}

export interface PaginationResult {
  skip: number;
  take: number;
  orderBy: Record<string, unknown> | undefined;
}

export interface PaginationMeta {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parses raw query parameters to standard Prisma pagination and sorting clauses.
 */
export const parseQueryParams = (
  params: QueryParams,
  defaultSortBy = 'createdAt'
): PaginationResult => {
  const page = Math.max(1, parseInt(String(params.page || 1), 10));
  const limit = Math.max(1, Math.min(100, parseInt(String(params.limit || 10), 10)));
  const skip = (page - 1) * limit;
  const take = limit;

  const sortBy = String(params.sortBy || defaultSortBy);
  const sortOrder: 'asc' | 'desc' =
    params.sortOrder === 'asc' || params.sortOrder === 'desc' ? params.sortOrder : 'desc';

  // Support nested ordering if sortBy contains a dot (e.g. "userProfile.fullName")
  let orderBy: Record<string, unknown>;
  if (sortBy.includes('.')) {
    const parts = sortBy.split('.');
    const buildNestedOrderBy = (
      fields: string[],
      order: 'asc' | 'desc'
    ): Record<string, unknown> => {
      if (fields.length === 1) {
        return { [fields[0]]: order };
      }
      return { [fields[0]]: buildNestedOrderBy(fields.slice(1), order) };
    };
    orderBy = buildNestedOrderBy(parts, sortOrder);
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  return { skip, take, orderBy };
};

/**
 * Builds the pagination meta response envelope.
 */
export const buildPaginationMeta = (totalCount: number, params: QueryParams): PaginationMeta => {
  const page = Math.max(1, parseInt(String(params.page || 1), 10));
  const limit = Math.max(1, Math.min(100, parseInt(String(params.limit || 10), 10)));
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    page,
    limit,
    totalPages,
  };
};

/**
 * Builds standard Prisma search filter object for string fields.
 */
export const buildSearchQuery = (
  search: string | undefined,
  fields: string[]
): Record<string, unknown> => {
  if (!search || !fields.length) return {};

  const searchString = search.trim();
  if (searchString === '') return {};

  const searchClauses = fields.map((field) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      const buildNestedSearch = (pathParts: string[]): Record<string, unknown> => {
        if (pathParts.length === 1) {
          return { [pathParts[0]]: { contains: searchString, mode: 'insensitive' } };
        }
        return { [pathParts[0]]: buildNestedSearch(pathParts.slice(1)) };
      };
      return buildNestedSearch(parts);
    }
    return { [field]: { contains: searchString, mode: 'insensitive' } };
  });

  return { OR: searchClauses };
};
