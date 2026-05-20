'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Play, Shuffle, UserPlus, UserCheck, Radio } from 'lucide-react';
import { TrackRow } from '@/components/catalog/TrackRow';
import { AlbumCard } from '@/components/catalog/AlbumCard';
import { usePlayerStore } from '@/store/player.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import type { Artist, Track, Album } from '@vyro/types';

interface Props {
  artistId: string;
  artist: Artist;
  tracks: Track[];
  albums: Album[];
}

export function ArtistClient({ artistId, artist, tracks, albums }: Props) {
  const { playTrack, setQueue, startRadio } = usePlayerStore();
  const user = useAuthStore(s => s.user);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(artist.followerCount ?? 0);

  useEffect(() => {
    if (!user) return;
    api<{ following: boolean }>(`/api/artists/${artistId}/follow`).then((d) => {
      setFollowing(d.following);
    }).catch(() => {});
  }, [artistId, user]);

  const toggleFollow = async () => {
    if (!user) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount(c => wasFollowing ? c - 1 : c + 1);
    try {
      await api(`/api/artists/${artistId}/follow`, {
        method: wasFollowing ? 'DELETE' : 'POST',
      });
    } catch {
      setFollowing(wasFollowing);
      setFollowerCount(c => wasFollowing ? c + 1 : c - 1);
    }
  };

  const playAll = (shuffle = false) => {
    const list = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    if (!list.length) return;
    setQueue(list);
    playTrack(list[0]);
  };

  return (
    <div className="pb-8">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        {artist.coverUrl || artist.avatarUrl ? (
          <Image
            src={artist.coverUrl || artist.avatarUrl!}
            alt={artist.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-vyro-800 to-cyan-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          {artist.verified && (
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-cyan-400 text-xs font-semibold">Verified Artist</span>
            </div>
          )}
          <h1 className="text-5xl font-bold text-white mb-2">{artist.name}</h1>
          <p className="text-white/50 text-sm">
            {formatNumber(artist.monthlyListeners)} monthly listeners
            {followerCount > 0 && ` · ${formatNumber(followerCount)} followers`}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-8 mt-6 flex items-center gap-4">
        <button
          onClick={() => playAll(false)}
          className="btn-neon flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold"
        >
          <Play className="w-4 h-4 fill-current" />
          Play
        </button>
        <button
          onClick={() => playAll(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all text-sm"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </button>
        {tracks[0] && (
          <button
            onClick={() => startRadio(tracks[0])}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-cyan-400/30 text-cyan-400/70 hover:text-cyan-400 hover:border-cyan-400/60 transition-all text-sm"
          >
            <Radio className="w-4 h-4" />
            Radio
          </button>
        )}
        {user && (
          <button
            onClick={toggleFollow}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-all ml-auto ${
              following
                ? 'border-vyro-500 text-vyro-400 hover:border-red-400/50 hover:text-red-400'
                : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
            }`}
          >
            {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <div className="px-8 mt-8 space-y-10">
        {/* Popular tracks */}
        {tracks.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Popular</h2>
            <div className="space-y-1">
              {tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i + 1}
                  onPlay={() => { setQueue(tracks); playTrack(track); }}
                  onStartRadio={() => startRadio(track)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Discography */}
        {albums.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Discography</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map(album => <AlbumCard key={album.id} album={album} />)}
            </div>
          </section>
        )}

        {/* Bio */}
        {artist.bio && (
          <section>
            <h2 className="text-xl font-bold text-white mb-3">About</h2>
            <p className="text-white/60 leading-relaxed max-w-2xl">{artist.bio}</p>
          </section>
        )}
      </div>
    </div>
  );
}
