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
  const isPlayingRef = useRef(false); // always-current ref to avoid stale closure

  const { currentTrack, isPlaying, volume, muted, repeat, setCurrentMs, setDurationMs, next } = usePlayerStore();

  // Keep ref in sync with state
  isPlayingRef.current = isPlaying;

  // ── Load track ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    if (currentTrack.id === lastTrackIdRef.current) return;
    lastTrackIdRef.current = currentTrack.id;

    const audio = audioRef.current;
    const trackId = currentTrack.id; // capture to detect stale loads

    const playWhenReady = () => {
      if (lastTrackIdRef.current !== trackId) return;
      if (isPlayingRef.current) audio.play().catch(() => {});
    };

    // Load a URL properly — handles both HLS .m3u8 and direct audio
    const loadUrl = (url: string, onReady: () => void) => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      if (url.includes('.m3u8') && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(url);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, onReady);
        hlsRef.current = hls;
      } else {
        audio.src = url;
        audio.load();
        audio.addEventListener('canplay', onReady, { once: true });
      }
    };

    const fetchYtUrl = async (): Promise<string | null> => {
      const ytQuery = encodeURIComponent(
        `${currentTrack.title} ${currentTrack.artist?.name || ''}`
      );
      // Try up to 3 times
      for (let i = 0; i < 3; i++) {
        try {
          const data = await api<{ url: string }>(`/api/youtube/url?q=${ytQuery}`);
          if (data?.url) return data.url;
        } catch { /* retry */ }
      }
      return null;
    };

    const loadTrack = async () => {
      audio.pause();
      audio.src = '';
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      const previewUrl = currentTrack.previewUrl;

      // Step 1: Play preview instantly so there's zero wait
      if (previewUrl) {
        audio.src = previewUrl;
        audio.load();
        audio.addEventListener('canplay', playWhenReady, { once: true });
      }

      // Step 2: Fetch full YouTube URL (with retries)
      const ytUrl = await fetchYtUrl();

      // Bail if user switched tracks while we were fetching
      if (lastTrackIdRef.current !== trackId) return;

      if (!ytUrl) return; // all retries failed — stay on preview

      // Step 3: Swap to full song
      const wasPlaying = isPlayingRef.current;
      audio.pause();
      audio.src = '';
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      audio.src = ytUrl;
      audio.load();
      if (wasPlaying) {
        audio.addEventListener('canplay', () => {
          if (lastTrackIdRef.current === trackId) audio.play().catch(() => {});
        }, { once: true });
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
      onLoadedMetadata={() => {
        const a = audioRef.current;
        if (!a || !isFinite(a.duration)) return;
        setDurationMs(a.duration * 1000);
      }}
      onTimeUpdate={() => {
        const a = audioRef.current;
        if (!a) return;
        setCurrentMs(a.currentTime * 1000);
        if (isFinite(a.duration) && a.duration > 0) {
          setDurationMs(a.duration * 1000);
        }
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
