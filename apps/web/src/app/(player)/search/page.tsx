'use client';
import { useState, useCallback } from 'react';
import { TrackRow } from '@/components/catalog/TrackRow';
import { AlbumCard } from '@/components/catalog/AlbumCard';
import { ArtistCard } from '@/components/catalog/ArtistCard';
import { usePlayerStore } from '@/store/player.store';
import { api } from '@/lib/api';
import type { Track, Album, Artist } from '@vyro/types';

type Results = { tracks: Track[]; albums: Album[]; artists: Artist[] };

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { playTrack, setQueue, startRadio } = usePlayerStore();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await api<Results>(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch { setResults(null); }
    finally { setLoading(false); }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => search(q), 300));
  };

  return (
    <div className="p-6 space-y-8">
      {/* Search input */}
      <div className="relative max-w-2xl">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-white/30" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          autoFocus
          value={query}
          onChange={handleInput}
          placeholder="Search songs, artists, albums..."
          className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-vyro-500/50 focus:bg-white/[0.08] transition-all text-sm"
        />
        {loading && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <div className="w-4 h-4 border-2 border-vyro-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {results && (
        <div className="space-y-8">
          {results.tracks.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Songs</h2>
              <div className="space-y-1">
                {results.tracks.slice(0, 10).map((t, i) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    index={i + 1}
                    showAlbum
                    onPlay={() => { setQueue(results.tracks); playTrack(t); }}
                    onStartRadio={() => startRadio(t)}
                  />
                ))}
              </div>
            </section>
          )}

          {results.artists.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.artists.map(a => <ArtistCard key={a.id} artist={a} />)}
              </div>
            </section>
          )}

          {results.albums.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.albums.map(a => <AlbumCard key={a.id} album={a} />)}
              </div>
            </section>
          )}

          {!results.tracks.length && !results.artists.length && !results.albums.length && (
            <div className="text-center py-16 text-white/30">
              <p>No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="text-center py-16 text-white/20">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
          </svg>
          <p>Search for your favourite music</p>
        </div>
      )}
    </div>
  );
}
