import 'dotenv/config';
import { env } from './config/env.js';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

import { authRoutes }           from './routes/auth.routes';
import { catalogRoutes }        from './routes/catalog.routes';
import { libraryRoutes }        from './routes/library.routes';
import { searchRoutes }         from './routes/search.routes';
import { recommendationRoutes } from './routes/recommendation.routes';
import { socialRoutes }         from './routes/social.routes';
import { billingRoutes }        from './routes/billing.routes';
import { itunesRoutes }         from './routes/itunes.routes';
import { youtubeRoutes }        from './routes/youtube.routes';
import { getRedis }             from './services/redis.service';
import { ipRateLimit, userRateLimit, logSecurityEvent, extractClientIp } from './plugins/rate-limit';

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
  /**
   * trustProxy must match your infrastructure.
   * Single Nginx/ALB in front → 1
   * Direct (dev)              → false
   */
  trustProxy: env.PROXY_DEPTH > 0,
});

async function bootstrap() {
  // ── Security headers ──────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc:   ["'none'"],
        objectSrc:  ["'none'"],
      },
    },
  });

  // ── CORS ──────────────────────────────────────────────────────────────────
  await app.register(fastifyCors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // ── Cookie + JWT ──────────────────────────────────────────────────────────
  await app.register(fastifyCookie);

  const jwtSecret = env.JWT_SECRET;
  // JWT_SECRET validation happens in env.ts — throws in prod if unset.
  const _devFallback = 'dev-only-unsafe:' + Math.random().toString(36);
  if (!jwtSecret) app.log.warn('JWT_SECRET not set — using random dev-only key (tokens invalid after restart)');
  await app.register(fastifyJwt, {
    secret: jwtSecret || _devFallback,
    cookie: { cookieName: 'refresh_token', signed: false },
  });

  // ── Global rate limiting (Redis-backed) ───────────────────────────────────
  // 200 requests / min / IP — broad limit to catch floods before routing.
  // Stripe webhook (/billing/webhook) is intentionally exempted below.
  await app.register(fastifyRateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    redis: getRedis(),
    nameSpace: 'rl:global:',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    keyGenerator: (request) => extractClientIp(request),
    errorResponseBuilder: (_request, context) => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)}s.`,
      statusCode: 429,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
    onExceeded: (request) => {
      logSecurityEvent(app, request as Parameters<typeof logSecurityEvent>[1], 'global_rate_limit_exceeded');
    },
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(authRoutes);           // /auth/*

  // /billing — checkout and portal have strict per-user limits to prevent
  // session flooding. Webhook is exempt from rate limiting (Stripe signature
  // is the trust boundary there).
  await app.register(async (billingInstance) => {
    // Exempt /billing/webhook from rate limiting — Stripe retries on failure,
    // and rate-limiting it would cause missed webhook events.
    billingInstance.addHook('preHandler', async (req, reply) => {
      if (req.routerPath === '/billing/webhook') return; // skip for webhook
      return ipRateLimit(60, 60_000, 'billing:ip')(req, reply);
    });

    // Per-user limits on expensive Stripe operations
    billingInstance.addHook('preHandler', async (req, _reply) => {
      // attach user if JWT present (best-effort — billing routes do their own auth)
      try { await req.jwtVerify(); } catch { /* not logged in — IP limit only */ }
    });

    await billingInstance.register(billingRoutes);
  });

  await app.register(catalogRoutes);        // /tracks/*, /albums/*, /artists/*

  // /search — stricter: 30 / min / IP (search can be expensive)
  await app.register(async (searchInstance) => {
    searchInstance.addHook('preHandler', ipRateLimit(30, 60_000, 'search:ip'));
    await searchInstance.register(searchRoutes);
  });

  await app.register(libraryRoutes);        // /me/library/*, /playlists/*
  await app.register(recommendationRoutes); // /recommendations/*
  await app.register(socialRoutes);         // /me/profile, /artists/:id/follow
  await app.register(itunesRoutes, { prefix: '/itunes' });
  await app.register(youtubeRoutes);

  // ── Health (exempt from rate limiting) ───────────────────────────────────
  app.get('/health', {
    config: { rateLimit: false },
  }, async () => ({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  }));

  // ── 404 ───────────────────────────────────────────────────────────────────
  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ error: 'Route not found', statusCode: 404 });
  });

  // ── Error handler ─────────────────────────────────────────────────────────
  app.setErrorHandler((err, request, reply) => {
    if ((err.statusCode ?? 500) >= 500) {
      app.log.error({ err, path: request.url }, 'Unhandled server error');
    }
    reply.status(err.statusCode ?? 500).send({
      error: err.message ?? 'Internal Server Error',
      statusCode: err.statusCode ?? 500,
    });
  });

  const port = env.PORT;
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`🎵 Vyro Music API running on http://localhost:${port} [${env.NODE_ENV}]`);
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
