'use client';
/**
 * AudioEngine — singleton HLS.js audio player.
 * Lives at the root player layout and never unmounts.
 * Playback state is synced bidirectionally with the Zustand player store.
 */
import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '@/store/player.store';
import { api } from '@/lib/api';

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

  const { currentTrack, isPlaying, volume, muted, repeat, setCurrentMs, next } = usePlayerStore();

  // ── Load track ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    if (currentTrack.id === lastTrackIdRef.current) return;
    lastTrackIdRef.current = currentTrack.id;

    const audio = audioRef.current;

    const loadTrack = async () => {
      // Destroy previous HLS instance first
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      try {
        const token = await api<{ manifestUrl: string; previewOnly: boolean }>(
          `/api/tracks/${currentTrack.id}/stream`
        );
        const url = token?.manifestUrl;
        if (!url) throw new Error('No stream URL');

        if (url.includes('.m3u8') && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hls.loadSource(url);
          hls.attachMedia(audio);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isPlaying) audio.play().catch(() => {});
          });
          hlsRef.current = hls;
        } else {
          // Direct MP3 (preview) or native HLS (Safari)
          audio.src = url;
          audio.load();
          if (isPlaying) audio.play().catch(() => {});
        }
      } catch {
        // Fallback: use previewUrl if stream fetch failed
        if (currentTrack.previewUrl) {
          audio.src = currentTrack.previewUrl;
          audio.load();
          if (isPlaying) audio.play().catch(() => {});
        }
      }
    };

    loadTrack();
  }, [currentTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play / pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  // ── Volume / mute ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ── Track end ─────────────────────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      audioRef.current!.currentTime = 0;
      audioRef.current!.play().catch(() => {});
    } else {
      next();
    }
  }, [repeat, next]);

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={() => {
        const a = audioRef.current;
        if (!a || !a.duration) return;
        setCurrentMs(a.currentTime * 1000);
      }}
      onEnded={handleEnded}
      style={{ display: 'none' }}
    />
  );
}

/** Called by PlayerBar seek bar */
export function seekAudio(ms: number) {
  const audio = document.querySelector('audio');
  if (audio) audio.currentTime = ms / 1000;
}
