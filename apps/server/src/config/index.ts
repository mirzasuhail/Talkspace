import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || process.env.PUBLIC_WEB_URL || '*',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  REDIS_URL: process.env.REDIS_URL || '',
  UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024,
  PUBLIC_SERVER_URL: process.env.PUBLIC_SERVER_URL || 'http://localhost:4000',
  PUBLIC_WEB_URL: process.env.PUBLIC_WEB_URL || 'http://localhost:3000',
  SESSION_SECRET: process.env.SESSION_SECRET || 'talkspace-production-secret-key-change-me',
  ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'talkspace-images',
};


