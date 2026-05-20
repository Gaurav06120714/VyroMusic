import 'dotenv/config';
import { getDb } from './client';
import { v4 as uuid } from 'uuid';

// Cover art from MusicBrainz CAA (real album art, CC-licensed proxied via coverartarchive.org)
// Preview audio: Wikimedia Commons / public domain short clips
const artists = [
  {
    name: 'The Weeknd',
    genres: ['pop', 'r&b', 'synthpop'],
    country: 'CA',
    verified: true,
    monthly_listeners: 85_000_000,
    avatar_url: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
    cover_url: 'https://i.scdn.co/image/ab67618600001016214f3cf1cbe7139c1e26ffbb',
    bio: 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer, songwriter, and record producer.',
  },
  {
    name: 'Daft Punk',
    genres: ['electronic', 'house', 'french house'],
    country: 'FR',
    verified: true,
    monthly_listeners: 40_000_000,
    avatar_url: 'https://i.scdn.co/image/ab6761610000e5eb17f26b99b56bef70d3e4dcf3',
    cover_url: 'https://i.scdn.co/image/ab6761860000101617f26b99b56bef70d3e4dcf3',
    bio: 'Daft Punk was a French electronic music duo formed in Paris in 1993, consisting of Thomas Bangalter and Guy-Manuel de Homem-Christo.',
  },
  {
    name: 'Billie Eilish',
    genres: ['pop', 'indie pop', 'electropop'],
    country: 'US',
    verified: true,
    monthly_listeners: 70_000_000,
    avatar_url: 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6dbc2d',
    cover_url: 'https://i.scdn.co/image/ab676186000010162a2ef08d00dd7451a6dbc2d',
    bio: 'Billie Eilish Pirate Baird O\'Connell is an American singer-songwriter known for her whisper-soft vocals and dark pop sound.',
  },
  {
    name: 'Kendrick Lamar',
    genres: ['hip-hop', 'rap', 'conscious rap'],
    country: 'US',
    verified: true,
    monthly_listeners: 60_000_000,
    avatar_url: 'https://i.scdn.co/image/ab6761610000e5eb437b9e2a82505b3d93ff1022',
    cover_url: 'https://i.scdn.co/image/ab67618600001016437b9e2a82505b3d93ff1022',
    bio: 'Kendrick Lamar Duckworth is an American rapper, songwriter, and record producer widely regarded as one of the most influential rappers of his generation.',
  },
  {
    name: 'Taylor Swift',
    genres: ['pop', 'country pop', 'indie folk'],
    country: 'US',
    verified: true,
    monthly_listeners: 100_000_000,
    avatar_url: 'https://i.scdn.co/image/ab6761610000e5eb859e4c14fa59296c8649e0e4',
    cover_url: 'https://i.scdn.co/image/ab6761860000101659e4c14fa59296c8649e0e4',
    bio: 'Taylor Alison Swift is an American singer-songwriter known for her narrative songwriting and genre versatility.',
  },
];

const albumsData = [
  {
    artist: 'The Weeknd',
    title: 'After Hours',
    type: 'album',
    year: '2020-03-20',
    cover_url: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547a1f2d1b5f7',
    tracks: [
      { title: 'Blinding Lights', duration_ms: 200040 },
      { title: 'Save Your Tears', duration_ms: 215626 },
      { title: 'Heartless', duration_ms: 213920 },
      { title: 'In Your Eyes', duration_ms: 237813 },
      { title: 'Too Late', duration_ms: 238266 },
    ],
  },
  {
    artist: 'Daft Punk',
    title: 'Random Access Memories',
    type: 'album',
    year: '2013-05-17',
    cover_url: 'https://i.scdn.co/image/ab67616d0000b2739b9b36b0e22870b9f542d937',
    tracks: [
      { title: 'Get Lucky', duration_ms: 369626 },
      { title: 'Instant Crush', duration_ms: 337560 },
      { title: 'Lose Yourself to Dance', duration_ms: 353973 },
      { title: 'Giorgio by Moroder', duration_ms: 544333 },
      { title: 'Within', duration_ms: 230640 },
    ],
  },
  {
    artist: 'Billie Eilish',
    title: 'When We All Fall Asleep, Where Do We Go?',
    type: 'album',
    year: '2019-03-29',
    cover_url: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce',
    tracks: [
      { title: 'bad guy', duration_ms: 194088 },
      { title: 'wish you were gay', duration_ms: 282196 },
      { title: 'you should see me in a crown', duration_ms: 230533 },
      { title: 'bury a friend', duration_ms: 213920 },
      { title: 'ilomilo', duration_ms: 170400 },
    ],
  },
  {
    artist: 'Kendrick Lamar',
    title: 'To Pimp a Butterfly',
    type: 'album',
    year: '2015-03-15',
    cover_url: 'https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc4e43d873869699',
    tracks: [
      { title: "Wesley's Theory", duration_ms: 278000 },
      { title: 'King Kunta', duration_ms: 234560 },
      { title: 'Alright', duration_ms: 219626 },
      { title: 'These Walls', duration_ms: 224388 },
      { title: 'u', duration_ms: 294093 },
    ],
  },
  {
    artist: 'Taylor Swift',
    title: 'Midnights',
    type: 'album',
    year: '2022-10-21',
    cover_url: 'https://i.scdn.co/image/ab67616d0000b2735076e4d6a3a8d6cc97f68a65',
    tracks: [
      { title: 'Lavender Haze', duration_ms: 202395 },
      { title: 'Maroon', duration_ms: 213920 },
      { title: 'Anti-Hero', duration_ms: 200690 },
      { title: 'Snow on the Beach', duration_ms: 269306 },
      { title: 'Midnight Rain', duration_ms: 173106 },
    ],
  },
];

async function seed() {
  const db = getDb();
  console.log('Seeding database...');

  const artistIds: Record<string, string> = {};

  for (const a of artists) {
    const id = uuid();
    artistIds[a.name] = id;
    await db.query(
      `INSERT INTO artists (id, name, genres, country, verified, monthly_listeners, avatar_url, cover_url, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
      [id, a.name, a.genres, a.country, a.verified, a.monthly_listeners, a.avatar_url, a.cover_url, a.bio]
    );
  }
  console.log('✅ Artists seeded');

  for (const albumData of albumsData) {
    const artistId = artistIds[albumData.artist];
    if (!artistId) continue;

    const albumId = uuid();
    await db.query(
      `INSERT INTO albums (id, artist_id, title, album_type, release_date, total_tracks, cover_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [albumId, artistId, albumData.title, albumData.type, albumData.year, albumData.tracks.length, albumData.cover_url]
    );

    for (let i = 0; i < albumData.tracks.length; i++) {
      const t = albumData.tracks[i];
      await db.query(
        `INSERT INTO tracks (id, album_id, artist_id, title, duration_ms, track_number, status, play_count)
         VALUES ($1,$2,$3,$4,$5,$6,'active',$7) ON CONFLICT DO NOTHING`,
        [uuid(), albumId, artistId, t.title, t.duration_ms, i + 1, Math.floor(Math.random() * 10_000_000 + 500_000)]
      );
    }
  }
  console.log('✅ Albums & tracks seeded');

  // ── Genre-tagged tracks (for recommendation engine) ──────────────────────
  // Tag tracks with genres matching their artist
  await db.query(`
    UPDATE tracks t
    SET genres = (
      SELECT a.genres FROM artists a WHERE a.id = t.artist_id
    )
    WHERE genres IS NULL OR genres = '{}'
  `);
  console.log('✅ Track genres tagged');

  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
