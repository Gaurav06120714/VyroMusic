'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Search, Library, User, Radio, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usePlayerStore } from '@/store/player.store';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { href: '/search', label: 'Search', icon: <Search className="w-4 h-4" /> },
  { href: '/library', label: 'Your Library', icon: <Library className="w-4 h-4" /> },
];

interface Playlist { id: string; title: string; track_count: number }
interface FollowedArtist { id: string; name: string; avatarUrl?: string }

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const { currentTrack, startRadio } = usePlayerStore();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);

  useEffect(() => {
    if (!user) return;
    api<Playlist[]>('/api/me/playlists').then(setPlaylists).catch(() => {});
    api<FollowedArtist[]>('/api/me/following/artists').then(setFollowedArtists).catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleCreatePlaylist = async () => {
    if (!user) return;
    const pl = await api('/api/me/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `My Playlist #${playlists.length + 1}` }),
    });
    setPlaylists(p => [pl as Playlist, ...p]);
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#080809] border-r border-white/[0.05]">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vyro-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-vyro-500/30">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">Vyro</span>
        <span className="text-vyro-400 text-xs font-medium">Music</span>
      </div>

      {/* Main nav */}
      <nav className="px-3 py-2 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active ? 'bg-vyro-500/20 text-vyro-400' : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        {/* Radio from current track */}
        {currentTrack && (
          <button
            onClick={() => startRadio(currentTrack)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all"
          >
            <Radio className="w-4 h-4" />
            Go to Radio
          </button>
        )}
      </nav>

      {/* Playlists */}
      <div className="flex-1 overflow-y-auto px-3 py-2 mt-1">
        <div className="flex items-center justify-between px-3 py-1.5 mb-1">
          <p className="text-[11px] text-white/25 uppercase tracking-widest font-semibold">Playlists</p>
          {user && (
            <button onClick={handleCreatePlaylist} className="text-white/25 hover:text-white/60 transition-colors" title="New playlist">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!user ? (
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-white/40 mb-3">Create playlists and like songs</p>
            <Link href="/login" className="block text-center py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors">
              Log in
            </Link>
          </div>
        ) : playlists.length === 0 ? (
          <p className="px-3 text-xs text-white/20 py-2">No playlists yet</p>
        ) : (
          <div className="space-y-0.5">
            {playlists.map(pl => (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className={`block px-3 py-2 rounded-xl text-sm transition-colors truncate ${
                  pathname === `/playlist/${pl.id}` ? 'text-white bg-white/[0.07]' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {pl.title}
              </Link>
            ))}
          </div>
        )}

        {/* Followed artists */}
        {followedArtists.length > 0 && (
          <>
            <div className="px-3 pt-5 pb-1.5">
              <p className="text-[11px] text-white/25 uppercase tracking-widest font-semibold">Following</p>
            </div>
            <div className="space-y-0.5">
              {followedArtists.slice(0, 5).map(a => (
                <Link
                  key={a.id}
                  href={`/artist/${a.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-white/10 shrink-0 overflow-hidden">
                    {a.avatarUrl && <img src={a.avatarUrl} alt={a.name} className="w-full h-full object-cover" />}
                  </div>
                  <span className="truncate">{a.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User section */}
      {user ? (
        <div className="p-3 border-t border-white/[0.05]">
          <Link href="/profile" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] cursor-pointer group transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vyro-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getInitials(user.username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-white/40 capitalize">{user.subscriptionTier}</p>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); handleLogout(); }}
              className="text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all"
              title="Log out"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </Link>
        </div>
      ) : (
        <div className="p-3 border-t border-white/[0.05]">
          <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/50 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors">
            <User className="w-4 h-4" />
            Log in
          </Link>
        </div>
      )}
    </aside>
  );
}
