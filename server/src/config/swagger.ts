import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/config/env';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Maatram Foundation Student & Volunteer Management System API',
    version: '1.0.0',
    description: 'Enterprise Student Information System (SIS) Backend API foundation docs.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Server Health Check',
        responses: {
          200: {
            description: 'Uptime and status check',
          },
        },
      },
    },
    '/health/database': {
      get: {
        summary: 'Database Connectivity Check',
        responses: {
          200: {
            description: 'Database is connected',
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
