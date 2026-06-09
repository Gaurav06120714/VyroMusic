'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/player.store';
import { api } from '@/lib/api';
import type { Track } from '@vyro/types';

export function RadioEngine() {
  const { playMode, radioSeedId, queue, queueIndex, appendToQueue, setRadioLoaded } = usePlayerStore();
  const loading = useRef(false);

  useEffect(() => {
    if (playMode !== 'radio' || !radioSeedId) return;

    const remaining = queue.length - queueIndex - 1;
    if (remaining > 5 || loading.current) return;

    loading.current = true;
    const excludeIds = queue.map(t => t.id).join(',');

    api<{ tracks: Track[] }>(`/api/recommendations/radio/${radioSeedId}?exclude=${excludeIds}`)
      .then((data) => {
        if (data.tracks?.length) {
          appendToQueue(data.tracks);
          setRadioLoaded(true);
        }
      })
      .catch(console.error)
      .finally(() => { loading.current = false; });
  }, [playMode, radioSeedId, queue.length, queueIndex, appendToQueue, setRadioLoaded]);

  return null; 
}
