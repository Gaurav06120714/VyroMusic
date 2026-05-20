'use client';
import Image from 'next/image';
import { Radio } from 'lucide-react';
import { usePlayerStore } from '@/store/player.store';
import { seekAudio } from './AudioEngine';
import { formatMs } from '@/lib/utils';

export function PlayerBar() {
  const {
    currentTrack, isPlaying, volume, muted, currentMs,
    shuffle, repeat, showQueue, showLyrics, playMode,
    togglePlay, next, prev, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, toggleQueue, toggleLyrics,
    startRadio,
  } = usePlayerStore();

  if (!currentTrack) return (
    <div className="h-20 border-t border-white/[0.06] bg-[#080809] flex items-center justify-center shrink-0">
      <p className="text-white/20 text-sm">Nothing playing</p>
    </div>
  );

  // currentMs is the source of truth; we compute progress from <audio> duration via seekAudio
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
    <div className="h-20 border-t border-white/[0.06] bg-[#080809]/95 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0">

      {/* Track info */}
      <div className="flex items-center gap-3 w-64 min-w-0">
        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white/5">
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
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-white">{currentTrack.title}</p>
          <p className="text-xs text-white/50 truncate">{currentTrack.artist?.name}</p>
        </div>
        {playMode === 'radio' && (
          <span className="shrink-0 text-cyan-400/70 text-[10px] font-semibold flex items-center gap-0.5">
            <Radio className="w-3 h-3" /> RADIO
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center flex-1 gap-1">
        <div className="flex items-center gap-5">
          {/* Shuffle */}
          <button onClick={toggleShuffle} className={`transition-colors ${shuffle ? 'text-vyro-400' : 'text-white/40 hover:text-white'}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
          </button>

          {/* Prev */}
          <button onClick={prev} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button onClick={togglePlay} className="w-10 h-10 rounded-full btn-neon flex items-center justify-center text-white shadow-lg">
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
          <button onClick={next} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
            </svg>
          </button>

          {/* Repeat */}
          <button onClick={cycleRepeat} className={`transition-colors relative ${repeat !== 'off' ? 'text-vyro-400' : 'text-white/40 hover:text-white'}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm1 3a1 1 0 000 2h8a1 1 0 100-2H6z" />
            </svg>
            {repeat === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold text-vyro-400">1</span>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full max-w-lg">
          <span className="text-[10px] text-white/30 w-8 text-right font-mono">{elapsed}</span>
          <div className="progress-bar flex-1 cursor-pointer" onClick={handleSeek}>
            <div
              className="progress-fill transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-white/30 w-8 font-mono">{total}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 w-64 justify-end">
        {/* Radio from current track */}
        <button
          onClick={() => startRadio(currentTrack)}
          className={`transition-colors ${playMode === 'radio' ? 'text-cyan-400' : 'text-white/40 hover:text-cyan-400'}`}
          title="Start Radio"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Lyrics */}
        <button onClick={toggleLyrics} className={`transition-colors ${showLyrics ? 'text-vyro-400' : 'text-white/40 hover:text-white'}`} title="Lyrics">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Queue */}
        <button onClick={toggleQueue} className={`transition-colors ${showQueue ? 'text-vyro-400' : 'text-white/40 hover:text-white'}`} title="Queue">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm10 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
          </svg>
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
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
            className="w-20 accent-vyro-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
