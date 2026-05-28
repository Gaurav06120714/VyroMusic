import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { AuthService } from '../services/auth.service';
import { getDb } from '../db/client';
import {
  loginRateLimit,
  ipRateLimit,
  botCheck,
  recordLoginFailure,
  recordLoginSuccess,
} from '../plugins/rate-limit';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(getDb());

  // ── POST /auth/register ──────────────────────────────────────────────────────
  // 3 / hr / IP + bot check
  app.post('/auth/register', {
    preHandler: [
      botCheck(),
      ipRateLimit(3, 60 * 60_000, 'auth:register'),
    ],
  }, async (req, reply) => {
    const { email, username, password } = req.body as {
      email: string; username: string; password: string;
    };
    if (!email || !username || !password) {
      return reply.status(400).send({ error: 'Missing fields' });
    }
    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    try {
      const user = await authService.register(email, username, password);
      const accessToken = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
      const refreshToken = crypto.randomBytes(64).toString('hex');
      const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await authService.saveRefreshToken(
        user.id, refreshHash, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      );

      reply.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          subscriptionTier: user.subscription_tier,
        },
      };
    } catch (err) {
      reply.status(409).send({ error: (err as Error).message });
    }
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────────
  // 5 / 15 min / IP  +  3 / 15 min / email  +  progressive lockout
  app.post('/auth/login', {
    preHandler: [loginRateLimit()],
  }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return reply.status(400).send({ error: 'Missing fields' });

    try {
      const user = await authService.login(email, password);

      // Successful login — clear failure counters
      await recordLoginSuccess(req, email);

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
      const refreshToken = crypto.randomBytes(64).toString('hex');
      const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await authService.saveRefreshToken(
        user.id, refreshHash, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      );

      reply.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return { accessToken, user };
    } catch {
      // Record the failure against both IP and email for progressive lockout
      await recordLoginFailure(req, email);
      reply.status(401).send({ error: 'Invalid credentials' });
    }
  });

  // ── POST /auth/refresh ───────────────────────────────────────────────────────
  // 10 / min / IP — prevent refresh token brute-force
  app.post('/auth/refresh', {
    preHandler: [ipRateLimit(10, 60_000, 'auth:refresh')],
  }, async (req, reply) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return reply.status(401).send({ error: 'No refresh token' });

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const userId = await authService.validateRefreshToken(hash);
    if (!userId) return reply.status(401).send({ error: 'Invalid or expired refresh token' });

    const user = await authService.getUserById(userId);
    if (!user) return reply.status(401).send({ error: 'User not found' });

    // Rotate refresh token (one-time use)
    await authService.revokeRefreshToken(hash);
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await authService.saveRefreshToken(
      userId, newHash, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    const accessToken = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });

    reply.setCookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscription_tier,
      },
    };
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────────
  app.post('/auth/logout', async (req, reply) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await authService.revokeRefreshToken(hash);
    }
    reply.clearCookie('refresh_token', { path: '/' });
    return { ok: true };
  });

  // ── GET /auth/me ─────────────────────────────────────────────────────────────
  app.get('/auth/me', {
    preHandler: [async (req, reply) => {
      try { await req.jwtVerify(); }
      catch { reply.status(401).send({ error: 'Unauthorized' }); }
    }],
  }, async (req) => {
    const payload = req.user as { sub: string };
    return authService.getUserById(payload.sub);
  });
}
