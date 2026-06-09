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
  
  trustProxy: env.PROXY_DEPTH > 0,
});

async function bootstrap() {
  
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

  await app.register(fastifyCors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyCookie);

  const jwtSecret = env.JWT_SECRET;
  
  const _devFallback = 'dev-only-unsafe:' + Math.random().toString(36);
  if (!jwtSecret) app.log.warn('JWT_SECRET not set — using random dev-only key (tokens invalid after restart)');
  await app.register(fastifyJwt, {
    secret: jwtSecret || _devFallback,
    cookie: { cookieName: 'refresh_token', signed: false },
  });

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

  await app.register(authRoutes);           

  await app.register(async (billingInstance) => {
    
    billingInstance.addHook('preHandler', async (req, reply) => {
      if (req.routerPath === '/billing/webhook') return; 
      return ipRateLimit(60, 60_000, 'billing:ip')(req, reply);
    });

    billingInstance.addHook('preHandler', async (req, _reply) => {
      
      try { await req.jwtVerify(); } catch {  }
    });

    await billingInstance.register(billingRoutes);
  });

  await app.register(catalogRoutes);        

  await app.register(async (searchInstance) => {
    searchInstance.addHook('preHandler', ipRateLimit(30, 60_000, 'search:ip'));
    await searchInstance.register(searchRoutes);
  });

  await app.register(libraryRoutes);        
  await app.register(recommendationRoutes); 
  await app.register(socialRoutes);         
  await app.register(itunesRoutes, { prefix: '/itunes' });
  await app.register(youtubeRoutes);

  app.get('/health', {
    config: { rateLimit: false },
  }, async () => ({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  }));

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ error: 'Route not found', statusCode: 404 });
  });

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
