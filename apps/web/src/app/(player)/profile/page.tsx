'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Music, Headphones, ListMusic, Users, BarChart3, Crown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatNumber, getInitials } from '@/lib/utils';

interface Profile {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  subscriptionTier: string;
  createdAt: string;
  stats: {
    likedTracks: number;
    totalPlays: number;
    playlists: number;
    following: number;
  };
}

interface GenreStat { genre: string; plays: number }
interface ArtistStat { id: string; name: string; avatarUrl?: string; verified: boolean; plays: number }

const TIER_COLORS: Record<string, string> = {
  free: 'text-white/40',
  premium: 'text-yellow-400',
  family: 'text-cyan-400',
  student: 'text-green-400',
};

export default function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [genres, setGenres] = useState<GenreStat[]>([]);
  const [topArtists, setTopArtists] = useState<ArtistStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    Promise.all([
      api<Profile>('/api/me/profile'),
      api<GenreStat[]>('/api/me/stats/genres').catch(() => [] as GenreStat[]),
      api<ArtistStat[]>('/api/me/stats/artists').catch(() => [] as ArtistStat[]),
    ]).then(([p, g, a]) => {
      setProfile(p);
      setGenres(g);
      setTopArtists(a);
    }).finally(() => setLoading(false));
  }, [user, router]);

  if (loading || !profile) {
    return (
      <div className="flex-1 p-8 space-y-6 animate-pulse">
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const maxPlays = Math.max(...genres.map(g => g.plays), 1);

  return (
    <div className="flex-1 overflow-y-auto pb-8">
      {/* Hero */}
      <div className="relative px-8 pt-10 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-vyro-900/30 to-transparent pointer-events-none" />
        <div className="relative flex items-end gap-6">
          {/* Avatar */}
          <div className="relative w-32 h-32 shrink-0 rounded-full overflow-hidden border-4 border-white/10 bg-gradient-to-br from-vyro-500 to-cyan-500 flex items-center justify-center shadow-2xl">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.username} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-white text-3xl font-bold">{getInitials(profile.username)}</span>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-vyro-400 uppercase tracking-widest mb-1">Profile</p>
            <h1 className="text-4xl font-bold text-white mb-2">{profile.username}</h1>
            {profile.bio && <p className="text-white/50 text-sm mb-2">{profile.bio}</p>}
            <div className="flex items-center gap-3 text-sm">
              <span className={`flex items-center gap-1 font-semibold capitalize ${TIER_COLORS[profile.subscriptionTier]}`}>
                <Crown className="w-3.5 h-3.5" />
                {profile.subscriptionTier}
              </span>
              {profile.country && <span className="text-white/30">• {profile.country}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Music className="w-5 h-5" />, label: 'Liked Songs', value: profile.stats.likedTracks },
            { icon: <Headphones className="w-5 h-5" />, label: 'Total Plays', value: profile.stats.totalPlays },
            { icon: <ListMusic className="w-5 h-5" />, label: 'Playlists', value: profile.stats.playlists },
            { icon: <Users className="w-5 h-5" />, label: 'Following', value: profile.stats.following },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-2xl p-5">
              <div className="text-vyro-400 mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-white">{formatNumber(stat.value)}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Genre breakdown */}
          {genres.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-5 h-5 text-vyro-400" />
                <h2 className="text-lg font-bold text-white">Top Genres (30 days)</h2>
              </div>
              <div className="space-y-3">
                {genres.map(g => (
                  <div key={g.genre}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white capitalize">{g.genre}</span>
                      <span className="text-white/40">{g.plays} plays</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-vyro-500 to-cyan-500 transition-all duration-700"
                        style={{ width: `${(g.plays / maxPlays) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top artists */}
          {topArtists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <User className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Top Artists (30 days)</h2>
              </div>
              <div className="space-y-3">
                {topArtists.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 hover:bg-white/5 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                    <span className="text-white/20 text-sm w-4 shrink-0">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vyro-500/30 to-cyan-500/30 overflow-hidden shrink-0">
                      {a.avatarUrl && (
                        <Image src={a.avatarUrl} alt={a.name} width={40} height={40} className="object-cover" unoptimized />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.name}</p>
                      <p className="text-xs text-white/40">{a.plays} plays</p>
                    </div>
                    {a.verified && (
                      <svg className="w-4 h-4 text-vyro-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* No data message */}
        {genres.length === 0 && topArtists.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Headphones className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No listening data yet</p>
            <p className="text-sm mt-1">Start playing music to see your stats here</p>
          </div>
        )}
      </div>
    </div>
  );
}
