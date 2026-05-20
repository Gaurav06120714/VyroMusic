import Image from 'next/image';
import { AlbumTrackList } from './AlbumTrackList';
import type { Album, Track } from '@vyro/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAlbum(id: string): Promise<Album | null> {
  try {
    const res = await fetch(`${API}/albums/${id}`, { next: { revalidate: 3600 } });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

async function getTracks(id: string): Promise<Track[]> {
  try {
    const res = await fetch(`${API}/albums/${id}/tracks`, { next: { revalidate: 3600 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [album, tracks] = await Promise.all([getAlbum(id), getTracks(id)]);
  if (!album) return <div className="p-8 text-white/40">Album not found</div>;

  const totalDuration = tracks.reduce((acc, t) => acc + t.durationMs, 0);
  const totalMin = Math.floor(totalDuration / 60000);

  return (
    <div className="pb-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-vyro-900/40 to-transparent h-64 pointer-events-none" />
        <div className="flex items-end gap-6 p-8 pt-12">
          <div className="relative w-48 h-48 shrink-0 rounded-2xl overflow-hidden shadow-2xl">
            {album.coverUrl ? (
              <Image src={album.coverUrl} alt={album.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-vyro-700 to-cyan-600 flex items-center justify-center text-6xl">🎵</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{album.albumType}</p>
            <h1 className="text-4xl font-bold text-white mb-2">{album.title}</h1>
            <p className="text-white/70 font-medium">{album.artist?.name}</p>
            <p className="text-white/40 text-sm mt-1">
              {new Date(album.releaseDate).getFullYear()} · {tracks.length} songs · {totalMin} min
            </p>
          </div>
        </div>
      </div>

      {/* Client component handles playback interactions */}
      <AlbumTrackList tracks={tracks} />
    </div>
  );
}
