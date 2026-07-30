import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('587'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM_EMAIL: z.string().email().default('no-reply@maatram.org'),
  SMTP_FROM_NAME: z.string().default('Maatram Foundation'),

  SWAGGER_USER: z.string().default('admin'),
  SWAGGER_PASSWORD: z.string().default('admin'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  process.stderr.write(
    `❌ Environment validation failed:\n${JSON.stringify(parsedEnv.error.format(), null, 2)}\n`
  );
  process.exit(1);
}

export const env = parsedEnv.data;
