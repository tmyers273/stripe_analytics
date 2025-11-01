import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z
    .string()
    .min(16, 'SESSION_SECRET must be at least 16 characters')
    .default('dev-session-secret-change-me'),
  SESSION_COOKIE_NAME: z.string().default('sa_session'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  SESSION_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  REDIS_URL: z.string().url().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_LOGIN: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_MAX_REGISTER: z.coerce.number().int().positive().default(5),
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.parse(process.env);
  cachedConfig = parsed;
  return parsed;
}
