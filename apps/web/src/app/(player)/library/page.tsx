'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Play, Shuffle } from 'lucide-react';
import { TrackRow } from '@/components/catalog/TrackRow';
import { useAuthStore } from '@/store/auth.store';
import { usePlayerStore } from '@/store/player.store';
import { api } from '@/lib/api';
import type { Track } from '@vyro/types';

export default function LibraryPage() {
  const user = useAuthStore(s => s.user);
  const { playTrack, setQueue, startRadio } = usePlayerStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<Track[]>('/api/me/library/tracks')
      .then(setTracks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl">🎵</div>
      <h2 className="text-2xl font-bold text-white">Your Library</h2>
      <p className="text-white/40 text-center max-w-xs">Create an account to save your liked songs and playlists.</p>
      <Link href="/login" className="btn-neon text-white px-6 py-2.5 rounded-full text-sm font-semibold">Get started</Link>
    </div>
  );

  const playAll = (shuffle = false) => {
    const list = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    if (!list.length) return;
    setQueue(list);
    playTrack(list[0]);
  };

  return (
    <div className="p-6 pb-8">
      {/* Header */}
      <div className="flex items-end gap-6 mb-8">
        <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-vyro-600 to-cyan-600 flex items-center justify-center shadow-2xl shrink-0">
          <Heart className="w-14 h-14 text-white fill-white" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Playlist</p>
          <h1 className="text-4xl font-bold text-white mb-2">Liked Songs</h1>
          <p className="text-white/40 text-sm">{tracks.length} songs</p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => playAll(false)}
              className="btn-neon flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
              disabled={!tracks.length}
            >
              <Play className="w-4 h-4 fill-current" /> Play
            </button>
            <button
              onClick={() => playAll(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 text-white/60 hover:text-white text-sm transition-all"
              disabled={!tracks.length}
            >
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Songs you like will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i + 1}
              showAlbum
              onPlay={() => { setQueue(tracks); playTrack(track); }}
              onStartRadio={() => startRadio(track)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
