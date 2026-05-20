import { FastifyInstance } from 'fastify';
import { CatalogService } from '../services/catalog.service';
import { getDb } from '../db/client';
import { optionalAuth, requireAuth } from '../middleware/auth';

export async function catalogRoutes(app: FastifyInstance) {
  const catalog = new CatalogService(getDb());

  // ── Tracks ────────────────────────────────────────────────────────────────

  app.get('/tracks/trending', async () => {
    return catalog.getTopTracks(20);
  });

  app.get('/tracks/:id', { preHandler: [optionalAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = (req.user as { sub: string } | undefined)?.sub;
    const track = await catalog.getTrack(id, userId);
    if (!track) return reply.status(404).send({ error: 'Track not found' });
    return track;
  });

  // Stream token — returns signed CloudFront URL (or preview URL)
  app.get('/tracks/:id/stream', { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = (req.user as { sub: string }).sub;
    const track = await catalog.getTrack(id, userId);
    if (!track) return reply.status(404).send({ error: 'Track not found' });

    // In production: generate signed CloudFront URL
    // For MVP/dev: return the direct HLS URL (or preview for free tier)
    const db = getDb();
    const userResult = await db.query('SELECT subscription_tier FROM users WHERE id=$1', [userId]);
    const isPremium = userResult.rows[0]?.subscription_tier !== 'free';

    if (!isPremium && track.hlsManifestUrl) {
      return {
        manifestUrl: track.previewUrl || track.hlsManifestUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        previewOnly: true,
      };
    }

    return {
      manifestUrl: track.hlsManifestUrl || track.previewUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      previewOnly: !isPremium,
    };
  });

  // ── Albums ────────────────────────────────────────────────────────────────

  app.get('/albums/new-releases', async () => {
    return catalog.getNewReleases(20);
  });

  app.get('/albums/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const album = await catalog.getAlbum(id);
    if (!album) return reply.status(404).send({ error: 'Album not found' });
    return album;
  });

  app.get('/albums/:id/tracks', { preHandler: [optionalAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const userId = (req.user as { sub: string } | undefined)?.sub;
    return catalog.getTracksByAlbum(id, userId);
  });

  // ── Artists ───────────────────────────────────────────────────────────────

  app.get('/artists/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const artist = await catalog.getArtist(id);
    if (!artist) return reply.status(404).send({ error: 'Artist not found' });
    return artist;
  });

  app.get('/artists/:id/albums', async (req) => {
    const { id } = req.params as { id: string };
    return catalog.getArtistAlbums(id);
  });

  app.get('/artists/:id/top-tracks', { preHandler: [optionalAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const userId = (req.user as { sub: string } | undefined)?.sub;
    return catalog.getArtistTopTracks(id, userId);
  });
}
