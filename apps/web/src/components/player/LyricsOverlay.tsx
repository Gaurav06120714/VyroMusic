'use client';

import { usePlayerStore } from '@/store/player.store';
import { LyricsPanel } from './LyricsPanel';

export function LyricsOverlay() {
  const { showLyrics, toggleLyrics, currentTrack, currentMs } = usePlayerStore();

  return (
    <LyricsPanel
      trackId={currentTrack?.id ?? null}
      trackTitle={currentTrack?.title ?? null}
      currentMs={currentMs}
      isOpen={showLyrics}
      onClose={toggleLyrics}
    />
  );
}
