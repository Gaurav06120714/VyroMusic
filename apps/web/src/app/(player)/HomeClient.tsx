'use client';
/**
 * HomeClient — Phase 2 personalised home page
 *
 * Sections (auth-aware):
 *  • Greeting + time of day
 *  • For You (personalised) OR Trending (guest)
 *  • New Releases (album grid)
 *  • Discover Something New (genre-diverse, auth only)
 *  • iTunes Top Charts (live from Apple)
 *  • iTunes New Releases (live from Apple)
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, TrendingUp, Disc3, Zap, Music2, Flame, ChevronRight } from 'lucide-react';
import { AlbumCard } from '@/components/catalog/AlbumCard';
import { TrackRow } from '@/components/catalog/TrackRow';
import { TrackSkeleton, CardSkeleton, HorizontalCardSkeleton } from '@/components/ui/Skeleton';
import { usePlayerStore } from '@/store/player.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import type { Track, Album } from '@vyro/types';

interface ItunesTrack {
  id: string;
  title: string;
  artistName: string;
  albumTitle: string;
  durationMs: number;
  previewUrl: string;
  coverUrl: string;
  genre: string;
  releaseDate: string;
  source: 'itunes';
}

function toPlayerTrack(t: ItunesTrack): Track {
  return {
    id: t.id,
    albumId: '',
    artistId: '',
    title: t.title,
    durationMs: t.durationMs,
    trackNumber: 0,
    explicit: false,
    isrc: null,
    hlsManifestUrl: null,
    previewUrl: t.previewUrl,
    waveformData: null,
    playCount: 0,
    likeCount: 0,
    status: 'active',
    genres: [t.genre],
    source: 'itunes',
    artist: { id: '', name: t.artistName, bio: null, avatarUrl: null, coverUrl: null, verified: false, monthlyListeners: 0, genres: [], country: null },
    album: { id: '', artistId: '', title: t.albumTitle, coverUrl: t.coverUrl, releaseDate: t.releaseDate, albumType: 'album', totalTracks: 0, label: null },
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function SectionHeader({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-vyro-400">{icon}</span>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {subtitle && <span className="text-white/25 text-sm mb-0.5 hidden sm:block">{subtitle}</span>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-white/35 hover:text-vyro-400 transition-colors font-medium"
        >
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      )}
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
  const [itunesCharts, setItunesCharts] = useState<ItunesTrack[]>([]);
  const [itunesNew, setItunesNew] = useState<ItunesTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [trendingData, newReleasesData, chartsData, itunesNewData] = await Promise.all([
          api<{ tracks: Track[] }>('/api/recommendations/trending').then(d => d.tracks),
          api<Album[]>('/api/albums/new-releases').catch(() => [] as Album[]),
          api<ItunesTrack[]>('/api/itunes/trending?limit=20').catch(() => [] as ItunesTrack[]),
          api<ItunesTrack[]>('/api/itunes/new-releases?limit=20').catch(() => [] as ItunesTrack[]),
        ]);
        setTrending(trendingData);
        setNewReleases(newReleasesData);
        setItunesCharts(chartsData);
        setItunesNew(itunesNewData);

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
    <div className="overflow-y-auto px-5 md:px-8 py-6 md:py-8 space-y-10 md:space-y-12 pb-8 animate-fadeIn">
      {/* Greeting */}
      <div className="animate-slideUp">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {greeting()}{user ? `, ${user.username}` : ''} 👋
        </h1>
        <p className="text-white/35 mt-1 text-sm">
          {user ? "Here's your personalised mix for today" : "Discover what's trending right now"}
        </p>
      </div>

      {/* For You / Trending tracks */}
      <section className="animate-slideUp" style={{ animationDelay: '60ms' }}>
        <SectionHeader
          icon={user ? <Sparkles className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          title={user ? 'For You' : 'Trending Now'}
          subtitle={user ? 'Based on your taste' : 'Most played globally'}
        />
        {loading ? <TrackSkeleton /> : (
          <div className="space-y-0.5">
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
        <section className="animate-slideUp" style={{ animationDelay: '120ms' }}>
          <SectionHeader
            icon={<Disc3 className="w-5 h-5" />}
            title="New Releases"
          />
          {loading ? <CardSkeleton count={5} /> : (
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
        <section className="animate-slideUp" style={{ animationDelay: '180ms' }}>
          <SectionHeader
            icon={<Zap className="w-5 h-5" />}
            title="Discover Something New"
            subtitle="Outside your usual genres"
          />
          {loading ? <TrackSkeleton /> : (
            <div className="space-y-0.5">
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

      {/* iTunes Top Charts */}
      {(loading || itunesCharts.length > 0) && (
        <section className="animate-slideUp" style={{ animationDelay: '240ms' }}>
          <SectionHeader
            icon={<Flame className="w-5 h-5" />}
            title="Top Charts"
            subtitle="Updated daily by Apple"
          />
          {loading ? <HorizontalCardSkeleton /> : (
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
              {itunesCharts.map((t) => {
                const pt = toPlayerTrack(t);
                const queue = itunesCharts.map(toPlayerTrack);
                return (
                  <button
                    key={t.id}
                    onClick={() => { setQueue(queue); playTrack(pt); }}
                    className="flex-shrink-0 w-36 md:w-40 group text-left snap-start"
                  >
                    <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-xl overflow-hidden mb-2.5 shadow-lg">
                      {t.coverUrl ? (
                        <Image src={t.coverUrl} alt={t.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-white/10" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <p className="text-xs text-white/40 truncate mt-0.5">{t.artistName}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* iTunes New Releases */}
      {(loading || itunesNew.length > 0) && (
        <section className="animate-slideUp" style={{ animationDelay: '300ms' }}>
          <SectionHeader
            icon={<Music2 className="w-5 h-5" />}
            title="New on iTunes"
            subtitle="Fresh drops"
          />
          {loading ? <HorizontalCardSkeleton /> : (
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
              {itunesNew.map((t) => {
                const pt = toPlayerTrack(t);
                const queue = itunesNew.map(toPlayerTrack);
                return (
                  <button
                    key={t.id}
                    onClick={() => { setQueue(queue); playTrack(pt); }}
                    className="flex-shrink-0 w-36 md:w-40 group text-left snap-start"
                  >
                    <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-xl overflow-hidden mb-2.5 shadow-lg">
                      {t.coverUrl ? (
                        <Image src={t.coverUrl} alt={t.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-white/10" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <p className="text-xs text-white/40 truncate mt-0.5">{t.artistName}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
