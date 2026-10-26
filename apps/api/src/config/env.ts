/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z, ZodError } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Supabase Auth and Database
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().optional(),

  // Security & Limits
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = (result.error as any).issues || (result.error as any).errors || [];
    const errorDetails = issues.map((issue: any) => `${issue.path ? issue.path.join('.') : 'field'}: ${issue.message}`).join(', ');
    console.warn(`[Config Warning] Environment validation warnings: ${errorDetails}`);
    // Provide validated defaults fallback for non-fatal execution during initial phases
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
      API_PREFIX: process.env.API_PREFIX || '/api',
      APP_URL: process.env.APP_URL || 'http://localhost:3000',
    });
  }

  return result.data;
}

export const env = parseEnv();
