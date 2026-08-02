import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ApiError } from '@/common/exceptions/apiError';
import { env } from '@/config/env';
import { TokenPayload } from '@/types';
import { prisma } from '@/config/database';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const tokenFromCookie = req.cookies?.accessToken;

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (tokenFromCookie) {
    token = tokenFromCookie;
  }

  if (!token) {
    return next(ApiError.unauthorized('Access token is missing or malformed'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & TokenPayload;

    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      return next(ApiError.unauthorized('Invalid access token payload'));
    }

    // Database verification: verify user exists, is active, and role hasn't changed
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        registerNumber: true,
        zoneId: true,
      },
    });

    if (!user) {
      return next(ApiError.unauthorized('User account no longer exists'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated'));
    }

    if (user.role !== decoded.role) {
      return next(ApiError.unauthorized('User role is no longer valid'));
    }

    req.user = {
      userId: user.id,
      email: user.email || '',
      role: user.role,
      zoneId: user.zoneId || undefined,
      registerNumber: user.registerNumber || undefined,
    };
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token has expired'));
    }
    return next(ApiError.unauthorized('Invalid access token'));
  }
};
