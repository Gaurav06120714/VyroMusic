'use client';
import Image from 'next/image';
import { Heart, Radio, Mic2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { usePlayerStore } from '@/store/player.store';
import { useAuthStore } from '@/store/auth.store';
import { seekAudio } from './AudioEngine';
import { formatMs } from '@/lib/utils';
import { api } from '@/lib/api';

function EqualizerBars() {
  return (
    <div className="flex items-end gap-[2px] h-3.5 shrink-0">
      <div className="equalizer-bar w-[2px] h-3 rounded-full" style={{ animationDuration: '0.6s' }} />
      <div className="equalizer-bar w-[2px] h-3.5 rounded-full" style={{ animationDuration: '0.8s' }} />
      <div className="equalizer-bar w-[2px] h-2.5 rounded-full" style={{ animationDuration: '0.7s' }} />
      <div className="equalizer-bar w-[2px] h-3.5 rounded-full" style={{ animationDuration: '0.9s' }} />
    </div>
  );
}

export function PlayerBar() {
  const {
    currentTrack, isPlaying, volume, muted, currentMs,
    shuffle, repeat, showQueue, showLyrics, playMode,
    togglePlay, next, prev, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, toggleQueue, toggleLyrics,
    startRadio,
  } = usePlayerStore();
  const user = useAuthStore(s => s.user);
  const [liked, setLiked] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !currentTrack) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    try {
      if (wasLiked) {
        await api(`/api/me/library/tracks/${currentTrack.id}`, { method: 'DELETE' });
        toast('Removed from Liked Songs', { icon: '💔' });
      } else {
        await api(`/api/me/library/tracks/${currentTrack.id}`, { method: 'POST' });
        toast.success('Added to Liked Songs');
      }
    } catch {
      setLiked(wasLiked);
    }
  };

  if (!currentTrack) return (
    <div className="h-20 border-t border-white/[0.04] flex items-center justify-center shrink-0" style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(40px)' }}>
      <p className="text-white/15 text-sm tracking-wide">Nothing playing</p>
    </div>
  );

  const durationMs = currentTrack.durationMs || 0;
  const progress = durationMs > 0 ? Math.min(currentMs / durationMs, 1) : 0;
  const elapsed = formatMs(currentMs);
  const total = formatMs(durationMs);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ms = pct * durationMs;
    seek(ms);
    seekAudio(ms);
  };

  return (
    <div
      className="h-[72px] md:h-20 border-t border-white/[0.04] flex items-center px-3 md:px-5 gap-3 md:gap-4 shrink-0 z-40"
      style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
    >
      {/* Track info — left */}
      <div className="flex items-center gap-3 w-[180px] md:w-64 min-w-0 shrink-0">
        {/* Cover art */}
        <div className="relative w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-lg overflow-hidden bg-white/5 shadow-lg shadow-black/60 ring-1 ring-white/5">
          {currentTrack.album?.coverUrl ? (
            <Image
              src={currentTrack.album.coverUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Title + artist */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isPlaying && <EqualizerBars />}
            <p className={`text-sm font-semibold truncate leading-tight ${isPlaying ? 'text-vyro-300' : 'text-white'}`}>
              {currentTrack.title}
            </p>
          </div>
          <p className="text-xs text-white/40 truncate">{currentTrack.artist?.name}</p>
        </div>

        {/* Heart — desktop only */}
        {user && (
          <button
            onClick={handleLike}
            className={`hidden md:flex shrink-0 p-1.5 rounded-full transition-all hover:scale-110 ${liked ? 'text-vyro-400' : 'text-white/20 hover:text-white/60'}`}
            title={liked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Radio badge */}
        {playMode === 'radio' && (
          <span className="hidden md:flex shrink-0 text-cyan-400/70 text-[9px] font-bold items-center gap-0.5 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">
            <Radio className="w-2.5 h-2.5" /> RADIO
          </span>
        )}
      </div>

      {/* Controls — center */}
      <div className="flex flex-col items-center flex-1 gap-1.5 min-w-0">
        <div className="flex items-center gap-4 md:gap-5">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`hidden md:block transition-all duration-150 hover:scale-110 ${shuffle ? 'text-vyro-400' : 'text-white/30 hover:text-white'}`}
            title="Shuffle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </button>

          {/* Prev */}
          <button onClick={prev} className="text-white/50 hover:text-white transition-all hover:scale-110 active:scale-95">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full btn-neon flex items-center justify-center text-white shadow-lg shadow-vyro-500/30 transition-transform active:scale-95 hover:scale-105"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button onClick={next} className="text-white/50 hover:text-white transition-all hover:scale-110 active:scale-95">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className={`hidden md:block transition-all duration-150 hover:scale-110 relative ${repeat !== 'off' ? 'text-vyro-400' : 'text-white/30 hover:text-white'}`}
            title="Repeat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4m14 0v2a4 4 0 01-4 4H3" />
            </svg>
            {repeat === 'one' && (
              <span className="absolute -top-1.5 -right-1.5 text-[7px] font-black text-vyro-400 bg-vyro-900 rounded-full w-3 h-3 flex items-center justify-center">1</span>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2.5 w-full max-w-lg md:max-w-xl">
          <span className="text-[10px] text-white/25 w-8 text-right font-mono tabular-nums hidden md:block">{elapsed}</span>
          <div
            className="progress-bar flex-1 cursor-pointer group/bar"
            onClick={handleSeek}
          >
            <div className="progress-fill transition-none" style={{ width: `${progress * 100}%` }} />
            <div className="progress-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
          <span className="text-[10px] text-white/25 w-8 font-mono tabular-nums hidden md:block">{total}</span>
        </div>
      </div>

      {/* Right controls — desktop */}
      <div className="hidden md:flex items-center gap-2.5 w-64 justify-end shrink-0">
        {/* Radio */}
        <button
          onClick={() => startRadio(currentTrack)}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${playMode === 'radio' ? 'text-cyan-400' : 'text-white/30 hover:text-cyan-400'}`}
          title="Start Radio"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Lyrics */}
        <button
          onClick={toggleLyrics}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${showLyrics ? 'text-vyro-400 bg-vyro-500/10' : 'text-white/30 hover:text-white'}`}
          title="Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Queue */}
        <button
          onClick={toggleQueue}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${showQueue ? 'text-vyro-400 bg-vyro-500/10' : 'text-white/30 hover:text-white'}`}
          title="Queue"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm10 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
          </svg>
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-white/30 hover:text-white transition-all hover:scale-110"
          >
            {muted || volume === 0 ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.146 5.146a5 5 0 010 9.708.5.5 0 01-.292-.938 4 4 0 000-7.832.5.5 0 01.292-.938z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <input
            type="range" min="0" max="1" step="0.01"
            value={muted ? 0 : volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-vyro-500 hover:h-1.5 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
