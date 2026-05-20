import { FastifyInstance } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';
import { optionalAuth } from '../middleware/auth';

const execAsync = promisify(exec);
const YTDLP = '/opt/homebrew/bin/yt-dlp';

// Cache: track query → { url, expires }
const urlCache = new Map<string, { url: string; expires: number }>();

const SONG_OVERRIDES: Record<string, string> = {
  'orange army virendra patidar': 'Orange Army Virendra Patidar SRH',
  'orange army': 'Orange Army Virendra Patidar SRH',
};

function buildYtQuery(query: string): string {
  const lower = query.toLowerCase().trim();
  const override = Object.keys(SONG_OVERRIDES).find(k => lower.includes(k));
  return override ? SONG_OVERRIDES[override] : query.trim();
}

async function getYouTubeStreamUrl(query: string): Promise<string | null> {
  const key = query.toLowerCase().trim();
  const cached = urlCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.url;

  const ytQuery = buildYtQuery(query);

  try {
    // Use spawn-style args to avoid shell quoting issues entirely
    const { stdout } = await execAsync(
      `${YTDLP} "ytsearch1:${ytQuery.replace(/"/g, '')}" -f "bestaudio[ext=webm]/251/250/bestaudio" --get-url --no-playlist --no-warnings --quiet`,
      { timeout: 25000 }
    );
    const url = stdout.trim().split('\n')[0];
    if (!url || !url.startsWith('http')) return null;

    // Cache for 5 hours (YouTube signed URLs last ~6h)
    urlCache.set(key, { url, expires: Date.now() + 5 * 60 * 60 * 1000 });
    return url;
  } catch {
    return null;
  }
}

export async function youtubeRoutes(app: FastifyInstance) {
  // GET /youtube/stream?q=Levitating+Dua+Lipa
  app.get('/youtube/stream', { preHandler: [optionalAuth] }, async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q) return reply.status(400).send({ error: 'Missing query param q' });

    const url = await getYouTubeStreamUrl(q);
    if (!url) return reply.status(404).send({ error: 'Could not find stream' });

    // Redirect browser directly to YouTube CDN — no proxying needed
    return reply.redirect(url);
  });

  // GET /youtube/url?q=... — returns the URL as JSON (for AudioEngine)
  app.get('/youtube/url', { preHandler: [optionalAuth] }, async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q) return reply.status(400).send({ error: 'Missing query param q' });

    const url = await getYouTubeStreamUrl(q);
    if (!url) return reply.status(404).send({ error: 'Could not find stream' });

    return { url, source: 'youtube' };
  });
}
