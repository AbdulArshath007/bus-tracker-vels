// ─── App Configuration ────────────────────────────────────────────────────────
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
}));

export const dbConfig = registerAs('db', () => ({
  url: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  name: process.env.DB_NAME || 'bustrack',
  user: process.env.DB_USER || 'bustrack_user',
  password: process.env.DB_PASSWORD || 'changeme',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev_secret_replace_in_prod',
  accessTtlSeconds: parseInt(process.env.JWT_ACCESS_TTL_SECONDS || '900', 10),
  refreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS || '7', 10),
}));

export const s3Config = registerAs('s3', () => ({
  bucket: process.env.S3_BUCKET || 'bustrack-attachments',
  region: process.env.S3_REGION || 'ap-south-1',
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  presignedUrlTtlSeconds: parseInt(
    process.env.PRESIGNED_URL_TTL_SECONDS || '300',
    10,
  ),
}));

export const fcmConfig = registerAs('fcm', () => ({
  serviceAccountPath:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    './firebase-service-account.json',
}));

export const throttleConfig = registerAs('throttle', () => ({
  authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '10', 10),
  authTtlMs: parseInt(process.env.THROTTLE_AUTH_TTL_MS || '900000', 10),
  globalLimit: parseInt(process.env.THROTTLE_GLOBAL_LIMIT || '200', 10),
  globalTtlMs: parseInt(process.env.THROTTLE_GLOBAL_TTL_MS || '60000', 10),
  uploadLimit: parseInt(process.env.THROTTLE_UPLOAD_LIMIT || '20', 10),
  uploadTtlMs: parseInt(process.env.THROTTLE_UPLOAD_TTL_MS || '3600000', 10),
}));

export const geoConfig = registerAs('geo', () => ({
  destinationGeofenceRadiusMetres: parseInt(
    process.env.DESTINATION_GEOFENCE_RADIUS_METRES || '150',
    10,
  ),
  busApproachingEtaMinutes: parseInt(
    process.env.BUS_APPROACHING_ETA_MINUTES || '10',
    10,
  ),
}));

export const seedConfig = registerAs('seed', () => ({
  adminEmail:
    process.env.ADMIN_EMAIL || 'admin@bustrack.vels.edu.in',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
  adminFullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
}));
