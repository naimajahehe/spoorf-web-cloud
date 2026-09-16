import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'node:path';

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  JWT_PRIVATE_KEY_PATH: z.string().default('./keys/license-private.pem'),
  JWT_PUBLIC_KEY_PATH: z.string().default('./keys/license-public.pem'),
  JWT_ISSUER: z.string().default('https://api.spoorf.app'),

  MIDTRANS_SERVER_KEY: z.string().default('SB-Mid-server-demo'),
  MIDTRANS_CLIENT_KEY: z.string().default('SB-Mid-client-demo'),
  MIDTRANS_IS_PRODUCTION: z.coerce.boolean().default(false),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ [Config] Fatal Error: Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadConfig();
export type EnvConfig = z.infer<typeof envSchema>;