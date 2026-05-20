'use client';
import { Play, Shuffle } from 'lucide-react';
import { TrackRow } from '@/components/catalog/TrackRow';
import { usePlayerStore } from '@/store/player.store';
import type { Track } from '@vyro/types';

export function AlbumTrackList({ tracks }: { tracks: Track[] }) {
  const { playTrack, setQueue, startRadio } = usePlayerStore();

  const playAll = (shuffle = false) => {
    const list = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    if (!list.length) return;
    setQueue(list);
    playTrack(list[0]);
  };

  return (
    <div className="px-6 mt-2">
      {/* Play controls */}
      <div className="flex items-center gap-3 px-2 mb-4">
        <button
          onClick={() => playAll(false)}
          className="btn-neon flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
        >
          <Play className="w-4 h-4 fill-current" /> Play
        </button>
        <button
          onClick={() => playAll(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm"
        >
          <Shuffle className="w-4 h-4" /> Shuffle
        </button>
      </div>

      {/* Track list */}
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
    </div>
  );
}
