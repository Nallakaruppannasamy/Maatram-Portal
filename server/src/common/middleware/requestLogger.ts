import morgan from 'morgan';
import { logger } from '@/config/logger';

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

const format = ':remote-addr :method :url :status :res[content-length] - :response-time ms';

export const requestLogger = morgan(format, { stream, skip });
