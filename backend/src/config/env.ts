import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET must be defined').default('supersecret'),
  REFRESH_SECRET: z.string().min(1, 'REFRESH_SECRET must be defined').default('refreshsecret'),
  MONGODB_URI: z.string().startsWith('mongodb', 'MONGODB_URI must start with mongodb').default('mongodb://127.0.0.1:27017/inspectmate'),
  DB_NAME: z.string().default('inspectmate'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
