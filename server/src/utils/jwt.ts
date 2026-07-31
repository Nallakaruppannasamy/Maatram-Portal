/**
 * @file src/utils/jwt.ts
 * @description Helper functions for generating and verifying JSON Web Tokens (Access & Refresh).
 */

import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '@/config/env';
import { TokenPayload } from '@/types';

/**
 * Generates an Access Token (JWT).
 * @param payload The token payload data
 * @returns Access token string
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as unknown as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Generates a Refresh Token (JWT).
 * @param payload The token payload data
 * @returns Refresh token string
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as unknown as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verifies an Access Token.
 * @param token The token string to verify
 * @returns Decoded payload if valid, throws error otherwise
 */
export const verifyAccessToken = (token: string): TokenPayload & JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload & JwtPayload;
};

/**
 * Verifies a Refresh Token.
 * @param token The token string to verify
 * @returns Decoded payload if valid, throws error otherwise
 */
export const verifyRefreshToken = (token: string): TokenPayload & JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload & JwtPayload;
};
