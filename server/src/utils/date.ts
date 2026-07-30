/**
 * @file src/utils/date.ts
 * @description Date utility helpers used across the application.
 * Centralises all date formatting and computation logic to keep
 * business modules free of inline date manipulation.
 */

/**
 * Returns the current UTC timestamp as an ISO 8601 string.
 */
export const nowISO = (): string => new Date().toISOString();

/**
 * Returns a Date object representing now + the given number of minutes.
 */
export const addMinutes = (minutes: number): Date => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

/**
 * Returns a Date object representing now + the given number of days.
 */
export const addDays = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Checks whether a given Date is in the past.
 */
export const isExpired = (date: Date): boolean => date < new Date();

/**
 * Formats a Date as YYYY-MM-DD string (useful for logs and audit records).
 */
export const formatDate = (date: Date): string => date.toISOString().split('T')[0];
