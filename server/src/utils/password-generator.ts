/**
 * @file src/utils/password-generator.ts
 * @description Helper utility to generate secure temporary passwords.
 */

import crypto from 'crypto';

/**
 * Generates a secure, random temporary password that complies with complexity rules:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character (@$!%*?&)
 *
 * @param length Length of the password (defaults to 12)
 */
export const generateTempPassword = (length = 12): string => {
  const minLength = 8;
  const actualLength = Math.max(length, minLength);

  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const digitChars = '0123456789';
  const specialChars = '@$!%*?&';
  const allChars = uppercaseChars + lowercaseChars + digitChars + specialChars;

  // Guarantee at least one of each character class
  let password = '';
  password += uppercaseChars[crypto.randomInt(uppercaseChars.length)];
  password += lowercaseChars[crypto.randomInt(lowercaseChars.length)];
  password += digitChars[crypto.randomInt(digitChars.length)];
  password += specialChars[crypto.randomInt(specialChars.length)];

  // Fill the remaining length with random characters from the pool
  for (let i = password.length; i < actualLength; i++) {
    const randomIndex = crypto.randomInt(allChars.length);
    password += allChars[randomIndex];
  }

  // Shuffle the password characters to avoid predictable patterns
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
};
