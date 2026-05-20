'use client';
/**
 * HomeClient — Phase 2 personalised home page
 *
 * Sections (auth-aware):
 *  • Greeting + time of day
 *  • For You (personalised) OR Trending (guest)
 *  • New Releases (album grid)
 *  • Discover Something New (genre-diverse, auth only)
 *  • Quick picks (top tracks row)
 */
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Disc3, Zap } from 'lucide-react';
import { AlbumCard } from '@/components/catalog/AlbumCard';
import { TrackRow } from '@/components/catalog/TrackRow';
import { usePlayerStore } from '@/store/player.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import type { Track, Album } from '@vyro/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-end gap-3 mb-5">
      <div className="flex items-center gap-2">
        <span className="text-vyro-400">{icon}</span>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {subtitle && <span className="text-white/30 text-sm mb-0.5">{subtitle}</span>}
    </div>
  );
}

function TrackSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-white/5 rounded-xl" />
      ))}
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="aspect-square bg-white/5 rounded-2xl" />
      ))}
    </div>
  );
}

export function HomeClient() {
  const user = useAuthStore(s => s.user);
  const { playTrack, setQueue, startRadio } = usePlayerStore();

  const [forYou, setForYou] = useState<Track[]>([]);
  const [trending, setTrending] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [discover, setDiscover] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [trendingData, newReleasesData] = await Promise.all([
          api<{ tracks: Track[] }>('/api/recommendations/trending').then(d => d.tracks),
          api<Album[]>('/api/albums/new-releases').catch(() => [] as Album[]),
        ]);
        setTrending(trendingData);
        setNewReleases(newReleasesData);

        if (user) {
          const [fyData, discoverData] = await Promise.all([
            api<{ tracks: Track[] }>('/api/recommendations/for-you').then(d => d.tracks).catch(() => trendingData),
            api<{ tracks: Track[] }>('/api/recommendations/discover').then(d => d.tracks).catch(() => [] as Track[]),
          ]);
          setForYou(fyData);
          setDiscover(discoverData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const mainTracks = user && forYou.length ? forYou : trending;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-12 pb-6">
      {/* Greeting */}
      <div className="fade-up">
        <h1 className="text-3xl font-bold text-white">
          {greeting()}{user ? `, ${user.username}` : ''} 👋
        </h1>
        <p className="text-white/40 mt-1 text-sm">
          {user ? 'Here\'s your personalised mix for today' : 'Discover what\'s trending right now'}
        </p>
      </div>

      {/* For You / Trending tracks */}
      <section className="fade-up">
        <SectionHeader
          icon={user ? <Sparkles className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          title={user ? 'For You' : 'Trending Now'}
          subtitle={user ? 'Based on your taste' : 'Most played globally'}
        />
        {loading ? <TrackSkeleton /> : (
          <div className="space-y-1">
            {mainTracks.slice(0, 8).map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i + 1}
                onPlay={() => { setQueue(mainTracks); playTrack(track); }}
                onStartRadio={() => startRadio(track)}
              />
            ))}
          </div>
        )}
      </section>

      {/* New Releases */}
      {(loading || newReleases.length > 0) && (
        <section className="fade-up">
          <SectionHeader
            icon={<Disc3 className="w-5 h-5" />}
            title="New Releases"
          />
          {loading ? <AlbumSkeleton /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {newReleases.slice(0, 5).map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Discover Something New (auth only) */}
      {user && (loading || discover.length > 0) && (
        <section className="fade-up">
          <SectionHeader
            icon={<Zap className="w-5 h-5" />}
            title="Discover Something New"
            subtitle="Outside your usual genres"
          />
          {loading ? <TrackSkeleton /> : (
            <div className="space-y-1">
              {discover.slice(0, 5).map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i + 1}
                  onPlay={() => { setQueue(discover); playTrack(track); }}
                  onStartRadio={() => startRadio(track)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
