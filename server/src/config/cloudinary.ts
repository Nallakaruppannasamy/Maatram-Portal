import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

export const configureCloudinary = (): void => {
  try {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    logger.info('☁️ Cloudinary SDK configured successfully.');
  } catch (error) {
    logger.error('❌ Cloudinary configuration failed:', error);
  }
};

export { cloudinary };
