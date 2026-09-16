import 'dotenv/config';
import path from 'node:path';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  storageDriver: (process.env.STORAGE_DRIVER ?? 'local') as 'local' | 's3',
  storagePath: path.resolve(process.env.STORAGE_PATH ?? './storage'),
  storageEndpoint: process.env.STORAGE_ENDPOINT ?? '',
  storageBucket: process.env.STORAGE_BUCKET ?? 'quickclip',
  storageAccessKey: process.env.STORAGE_ACCESS_KEY ?? '',
  storageSecretKey: process.env.STORAGE_SECRET_KEY ?? '',
  storageRegion: process.env.STORAGE_REGION ?? 'auto',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 200),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 52_428_800),
  isTest: process.env.NODE_ENV === 'test' || process.env.VITEST === 'true',
};

export function assertProdSecrets(): void {
  if (config.nodeEnv === 'production') {
    required('JWT_SECRET');
    required('DATABASE_URL');
  }
}
