import { FastifyInstance } from 'fastify';
import { CatalogService } from '../services/catalog.service';
import { getDb } from '../db/client';
import { optionalAuth, requireAuth } from '../middleware/auth';

export async function catalogRoutes(app: FastifyInstance) {
  const catalog = new CatalogService(getDb());

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

  app.get('/tracks/:id/lyrics', async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const result = await db.query<{
      content: Array<{ timeMs: number; text: string }>;
      plain_text: string | null;
      language: string | null;
      synced: boolean;
    }>(
      `SELECT content, plain_text, language, synced FROM lyrics WHERE track_id = $1`,
      [id]
    );
    if (!result.rows[0]) return reply.status(404).send({ error: 'Lyrics not found' });
    const row = result.rows[0];
    return {
      trackId: id,
      lines: row.content,
      synced: row.synced,
      language: row.language,
    };
  });

  app.get('/tracks/:id/stream', { preHandler: [optionalAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = (req.user as { sub: string } | undefined)?.sub;
    const track = await catalog.getTrack(id, userId);
    if (!track) return reply.status(404).send({ error: 'Track not found' });

    const db = getDb();
    const isPremium = userId
      ? (await db.query('SELECT subscription_tier FROM users WHERE id=$1', [userId])).rows[0]?.subscription_tier !== 'free'
      : false;

    const streamUrl = isPremium
      ? (track.hlsManifestUrl || track.previewUrl)
      : track.previewUrl;

    if (!streamUrl) return reply.status(404).send({ error: 'No stream available' });

    return {
      url: streamUrl,
      manifestUrl: streamUrl, 
      token: 'preview',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      previewOnly: !isPremium,
    };
  });

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
