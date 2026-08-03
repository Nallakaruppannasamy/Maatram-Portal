import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from '@/config/env';
import { requestLogger } from '@/common/middleware/requestLogger';
import { errorHandler } from '@/common/middleware/error';
import { setupSwagger } from '@/config/swagger';
import { checkDatabaseConnection } from '@/config/database';
import { verifyMailConnection } from '@/config/mail';

import { configureCloudinary } from '@/config/cloudinary';
import { ResponseFormatter } from '@/common/responses/formatter';
import { ApiError } from '@/common/exceptions/apiError';

const app: Express = express();

// 1. Configure Cloudinary configuration bindings
configureCloudinary();

// 2. Global rate limiter (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

// 3. Security & Optimization Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request Logging (Morgan → Winston)
app.use(requestLogger);

// 5. Apply Global Rate Limiting
app.use('/api', globalLimiter);

// 6. API Documentation Route
setupSwagger(app);

// 7. API Modules
import authRouter from '@/modules/auth/auth.routes';
import organizationRouter from '@/modules/organization/organization.routes';
import zoneRouter from '@/modules/zone/zone.routes';
import userRouter from '@/modules/user/user.routes';
import profileRouter from '@/modules/profile/profile.routes';
import studentRouter from '@/modules/student/student.routes';
import volunteerRouter from '@/modules/volunteer/volunteer.routes';

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', organizationRouter);
app.use('/api/v1/zones', zoneRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/students', studentRouter);
app.use('/api/v1/volunteers', volunteerRouter);

// 8. Health Check Endpoints
// Standard System Health Check
app.get('/health', (req: Request, res: Response) => {
  ResponseFormatter.success(
    res,
    {
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    'Server is healthy'
  );
});

// Database Connection Health Check
app.get('/health/database', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      throw ApiError.internal('Database connection check failed');
    }
    ResponseFormatter.success(res, { connected: true }, 'Database connection is healthy');
  } catch (error) {
    next(error);
  }
});

// Mail Server Connection Health Check
app.get('/health/mail', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isMailConnected = await verifyMailConnection();
    if (!isMailConnected) {
      throw ApiError.internal('Mail server connection check failed');
    }
    ResponseFormatter.success(res, { connected: true }, 'Mail server connection is healthy');
  } catch (error) {
    next(error);
  }
});

// 8. 404 Fallback for Undefined Routes
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route ${req.baseUrl} not found`));
});

// 9. Centralized Error Handler Middleware
app.use(errorHandler);

export default app;
