import 'dotenv/config';

interface Env {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  LOG_LEVEL: string;

  PORT: number;
  FRONTEND_URL: string[];   

  DATABASE_URL: string;

  REDIS_URL: string;

  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;

  PROXY_DEPTH: number;
  IP_HASH_SALT: string;

  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PREMIUM_PRICE_ID: string;
  STRIPE_FAMILY_PRICE_ID: string;
  STRIPE_STUDENT_PRICE_ID: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Required environment variable "${name}" is not set.\n` +
      `Copy apps/api/.env.example to apps/api/.env and fill in the value.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function optionalInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`[env] "${name}" must be an integer, got: "${v}"`);
  return n;
}

function parseFrontendUrl(raw: string | undefined): string[] {
  const fallback = ['http://localhost:3005'];
  if (!raw) return fallback;
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

function validateProductionConfig(parsed: Env): void {
  if (parsed.NODE_ENV !== 'production') return;

  const errors: string[] = [];

  if (parsed.JWT_SECRET.length < 32 || parsed.JWT_SECRET.includes('REPLACE')) {
    errors.push('JWT_SECRET must be a strong random secret (≥32 chars)');
  }
  if (parsed.JWT_REFRESH_SECRET.length < 32 || parsed.JWT_REFRESH_SECRET.includes('REPLACE')) {
    errors.push('JWT_REFRESH_SECRET must be a strong random secret (≥32 chars)');
  }
  if (parsed.JWT_SECRET === parsed.JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different values');
  }
  if (parsed.IP_HASH_SALT.includes('change-this-salt')) {
    errors.push('IP_HASH_SALT must be changed from the default');
  }
  if (!parsed.DATABASE_URL || parsed.DATABASE_URL.includes('localhost')) {
    errors.push('DATABASE_URL should not point to localhost in production');
  }
  if (!parsed.STRIPE_SECRET_KEY || parsed.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    errors.push('STRIPE_SECRET_KEY should be a live key (sk_live_...) in production');
  }

  if (errors.length > 0) {
    throw new Error(
      `[env] Production startup blocked — fix these issues:\n  - ${errors.join('\n  - ')}`,
    );
  }
}

function buildEnv(): Env {
  const nodeEnv = optional('NODE_ENV', 'development') as Env['NODE_ENV'];
  const isProd = nodeEnv === 'production';

  const jwtSecret = isProd ? required('JWT_SECRET') : optional('JWT_SECRET', '');
  const jwtRefreshSecret = isProd ? required('JWT_REFRESH_SECRET') : optional('JWT_REFRESH_SECRET', '');

  const parsed: Env = {
    NODE_ENV: nodeEnv,
    LOG_LEVEL: optional('LOG_LEVEL', isProd ? 'warn' : 'info'),

    PORT: optionalInt('PORT', 3006),
    FRONTEND_URL: parseFrontendUrl(process.env['FRONTEND_URL']),

    DATABASE_URL: required('DATABASE_URL'),
    REDIS_URL: optional('REDIS_URL', 'redis://localhost:6379'),

    JWT_SECRET: jwtSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,

    PROXY_DEPTH: optionalInt('PROXY_DEPTH', 1),
    IP_HASH_SALT: optional('IP_HASH_SALT', 'vyromusic-change-this-salt-in-prod'),

    STRIPE_SECRET_KEY: optional('STRIPE_SECRET_KEY', ''),
    STRIPE_WEBHOOK_SECRET: optional('STRIPE_WEBHOOK_SECRET', ''),
    STRIPE_PREMIUM_PRICE_ID: optional('STRIPE_PREMIUM_PRICE_ID', ''),
    STRIPE_FAMILY_PRICE_ID: optional('STRIPE_FAMILY_PRICE_ID', ''),
    STRIPE_STUDENT_PRICE_ID: optional('STRIPE_STUDENT_PRICE_ID', ''),
  };

  validateProductionConfig(parsed);
  return parsed;
}

export const env: Readonly<Env> = buildEnv();
