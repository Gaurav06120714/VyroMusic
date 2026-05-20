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

// Cycling through 17 SoundHelix public-domain MP3s
const PREVIEW_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3',
];

let previewUrlIndex = 0;
function nextPreviewUrl(): string {
  return PREVIEW_URLS[previewUrlIndex++ % PREVIEW_URLS.length];
}

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
        `INSERT INTO tracks (id, album_id, artist_id, title, duration_ms, track_number, status, play_count, preview_url)
         VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8) ON CONFLICT DO NOTHING`,
        [uuid(), albumId, artistId, t.title, t.duration_ms, i + 1, Math.floor(Math.random() * 10_000_000 + 500_000), nextPreviewUrl()]
      );
    }
  }
  console.log('✅ Albums & tracks seeded');

  // ── Lyrics (LRC-style synced lyrics for select tracks) ───────────────────
  // Fetch track IDs by title so we can attach lyrics
  const lyricsData: Array<{
    title: string;
    language: string;
    lines: Array<{ timeMs: number; text: string }>;
  }> = [
    {
      title: 'Blinding Lights',
      language: 'en',
      lines: [
        { timeMs: 3200,  text: "I've been tryna call" },
        { timeMs: 7800,  text: "I've been on my own for long enough" },
        { timeMs: 12400, text: "Maybe you can show me how to love, maybe" },
        { timeMs: 17000, text: "I'm going through withdrawals" },
        { timeMs: 21600, text: "You don't even have to do too much" },
        { timeMs: 26200, text: "You can turn me on with just a touch, baby" },
        { timeMs: 31000, text: "I look around and" },
        { timeMs: 33800, text: "Sin City's cold and empty" },
        { timeMs: 38400, text: "No one's around to judge me" },
        { timeMs: 43000, text: "I can't see clearly when you're gone" },
        { timeMs: 49000, text: "I said, ooh, I'm blinded by the lights" },
        { timeMs: 54600, text: "No, I can't sleep until I feel your touch" },
        { timeMs: 60200, text: "I said, ooh, I'm drowning in the night" },
        { timeMs: 65800, text: "Oh, when I'm like this, you're the one I trust" },
        { timeMs: 71400, text: "Hey, hey, hey" },
        { timeMs: 90000, text: "I'm running out of time" },
        { timeMs: 94600, text: "'Cause I can see the sun light up the sky" },
        { timeMs: 99200, text: "So I hit the road in overdrive, baby" },
        { timeMs: 103800, text: "Oh, the city's cold and empty" },
        { timeMs: 108400, text: "No one's around to judge me" },
        { timeMs: 113000, text: "I can't see clearly when you're gone" },
        { timeMs: 119000, text: "I said, ooh, I'm blinded by the lights" },
        { timeMs: 124600, text: "No, I can't sleep until I feel your touch" },
        { timeMs: 130200, text: "I said, ooh, I'm drowning in the night" },
        { timeMs: 135800, text: "Oh, when I'm like this, you're the one I trust" },
        { timeMs: 155000, text: "I'm just walking by to let you know" },
        { timeMs: 159600, text: "I need to be with you" },
        { timeMs: 164200, text: "Hey, hey, hey" },
        { timeMs: 170000, text: "I said, ooh, I'm blinded by the lights" },
        { timeMs: 175600, text: "No, I can't sleep until I feel your touch" },
      ],
    },
    {
      title: 'bad guy',
      language: 'en',
      lines: [
        { timeMs: 1000,  text: "White shirt now red, my bloody nose" },
        { timeMs: 5400,  text: "Sleeping, you're on your tippy toes" },
        { timeMs: 9800,  text: "Creeping around like no one knows" },
        { timeMs: 14200, text: "Think you're so criminal" },
        { timeMs: 18600, text: "Bruises on both my knees for you" },
        { timeMs: 23000, text: "Don't say thank you or please" },
        { timeMs: 27400, text: "I do what I want when I'm wanting to" },
        { timeMs: 31800, text: "My soul, so cynical" },
        { timeMs: 36200, text: "So you're a tough guy" },
        { timeMs: 40600, text: "Like it really rough guy" },
        { timeMs: 45000, text: "Just can't get enough guy" },
        { timeMs: 49400, text: "Chest always so puffed guy" },
        { timeMs: 53800, text: "I'm that bad type" },
        { timeMs: 58200, text: "Make your mama sad type" },
        { timeMs: 62600, text: "Make your girlfriend mad tight" },
        { timeMs: 67000, text: "Might seduce your dad type" },
        { timeMs: 71400, text: "I'm the bad guy, duh" },
        { timeMs: 79800, text: "I'm the bad guy" },
        { timeMs: 86000, text: "I like it when you take control" },
        { timeMs: 90400, text: "Even if you know that you don't" },
        { timeMs: 94800, text: "Own me, I'll let you play the role" },
        { timeMs: 99200, text: "I'll be your animal" },
        { timeMs: 103600, text: "My mommy likes to sing along with me" },
        { timeMs: 108000, text: "But she won't sing this song" },
        { timeMs: 112400, text: "If she reads all the lyrics" },
        { timeMs: 116800, text: "She'll pity the men I know" },
        { timeMs: 121200, text: "So you're a tough guy" },
        { timeMs: 125600, text: "Like it really rough guy" },
        { timeMs: 130000, text: "Just can't get enough guy" },
        { timeMs: 134400, text: "I'm the bad guy, duh" },
      ],
    },
    {
      title: 'Anti-Hero',
      language: 'en',
      lines: [
        { timeMs: 4000,  text: "I have this thing where I get older but just never wiser" },
        { timeMs: 11200, text: "Midnights become my afternoons" },
        { timeMs: 18400, text: "When my depression works the graveyard shift" },
        { timeMs: 25600, text: "All of the people I've ghosted stand there in the room" },
        { timeMs: 32800, text: "I should not be left to my own devices" },
        { timeMs: 40000, text: "They come with prices and vices" },
        { timeMs: 47200, text: "I end up in crisis (tale as old as time)" },
        { timeMs: 54400, text: "I wake up screaming from dreaming" },
        { timeMs: 61600, text: "One day I'll watch as you're leaving" },
        { timeMs: 68800, text: "'Cause you got tired of my scheming" },
        { timeMs: 76000, text: "(For the last time)" },
        { timeMs: 80000, text: "It's me, hi, I'm the problem, it's me" },
        { timeMs: 87200, text: "At teatime, everybody agrees" },
        { timeMs: 94400, text: "I'll stare directly at the sun but never in the mirror" },
        { timeMs: 101600, text: "It must be exhausting always rooting for the anti-hero" },
        { timeMs: 112000, text: "Sometimes I feel like everybody is a sexy baby" },
        { timeMs: 119200, text: "And I'm a monster on the hill" },
        { timeMs: 126400, text: "Too big to hang out, slowly lurching toward your favorite city" },
        { timeMs: 133600, text: "Piercing and froze that dumbstruck hill" },
        { timeMs: 140800, text: "I have this dream my daughter-in-law kills me for the money" },
        { timeMs: 148000, text: "She thinks I left them in the will" },
        { timeMs: 155200, text: "The family gathers 'round and reads it" },
        { timeMs: 162400, text: "And then someone screams out 'she's laughing up at us from hell'" },
        { timeMs: 169600, text: "It's me, hi, I'm the problem, it's me" },
        { timeMs: 176800, text: "At teatime, everybody agrees" },
        { timeMs: 184000, text: "I'll stare directly at the sun but never in the mirror" },
        { timeMs: 191200, text: "It must be exhausting always rooting for the anti-hero" },
      ],
    },
  ];

  for (const lyric of lyricsData) {
    const trackRes = await db.query<{ id: string }>(
      `SELECT id FROM tracks WHERE title = $1 LIMIT 1`,
      [lyric.title]
    );
    if (!trackRes.rows[0]) continue;
    const trackId = trackRes.rows[0].id;

    const plainText = lyric.lines.map(l => l.text).join('\n');
    await db.query(
      `INSERT INTO lyrics (track_id, provider, content, plain_text, language, synced, fetched_at)
       VALUES ($1, 'seed', $2, $3, $4, true, NOW())
       ON CONFLICT (track_id) DO UPDATE
         SET content = EXCLUDED.content,
             plain_text = EXCLUDED.plain_text,
             synced = EXCLUDED.synced`,
      [trackId, JSON.stringify(lyric.lines), plainText, lyric.language]
    );
  }
  console.log('✅ Lyrics seeded');

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
