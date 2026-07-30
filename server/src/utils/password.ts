/**
 * @file src/utils/password.ts
 * @description Helper functions for hashing and comparing passwords using bcryptjs.
 */

import bcrypt from 'bcryptjs';

/**
 * Hashes a plain text password.
 * @param password The plain text password to hash
 * @returns A promise that resolves to the hashed password string
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hash.
 * @param password The plain text password to verify
 * @param hash The hashed password to compare against
 * @returns A promise that resolves to a boolean indicating match status
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
